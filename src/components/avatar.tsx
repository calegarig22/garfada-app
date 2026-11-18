// Avatar: foto da pessoa (se tiver) ou a inicial num círculo verde-garrafa.
export function Avatar({
  name,
  image,
  size = 40,
}: {
  name: string | null;
  image?: string | null;
  size?: number;
}) {
  const initial = (name ?? "?").trim().charAt(0).toUpperCase() || "?";
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="letreiro flex shrink-0 items-center justify-center rounded-full bg-accent pt-[0.1em] text-accent-fg"
      style={{ width: size, height: size, fontSize: size * 0.55 }}
    >
      {initial}
    </span>
  );
}
