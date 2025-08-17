import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: false,
  },
})
export class BookingsGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  constructor(private jwt: JwtService, private cfg: ConfigService) {}

  handleConnection(client: Socket) {
    try {
      const raw = (client.handshake.auth?.token as string)
        || (client.handshake.headers.authorization as string | undefined);
      const token = raw?.replace(/^Bearer\s+/i, '');
      if (!token) throw new Error('no token');
      const payload = this.jwt.verify(token, { secret: this.cfg.get('JWT_SECRET', 'devsecret') });
      (client as any).user = { id: payload.sub, role: payload.role, email: payload.email };
    } catch {
      client.disconnect(true);
    }
  }

  emitCreated(data: any) { this.server.emit('booking.created', data); }
  emitUpdated(data: any) { this.server.emit('booking.updated', data); }
  emitDeleted(data: any) { this.server.emit('booking.deleted', data); }
}
