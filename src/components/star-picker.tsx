"use client";
// Escolher a nota com meia estrela. Por baixo são 10 opções (1 a 10);
// cada estrela tem uma metade esquerda (x,5) e uma direita (inteira).
import { useState } from "react";
import { NotaPlaquinha } from "./plaquinha";

const fmt = (n: number) => (n / 2).toLocaleString("pt-BR", { minimumFractionDigits: 1 });

export function StarPicker({ name = "rating", defaultValue = 0 }: { name?: string; defaultValue?: number }) {
  const [value, setValue] = useState(defaultValue);
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">Sua nota</legend>
      <div className="flex items-center gap-4">
        <div className="flex" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((star) => {
            const fill = shown >= star * 2 ? 1 : shown === star * 2 - 1 ? 0.5 : 0;
            return (
              <span key={star} className="relative size-11">
                <StarShape fill={fill} />
                {[star * 2 - 1, star * 2].map((v) => (
                  <label
                    key={v}
                    className={`absolute inset-y-0 w-1/2 cursor-pointer ${v % 2 ? "left-0" : "right-0"}`}
                    onMouseEnter={() => setHover(v)}
                  >
                    <input
                      type="radio"
                      name={name}
                      value={v}
                      required
                      checked={value === v}
                      onChange={() => setValue(v)}
                      className="peer sr-only"
                    />
                    <span className="sr-only">{fmt(v)} estrelas</span>
                    <span aria-hidden className="absolute inset-0 rounded-control peer-focus-visible:outline-2 peer-focus-visible:outline-ring" />
                  </label>
                ))}
              </span>
            );
          })}
        </div>
        {shown ? <NotaPlaquinha nota={shown} className="text-2xl" /> : <span className="text-sm text-text-muted">Toque nas estrelas</span>}
      </div>
    </fieldset>
  );
}

function StarShape({ fill }: { fill: number }) {
  const d = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z";
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute inset-0 size-11 p-0.5">
      <path d={d} className="fill-star-empty" />
      {fill > 0 ? (
        <path d={d} className="fill-star" style={fill < 1 ? { clipPath: "inset(0 50% 0 0)" } : undefined} />
      ) : null}
      <path d={d} fill="none" className="stroke-text" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}
