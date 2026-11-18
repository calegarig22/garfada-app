// Redes muito grandes não entram no Garfada (a ideia é descobrir lugares).
// Para bloquear outra rede, é só acrescentar o nome aqui (sem acento, minúsculas).
export const REDES_GRANDES = [
  "mcdonalds", "mc donalds", "burger king", "bk", "habibs", "subway", "starbucks", "outback", "madero",
  "coco bambu", "si senor", "fogo de chao", "dengo", "ofner", "the fifties", "spoleto", "giraffas",
  "bobs", "china in box", "kfc", "pizza hut", "dominos", "jeronimo", "ragazzo", "girafas", "cacau show",
  "kopenhagen", "havanna", "casa do pao de queijo", "rei do mate", "viena", "applebees", "tgi fridays",
  "abbraccio", "paris 6", "rascal",
];

const norm = (t: string) =>
  t
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/['’!.]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Devolve o nome da rede grande se o nome digitado for de uma delas. */
export function redeGrande(nome: string): string | null {
  const n = ` ${norm(nome)} `;
  return REDES_GRANDES.find((r) => n.includes(` ${r} `)) ?? null;
}
