"use client";
import { useActionState } from "react";
import { Field, FormError, SubmitButton, TextInput } from "@/components/form";
import { entrar, type AuthFormState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(entrar, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field id="email" label="E-mail">
        <TextInput
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="voce@exemplo.com"
          defaultValue={state.email}
        />
      </Field>
      <Field id="password" label="Senha">
        <TextInput id="password" name="password" type="password" required autoComplete="current-password" />
      </Field>
      <FormError>{state.error}</FormError>
      <SubmitButton pending={pending} pendingText="Entrando…">
        Entrar
      </SubmitButton>
    </form>
  );
}
