// Conexão com o banco. Qualquer parte do servidor que precisa ler ou
// gravar dados importa `db` daqui.
import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Limpa o valor colado: endereço de banco nunca tem espaço nem quebra de linha
// (na Vercel ele ficou com uma quebra no meio), e pode vir entre aspas.
const databaseUrl = (process.env.DATABASE_URL ?? "")
  .replace(/\s+/g, "")
  .replace(/^(['"])(.*)\1$/, "$2");

if (!databaseUrl) {
  throw new Error("Falta DATABASE_URL no .env.local. Veja o passo a passo no README.");
}
if (!URL.canParse(databaseUrl)) {
  // Mensagem sem o valor, para a senha do banco nunca ir parar nos registros de erro.
  // Mostra só o "formato" (nada secreto) para ajudar a achar o problema.
  const formato = {
    tamanho: databaseUrl.length,
    comecaCom: JSON.stringify(databaseUrl.slice(0, 13).replace(/[^a-z:/"' ]/gi, "?")),
    aspas: (databaseUrl.match(/["']/g) ?? []).length,
    espacosOuQuebras: /\s/.test(databaseUrl),
    temIgual: databaseUrl.includes("DATABASE_URL"),
  };
  throw new Error(
    `DATABASE_URL não é um endereço válido. Confira o valor na Vercel/.env.local. Formato: ${JSON.stringify(formato)}`,
  );
}

const sql = neon(databaseUrl);
export const db = drizzle({ client: sql, schema });
