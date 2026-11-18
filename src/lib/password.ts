// Senhas: nunca guardamos a senha em si, só uma versão "embaralhada"
// (scrypt + sal aleatório). Para conferir, embaralhamos de novo o que a
// pessoa digitou e comparamos. Mesmo esquema do BuscaJob.
import "server-only";
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const PASSWORD_MIN = 10;
const PASSWORD_MAX = 200; // senhas gigantes deixariam o servidor lento de propósito

/** Formato guardado: scrypt$<sal em base64>$<hash em base64> */
export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [alg, saltB64, hashB64] = stored.split("$");
  if (alg !== "scrypt" || !saltB64 || !hashB64 || pw.length > PASSWORD_MAX) return false;
  const expected = Buffer.from(hashB64, "base64");
  const got = await scrypt(pw, Buffer.from(saltB64, "base64"), expected.length);
  return timingSafeEqual(got, expected);
}

/** Devolve a mensagem de erro, ou null se a senha serve. */
export function validatePassword(pw: string): string | null {
  if (pw.length < PASSWORD_MIN) return `A senha precisa ter pelo menos ${PASSWORD_MIN} caracteres.`;
  if (pw.length > PASSWORD_MAX) return "Senha longa demais.";
  return null;
}

/**
 * Hash falso usado quando o e-mail não existe: assim a resposta demora o
 * mesmo tempo e ninguém descobre quais e-mails têm conta pelo relógio.
 */
export const DUMMY_HASH = `scrypt$${"A".repeat(22)}==$${"A".repeat(86)}==`;
