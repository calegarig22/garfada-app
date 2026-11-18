// Cria 10 contas DE TESTE com avaliações, curtidas, comentários e seguidores,
// para testar a interatividade do app. Tudo fica marcado:
//   - e-mail termina em @garfada.test
//   - bio diz "Conta de teste"
// Para apagar tudo depois:  node scripts/limpar-teste.mjs
//
// Rodar:  node scripts/seed-teste.mjs  (depois: node scripts/seed-teste-listas.mjs)
// As contas usam a senha guardada em .env.local (TEST_USERS_PASSWORD), para
// você poder entrar como qualquer uma delas e testar.
import { randomBytes, randomUUID, scrypt as _scrypt } from "node:crypto";
import { appendFileSync, readFileSync } from "node:fs";
import { promisify } from "node:util";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
const sql = neon(process.env.DATABASE_URL.replace(/\s+/g, "").replace(/^(['"])(.*)\1$/, "$2"));
const scrypt = promisify(_scrypt);

// ── senha das contas de teste (gerada uma vez e guardada no .env.local) ──
let password = process.env.TEST_USERS_PASSWORD;
if (!password) {
  password = randomBytes(9).toString("base64url");
  const env = readFileSync(".env.local", "utf8");
  appendFileSync(".env.local", `${env.endsWith("\n") ? "" : "\n"}\n# Senha das contas de teste (scripts/seed-teste.mjs)\nTEST_USERS_PASSWORD="${password}"\n`);
}
const salt = randomBytes(16);
const hash = `scrypt$${salt.toString("base64")}$${(await scrypt(password, salt, 64)).toString("base64")}`;

// ── pessoas ──
const PESSOAS = [
  ["Marina Okada", "marina.come"],
  ["Rafael Teixeira", "rafa_boteco"],
  ["Júlia Prado", "juprado"],
  ["Caio Mendes", "caiomendes"],
  ["Bianca Lopes", "bia.lopes"],
  ["Diego Ferraz", "diegoferraz"],
  ["Letícia Nunes", "leticianunes"],
  ["Thiago Rocha", "thiagorocha"],
  ["Paula Sato", "paulasato"],
  ["Fernando Alves", "fe.alves"],
];

// ── avaliações: [pessoa, restaurante, nota 1–10 (meias estrelas), dias atrás, texto] ──
const AVALIACOES = [
  [0, "Aizomê", 10, 12, "Omakase impecável. Cada peça no ponto certo, vale a ocasião especial."],
  [8, "Aizomê", 9, 30, "Peixe muito fresco e atendimento atencioso. Caro, mas é para comemorar."],
  [3, "Aizomê", 9, 45, "Gostei bastante do sashimi. Ambiente silencioso, bom para conversar."],
  [5, "Aizomê", 8, 70, "Muito bom, mas achei as porções pequenas para o preço."],

  [1, "A Casa do Porco", 10, 5, "Porco san zé é obrigatório. Saí planejando a próxima visita."],
  [4, "A Casa do Porco", 10, 20, "Torresmo crocante e sequência criativa. Melhor almoço do mês."],
  [6, "A Casa do Porco", 9, 41, "Tudo delicioso. Só a espera na fila que foi longa."],
  [9, "A Casa do Porco", 9, 60, "Comida criativa e saborosa. Recomendo chegar cedo."],
  [2, "A Casa do Porco", 10, 90, "Experiência completa, do couvert à sobremesa."],

  [1, "Mocotó", 10, 8, "Dadinho de tapioca é viciante. Baião de dois caprichado."],
  [7, "Mocotó", 9, 25, "Comida nordestina de respeito. Vale a viagem até a zona norte."],
  [3, "Mocotó", 9, 52, "Carne de sol macia e porções generosas para dividir."],
  [6, "Mocotó", 8, 80, "Muito bom. Fui num sábado e estava bem cheio."],

  [4, "Bráz Pizzaria", 9, 3, "Margherita clássica, massa leve e borda bem assada."],
  [8, "Bráz Pizzaria", 8, 18, "Pizza ótima, ambiente animado. Um pouco barulhento pra mim."],
  [0, "Bráz Pizzaria", 7, 35, "Boa pizza, mas já comi melhores pelo mesmo preço."],
  [5, "Bráz Pizzaria", 9, 64, "Clássico de São Paulo. Pedimos duas e não sobrou nada."],

  [1, "Bar do Luiz Fernandes", 9, 2, "Bolinho de carne com chopp gelado, boteco raiz como deve ser."],
  [7, "Bar do Luiz Fernandes", 9, 27, "Petiscos no balcão, preço justo e clima de bairro."],
  [9, "Bar do Luiz Fernandes", 8, 50, "Gostei, mas é longe pra mim. Voltaria pelos petiscos."],

  [2, "Arábia", 8, 9, "Kibe cru muito bem temperado e esfiha quentinha."],
  [6, "Arábia", 9, 33, "Mezze completo para dividir em grupo, adoramos."],
  [8, "Arábia", 7, 58, "Gostoso, mas achei um pouco salgado para o meu gosto."],
  [3, "Arábia", 8, 85, "Sobremesas árabes ótimas, o malabi é muito bom."],

  [5, "Coffee Lab", 9, 4, "Melhor espresso que tomei este ano. Baristas explicam tudo."],
  [0, "Coffee Lab", 7, 22, "Café excelente, mas o lugar estava lotado e foi difícil sentar."],
  [7, "Coffee Lab", 8, 47, "Ótimo para conhecer métodos de preparo diferentes."],
  [2, "Coffee Lab", 6, 73, "Bom café, mas esperava mais pelo preço."],

  [4, "Consulado Mineiro", 9, 11, "Tutu e torresmo como em Minas. Saí satisfeitíssimo."],
  [9, "Consulado Mineiro", 8, 38, "Comida mineira caprichada, ótimo para almoço de sábado."],
  [1, "Consulado Mineiro", 7, 66, "Bom, mas o feijão tropeiro estava um pouco seco no dia."],

  [3, "Famiglia Mancini", 8, 14, "Antepasto farto e lasanha bem servida. Rua linda à noite."],
  [8, "Famiglia Mancini", 7, 44, "Ambiente encantador. A espera foi longa num sábado."],
  [6, "Famiglia Mancini", 6, 77, "Bonito e cheio de história, mas a massa não me marcou."],

  [2, "Bar da Dona Onça", 9, 6, "Picadinho maravilhoso e o Copan de cenário. Programa perfeito."],
  [7, "Bar da Dona Onça", 8, 29, "Drinks bons e comida de boteco caprichada."],
  [5, "Bar da Dona Onça", 7, 55, "Gostei, mas achei o serviço um pouco lento."],
];

// ── comentários: [quem comenta, índice da avaliação, texto] ──
const COMENTARIOS = [
  [3, 0, "Que inveja! Faz tempo que quero ir."],
  [8, 0, "Concordo, o omakase de lá é outro nível."],
  [0, 4, "Anotado! Vou pedir o porco san zé."],
  [5, 4, "Esse torresmo é surreal mesmo."],
  [2, 5, "Fui semana passada por causa da sua avaliação 😄"],
  [6, 9, "Dadinho de tapioca é o melhor petisco de SP."],
  [4, 9, "Preciso levar meus pais lá."],
  [1, 13, "Margherita da Bráz não tem erro."],
  [9, 14, "Também achei barulhento, mas a pizza compensa."],
  [7, 17, "Chopp gelado é tudo!"],
  [2, 17, "Bora marcar um happy hour lá?"],
  [0, 20, "Kibe cru de lá é bom demais."],
  [3, 24, "Qual método você recomenda pra começar?"],
  [5, 24, "Eu iria de coado, é o mais clássico."],
  [8, 28, "Saudades de Minas só de ler."],
  [6, 31, "A Avanhandava à noite é linda mesmo."],
  [9, 34, "Picadinho da Dona Onça é clássico."],
  [4, 34, "O Copan visto de dentro é demais."],
];

// ── quem segue quem ──
const SEGUE = [
  [0, 1], [0, 3], [0, 8], [1, 0], [1, 2], [1, 7], [2, 1], [2, 4], [2, 6],
  [3, 0], [3, 5], [4, 2], [4, 9], [5, 3], [5, 4], [6, 2], [6, 7], [7, 1],
  [7, 6], [8, 0], [8, 9], [9, 4], [9, 8], [9, 1],
];

const days = (n) => new Date(Date.now() - n * 86400000);
const isoDay = (n) => days(n).toISOString().slice(0, 10);

// ── criar pessoas ──
const ids = [];
for (const [name, username] of PESSOAS) {
  const id = randomUUID();
  ids.push(id);
  await sql`INSERT INTO users (id, name, email, username, bio, password_hash, created_at)
    VALUES (${id}, ${name}, ${`${username}@garfada.test`}, ${username},
            ${"Conta de teste do Garfada."}, ${hash}, ${days(100)})`;
}

const restaurantes = Object.fromEntries((await sql`SELECT id, name FROM restaurants`).map((r) => [r.name, r.id]));

// ── avaliações (o gatilho do banco recalcula a nota média de cada lugar) ──
const reviewIds = [];
for (const [p, nome, nota, diasAtras, texto] of AVALIACOES) {
  const id = randomUUID();
  reviewIds.push(id);
  await sql`INSERT INTO reviews (id, user_id, restaurant_id, rating, body, visited_on, created_at, updated_at)
    VALUES (${id}, ${ids[p]}, ${restaurantes[nome]}, ${nota}, ${texto}, ${isoDay(diasAtras + 1)},
            ${days(diasAtras)}, ${days(diasAtras)})`;
}

// ── curtidas: cada avaliação recebe de 1 a 6 curtidas de outras pessoas ──
let curtidas = 0;
for (const [i, rid] of reviewIds.entries()) {
  const autor = AVALIACOES[i][0];
  const n = 1 + ((i * 7) % 6);
  for (let k = 1; k <= n; k++) {
    const quem = (autor + k * 3) % 10;
    if (quem === autor) continue;
    await sql`INSERT INTO review_likes (user_id, review_id, created_at) VALUES (${ids[quem]}, ${rid}, ${days(AVALIACOES[i][3] - 1)})
      ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO notifications (id, recipient_id, type, actor_id, review_id, read_at, created_at)
      VALUES (${randomUUID()}, ${ids[autor]}, 'review_like', ${ids[quem]}, ${rid}, ${days(0)}, ${days(AVALIACOES[i][3] - 1)})`;
    curtidas++;
  }
}

// ── comentários ──
for (const [quem, idx, texto] of COMENTARIOS) {
  const cid = randomUUID();
  const autor = AVALIACOES[idx][0];
  await sql`INSERT INTO review_comments (id, review_id, user_id, body, created_at)
    VALUES (${cid}, ${reviewIds[idx]}, ${ids[quem]}, ${texto}, ${days(AVALIACOES[idx][3] - 1)})`;
  await sql`INSERT INTO notifications (id, recipient_id, type, actor_id, review_id, comment_id, read_at, created_at)
    VALUES (${randomUUID()}, ${ids[autor]}, 'review_comment', ${ids[quem]}, ${reviewIds[idx]}, ${cid}, ${days(0)}, ${days(AVALIACOES[idx][3] - 1)})`;
}

// ── seguidores ──
for (const [a, b] of SEGUE) {
  await sql`INSERT INTO follows (follower_id, following_id) VALUES (${ids[a]}, ${ids[b]}) ON CONFLICT DO NOTHING`;
}

// ── interação com a SUA conta (para você ver notificações chegando) ──
const [eu] = await sql`SELECT id FROM users WHERE email NOT LIKE '%@garfada.test' AND username IS NOT NULL ORDER BY created_at LIMIT 1`;
let interacoesComVoce = 0;
if (eu) {
  for (const p of [0, 1, 4, 7]) {
    await sql`INSERT INTO follows (follower_id, following_id) VALUES (${ids[p]}, ${eu.id}) ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO notifications (id, recipient_id, type, actor_id) VALUES (${randomUUID()}, ${eu.id}, 'follow', ${ids[p]})`;
    interacoesComVoce++;
  }
  const minhas = await sql`SELECT id FROM reviews WHERE user_id = ${eu.id} ORDER BY created_at DESC LIMIT 3`;
  for (const r of minhas) {
    for (const p of [2, 5, 8]) {
      await sql`INSERT INTO review_likes (user_id, review_id) VALUES (${ids[p]}, ${r.id}) ON CONFLICT DO NOTHING`;
      await sql`INSERT INTO notifications (id, recipient_id, type, actor_id, review_id) VALUES (${randomUUID()}, ${eu.id}, 'review_like', ${ids[p]}, ${r.id})`;
      interacoesComVoce++;
    }
    const cid = randomUUID();
    await sql`INSERT INTO review_comments (id, review_id, user_id, body) VALUES (${cid}, ${r.id}, ${ids[1]}, ${"Boa dica! Vou experimentar esse sabor."})`;
    await sql`INSERT INTO notifications (id, recipient_id, type, actor_id, review_id, comment_id) VALUES (${randomUUID()}, ${eu.id}, 'review_comment', ${ids[1]}, ${r.id}, ${cid})`;
    interacoesComVoce++;
  }
}

const notas = await sql`SELECT name, rating_count, round(rating_avg::numeric, 2) AS media FROM restaurants ORDER BY rating_avg DESC NULLS LAST`;
console.log(`Criado: ${PESSOAS.length} pessoas, ${AVALIACOES.length} avaliações, ${curtidas} curtidas, ${COMENTARIOS.length} comentários, ${SEGUE.length} seguidores, ${interacoesComVoce} interações com a sua conta.`);
console.table(notas.map((n) => ({ lugar: n.name, avaliacoes: n.rating_count, media_estrelas: n.media })));
