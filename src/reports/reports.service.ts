// src/reports/reports.service.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ReportsService {
  constructor(private readonly ds: DataSource) {}

  async overview(params: { from?: Date; to?: Date; venueId?: string | null }) {
    const to = params.to ?? new Date();
    const from = params.from ?? new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000);
    const venueId = params.venueId ?? null;

    // Serie diaria
    const series = await this.ds.query(
      `
      WITH series AS (
        SELECT generate_series($1::timestamptz, $2::timestamptz, '1 day') AS d
      )
      SELECT to_char(s.d, 'YYYY-MM-DD') AS date,
              COALESCE(COUNT(b.id), 0)::int AS count
      FROM series s
      LEFT JOIN "booking" b
        ON b."startAt" >= s.d
        AND b."startAt" <  (s.d + interval '1 day')
        AND ($3::uuid IS NULL OR b."venueId" = $3)
      GROUP BY s.d
      ORDER BY s.d;
      `,
      [from, to, venueId],
    );

    // Totales (⚠️ aquí estaba el error)
    const [{ total }] = await this.ds.query(
      `
      SELECT COUNT(*)::int AS total
      FROM "booking" b
      WHERE ($1::uuid IS NULL OR b."venueId" = $1)
        AND b."startAt" >= $2::timestamptz
        AND b."startAt" <  ($3::timestamptz + interval '1 day');
      `,
      [venueId, from, to],
    );

    // Top por venue
    const byVenue = await this.ds.query(
      `
      SELECT v.id, v.name, COUNT(b.id)::int AS count
      FROM "booking" b
      JOIN "venue" v ON v.id = b."venueId"
      WHERE b."startAt" >= $1::timestamptz
        AND b."startAt" <  ($2::timestamptz + interval '1 day')
        AND ($3::uuid IS NULL OR b."venueId" = $3)
      GROUP BY v.id, v.name
      ORDER BY count DESC
      LIMIT 8;
      `,
      [from, to, venueId],
    );

    return { range: { from, to }, totals: { bookings: total, byVenue }, series };
  }
}
