// Prisma v6-compatible config shim.
// Keep this minimal so `next build` TypeScript checks don't fail.
import "dotenv/config";

const config: any = {
  schema: "prisma/schema.prisma",
};

export default config;
