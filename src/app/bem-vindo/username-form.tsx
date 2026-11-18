"use client";
import { useActionState } from "react";
import { primaryButtonClass } from "@/components/form";
import { salvarUsername, type UsernameState } from "./actions";

export function UsernameForm({ suggestion }: { suggestion: string }) {
  const [state, action, pending] = useActionState<UsernameState, FormData>(salvarUsername, {});

  return (
    <form action={action} className="mt-8 flex flex-col gap-2">
      <label htmlFor="username" className="text-sm font-semibold">
        Seu @username
      </label>
      <div className="flex h-12 items-center rounded-control border-2 border-border bg-surface px-3.5 hover:border-text-muted focus-within:border-ring">
        <span aria-hidden className="text-text-muted">@</span>
        <input
          id="username"
          name="username"
          required
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          defaultValue={state.value ?? suggestion}
          aria-invalid={state.error ? true : undefined}
          aria-describedby="username-help"
          className="h-full flex-1 bg-transparent pl-0.5 text-base outline-none"
        />
      </div>
      <p
        id="username-help"
        aria-live="polite"
        className={`text-sm ${state.error ? "text-danger" : "text-text-muted"}`}
      >
        {state.error ?? "É assim que as pessoas vão te encontrar. Dá para mudar depois."}
      </p>
      <button
        type="submit"
        disabled={pending}
        className={`mt-4 ${primaryButtonClass}`}
      >
        {pending ? "Salvando…" : "Continuar"}
      </button>
    </form>
  );
}
