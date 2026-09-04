import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { useCreateSessionMutation } from "@/entities/session/api/sessionApi";
import {
  sessionDraftSchema,
  type SessionDraft,
} from "@/entities/session/model/types";
import {
  clearDraft,
  saveDraft,
} from "@/features/interview/model/interviewSlice";
import { getApiErrorMessage } from "@/shared/api/baseApi";

const stepFields: Array<Array<keyof SessionDraft>> = [
  ["vacancy"],
  ["profile"],
  ["level", "format"],
  ["questionsCount", "durationMinutes", "includeHints"],
];

const stepTitles = ["Вакансия", "Профиль", "Формат", "Настройки вопросов"];

export function NewInterviewPage() {
  const dispatch = useAppDispatch();
  const draft = useAppSelector((state) => state.interview.draft);
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [createSession, createState] = useCreateSessionMutation();
  const form = useForm<SessionDraft>({
    defaultValues: draft,
    resolver: zodResolver(sessionDraftSchema),
  });
  const values = useWatch({ control: form.control });
  const savedDraftRef = useRef(draft);

  useEffect(() => {
    const nextDraft = { ...savedDraftRef.current, ...values };

    if (isSameDraft(savedDraftRef.current, nextDraft)) {
      return;
    }

    savedDraftRef.current = nextDraft;
    dispatch(saveDraft(nextDraft));
  }, [dispatch, values]);

  async function goNext() {
    if (await form.trigger(stepFields[step])) {
      setStep((currentStep) => currentStep + 1);
    }
  }

  async function create(values: SessionDraft) {
    try {
      const session = await createSession(values).unwrap();
      dispatch(clearDraft());
      navigate(`/interview/${session.id}`);
    } catch (error) {
      form.setError("root", { message: getApiErrorMessage(error) });
    }
  }

  return (
    <section className="max-w-2xl space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Новая сессия · шаг {step + 1} из {stepTitles.length}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">{stepTitles[step]}</h1>
        <p className="text-muted-foreground">
          Укажите параметры, чтобы подготовить практическую сессию.
        </p>
      </header>
      <form
        className="space-y-5 rounded-lg border border-border bg-card p-6"
        noValidate
        onSubmit={form.handleSubmit(create)}
      >
        {step === 0 && (
          <Field label="Вакансия" error={form.formState.errors.vacancy?.message}>
            <textarea
              {...form.register("vacancy")}
              className="min-h-28 rounded-md border border-input bg-background px-3 py-2"
              id="vacancy"
              placeholder="Например: Senior Frontend Developer"
            />
          </Field>
        )}
        {step === 1 && (
          <Field label="Профиль кандидата" error={form.formState.errors.profile?.message}>
            <textarea
              {...form.register("profile")}
              className="min-h-32 rounded-md border border-input bg-background px-3 py-2"
              id="profile"
              placeholder="Опишите опыт и навыки кандидата"
            />
          </Field>
        )}
        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Уровень" error={form.formState.errors.level?.message}>
              <select {...form.register("level")} className="rounded-md border border-input bg-background px-3 py-2" id="level">
                <option value="junior">Junior</option>
                <option value="middle">Middle</option>
                <option value="senior">Senior</option>
              </select>
            </Field>
            <Field label="Формат" error={form.formState.errors.format?.message}>
              <select {...form.register("format")} className="rounded-md border border-input bg-background px-3 py-2" id="format">
                <option value="technical">Техническое интервью</option>
                <option value="behavioral">Поведенческое интервью</option>
                <option value="mixed">Смешанное интервью</option>
              </select>
            </Field>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Количество вопросов" error={form.formState.errors.questionsCount?.message}>
                <select {...form.register("questionsCount", { valueAsNumber: true })} className="rounded-md border border-input bg-background px-3 py-2" id="questions-count">
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                </select>
              </Field>
              <Field label="Длительность, минут" error={form.formState.errors.durationMinutes?.message}>
                <select {...form.register("durationMinutes", { valueAsNumber: true })} className="rounded-md border border-input bg-background px-3 py-2" id="duration-minutes">
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={45}>45</option>
                  <option value={60}>60</option>
                  <option value={90}>90</option>
                </select>
              </Field>
            </div>
            <label className="flex items-center gap-3" htmlFor="include-hints">
              <input {...form.register("includeHints")} id="include-hints" type="checkbox" />
              Показывать подсказки во время сессии
            </label>
          </div>
        )}
        {form.formState.errors.root && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <button
            className="rounded-md border border-border px-4 py-2 disabled:opacity-50"
            disabled={step === 0 || createState.isLoading}
            onClick={() => setStep((currentStep) => currentStep - 1)}
            type="button"
          >
            Назад
          </button>
          {step < stepTitles.length - 1 ? (
            <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground" onClick={goNext} type="button">
              Далее
            </button>
          ) : (
            <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50" disabled={createState.isLoading} type="submit">
              Создать сессию
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

function isSameDraft(first: SessionDraft, second: SessionDraft) {
  return (
    first.vacancy === second.vacancy &&
    first.profile === second.profile &&
    first.format === second.format &&
    first.level === second.level &&
    first.questionsCount === second.questionsCount &&
    first.durationMinutes === second.durationMinutes &&
    first.includeHints === second.includeHints
  );
}

function Field({
  children,
  error,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}) {
  const fieldId = label === "Вакансия" ? "vacancy" : label === "Профиль кандидата" ? "profile" : label === "Уровень" ? "level" : label === "Формат" ? "format" : label === "Количество вопросов" ? "questions-count" : "duration-minutes";

  return (
    <label className="grid gap-2" htmlFor={fieldId}>
      {label}
      {children}
      {error && <span className="text-sm text-destructive">{error}</span>}
    </label>
  );
}
