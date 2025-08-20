import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { BookingsGateway } from 'src/bookings/bookings.gateway';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
  private pref = new Preference(this.mp);
  private payment = new Payment(this.mp);

  constructor(@InjectRepository(Booking) private readonly repo: Repository<Booking>, private readonly ws: BookingsGateway,) {
    const accessToken = (process.env.MP_ACCESS_TOKEN || '').trim();
    if (!accessToken) {
      this.logger.error('MP_ACCESS_TOKEN no está definido');
      throw new Error('Config faltante: MP_ACCESS_TOKEN');
    }
    if (!accessToken.startsWith('TEST-')) {
      this.logger.warn('Usando un access token que no es de TEST (¿seguro?)');
    }
    this.mp = new MercadoPagoConfig({ accessToken });
    this.pref = new Preference(this.mp);
    this.payment = new Payment(this.mp);
  }

  async createPreference(
    bookingId: string,
    clientUrl = process.env.CLIENT_URL || 'http://localhost:5173',
  ) {
    const b = await this.repo.findOne({
      where: { id: bookingId },
      relations: ['venue', 'user'],
    });
    if (!b) throw new NotFoundException('Reserva no existe');
    if (b.status === 'paid') throw new BadRequestException('Reserva ya pagada');

    // valida CLIENT_URL y construye URLs absolutas
    clientUrl = clientUrl.trim();
    if (!/^https?:\/\//i.test(clientUrl)) {
      throw new BadRequestException('CLIENT_URL debe ser una URL absoluta http(s)');
    }
    const successUrl = new URL(`/pay/success?bookingId=${b.id}`, clientUrl).toString();
    const failureUrl = new URL(`/pay/failure?bookingId=${b.id}`, clientUrl).toString();
    const pendingUrl = new URL(`/pay/pending?bookingId=${b.id}`, clientUrl).toString();

    // ====== MONTO (asegurar number > 0) ======
    const rawAmount = (b as any).amount;
    let amount = Number(rawAmount);
    if (!Number.isFinite(amount) || amount <= 0) amount = 20; // fallback demo

    // ====== DIVISA ======
    // No la pongas en cada item. Si quieres forzar moneda, usa variable MP_CURRENCY (ej. PEN/ARS/CLP)
    const prefCurrency = (process.env.MP_CURRENCY || '').trim().toUpperCase() || undefined;

    // ====== auto_return: OFF en localhost ======
    const useAutoReturn = !/localhost|127\.0\.0\.1/i.test(clientUrl);

    const body: any = {
        items: [
          {
            id: `booking-${b.id}`,                                  // 👈 requerido por los tipos del SDK
            title: b.title || `Reserva - ${b.venue.name} - ${b.title}`,
            quantity: 1,
            unit_price: amount,
            /* currency_id: prefCurrency,  */                                    // 👈 number
          },
          /* { id: 'test-1', title: 'Reserva de prueba', quantity: Number(1), unit_price: Number(20), currency_id: 'ARS' }, */
        ],
        external_reference: b.id,                                   // para reconciliar
        metadata: { bookingId: b.id },
        back_urls: {
          // incluye payment_id/preference_id en el redirect para verificar
          success: successUrl,  // ✅ absoluta y definida
          failure: failureUrl,
          pending: pendingUrl,
        },
        payer: b.user ? { email: b.user.email, name: b.user.name } : undefined,
        // notification_url: process.env.MP_WEBHOOK_URL, // opcional si configuras webhook
    }

    if (prefCurrency) body.currency_id = prefCurrency; // solo si quieres forzar
    if (useAutoReturn) body.auto_return = 'approved';

    // LOG de depuración para ver exactamente qué se envía
    /* this.logger.log(
      `MP preference payload: ${JSON.stringify({
        items: body.items,
        currency_id: body.currency_id,
        back_urls: body.back_urls,
        auto_return: body.auto_return,
        payer: body.payer,
      })}`,
    ); */

    // Opcional: log para validar las URLs que se enviarán
    this.logger.log(`MP pref back_urls: ${JSON.stringify(body.back_urls)} auto_return=${useAutoReturn ? 'approved' : 'OFF'}`);

    const res = await this.pref.create({ body });

    return {
      preferenceId: res.id,
      initPoint: (res as any).init_point ?? (res as any).sandbox_init_point,
    };
  }

  async verifyByPaymentId(paymentId: string) {
    const p = await this.payment.get({ id: paymentId });
    const approved = p.status === 'approved';
    const bookingId = (p.metadata as any)?.bookingId || p.external_reference;

    this.logger.log(`MP payment payload: ${JSON.stringify(p)}`);
    this.logger.log(`MP payment approved=${approved} bookingId=${bookingId}`);    

    if (approved && bookingId) {
      console.log('actualizando reserva de pending a paid');
      await this.repo.update(bookingId, { status: 'paid' as any });
      const saved = await this.repo.findOne({ where: { id: bookingId }, relations: ['venue'] })
      if (saved) {
        // 🔊 avisa a todos los clientes conectados
        this.ws.emitUpdated({
          id: saved.id,
          venueId: saved.venue.id,
          title: saved.title,
          startAt: saved.startAt,
          endAt: saved.endAt,
          status: saved.status, // 'paid'
        })
      }
    }
    return { approved, bookingId, raw: p };
  }

  async verifyByExternalReference(bookingId: string) {
    // busca el último pago asociado a esa reserva
    const res: any = await this.payment.search({
      options: {
        external_reference: bookingId,
        sort: 'date_created',
        criteria: 'desc',
        limit: 1,
      },
    })

    const p = res?.results?.[0]
    const approved = p?.status === 'approved'
    const paymentId = p?.id

    if (approved) {
      await this.repo.update(bookingId, { status: 'paid' as any })
      // (opcional) emitir socket si tienes gateway
      // const saved = await this.repo.findOne({ where: { id: bookingId }, relations: ['venue'] })
      // if (saved) this.ws.emitUpdated({ id: saved.id, ... })
    }

    return { approved, paymentId, status: p?.status ?? 'unknown' }
  }

  // opcional: si recibes solo preference_id, busca el último pago asociado
  async verifyByPreferenceId(preferenceId: string) {
    // Mercado Pago no expone búsqueda directa por preferenceId en todos los casos,
    // así que lo normal es usar payment_id desde el redirect.
    throw new BadRequestException('Usa payment_id para verificación');
  }
}
