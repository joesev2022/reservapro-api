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
  /* await seed(app); */

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

    const venueRepo = app.get(getRepositoryToken(Venue));
    if (await venueRepo.count() === 0) {
      await venueRepo.save(venueRepo.create({ name: 'Cancha Central', lat: -12.05, lng: -77.04 }));
      console.log('Seed venues created.');
    }
  } catch (e) {
    console.warn('Seed skipped:', e?.message ?? e);
  }
}

bootstrap();
