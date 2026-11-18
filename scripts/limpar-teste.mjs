// Apaga TODAS as contas de teste (e-mail @garfada.test) e tudo o que elas criaram:
// avaliações, fotos (também no Backblaze), curtidas, comentários, seguidores, listas,
// favoritos e notificações. O gatilho do banco recalcula a nota média de cada lugar.
// Rodar:  node scripts/limpar-teste.mjs
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
const clean = (v) => (v ?? "").replace(/\s+/g, "").replace(/^(['"])(.*)\1$/, "$2");
const sql = neon(clean(process.env.DATABASE_URL));

// 1) Fotos das contas de teste (antes de apagar, para saber quais arquivos remover)
const fotos = await sql`
  SELECT vp.storage_key AS key FROM review_photos vp
    JOIN reviews r ON r.id = vp.review_id JOIN users u ON u.id = r.user_id
   WHERE u.email LIKE '%@garfada.test' AND vp.storage_key IS NOT NULL
  UNION
  SELECT rp.storage_key FROM restaurant_photos rp JOIN users u ON u.id = rp.uploaded_by_id
   WHERE u.email LIKE '%@garfada.test' AND rp.storage_key IS NOT NULL`;

let removidas = 0;
if (fotos.length && process.env.S3_ENDPOINT) {
  const s3 = new S3Client({
    endpoint: clean(process.env.S3_ENDPOINT),
    region: clean(process.env.S3_REGION) || "auto",
    forcePathStyle: true,
    credentials: { accessKeyId: clean(process.env.S3_ACCESS_KEY_ID), secretAccessKey: clean(process.env.S3_SECRET_ACCESS_KEY) },
  });
  for (const f of fotos) {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: clean(process.env.S3_BUCKET), Key: f.key }));
      removidas++;
    } catch (e) {
      console.error(`Não apagou ${f.key}: ${e.name}`);
    }
  }
}
// Fotos enviadas no cadastro de lugares por contas de teste: a linha some junto com o lugar? Não —
// o lugar continua; apagamos só as linhas dessas fotos.
await sql`DELETE FROM restaurant_photos rp USING users u WHERE u.id = rp.uploaded_by_id AND u.email LIKE '%@garfada.test'`;

// 2) Contas (o resto sai em cascata)
const apagados = await sql`DELETE FROM users WHERE email LIKE '%@garfada.test' RETURNING username`;
const [resto] = await sql`SELECT (SELECT count(*)::int FROM users) AS usuarios, (SELECT count(*)::int FROM reviews) AS avaliacoes`;
console.log(
  `Contas de teste apagadas: ${apagados.length}. Fotos removidas do armazenamento: ${removidas}. ` +
    `Sobraram ${resto.usuarios} usuário(s) e ${resto.avaliacoes} avaliação(ões).`,
);
