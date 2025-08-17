import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { ConfigService } from '@nestjs/config';
import listEndpoints from 'express-list-endpoints';
import expressListEndpoints from 'express-list-endpoints';
import { Venue } from './venues/venue.entity';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  const cfg = app.get(ConfigService);
  const port = Number(cfg.get('PORT') ?? 3001);

  await app.init();
  await seed(app);

  /* // en main.ts, después de await app.init()
  const adapter = app.getHttpAdapter();
  const type = adapter.getType();
  const instance = adapter.getInstance();
  
  try {
    if (type === 'express') {
      // Soporta CJS y ESM
      const mod: any = await import('express-list-endpoints');
      const listEndpoints = mod.default ?? mod; // ← clave
      const endpoints = listEndpoints(instance);

      // Imprime cada método por fila (más legible)
      console.table(
        endpoints.flatMap((r: any) =>
          r.methods.map((m: string) => ({ method: m, path: r.path })),
        ),
      );
    } else if (type === 'fastify') {
      console.log(instance.printRoutes());
    } else {
      console.log(`Adapter: ${type} (sin impresor de rutas configurado)`);
    }
  } catch (e: any) {
    console.warn('No pude listar rutas:', e?.message ?? e);
  } */

  const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';

  app.enableCors({
    origin: CLIENT_URL, // o ['http://localhost:5173']
    methods: ['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    credentials: false, // true si vas a usar cookies
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  await app.listen(port);
  console.log(`API running on http://localhost:3001 (CORS for ${CLIENT_URL})`);
}

async function seed(app: any) {
  try {

    // --- Users Demo ---
    const repo = app.get(getRepositoryToken(User));
    const count = await repo.count();
    if (count === 0) {
      const bcrypt = (await import('bcrypt')).default;
      const mk = async (name: string, email: string, role: User['role']) =>
        repo.save(
          repo.create({
            name,
            email,
            role,
            passwordHash: await bcrypt.hash('123456', 10),
          }),
        );

      await mk('Admin Demo', 'admin@demo.com', 'admin');
      await mk('Trabajador Demo', 'worker@demo.com', 'trabajador');
      await mk('Cliente Demo', 'client@demo.com', 'cliente');
      console.log('Seed users created.');
    }

    // --- Venues Demo ---
    const venueRepo = app.get(getRepositoryToken(Venue));
    const venues: Array<Partial<Venue>> = [
      { name: 'Local Centro',      lat: -12.0464, lng: -77.0428 },
      { name: 'Miraflores Parque', lat: -12.1211, lng: -77.0297 },
      { name: 'San Isidro Business', lat: -12.0970, lng: -77.0370 },
      { name: 'Barranco Bohemio',  lat: -12.1483, lng: -77.0209 },
      { name: 'Surco Monterrico',  lat: -12.1416, lng: -76.9998 },
      { name: 'La Molina',         lat: -12.0870, lng: -76.9380 },
      { name: 'San Miguel Plaza',  lat: -12.0735, lng: -77.0932 },
      { name: 'Callao Costa',      lat: -12.0520, lng: -77.1180 },
      { name: 'Los Olivos Norte',  lat: -11.9902, lng: -77.0610 },
      { name: 'SJL Canto Rey',     lat: -12.0240, lng: -77.0050 },
      { name: 'Chorrillos Costa',  lat: -12.1722, lng: -77.0241 },
      { name: 'Pueblo Libre',      lat: -12.0730, lng: -77.0670 },
    ];
    // upsert por nombre → no duplica si ya existen
    await venueRepo.upsert(venues, ['name']);
    console.log('✔ Seed: venues');
  } catch (e) {
    console.warn('Seed skipped:', e?.message ?? e);
  }
}

bootstrap();
