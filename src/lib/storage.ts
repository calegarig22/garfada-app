// Guardar fotos fora do banco, num serviço "S3-compatível"
// (Backblaze B2, Cloudflare R2, MinIO… todos falam a mesma língua).
// O balde é PRIVADO: cada foto é mostrada por um link assinado e temporário.
// Enquanto as variáveis S3_* não existirem, o app funciona sem fotos.
import "server-only";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Limpa valores colados com espaço, quebra de linha ou aspas (aconteceu na Vercel).
const clean = (v?: string) => (v ?? "").replace(/\s+/g, "").replace(/^(['"])(.*)\1$/, "$2") || undefined;

const env = {
  endpoint: clean(process.env.S3_ENDPOINT),
  region: clean(process.env.S3_REGION) || "auto",
  bucket: clean(process.env.S3_BUCKET),
  accessKeyId: clean(process.env.S3_ACCESS_KEY_ID),
  secretAccessKey: clean(process.env.S3_SECRET_ACCESS_KEY),
};

export const photosEnabled = Boolean(env.endpoint && env.bucket && env.accessKeyId && env.secretAccessKey);

let client: S3Client | null = null;
function s3() {
  client ??= new S3Client({
    endpoint: env.endpoint,
    region: env.region,
    credentials: { accessKeyId: env.accessKeyId!, secretAccessKey: env.secretAccessKey! },
    forcePathStyle: true,
  });
  return client;
}

const SEVEN_DAYS = 7 * 24 * 60 * 60;

/**
 * Link temporário (7 dias) para ver uma foto. A assinatura usa o começo do dia,
 * então o link fica igual o dia todo e o navegador aproveita o cache.
 */
export async function photoUrl(key: string) {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: env.bucket, Key: key }), {
    expiresIn: SEVEN_DAYS,
    signingDate: startOfDay,
  });
}

/**
 * Acrescenta o link de cada foto. Fotos do app ganham link assinado;
 * fotos externas (Wikimedia) já têm o próprio endereço.
 */
export async function withUrls<T extends { key: string | null; external?: string | null }>(
  photos: T[],
): Promise<(T & { url: string })[]> {
  const out = await Promise.all(
    photos.map(async (p): Promise<(T & { url: string }) | null> => {
      if (p.external) return { ...p, url: p.external };
      if (p.key && photosEnabled) return { ...p, url: await photoUrl(p.key) };
      return null;
    }),
  );
  return out.filter((p) => p !== null);
}

export const MAX_PHOTOS = 4;
const MAX_BYTES = 1.5 * 1024 * 1024; // o navegador já comprime para ~300 KB
const MAX_SIDE = 4000;

export type UploadedPhoto = { storageKey: string; width: number; height: number };

/** Confere que o arquivo é mesmo uma imagem WebP/JPEG/PNG olhando os primeiros bytes. */
function sniffImage(buf: Buffer): { ext: string; type: string } | null {
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP")
    return { ext: "webp", type: "image/webp" };
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { ext: "png", type: "image/png" };
  return null;
}

/**
 * Lê as fotos de um formulário (campos "photos", "photoWidth", "photoHeight"),
 * confere tudo e envia para o armazenamento. Devolve as chaves para salvar no banco.
 */
export async function uploadPhotosFromForm(formData: FormData, folder: string): Promise<UploadedPhoto[]> {
  if (!photosEnabled) return [];
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const widths = formData.getAll("photoWidth").map(Number);
  const heights = formData.getAll("photoHeight").map(Number);

  const out: UploadedPhoto[] = [];
  for (const [i, file] of files.slice(0, MAX_PHOTOS).entries()) {
    if (file.size > MAX_BYTES) throw new Error("Foto grande demais.");
    const buf = Buffer.from(await file.arrayBuffer());
    const kind = sniffImage(buf);
    if (!kind) throw new Error("Arquivo não é uma foto.");
    const width = Math.round(widths[i]);
    const height = Math.round(heights[i]);
    if (!(width > 0 && height > 0 && width <= MAX_SIDE && height <= MAX_SIDE)) throw new Error("Foto inválida.");

    const storageKey = `${folder}/${randomUUID()}.${kind.ext}`;
    await s3().send(
      new PutObjectCommand({
        Bucket: env.bucket,
        Key: storageKey,
        Body: buf,
        ContentType: kind.type,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    out.push({ storageKey, width, height });
  }
  return out;
}

/** Apaga fotos do armazenamento (ex.: quando uma review é apagada). Falhas não travam o app. */
export async function deletePhotos(keys: string[]) {
  if (!photosEnabled) return;
  const results = await Promise.allSettled(
    keys.map((Key) => s3().send(new DeleteObjectCommand({ Bucket: env.bucket, Key }))),
  );
  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed) console.error(`[fotos] ${failed} de ${keys.length} não foram apagadas do armazenamento`);
}
