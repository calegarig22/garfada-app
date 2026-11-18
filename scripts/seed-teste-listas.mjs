// Dá favoritos e listas às contas de teste (rode depois de seed-teste.mjs).
// Apagar: node scripts/limpar-teste.mjs (apaga tudo das contas @garfada.test).
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
const sql = neon(process.env.DATABASE_URL.replace(/\s+/g, "").replace(/^(['"])(.*)\1$/, "$2"));

const users = Object.fromEntries((await sql`SELECT id, username FROM users WHERE email LIKE '%@garfada.test'`).map((u) => [u.username, u.id]));
const r = Object.fromEntries((await sql`SELECT id, name FROM restaurants`).map((x) => [x.name, x.id]));

const FAVORITOS = {
  "marina.come": ["Aizomê", "A Casa do Porco", "Coffee Lab", "Bráz Pizzaria"],
  "rafa_boteco": ["Bar do Luiz Fernandes", "Mocotó", "A Casa do Porco", "Bar da Dona Onça"],
  juprado: ["Arábia", "Bar da Dona Onça", "A Casa do Porco"],
  "bia.lopes": ["Consulado Mineiro", "A Casa do Porco", "Bráz Pizzaria", "Mocotó"],
  leticianunes: ["Mocotó", "Bar do Luiz Fernandes"],
  paulasato: ["Aizomê", "Bráz Pizzaria", "Consulado Mineiro", "Famiglia Mancini"],
};
const LISTAS = {
  "marina.come": [["Quero ir", "quero_ir", ["Mocotó", "Bar do Luiz Fernandes"]], ["Para ocasiões especiais", null, ["Aizomê", "A Casa do Porco", "Famiglia Mancini"]]],
  "rafa_boteco": [["Quero ir", "quero_ir", ["Aizomê"]], ["Botecos raiz", null, ["Bar do Luiz Fernandes", "Bar da Dona Onça", "Mocotó"]]],
  juprado: [["Quero ir", "quero_ir", ["Coffee Lab", "Consulado Mineiro"]], ["Levar meus pais", null, ["Famiglia Mancini", "Consulado Mineiro"]]],
  "bia.lopes": [["Comida mineira e nordestina", null, ["Consulado Mineiro", "Mocotó"]]],
  paulasato: [["Quero ir", "quero_ir", ["A Casa do Porco", "Arábia"]], ["Cafés para trabalhar", null, ["Coffee Lab"]]],
};

let f = 0, l = 0;
for (const [u, nomes] of Object.entries(FAVORITOS)) {
  if (!users[u]) continue;
  for (const [i, n] of nomes.entries()) {
    await sql`INSERT INTO favorites (user_id, position, restaurant_id) VALUES (${users[u]}, ${i + 1}, ${r[n]}) ON CONFLICT DO NOTHING`;
    f++;
  }
}
for (const [u, listas] of Object.entries(LISTAS)) {
  if (!users[u]) continue;
  for (const [nome, kind, lugares] of listas) {
    const id = randomUUID();
    await sql`INSERT INTO collections (id, owner_id, name, kind, is_private) VALUES (${id}, ${users[u]}, ${nome}, ${kind}, false)`;
    for (const n of lugares) await sql`INSERT INTO collection_items (id, collection_id, restaurant_id) VALUES (${randomUUID()}, ${id}, ${r[n]})`;
    l++;
  }
}
console.log(`Favoritos: ${f}. Listas: ${l}.`);
