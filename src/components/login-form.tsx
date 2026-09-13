"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginState } from "@/app/login/actions";

const initialState: LoginState = { error: "" };

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return <button className="primary-button login-submit" disabled={disabled || pending}>{pending ? "Signing in..." : "Sign in"}</button>;
}

export function LoginForm({ configured }: { configured: boolean }) {
  const [state, formAction] = useActionState(login, initialState);
  return (
    <form className="login-form" action={formAction}>
      <label><span>Email</span><input name="email" type="email" autoComplete="email" required disabled={!configured} /></label>
      <label><span>Password</span><input name="password" type="password" autoComplete="current-password" required disabled={!configured} /></label>
      {state.error && <p className="login-error" role="alert">{state.error}</p>}
      <SubmitButton disabled={!configured} />
    </form>
  );
}
