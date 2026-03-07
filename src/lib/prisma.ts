import { PrismaClient } from '@prisma/client';

declare global {
  // Using `var` on purpose to merge with Node global type.
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    // Reduce statement cache to mitigate "prepared statement already exists" on serverless Postgres.
    // See: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#pgbouncer
    datasources: {
      db: {
        url: process.env.DATABASE_URL ? `${process.env.DATABASE_URL}${process.env.DATABASE_URL.includes('?') ? '&' : '?'}pgbouncer=true&statement_cache_size=0` : undefined,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
