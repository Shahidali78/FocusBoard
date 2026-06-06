"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const form = new FormData(event.currentTarget);
    const payload =
      mode === "login"
        ? {
            email: form.get("email"),
            password: form.get("password"),
          }
        : {
            name: form.get("name"),
            email: form.get("email"),
            password: form.get("password"),
          };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to continue");
      router.push("/dashboard");
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to continue",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {mode === "register" && (
        <label className="field">
          <span>Full name</span>
          <div className="input-wrap">
            <UserRound size={18} />
            <input name="name" placeholder="Shahid Ali" autoComplete="name" required />
          </div>
        </label>
      )}

      <label className="field">
        <span>Email address</span>
        <div className="input-wrap">
          <Mail size={18} />
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>
      </label>

      <label className="field">
        <span>Password</span>
        <div className="input-wrap">
          <LockKeyhole size={18} />
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder={mode === "register" ? "At least 8 characters" : "Enter your password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
          <button
            type="button"
            className="input-action"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>

      {mode === "login" && (
        <div className="auth-options">
          <label>
            <input type="checkbox" /> Remember me
          </label>
          <span>Secure local account</span>
        </div>
      )}

      {error && <div className="form-error">{error}</div>}

      <button className="button button-primary auth-submit" disabled={pending}>
        {pending ? <LoaderCircle className="spin" size={19} /> : null}
        {mode === "login" ? "Sign in to Focusboard" : "Create my workspace"}
        {!pending ? <ArrowRight size={18} /> : null}
      </button>

      <p className="auth-switch">
        {mode === "login" ? "New to Focusboard?" : "Already have an account?"}{" "}
        <Link href={mode === "login" ? "/register" : "/login"}>
          {mode === "login" ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
