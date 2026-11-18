"use client";
// Escolher fotos: o próprio navegador reduz cada foto (máx. 1600 px, WebP ~300 KB)
// antes de enviar. Assim o envio é rápido e o armazenamento grátis rende muito mais.
import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

const MAX_SIDE = 1600;

type Picked = { file: File; url: string; width: number; height: number };

async function compress(original: File): Promise<Picked> {
  const bitmap = await createImageBitmap(original);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const toBlob = (type: string, q: number) =>
    new Promise<Blob | null>((ok) => canvas.toBlob(ok, type, q));
  // WebP é menor; navegadores que não sabem gerar WebP devolvem PNG, então caímos para JPEG.
  let blob = await toBlob("image/webp", 0.8);
  if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg", 0.82);
  if (!blob) throw new Error("compress");
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const file = new File([blob], `foto.${ext}`, { type: blob.type });
  return { file, url: URL.createObjectURL(file), width, height };
}

export function PhotoPicker({ max = 4, label = "Fotos (opcional)" }: { max?: number; label?: string }) {
  const [photos, setPhotos] = useState<Picked[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const anchor = useRef<HTMLFieldSetElement>(null);

  // Na hora do envio, as fotos já comprimidas (e o tamanho de cada uma) entram no formulário.
  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (!form) return;
    const onFormData = (e: FormDataEvent) => {
      for (const k of ["photos", "photoWidth", "photoHeight"]) e.formData.delete(k);
      for (const p of photos) {
        e.formData.append("photos", p.file);
        e.formData.append("photoWidth", String(p.width));
        e.formData.append("photoHeight", String(p.height));
      }
    };
    form.addEventListener("formdata", onFormData);
    return () => form.removeEventListener("formdata", onFormData);
  }, [photos]);

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), [photos]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])].slice(0, max - photos.length);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    setError(null);
    const done: Picked[] = [];
    for (const f of files) {
      try {
        done.push(await compress(f));
      } catch {
        setError("Uma das fotos não abriu. Tente outra (JPG, PNG ou WebP).");
      }
    }
    setPhotos((cur) => [...cur, ...done].slice(0, max));
    setBusy(false);
  }

  return (
    <fieldset ref={anchor} className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-semibold">{label}</legend>

      <ul className="grid grid-cols-4 gap-2">
        {photos.map((p, i) => (
          <li key={p.url} className="relative aspect-square overflow-hidden rounded-control border-2 border-text">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => setPhotos((cur) => cur.filter((x) => x !== p))}
              aria-label={`Tirar foto ${i + 1}`}
              className="absolute right-0.5 top-0.5 flex size-8 items-center justify-center rounded-control bg-text text-bg"
            >
              <X aria-hidden size={16} />
            </button>
          </li>
        ))}
        {photos.length < max ? (
          <li>
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-control border-2 border-dashed border-text-muted text-xs font-semibold text-text-muted hover:border-text hover:text-text focus-within:border-ring">
              <ImagePlus aria-hidden size={22} />
              {busy ? "Preparando…" : "Adicionar"}
              <input type="file" accept="image/*" multiple className="sr-only" onChange={onPick} disabled={busy} />
            </label>
          </li>
        ) : null}
      </ul>
      <p className="text-sm text-text-muted" aria-live="polite">
        {error ?? `Até ${max} fotos. Quem usa o Garfada vai poder ver.`}
      </p>
    </fieldset>
  );
}
