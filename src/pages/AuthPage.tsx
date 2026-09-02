import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";

import {
  useStartEmailLoginMutation,
  useVerifyEmailLoginMutation,
} from "@/entities/user/api/authApi";
import { getApiErrorMessage } from "@/shared/api/baseApi";

const emailSchema = z.object({
  email: z.string().trim().email("Введите корректный e-mail"),
});

const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Введите шестизначный код"),
});

type EmailForm = z.infer<typeof emailSchema>;
type CodeForm = z.infer<typeof codeSchema>;

export function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
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

  async function submitEmail(values: EmailForm) {
    try {
      await startEmailLogin({ email: values.email.trim() }).unwrap();
      setEmail(values.email.trim());
      setStep("code");
    } catch (error) {
      emailForm.setError("root", { message: getApiErrorMessage(error) });
    }
  }

  async function submitCode(values: CodeForm) {
    try {
      await verifyEmailLogin({ email, code: values.code }).unwrap();
      navigate("/profile");
    } catch (error) {
      codeForm.setError("root", { message: getApiErrorMessage(error) });
    }
  }

  if (step === "code") {
    return (
      <section className="max-w-md space-y-5">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Подтвердите e-mail
          </h1>
          <p className="text-muted-foreground">Мы отправили код на {email}.</p>
        </div>
        <form
          className="space-y-4"
          onSubmit={codeForm.handleSubmit(submitCode)}
        >
          <label className="grid gap-2" htmlFor="code">
            Код из письма
            <input
              {...codeForm.register("code")}
              autoComplete="one-time-code"
              className="rounded-md border border-input bg-background px-3 py-2"
              id="code"
              inputMode="numeric"
            />
          </label>
          {codeForm.formState.errors.code && (
            <p className="text-sm text-destructive">
              {codeForm.formState.errors.code.message}
            </p>
          )}
          {codeForm.formState.errors.root && (
            <p role="alert" className="text-sm text-destructive">
              {codeForm.formState.errors.root.message}
            </p>
          )}
          <button
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
            disabled={verifyState.isLoading}
          >
            Войти
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="max-w-md space-y-5">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Вход</h1>
        <p className="text-muted-foreground">
          Укажите e-mail, чтобы получить код для входа.
        </p>
      </div>
      <form
        className="space-y-4"
        noValidate
        onSubmit={emailForm.handleSubmit(submitEmail)}
      >
        <label className="grid gap-2" htmlFor="email">
          E-mail
          <input
            {...emailForm.register("email")}
            autoComplete="email"
            className="rounded-md border border-input bg-background px-3 py-2"
            id="email"
            inputMode="email"
            type="email"
          />
        </label>
        {emailForm.formState.errors.email && (
          <p className="text-sm text-destructive">
            {emailForm.formState.errors.email.message}
          </p>
        )}
        {emailForm.formState.errors.root && (
          <p role="alert" className="text-sm text-destructive">
            {emailForm.formState.errors.root.message}
          </p>
        )}
        <button
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          disabled={startState.isLoading}
        >
          Получить код
        </button>
      </form>
    </section>
  );
}
