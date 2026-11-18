// Formatações simples, usadas no servidor e no navegador.

/** "$$" a partir do nível 1–4. */
export const priceLabel = (n: number | null) => (n ? "$".repeat(n) : null);
