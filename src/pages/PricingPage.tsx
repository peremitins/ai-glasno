import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import "./PricingPage.css";

type Plan = {
  id: string;
  badge?: string;
  description: string;
  durationDays: number;
  features: string[];
  name: string;
  priceRub: number;
  type: "pass" | "minute_pack";
};

const passPlans: Plan[] = [
  {
    id: "pass_7d",
    durationDays: 7,
    priceRub: 449,
    badge: "Собес на носу",
    type: "pass",
    name: "Полный доступ · 7 дн.",
    description: "Короткая интенсивная подготовка.",
    features: [
      "Все форматы интервью без ограничений",
      "30 минут живого голосового интервью",
      "Подробный разбор и PDF-отчёт",
      "Докупка минут голоса",
    ],
  },
  {
    id: "pass_15d",
    durationDays: 15,
    priceRub: 899,
    type: "pass",
    name: "Полный доступ · 15 дн.",
    description: "Две недели уверенной подготовки.",
    features: [
      "Все форматы интервью без ограничений",
      "60 минут живого голосового интервью",
      "Подробный разбор и PDF-отчёт",
      "Докупка минут голоса",
    ],
  },
  {
    id: "pass_30d",
    durationDays: 30,
    priceRub: 1190,
    badge: "Оптимально",
    type: "pass",
    name: "Полный доступ · 30 дн.",
    description: "Все форматы интервью без ограничений, разбор и PDF-отчёт.",
    features: [
      "Все форматы интервью без ограничений",
      "60 минут живого голосового интервью",
      "Подробный разбор и PDF-отчёт",
      "Докупка минут голоса",
    ],
  },
  {
    id: "pass_90d",
    durationDays: 90,
    priceRub: 2290,
    type: "pass",
    name: "Полный доступ · 90 дн.",
    description: "Спокойная подготовка к смене работы.",
    features: [
      "Все форматы интервью без ограничений",
      "60 минут живого голосового интервью",
      "Подробный разбор и PDF-отчёт",
      "Докупка минут голоса",
    ],
  },
  {
    id: "pass_180d",
    durationDays: 180,
    priceRub: 3490,
    type: "pass",
    name: "Полный доступ · 180 дн.",
    description: "Доступ для долгой подготовки.",
    features: [
      "Все форматы интервью без ограничений",
      "60 минут живого голосового интервью",
      "Подробный разбор и PDF-отчёт",
      "Докупка минут голоса",
    ],
  },
  {
    id: "pass_365d",
    durationDays: 365,
    priceRub: 4990,
    badge: "Выгодно",
    type: "pass",
    name: "Полный доступ · 365 дн.",
    description: "Годовой запас для карьерных целей.",
    features: [
      "Все форматы интервью без ограничений",
      "60 минут живого голосового интервью",
      "Подробный разбор и PDF-отчёт",
      "Докупка минут голоса",
    ],
  },
];

const minutePacks: Plan[] = [
  {
    id: "realtime_pack_30",
    durationDays: 30,
    priceRub: 490,
    type: "minute_pack",
    name: "+30 минут голоса",
    description: "Небольшой запас перед важным интервью.",
    features: [
      "+30 минут голосового интервью",
      "Действуют 30 дней с момента оплаты",
      "Разовая покупка без автопродления",
    ],
  },
  {
    id: "realtime_pack_60",
    durationDays: 30,
    priceRub: 890,
    badge: "Популярный",
    type: "minute_pack",
    name: "+60 минут голоса",
    description: "Стандартный пакет для активной подготовки.",
    features: [
      "+60 минут голосового интервью",
      "Действуют 30 дней с момента оплаты",
      "Разовая покупка без автопродления",
    ],
  },
  {
    id: "realtime_pack_120",
    durationDays: 30,
    priceRub: 1590,
    type: "minute_pack",
    name: "+120 минут голоса",
    description: "Для интенсивной серии голосовых тренировок.",
    features: [
      "+120 минут голосового интервью",
      "Действуют 30 дней с момента оплаты",
      "Разовая покупка без автопродления",
    ],
  },
];

function formatPrice(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export function PricingPage() {
  const [searchParams] = useSearchParams();
  const requestedPlanId = searchParams.get("plan");
  const initialPlan =
    passPlans.find((plan) => plan.id === requestedPlanId) ?? passPlans[2]!;
  const [selectedPassId, setSelectedPassId] = useState(initialPlan.id);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(
    searchParams.get("checkout") === "gift" ? initialPlan : null,
  );
  const [giftMode, setGiftMode] = useState(
    searchParams.get("checkout") === "gift",
  );
  const selectedPass = useMemo(
    () => passPlans.find((plan) => plan.id === selectedPassId) ?? passPlans[2]!,
    [selectedPassId],
  );

  function openCheckout(plan: Plan, gift = false) {
    setCheckoutPlan(plan);
    setGiftMode(gift && plan.type === "pass");
  }

  return (
    <section className="pricing-page">
      <section className="pricing-status glass-frame glass-frame--soft">
        <div>
          <p className="panel-label">Текущий доступ</p>
          <h1>Бесплатное интервью</h1>
          <p>Одно короткое интервью без оплаты. Попробуйте формат.</p>
        </div>
        <p className="pricing-status__hint">
          Полный доступ открывает все форматы интервью без ограничений.
        </p>
      </section>

      <section className="pricing-pass glass-frame glass-frame--soft">
        <header>
          <p className="panel-label">Тарифы</p>
          <h2>Полный доступ</h2>
          <p>
            Все форматы интервью без ограничений, разбор и PDF-отчёт. Выберите
            срок подготовки.
          </p>
        </header>
        <div
          aria-label="Срок доступа"
          className="pricing-durations"
          role="radiogroup"
        >
          {passPlans.map((plan) => (
            <button
              aria-checked={plan.id === selectedPass.id}
              className={`pricing-duration${plan.id === selectedPass.id ? " pricing-duration--selected" : ""}`}
              key={plan.id}
              onClick={() => setSelectedPassId(plan.id)}
              role="radio"
              type="button"
            >
              {plan.badge && <em>{plan.badge}</em>}
              <strong>{plan.durationDays}</strong>
              <span>дней</span>
            </button>
          ))}
        </div>
        <div className="pricing-price">
          <strong>{formatPrice(selectedPass.priceRub)} ₽</strong>
          <span>
            ≈{" "}
            {formatPrice(
              Math.round(selectedPass.priceRub / selectedPass.durationDays),
            )}{" "}
            ₽ в день
          </span>
        </div>
        <ul className="pricing-features">
          {selectedPass.features.map((feature) => (
            <li key={feature}>
              <Check aria-hidden="true" />
              {feature}
            </li>
          ))}
        </ul>
        <div className="pricing-actions">
          <button
            className="primary-action"
            onClick={() => openCheckout(selectedPass)}
            type="button"
          >
            Оплатить {formatPrice(selectedPass.priceRub)} ₽
          </button>
          <button
            className="secondary-action"
            onClick={() => openCheckout(selectedPass, true)}
            type="button"
          >
            Подарить доступ
          </button>
          <p>
            Продлевается автоматически. Настройка доступна во время оформления.
          </p>
        </div>
      </section>

      <section className="pricing-packs-section">
        <header className="pricing-packs-header glass-frame glass-frame--soft">
          <h2>Пакеты минут голоса</h2>
          <p>
            Докупаются к активному пропуску «Полный доступ» и действуют, пока он
            активен.
          </p>
        </header>
        <div className="pricing-packs">
          {minutePacks.map((pack) => (
            <article
              className="pricing-pack glass-frame glass-frame--soft"
              key={pack.id}
            >
              {pack.badge && (
                <span className="pricing-badge">{pack.badge}</span>
              )}
              <h3>{pack.name}</h3>
              <p>{pack.description}</p>
              <div className="pricing-price">
                <strong>{formatPrice(pack.priceRub)} ₽</strong>
                <span>разовая покупка</span>
              </div>
              <ul className="pricing-features">
                {pack.features.map((feature) => (
                  <li key={feature}>
                    <Check aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className="primary-action"
                onClick={() => openCheckout(pack)}
                type="button"
              >
                Купить пакет
              </button>
            </article>
          ))}
        </div>
      </section>

      {checkoutPlan && (
        <div className="pricing-dialog-backdrop">
          <section
            aria-labelledby="pricing-checkout-title"
            aria-modal="true"
            className="pricing-dialog glass-frame"
            role="dialog"
          >
            <button
              aria-label="Закрыть"
              className="pricing-dialog__close"
              onClick={() => setCheckoutPlan(null)}
              type="button"
            >
              <X aria-hidden="true" />
            </button>
            <p className="panel-label">{giftMode ? "Подарок" : "Оформление"}</p>
            <h2 id="pricing-checkout-title">{checkoutPlan.name}</h2>
            <p>
              {giftMode
                ? "Подарок будет оформлен для выбранного получателя после подключения оплаты."
                : "Оформление оплаты будет доступно после подключения платёжного сценария."}
            </p>
            <strong>{formatPrice(checkoutPlan.priceRub)} ₽</strong>
            <button
              className="secondary-action"
              onClick={() => setCheckoutPlan(null)}
              type="button"
            >
              Понятно
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
