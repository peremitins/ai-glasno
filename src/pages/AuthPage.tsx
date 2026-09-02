import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Mail, Moon, Sun } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router";
import { z } from "zod";

import {
  useStartEmailLoginMutation,
  useVerifyEmailLoginMutation,
} from "@/entities/user/api/authApi";
import { getApiErrorMessage } from "@/shared/api/baseApi";

import "./AuthPage.css";

const emailSchema = z.object({
  email: z.string().trim().email("Введите корректный e-mail"),
});

const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Введите шестизначный код"),
});

type EmailForm = z.infer<typeof emailSchema>;
type CodeForm = z.infer<typeof codeSchema>;

const CODE_TTL_SECONDS = 10 * 60;
const RESEND_DELAY_SECONDS = 60;

function formatSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function resolveSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [devCode, setDevCode] = useState("");
  const [resendRemaining, setResendRemaining] = useState(0);
  const [codeExpiresIn, setCodeExpiresIn] = useState(0);
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [startEmailLogin, startState] = useStartEmailLoginMutation();
  const [verifyEmailLogin, verifyState] = useVerifyEmailLoginMutation();
  const emailForm = useForm<EmailForm>({
    defaultValues: { email: "" },
    resolver: zodResolver(emailSchema),
  });
  const codeForm = useForm<CodeForm>({
    defaultValues: { code: "" },
    resolver: zodResolver(codeSchema),
  });
  const nextPath = useMemo(
    () => resolveSafeNextPath(searchParams.get("next")),
    [searchParams],
  );

  useEffect(() => {
    if (step !== "code") {
      return;
    }

    const timer = window.setInterval(() => {
      setResendRemaining((value) => Math.max(0, value - 1));
      setCodeExpiresIn((value) => Math.max(0, value - 1));
    }, 1_000);

    return () => window.clearInterval(timer);
  }, [step]);

  function startCountdowns() {
    setResendRemaining(RESEND_DELAY_SECONDS);
    setCodeExpiresIn(CODE_TTL_SECONDS);
  }

  async function submitEmail(values: EmailForm) {
    try {
      const normalizedEmail = values.email.trim();
      const response = await startEmailLogin({
        email: normalizedEmail,
      }).unwrap();

      setEmail(normalizedEmail);
      setDevCode(response.devCode ?? "");
      codeForm.reset({ code: "" });
      setStep("code");
      startCountdowns();
    } catch (error) {
      emailForm.setError("root", { message: getApiErrorMessage(error) });
    }
  }

  async function resendCode() {
    if (resendRemaining > 0 || !email) {
      return;
    }

    try {
      const response = await startEmailLogin({ email }).unwrap();

      setDevCode(response.devCode ?? "");
      codeForm.reset({ code: "" });
      startCountdowns();
    } catch (error) {
      codeForm.setError("root", { message: getApiErrorMessage(error) });
    }
  }

  async function submitCode(values: CodeForm) {
    try {
      await verifyEmailLogin({ email, code: values.code }).unwrap();
      navigate(nextPath, { replace: true });
    } catch (error) {
      codeForm.setError("root", { message: getApiErrorMessage(error) });
    }
  }

  function resetToEmail() {
    setStep("email");
    setDevCode("");
    setResendRemaining(0);
    setCodeExpiresIn(0);
    codeForm.reset({ code: "" });
  }

  function toggleTheme() {
    const nextTheme = !isLightTheme;

    setIsLightTheme(nextTheme);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = nextTheme ? "light" : "dark";
    }
  }

  if (step === "code") {
    return (
      <AuthCard
        isLightTheme={isLightTheme}
        onToggleTheme={toggleTheme}
        title="Подтвердите e-mail"
      >
        <form
          className="auth-form"
          noValidate
          onSubmit={codeForm.handleSubmit(submitCode)}
        >
          <div className="verify-note">
            <span className="verify-note__icon" aria-hidden="true">
              <Mail size={20} />
            </span>
            <p>Мы отправили код на {email}.</p>
          </div>
          <label className="field" htmlFor="code">
            <span>Код из письма</span>
            <input
              {...codeForm.register("code", {
                onChange: (event) => {
                  codeForm.setValue(
                    "code",
                    event.target.value.replace(/\D/g, ""),
                  );
                },
              })}
              autoComplete="one-time-code"
              className="code-input"
              id="code"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
            />
          </label>
          <div className="code-meta">
            <span>Код действует {formatSeconds(codeExpiresIn)}</span>
            <button
              disabled={resendRemaining > 0 || startState.isLoading}
              onClick={resendCode}
              type="button"
            >
              {resendRemaining > 0
                ? `Отправить повторно через ${resendRemaining} с`
                : "Отправить повторно"}
            </button>
          </div>
          {devCode && <p className="hint">Код для разработки: {devCode}</p>}
          {codeForm.formState.errors.code && (
            <p className="error">{codeForm.formState.errors.code.message}</p>
          )}
          {codeForm.formState.errors.root && (
            <p role="alert" className="error">
              {codeForm.formState.errors.root.message}
            </p>
          )}
          <button
            className="primary-action auth-submit"
            disabled={verifyState.isLoading}
            type="submit"
          >
            Подтвердить <ArrowRight aria-hidden="true" size={18} />
          </button>
          <div className="verify-actions">
            <button onClick={resetToEmail} type="button">
              <ArrowLeft aria-hidden="true" size={16} /> Изменить e-mail
            </button>
          </div>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      isLightTheme={isLightTheme}
      onToggleTheme={toggleTheme}
      title="Вход"
    >
      <form
        className="auth-form"
        noValidate
        onSubmit={emailForm.handleSubmit(submitEmail)}
      >
        <label className="field" htmlFor="email">
          <span>E-mail</span>
          <span className="input-shell">
            <Mail aria-hidden="true" size={18} />
            <input
              {...emailForm.register("email")}
              autoCapitalize="none"
              autoComplete="email"
              id="email"
              inputMode="email"
              placeholder="you@example.com"
              spellCheck="false"
              type="email"
            />
          </span>
        </label>
        {emailForm.formState.errors.email && (
          <p className="error">{emailForm.formState.errors.email.message}</p>
        )}
        {emailForm.formState.errors.root && (
          <p role="alert" className="error">
            {emailForm.formState.errors.root.message}
          </p>
        )}
        <button
          className="primary-action auth-submit"
          disabled={startState.isLoading}
          type="submit"
        >
          Получить код <ArrowRight aria-hidden="true" size={18} />
        </button>
      </form>
    </AuthCard>
  );
}

type AuthCardProps = {
  children: ReactNode;
  isLightTheme: boolean;
  onToggleTheme: () => void;
  title: string;
};

function AuthCard({
  children,
  isLightTheme,
  onToggleTheme,
  title,
}: AuthCardProps) {
  return (
    <main className="auth-page">
      <div aria-hidden="true" className="aurora-field">
        <span className="aurora-field__layer aurora-field__layer--primary" />
        <span className="aurora-field__layer aurora-field__layer--secondary" />
        <span className="aurora-field__layer aurora-field__layer--tertiary" />
      </div>
      <section className="auth-shell">
        <article className="auth-card glass-frame">
          <header className="auth-card__head">
            <div>
              <Link className="brand" to="/">
                <span className="brand-mark">
                  <img
                    alt=""
                    className="brand-logo"
                    height="40"
                    src="/brand/logo.webp"
                    width="40"
                  />
                </span>
                <span>Гласно</span>
              </Link>
              <h1>{title}</h1>
            </div>
            <button
              aria-label="Изменить тему"
              className="icon-button"
              onClick={onToggleTheme}
              type="button"
            >
              {isLightTheme ? (
                <Sun aria-hidden="true" size={18} />
              ) : (
                <Moon aria-hidden="true" size={18} />
              )}
            </button>
          </header>
          {children}
          <p className="legal">
            Продолжая, вы принимаете{" "}
            <a
              href="https://glasno.app/legal/terms-of-service-ru.html"
              rel="noreferrer"
              target="_blank"
            >
              условия использования
            </a>{" "}
            и{" "}
            <a
              href="https://glasno.app/legal/privacy-policy-ru.html"
              rel="noreferrer"
              target="_blank"
            >
              политику конфиденциальности
            </a>
            .
          </p>
        </article>
      </section>
    </main>
  );
}
