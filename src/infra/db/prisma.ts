import path from 'node:path';

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

import { env } from '@/config/env';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// DATABASE_URL should be in the format: file:./path/to/db.sqlite3 or file:/absolute/path/to/db.sqlite3
// If not provided, defaults to file:<project_root>/ikabu.sqlite3
const dbPath = env.databaseUrl ?? `file:${path.join(process.cwd(), 'ikabu.sqlite3')}`;

const adapter = new PrismaBetterSqlite3({
    url: dbPath,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (env.nodeEnv !== 'production') globalForPrisma.prisma = prisma;
