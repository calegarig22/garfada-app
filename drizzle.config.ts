import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Lê as senhas do .env.local (o drizzle-kit roda fora do Next, então carregamos na mão)
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts", // onde as tabelas são descritas
  out: "./drizzle", // onde ficam as migrations (o histórico de mudanças do banco)
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  strict: true,
});
