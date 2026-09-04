import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, BarChart3, CheckCircle2, FileText, Rocket, Search, Settings, Zap } from "lucide-react";

import { useGetDashboardQuery } from "@/entities/dashboard/api/dashboardApi";
import type { InterviewSession } from "@/entities/session/model/types";
import { getApiErrorMessage } from "@/shared/api/baseApi";

import "./HomePage.css";

const quickScenarios = [
  { title: "Frontend-разработчик", subtitle: "React, TypeScript, архитектура" },
  { title: "Product manager", subtitle: "Продуктовое мышление и метрики" },
  { title: "Аналитик данных", subtitle: "SQL, продуктовая аналитика" },
  { title: "Своя вакансия", subtitle: "Ссылка, текст или конкретная роль" },
];

const firstRunSteps = [
  { title: "Вставьте вакансию", text: "ИИ разберёт задачи, требования и формат собеседования." },
  { title: "Ответьте голосом или текстом", text: "Тренировка идёт как короткое интервью с уточнениями." },
  { title: "Получите разбор", text: "В отчёте будут сильные места, провалы и что улучшить перед встречей." },
];

export function HomePage() {
  const { data, error, isError, isLoading } = useGetDashboardQuery();
  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <p role="alert">{getApiErrorMessage(error)}</p>;
  if (!data) return <p role="alert">Данные дашборда отсутствуют.</p>;

  return data.activeSessions + data.completedSessions > 0 ? (
    <ReturningDashboard activeSession={data.recentSessions.find((session) => session.status === "active")} activeSessions={data.activeSessions} completedSessions={data.completedSessions} recentSessions={data.recentSessions} />
  ) : <FirstRunDashboard />;
}

function DashboardSkeleton() {
  return <div aria-busy="true" aria-label="Загрузка дашборда" className="dashboard-skeleton" role="status"><span /><span /><span /></div>;
}

function FirstRunDashboard() {
  return <section className="dashboard-mode first-run-dashboard">
    <article className="glass-frame quick-launcher quick-launcher--hero">
      <div className="launcher-copy"><p className="page-kicker">Подготовка</p><h1 className="page-title">Бесплатная репетиция собеседования</h1><p className="page-subtitle">Вставьте ссылку на вакансию, описание или просто выберите должность. Остальное можно уточнить на следующем экране.</p></div>
      <QuickStartForm includeResume />
    </article>
    <section className="glass-frame how-it-works"><PanelHeading label="Как это работает" title="Три коротких шага" /><div className="steps-grid">{firstRunSteps.map((step, index) => <article key={step.title}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step.title}</strong><p>{step.text}</p></article>)}</div></section>
    <section className="glass-frame scenario-panel"><PanelHeading label="Примеры" title="Что можно потренировать" action="Настроить подробнее" /><div className="scenario-grid">{quickScenarios.map((scenario) => <Link className="scenario" key={scenario.title} to="/interview/new"><strong>{scenario.title}</strong><small>{scenario.subtitle}</small><ArrowRight aria-hidden="true" /></Link>)}</div></section>
  </section>;
}

function ReturningDashboard({ activeSession, activeSessions, completedSessions, recentSessions }: { activeSession?: InterviewSession; activeSessions: number; completedSessions: number; recentSessions: InterviewSession[] }) {
  const stats = [{ label: "Сессии", value: activeSessions + completedSessions, Icon: Rocket }, { label: "Завершено", value: completedSessions, Icon: CheckCircle2 }, { label: "Средний балл", value: "—", Icon: BarChart3 }, { label: "Пробные интервью", value: "0/1", Icon: Zap }];
  return <section className="dashboard-mode returning-dashboard">
    <article className="glass-frame returning-hero"><div><p className="page-kicker">Подготовка</p><h1 className="page-title">Продолжить подготовку</h1><p className="page-subtitle">Короткая репетиция по вакансии или профессии.</p>{activeSession && <div className="active-inline"><span>Активная сессия</span><strong>{activeSession.title}</strong><small>В работе</small></div>}</div><Link className="primary-action" to={activeSession ? `/interview/${activeSession.id}` : "/interview/new"}>{activeSession ? "Продолжить" : "Начать интервью"}<ArrowRight aria-hidden="true" /></Link></article>
    <section aria-label="Статистика подготовки" className="stats-strip">{stats.map(({ Icon, label, value }) => <article className="glass-frame glass-frame--soft stat" key={label}><span className="stat-icon"><Icon aria-hidden="true" /></span><span>{label}</span><strong>{value}</strong></article>)}</section>
    <section className="returning-grid"><article className="glass-frame quick-launcher"><PanelHeading label="Быстрый старт" title="Новая репетиция" action="Настроить подробнее" /><QuickStartForm /></article><article className="glass-frame recommendations"><PanelHeading label="Фокус" title="Что улучшить перед интервью" /><div className="empty-state"><FileText aria-hidden="true" /><strong>Начните с первой репетиции</strong><p>После первой репетиции здесь появятся отчёты, динамика и рекомендации.</p></div></article></section>
    <section className="glass-frame history-panel"><PanelHeading label="История" title="Последние интервью" action="История" actionTo="/history" />{recentSessions.length ? <div className="recent">{recentSessions.map((session) => <Link className="session-row" key={session.id} to={`/interview/${session.id}`}><span><strong>{session.title}</strong><small>{session.status === "completed" ? "Завершена" : "В работе"}</small></span><b>{session.status === "completed" ? "Завершено" : "Активна"}</b></Link>)}</div> : <p className="muted">После первой сессии здесь появится история интервью.</p>}</section>
  </section>;
}

function PanelHeading({ action, actionTo = "/interview/new", label, title }: { action?: string; actionTo?: string; label: string; title: string }) {
  return <div className="panel-head"><div><p className="panel-label">{label}</p><h2>{title}</h2></div>{action && <Link to={actionTo}>{action}</Link>}</div>;
}

function QuickStartForm({ includeResume = false }: { includeResume?: boolean }) {
  const navigate = useNavigate();
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const sourceId = includeResume ? "dashboard-source" : "dashboard-source-returning";
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (source.trim().length < 2) { setError("Добавьте ссылку, текст вакансии или роль"); return; } setError(""); navigate("/interview/new"); }
  return <form className="launcher-form" noValidate onSubmit={submit}>
    <label className="field" htmlFor={sourceId}><span>Роль или должность</span><span className="input-shell"><Search aria-hidden="true" /><input id={sourceId} onChange={(event) => setSource(event.target.value)} placeholder="Ссылка, описание вакансии или должность" value={source} /></span><small>Можно выбрать роль из списка или написать свой вариант.</small></label>
    {includeResume && <label className="field" htmlFor="dashboard-resume"><span>Резюме или опыт</span><textarea id="dashboard-resume" placeholder="Коротко: опыт, стек, проекты, сильные стороны" /><small>PDF, TXT, MD или скан можно добавить на следующем шаге.</small></label>}
    <div className="summary-chips"><span>Быстро · 3 вопроса</span><span>Смешанное</span><span>Бесплатно</span>{includeResume && <Link aria-label="Настроить подробнее" className="chip-config" to="/interview/new"><Settings aria-hidden="true" /></Link>}</div>
    <div className="launcher-footer">{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-action" type="submit">Начать репетицию<ArrowRight aria-hidden="true" /></button></div>
  </form>;
}
