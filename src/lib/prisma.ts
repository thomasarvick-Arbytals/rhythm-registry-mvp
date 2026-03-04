import { PrismaClient } from '@prisma/client';

declare global {
  // Using `var` on purpose to merge with Node global type.
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
