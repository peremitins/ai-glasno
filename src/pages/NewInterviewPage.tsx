import { zodResolver } from "@hookform/resolvers/zod";
import {
  BriefcaseBusiness,
  FileText,
  Link2,
  Plus,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  useCreateSessionMutation,
  useExtractQuestionsMutation,
  useExtractResumeMutation,
} from "@/entities/session/api/sessionApi";
import {
  sessionDraftSchema,
  type AdvancedSessionCreationRequest,
  type SessionDraft,
} from "@/entities/session/model/types";
import {
  clearDraft,
  saveDraft,
} from "@/features/interview/model/interviewSlice";
import { getApiErrorMessage } from "@/shared/api/baseApi";
import { VoiceTextarea } from "@/shared/ui/VoiceTextarea";
import "./NewInterviewPage.css";

type TrainingMode = "candidate" | "interviewer";
type SourceMode = "hh_url" | "manual";
type Goal = "quick" | "standard" | "deep";
type InterviewerMode = "soft" | "neutral" | "strict";
type Focus = NonNullable<AdvancedSessionCreationRequest["focus"]> | null;

const roles = [
  {
    name: "Frontend-разработчик",
    tags: ["React", "TypeScript", "JavaScript", "CSS"],
  },
  {
    name: "Backend-разработчик",
    tags: ["Node.js", "API", "SQL", "Архитектура"],
  },
  { name: "Product-менеджер", tags: ["Discovery", "Метрики", "Коммуникация"] },
  { name: "UX/UI-дизайнер", tags: ["Figma", "Исследования", "Дизайн-системы"] },
] as const;
const goals = [
  { value: "quick", title: "Быстро", meta: "3 вопроса · 15 минут" },
  { value: "standard", title: "Стандарт", meta: "6 вопросов · 45 минут" },
  { value: "deep", title: "Глубоко", meta: "10 вопросов · 60 минут" },
] as const;
const levels = [
  { value: "junior", title: "Junior", meta: "Начало карьеры" },
  { value: "middle", title: "Middle", meta: "Самостоятельный специалист" },
  { value: "senior", title: "Senior", meta: "Экспертный уровень" },
] as const;
const modes = [
  { value: "soft", title: "Поддерживающий", meta: "Помогает раскрыться" },
  { value: "neutral", title: "Нейтральный", meta: "Деловой разговор" },
  { value: "strict", title: "Строгий", meta: "Требовательный формат" },
] as const;
const focuses = [
  { value: null, title: "Смешанное" },
  { value: "hr_screening", title: "HR-скрининг" },
  { value: "professional", title: "Профильное" },
  { value: "behavioral", title: "Поведенческое" },
  { value: "salary_negotiation", title: "Зарплата" },
] as const;
const personas = [
  "Сильный и краткий",
  "Многословный",
  "Тревожный",
  "Самоуверенный",
] as const;

export function NewInterviewPage() {
  const dispatch = useAppDispatch();
  const draft = useAppSelector((state) => state.interview.draft);
  const navigate = useNavigate();
  const [trainingMode, setTrainingMode] = useState<TrainingMode>("candidate");
  const [sourceMode, setSourceMode] = useState<SourceMode>("hh_url");
  const [isRoleListOpen, setIsRoleListOpen] = useState(false);
  const [role, setRole] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [goal, setGoal] = useState<Goal>("standard");
  const [interviewerMode, setInterviewerMode] =
    useState<InterviewerMode>("neutral");
  const [focus, setFocus] = useState<Focus>(null);
  const [persona, setPersona] = useState<(typeof personas)[number]>(
    personas[0],
  );
  const [questionPlan, setQuestionPlan] = useState<
    "glasno" | "custom" | "mixed" | "free"
  >("mixed");
  const [customQuestions, setCustomQuestions] = useState("");
  const [questionsFileName, setQuestionsFileName] = useState("");
  const [questionsFileText, setQuestionsFileText] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeExtractedText, setResumeExtractedText] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [createSession, createState] = useCreateSessionMutation();
  const [extractQuestions, extractQuestionsState] =
    useExtractQuestionsMutation();
  const [extractResume, extractResumeState] = useExtractResumeMutation();
  const form = useForm<SessionDraft>({
    defaultValues: draft,
    resolver: zodResolver(sessionDraftSchema),
  });
  const values = useWatch({ control: form.control });
  const savedDraftRef = useRef(draft);
  const rolePickerRef = useRef<HTMLDivElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const questionsInputRef = useRef<HTMLInputElement>(null);
  const matchingRole = useMemo(
    () =>
      roles.find(
        (item) =>
          item.name.toLocaleLowerCase() === role.trim().toLocaleLowerCase(),
      ),
    [role],
  );
  const roleTags = matchingRole?.tags ?? [];
  const suggestedRoles = useMemo(
    () =>
      roles.filter((item) =>
        item.name.toLocaleLowerCase().includes(role.trim().toLocaleLowerCase()),
      ),
    [role],
  );

  useEffect(() => {
    const next = { ...savedDraftRef.current, ...values };
    if (!sameDraft(savedDraftRef.current, next)) {
      savedDraftRef.current = next;
      dispatch(saveDraft(next));
    }
  }, [dispatch, values]);

  useEffect(() => {
    if (!isRoleListOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !rolePickerRef.current?.contains(event.target)
      ) {
        setIsRoleListOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isRoleListOpen]);

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  }
  function addCustomTag() {
    const next = customTag.trim();
    if (!next) return;
    setSelectedTags((current) =>
      current.includes(next) ? current : [...current, next],
    );
    setCustomTag("");
  }

  async function handleResumeFile(file: File | undefined) {
    if (!file) return;
    setResumeFileName(file.name);
    setResumeExtractedText("");
    try {
      const result = await extractResume(file).unwrap();
      setResumeFileName(result.fileName || file.name);
      setResumeExtractedText(result.text.slice(0, 15_000));
    } catch (error) {
      setResumeFileName("");
      form.setError("root", { message: getApiErrorMessage(error) });
    } finally {
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  }

  function clearResumeFile() {
    setResumeFileName("");
    setResumeExtractedText("");
    if (resumeInputRef.current) resumeInputRef.current.value = "";
  }

  async function handleQuestionsFile(file: File | undefined) {
    if (!file) return;
    setQuestionsFileName(file.name);
    setQuestionsFileText("");
    try {
      const result = await extractQuestions(file).unwrap();
      const text = result.text.trim();
      setQuestionsFileName(result.fileName || file.name);
      setQuestionsFileText(text);
      setCustomQuestions((current) =>
        [current.trim(), text].filter(Boolean).join("\n\n"),
      );
    } catch (error) {
      setQuestionsFileName("");
      form.setError("root", { message: getApiErrorMessage(error) });
    } finally {
      if (questionsInputRef.current) questionsInputRef.current.value = "";
    }
  }

  async function create(data: SessionDraft) {
    const source =
      sourceMode === "hh_url"
        ? { type: "hh_url" as const, url: data.vacancy.trim() }
        : role.trim()
          ? {
              type: "profession" as const,
              role: role.trim(),
              specialization: selectedTags.join(", ") || undefined,
            }
          : { type: "text" as const, text: data.vacancy.trim() };
    const request: AdvancedSessionCreationRequest = {
      trainingMode,
      source,
      resumeText: [
        resumeExtractedText.trim()
          ? `Резюме из файла «${resumeFileName}»:\n${resumeExtractedText.trim()}`
          : "",
        data.profile.trim()
          ? `Дополнительно от кандидата:\n${data.profile.trim()}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n")
        .slice(0, 15_000) || undefined,
      level: data.level,
      sessionGoal: goal,
      focus: focus ?? undefined,
      interviewerMode,
      customQuestionsText:
        questionPlan === "custom" || questionPlan === "mixed"
          ? customQuestions.trim() || undefined
          : undefined,
      candidatePersona: trainingMode === "interviewer" ? persona : undefined,
      questionSourceMode: questionPlan,
    };
    setPreparing(true);
    try {
      const session = await createSession(request).unwrap();
      dispatch(clearDraft());
      navigate(`/interview/${session.id}`);
    } catch (error) {
      form.setError("root", { message: getApiErrorMessage(error) });
      setPreparing(false);
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    if (
      sourceMode === "manual" &&
      role.trim() &&
      form.getValues("vacancy").trim().length < 10
    ) {
      form.setValue("vacancy", role.trim(), { shouldDirty: true });
    }
    void form.handleSubmit(create)(event);
  }

  return (
    <form className="interview-page" noValidate onSubmit={submit}>
      <section className="setup-shell glass-frame">
        <header className="setup-context-head">
          <div>
            <p className="panel-label">КОНТЕКСТ ПОДГОТОВКИ</p>
            <h1>К чему готовимся</h1>
          </div>
          <div
            aria-label="Режим тренировки"
            className="training-mode-switch"
            role="radiogroup"
          >
            <Choice
              active={trainingMode === "candidate"}
              description="Ответы"
              onClick={() => setTrainingMode("candidate")}
              title="Я прохожу интервью"
            />
            <Choice
              active={trainingMode === "interviewer"}
              description="Вопросы"
              onClick={() => setTrainingMode("interviewer")}
              title="Я провожу интервью"
            />
          </div>
        </header>
        <div className="context-grid">
          <article className="context-column">
            <p className="panel-label">ВАКАНСИЯ</p>
            <h2>На какое собеседование готовимся?</h2>
            <div className="source-tabs" role="tablist">
              <Tab
                active={sourceMode === "hh_url"}
                ariaLabel="По ссылке"
                icon={<Link2 />}
                onClick={() => setSourceMode("hh_url")}
                title="Ссылка"
              />
              <Tab
                active={sourceMode === "manual"}
                ariaLabel="Вручную"
                icon={<BriefcaseBusiness />}
                onClick={() => setSourceMode("manual")}
                title="Опишу словами"
              />
            </div>
            {sourceMode === "hh_url" ? (
              <Field
                error={form.formState.errors.vacancy?.message}
                label="Ссылка на вакансию"
              >
                <input
                  inputMode="url"
                  placeholder="https://hh.ru/vacancy/123456"
                  {...form.register("vacancy")}
                />
              </Field>
            ) : (
              <>
                <Field label="Профессия или роль">
                  <div
                    className="role-combobox"
                    ref={rolePickerRef}
                  >
                    <input
                      aria-autocomplete="list"
                      aria-controls="role-options"
                      aria-expanded={isRoleListOpen}
                      onChange={(event) => {
                        setRole(event.target.value);
                        setIsRoleListOpen(true);
                      }}
                      onFocus={() => setIsRoleListOpen(true)}
                      placeholder="Например, Frontend-разработчик"
                      role="combobox"
                      value={role}
                    />
                    {isRoleListOpen && (
                      <div className="role-menu" id="role-options" role="listbox">
                        {suggestedRoles.length ? (
                          suggestedRoles.map((item) => (
                            <button
                              aria-selected={role === item.name}
                              key={item.name}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                setRole(item.name);
                                setIsRoleListOpen(false);
                              }}
                              role="option"
                              type="button"
                            >
                              <strong>{item.name}</strong>
                              <span>{item.tags.join(" · ")}</span>
                            </button>
                          ))
                        ) : (
                          <p>Продолжите вводить название роли.</p>
                        )}
                      </div>
                    )}
                  </div>
                </Field>
                {role.trim() && (
                  <div className="tag-field">
                    <span>Контекст роли</span>
                    <div className="context-tags">
                      {[
                        ...roleTags,
                        ...selectedTags.filter(
                          (tag) => !roleTags.includes(tag as never),
                        ),
                      ].map((tag) => (
                        <button
                          aria-pressed={selectedTags.includes(tag)}
                          className={
                            selectedTags.includes(tag)
                              ? "context-tag context-tag--active"
                              : "context-tag"
                          }
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          type="button"
                        >
                          {tag}
                          {selectedTags.includes(tag) && " ×"}
                        </button>
                      ))}
                    </div>
                    <div className="custom-tag">
                      <input
                        aria-label="Свой контекст"
                        onChange={(event) => setCustomTag(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addCustomTag();
                          }
                        }}
                        placeholder="Добавить свой контекст"
                        value={customTag}
                      />
                      <button
                        aria-label="Добавить контекст"
                        onClick={addCustomTag}
                        type="button"
                      >
                        <Plus aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}
                <Field
                  error={form.formState.errors.vacancy?.message}
                  label="Описание вакансии"
                >
                  <textarea
                    placeholder="Название позиции, задачи, технологии и ожидания от кандидата"
                    {...form.register("vacancy")}
                  />
                </Field>
              </>
            )}
          </article>
          <article className="context-column context-column--candidate">
            <p className="panel-label">ВАШ ОПЫТ</p>
            <h2>
              {trainingMode === "candidate"
                ? "Резюме или опыт"
                : "Портрет кандидата"}
            </h2>
            <p className="source-hint">
              {trainingMode === "candidate"
                ? "Необязательно. Без резюме вопросы будут более общими."
                : "Настройте поведение кандидата для репетиции интервью."}
            </p>
            {trainingMode === "interviewer" && (
              <OptionGroup
                ariaLabel="Поведение кандидата"
                options={personas.map((title) => ({ value: title, title }))}
                value={persona}
                onChange={setPersona}
              />
            )}
            <div className="file-upload file-upload--compact">
              <input
                accept=".txt,.md,.pdf,.doc,.docx"
                aria-label="Загрузить резюме"
                className="file-input"
                disabled={extractResumeState.isLoading}
                id="resume-file"
                onChange={(event) =>
                  void handleResumeFile(event.target.files?.[0])
                }
                ref={resumeInputRef}
                type="file"
              />
              <label className="file-button" htmlFor="resume-file">
                <FileText aria-hidden="true" />
                <span>{resumeFileName || "Загрузить резюме"}</span>
              </label>
            </div>
            {(extractResumeState.isLoading || resumeExtractedText) && (
              <section className="resume-preview">
                <div className="resume-preview__head">
                  <div className="resume-preview__title">
                    <span>ВЫДЕРЖКА ИЗ ФАЙЛА</span>
                    <strong>Предпросмотр резюме</strong>
                  </div>
                  <div className="resume-preview__actions">
                    <small>
                      {extractResumeState.isLoading
                        ? "Извлекаем текст…"
                        : `${resumeExtractedText.length} символов`}
                    </small>
                    <button
                      aria-label="Очистить резюме"
                      className="resume-preview__clear"
                      onClick={clearResumeFile}
                      type="button"
                    >
                      <X aria-hidden="true" />
                      <span>Очистить</span>
                    </button>
                  </div>
                </div>
                {extractResumeState.isLoading ? (
                  <div className="resume-preview__skeleton" aria-label="Извлекаем текст резюме">
                    <span />
                    <span />
                    <span />
                  </div>
                ) : (
                  <div className="resume-preview__body">
                    {resumeExtractedText.split(/\n{2,}/).map((paragraph, index) => (
                      <p className="resume-preview__paragraph" key={`${paragraph}-${index}`}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )}
              </section>
            )}
            <Field
              error={form.formState.errors.profile?.message}
              label={
                trainingMode === "candidate"
                  ? "Коротко о себе"
                  : "Контекст кандидата"
              }
            >
              <VoiceTextarea
                aria-label={
                  trainingMode === "candidate"
                    ? "Коротко о себе"
                    : "Контекст кандидата"
                }
                onValueChange={(profile) =>
                  form.setValue("profile", profile, { shouldDirty: true })
                }
                placeholder="Опыт, навыки, проекты и важные детали для сценария"
                value={values.profile ?? ""}
              />
            </Field>
          </article>
        </div>
      </section>
      <section className="settings-panel glass-frame">
        <p className="panel-label">НАСТРОЙКИ</p>
        <h2>Параметры интервью</h2>
        <div className="parameter-grid">
          <OptionGroup
            ariaLabel="Длительность"
            options={goals}
            value={goal}
            onChange={setGoal}
          />
          <OptionGroup
            ariaLabel="Уровень"
            options={levels}
            value={values.level ?? "middle"}
            onChange={(level) =>
              form.setValue("level", level, { shouldDirty: true })
            }
          />
          <OptionGroup
            ariaLabel="Стиль интервьюера"
            options={modes}
            value={interviewerMode}
            onChange={setInterviewerMode}
          />
          <OptionGroup
            ariaLabel="Что тренируем"
            options={focuses}
            value={focus}
            onChange={setFocus}
          />
          <section className="parameter-group custom-questions-panel">
            <div className="parameter-copy">
              <h3>Свои вопросы</h3>
            </div>
            <div className="custom-questions-content">
              {trainingMode === "interviewer" && (
                <div aria-label="Источник вопросов" className="interviewer-scenario-grid" role="radiogroup">
                  {[
                    { value: "mixed", title: "Смешанный" },
                    { value: "custom", title: "Свой план" },
                    { value: "free", title: "Свободное интервью" },
                  ].map((option) => (
                    <button
                      aria-checked={questionPlan === option.value}
                      className={questionPlan === option.value ? "option-card option-card--active" : "option-card"}
                      key={option.value}
                      onClick={() => setQuestionPlan(option.value as typeof questionPlan)}
                      role="radio"
                      type="button"
                    >
                      <strong>{option.title}</strong>
                    </button>
                  ))}
                </div>
              )}
            {questionPlan !== "free" && (
              <div className="custom-questions-grid">
                <Field label="Что хотите потренировать">
                  <VoiceTextarea
                  aria-label="Свой план вопросов"
                  className="compact-voice-textarea"
                  onValueChange={setCustomQuestions}
                  placeholder="Добавьте вопросы или темы, если хотите дополнить план"
                  value={customQuestions}
                />
                </Field>
                <div className="question-options">
                  <div className="file-upload file-upload--compact">
                    <input
                      accept=".pdf,.docx,.txt,.md,.csv,.xls,.xlsx"
                      aria-label="Добавить файл с вопросами"
                      className="file-input"
                      disabled={extractQuestionsState.isLoading}
                      id="questions-file"
                      onChange={(event) =>
                        void handleQuestionsFile(event.target.files?.[0])
                      }
                      ref={questionsInputRef}
                      type="file"
                    />
                    <label className="file-button" htmlFor="questions-file">
                      <Upload aria-hidden="true" size={16} />
                      <span>{questionsFileName || "Добавить файл"}</span>
                    </label>
                  </div>
                  {trainingMode === "candidate" && (
                    <label className="toggle-option">
                      <input
                        checked={questionPlan === "custom"}
                        onChange={(event) =>
                          setQuestionPlan(event.target.checked ? "custom" : "mixed")
                        }
                        type="checkbox"
                      />
                      <span className="toggle-switch" aria-hidden="true" />
                      <strong>Только мои вопросы</strong>
                    </label>
                  )}
                  {extractQuestionsState.isLoading && (
                    <p className="file-status">Извлекаем вопросы…</p>
                  )}
                  {questionsFileText && !extractQuestionsState.isLoading && (
                    <p className="file-status">Текст из файла добавлен в поле вопросов.</p>
                  )}
                </div>
              </div>
            )}
            </div>
          </section>
        </div>
        {form.formState.errors.root && (
          <p className="setup-error" role="alert">
            {form.formState.errors.root.message}
          </p>
        )}
        <footer className="sticky-start-bar">
          <div>
            <p>Настройки можно изменить перед следующим интервью.</p>
            <div className="summary-chips">
              <span>
                {goal === "quick"
                  ? "Быстро"
                  : goal === "deep"
                    ? "Глубоко"
                    : "Стандарт"}
              </span>
              <span>{values.level ?? "middle"}</span>
              <span>{focuses.find((item) => item.value === focus)?.title}</span>
            </div>
          </div>
          <button disabled={createState.isLoading} type="submit">
            Начать репетицию <Sparkles aria-hidden="true" />
          </button>
        </footer>
      </section>
      {preparing && (
        <div
          aria-live="polite"
          className="interview-start-overlay"
          role="status"
        >
          <div className="interview-start-card glass-frame">
            <FileText aria-hidden="true" />
            <div>
              <p className="panel-label">ПОДГОТОВКА</p>
              <h2>Собираем сценарий интервью</h2>
              <p>Проверяем контекст, опыт кандидата и план вопросов.</p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function Field({
  children,
  error,
  label,
}: {
  children: ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="setup-field">
      <span>{label}</span>
      {children}
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
function Choice({
  active,
  description,
  onClick,
  title,
}: {
  active: boolean;
  description: string;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      aria-checked={active}
      className={active ? "mode-button mode-button--active" : "mode-button"}
      onClick={onClick}
      role="radio"
      type="button"
    >
      <strong>{title}</strong>
      <small>{description}</small>
    </button>
  );
}
function Tab({
  active,
  ariaLabel,
  icon,
  onClick,
  title,
}: {
  active: boolean;
  ariaLabel: string;
  icon: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      aria-selected={active}
      className={active ? "source-tab source-tab--active" : "source-tab"}
      onClick={onClick}
      role="tab"
      type="button"
    >
      {icon}
      {title}
    </button>
  );
}
function OptionGroup<T extends string | null>({
  ariaLabel,
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  onChange: (value: T) => void;
  options: readonly { value: T; title: string; meta?: string }[];
  value: T;
}) {
  return (
    <section className="parameter-group">
      <h3>{ariaLabel}</h3>
      <div aria-label={ariaLabel} className="option-cards" role="radiogroup">
        {options.map((option) => (
          <button
            aria-checked={value === option.value}
            aria-label={option.title}
            className={
              value === option.value
                ? "option-card option-card--active"
                : "option-card"
            }
            key={option.title}
            onClick={() => onChange(option.value)}
            role="radio"
            type="button"
          >
            <strong>{option.title}</strong>
            {option.meta && <small>{option.meta}</small>}
          </button>
        ))}
      </div>
    </section>
  );
}
function sameDraft(a: SessionDraft, b: SessionDraft) {
  return (
    a.vacancy === b.vacancy &&
    a.profile === b.profile &&
    a.format === b.format &&
    a.level === b.level &&
    a.questionsCount === b.questionsCount &&
    a.durationMinutes === b.durationMinutes &&
    a.includeHints === b.includeHints
  );
}
