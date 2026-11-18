// Peças de formulário reaproveitadas (campos, aviso de erro, botão principal).
import type { ComponentProps, ReactNode } from "react";

export function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Classes do campo de texto, para quem precisa montar um campo próprio. */
export const inputClass =
  "h-12 rounded-control border-2 border-border bg-surface px-3.5 text-base placeholder:text-text-muted/70 hover:border-text-muted focus-visible:border-ring focus-visible:outline-none";

export function TextInput(props: ComponentProps<"input">) {
  return <input {...props} className={inputClass} />;
}

export function FormError({ children }: { children?: ReactNode }) {
  return (
    <p
      aria-live="polite"
      role={children ? "alert" : undefined}
      className={children ? "border-l-4 border-danger bg-surface-sunken px-3 py-2.5 text-sm font-medium text-danger" : "sr-only"}
    >
      {children}
    </p>
  );
}

/** Botão principal: vermelho-tomate, letra de letreiro. */
export const primaryButtonClass =
  "pressable letreiro flex h-13 w-full items-center justify-center rounded-control bg-primary pt-0.5 text-[1.375rem] text-primary-fg shadow-[0_3px_0_var(--text)] active:shadow-[0_1px_0_var(--text)] disabled:opacity-60";

/** Botão secundário: contorno, mesma letra. */
export const secondaryButtonClass =
  "pressable letreiro flex h-13 w-full items-center justify-center rounded-control border-2 border-text bg-surface pt-0.5 text-[1.375rem] text-text hover:bg-surface-sunken";

export function SubmitButton({
  pending,
  pendingText,
  children,
}: {
  pending: boolean;
  pendingText: string;
  children: ReactNode;
}) {
  return (
    <button type="submit" disabled={pending} className={`mt-1 ${primaryButtonClass}`}>
      {pending ? pendingText : children}
    </button>
  );
}
