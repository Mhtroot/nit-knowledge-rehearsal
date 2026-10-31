import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Single owner of the Prisma connection. Model services inject this service
 * and query through `dbContext.db` (e.g. `this.dbContext.db.user.findMany()`).
 */
@Injectable()
export class DbContextService implements OnModuleInit, OnModuleDestroy {
  readonly db: PrismaClient;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');
    const url = new URL(databaseUrl);

    this.db = new PrismaClient({
      adapter: new PrismaMariaDb({
        host: url.hostname,
        port: Number(url.port) || 3306,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.slice(1),
      }),
    });
  }

  async onModuleInit() {
    await this.db.$connect();
    await this.db.$queryRaw`SELECT 1`;
  }

  async onModuleDestroy() {
    await this.db.$disconnect();
  }
}
