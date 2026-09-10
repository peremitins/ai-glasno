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
import { PROFESSIONAL_ROLE_OPTIONS } from "@/shared/config/professionalRoles";
import { getRoleContextTags } from "@/shared/lib/roleContextTags";
import { VoiceTextarea } from "@/shared/ui/VoiceTextarea";
import "./NewInterviewPage.css";

type TrainingMode = "candidate" | "interviewer";
type SourceMode = "hh_url" | "manual";
type Goal = "quick" | "standard" | "deep";
type InterviewerMode = "soft" | "neutral" | "strict";
type Focus = NonNullable<AdvancedSessionCreationRequest["focus"]> | null;

const MAX_VISIBLE_ROLE_OPTIONS = 64;
const goals = [
  { value: "quick", title: "Быстро", meta: "3 вопроса" },
  { value: "standard", title: "Стандарт", meta: "6 вопросов" },
  { value: "deep", title: "Глубоко", meta: "10 вопросов" },
] as const;
const levels = [
  {
    value: "junior",
    title: "Начинающий (Junior)",
    meta: "Первые шаги в профессии",
  },
  { value: "middle", title: "Уверенный (Middle)", meta: "Есть опыт и кейсы" },
  { value: "senior", title: "Эксперт (Senior)", meta: "Лидерский уровень" },
] as const;
const modes = [
  {
    value: "soft",
    title: "Мягкий",
    meta: "Спокойный тон и поддерживающие уточнения без давления.",
  },
  {
    value: "neutral",
    title: "Нейтральный",
    meta: "Деловой тон и ровный уровень уточняющих вопросов.",
  },
  {
    value: "strict",
    title: "Строгий",
    meta: "Больше уточняющих вопросов и меньше терпимости к общим ответам.",
  },
] as const;
const focuses = [
  { value: null, title: "Смешанное" },
  { value: "hr_screening", title: "Разговор с HR" },
  { value: "professional", title: "Вопросы по профессии" },
  { value: "behavioral", title: "Опыт и кейсы" },
  { value: "salary_negotiation", title: "Зарплата и оффер" },
] as const;
const personas = [
  "Лаконичный",
  "Многословный",
  "Неуверенный",
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
  const roleTags = useMemo(() => getRoleContextTags(role), [role]);
  const suggestedRoles = useMemo(() => {
    const query = role.trim().toLocaleLowerCase();
    const options = query
      ? PROFESSIONAL_ROLE_OPTIONS.filter((item) =>
          [item.name, item.categoryName, ...(item.aliases ?? [])]
            .join(" ")
            .toLocaleLowerCase()
            .includes(query),
        )
      : PROFESSIONAL_ROLE_OPTIONS;

    return options.slice(0, MAX_VISIBLE_ROLE_OPTIONS);
  }, [role]);

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
      resumeText:
        [
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
                <Field label="Роль или должность">
                  <div className="role-combobox" ref={rolePickerRef}>
                    <input
                      aria-autocomplete="list"
                      aria-controls="role-options"
                      aria-expanded={isRoleListOpen}
                      onChange={(event) => {
                        setRole(event.target.value);
                        setIsRoleListOpen(true);
                      }}
                      onFocus={() => setIsRoleListOpen(true)}
                      placeholder="Например: frontend-разработчик, бухгалтер, менеджер по продажам"
                      role="combobox"
                      value={role}
                    />
                    {isRoleListOpen && (
                      <div
                        className="role-menu"
                        id="role-options"
                        role="listbox"
                      >
                        {suggestedRoles.length ? (
                          suggestedRoles.map((item) => (
                            <button
                              aria-selected={role === item.name}
                              key={`${item.categoryId}-${item.id}`}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                setRole(item.name);
                                setIsRoleListOpen(false);
                              }}
                              role="option"
                              type="button"
                            >
                              <strong>{item.name}</strong>
                              <span>{item.categoryName}</span>
                            </button>
                          ))
                        ) : (
                          <p>
                            Ничего не найдено. Можно оставить свой вариант
                            должности.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Field>
                <p className="source-hint">
                  Не нашли подходящий вариант? Просто оставьте свой текст.
                </p>
                {role.trim() && (
                  <div className="tag-field">
                    <span>Уточнить контекст</span>
                    <small>
                      Подобрали под вашу роль. Отметьте подходящее или добавьте
                      своё.
                    </small>
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
                        placeholder="Например: EdTech, enterprise, удалёнка"
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
                    placeholder="Задачи, требования, стек, формат работы. Можно вставить весь текст вакансии."
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
                : "Загрузите реальное резюме или опишите кандидата. Так тренировка будет ближе к настоящему интервью."}
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
                <span>{resumeFileName || "Выберите файл"}</span>
              </label>
            </div>
            {(extractResumeState.isLoading || resumeExtractedText) && (
              <section className="resume-preview">
                <div className="resume-preview__head">
                  <div className="resume-preview__title">
                    <span>ПРЕВЬЮ</span>
                    <strong>Содержимое резюме</strong>
                  </div>
                  <div className="resume-preview__actions">
                    <small>
                      {extractResumeState.isLoading
                        ? "Извлекаем текст…"
                        : `${resumeExtractedText.length} символов`}
                    </small>
                    <button
                      aria-label="Очистить файл"
                      className="resume-preview__clear"
                      onClick={clearResumeFile}
                      type="button"
                    >
                      <X aria-hidden="true" />
                      <span>Очистить файл</span>
                    </button>
                  </div>
                </div>
                {extractResumeState.isLoading ? (
                  <div
                    className="resume-preview__skeleton"
                    aria-label="Извлекаем текст резюме"
                  >
                    <span />
                    <span />
                    <span />
                  </div>
                ) : (
                  <div className="resume-preview__body">
                    {resumeExtractedText
                      .split(/\n{2,}/)
                      .map((paragraph, index) => (
                        <p
                          className="resume-preview__paragraph"
                          key={`${paragraph}-${index}`}
                        >
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
                  : "Что учесть в поведении"
              }
            >
              <VoiceTextarea
                aria-label={
                  trainingMode === "candidate"
                    ? "Коротко о себе"
                    : "Что учесть в поведении"
                }
                onValueChange={(profile) =>
                  form.setValue("profile", profile, { shouldDirty: true })
                }
                placeholder="Например: 5 лет в B2B-продажах, вёл команду из 6 человек, запускал новое направление."
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
                <div
                  aria-label="Источник вопросов"
                  className="interviewer-scenario-grid"
                  role="radiogroup"
                >
                  {[
                    { value: "mixed", title: "Смешанный план" },
                    { value: "custom", title: "Мой план" },
                    { value: "free", title: "Свободное интервью" },
                  ].map((option) => (
                    <button
                      aria-checked={questionPlan === option.value}
                      className={
                        questionPlan === option.value
                          ? "option-card option-card--active"
                          : "option-card"
                      }
                      key={option.value}
                      onClick={() =>
                        setQuestionPlan(option.value as typeof questionPlan)
                      }
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
                      placeholder={
                        "Например:\nРасскажите про конфликт со стейкхолдером\nКак объяснить проваленный проект?\nСпроси про зарплатные ожидания"
                      }
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
                            setQuestionPlan(
                              event.target.checked ? "custom" : "mixed",
                            )
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
                      <p className="file-status">
                        Текст из файла добавлен в поле вопросов.
                      </p>
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
            <p>Сценарий готовится по выбранным параметрам</p>
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
            {trainingMode === "candidate"
              ? "Начать интервью"
              : "Начать тренировку"}{" "}
            <Sparkles aria-hidden="true" />
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
              <p className="panel-label">СОБИРАЕМ ИНТЕРВЬЮ</p>
              <h2>Готовим сценарий интервью</h2>
              <p>Анализируем вакансию, опыт кандидата и план вопросов.</p>
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
