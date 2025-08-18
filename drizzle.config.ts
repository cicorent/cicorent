import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: './shared/schema.ts', // percorso al tuo file schema
  out: './drizzle',             // cartella dove generare le migrazioni
  dialect: 'postgresql',        // << richiesto
  dbCredentials: {
    url: process.env.DATABASE_URL!, // usa il .env
  },
} satisfies Config;