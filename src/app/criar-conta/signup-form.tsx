"use client";
import { useActionState } from "react";
import { Field, FormError, SubmitButton, TextInput } from "@/components/form";
import { criarConta, type AuthFormState } from "../entrar/actions";

export function SignupForm({ minLength }: { minLength: number }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(criarConta, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      {/* Armadilha para robôs: invisível para pessoas */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label htmlFor="website">Não preencha</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <Field id="name" label="Nome">
        <TextInput id="name" name="name" required autoFocus maxLength={80} autoComplete="name" defaultValue={state.name} />
      </Field>
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
      <Field id="password" label="Senha" hint={`Pelo menos ${minLength} caracteres.`}>
        <TextInput
          id="password"
          name="password"
          type="password"
          required
          minLength={minLength}
          autoComplete="new-password"
          aria-describedby="password-hint"
        />
      </Field>
      <Field id="pass2" label="Repita a senha">
        <TextInput id="pass2" name="pass2" type="password" required minLength={minLength} autoComplete="new-password" />
      </Field>
      <FormError>{state.error}</FormError>
      <SubmitButton pending={pending} pendingText="Criando conta…">
        Criar conta
      </SubmitButton>
    </form>
  );
}
