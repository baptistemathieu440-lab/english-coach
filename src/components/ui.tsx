import { Link } from "react-router";
import type { ComponentProps, ComponentPropsWithoutRef, ReactNode } from "react";
import { Volume2 } from "lucide-react";
import { speak } from "@/lib/speech";
import type { Accent } from "@/content/types";
import { getState } from "@/state/store";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover",
  secondary: "bg-surface text-ink border border-line hover:bg-surface-2",
  ghost: "text-ink hover:bg-surface-2",
  danger: "bg-danger-soft text-danger hover:brightness-95",
};
const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-[15px] gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

function buttonClass(variant: Variant, size: Size, full?: boolean, extra?: string) {
  return cx(
    "inline-flex items-center justify-center rounded-xl font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none select-none",
    VARIANTS[variant],
    SIZES[size],
    full && "w-full",
    extra,
  );
}

export function Button({ variant = "primary", size = "md", full, className, ...p }: ComponentProps<"button"> & { variant?: Variant; size?: Size; full?: boolean }) {
  return <button type="button" className={buttonClass(variant, size, full, className)} {...p} />;
}

export function ButtonLink({ to, variant = "primary", size = "md", full, className, children }: { to: string; variant?: Variant; size?: Size; full?: boolean; className?: string; children: ReactNode }) {
  return (
    <Link to={to} className={buttonClass(variant, size, full, className)}>
      {children}
    </Link>
  );
}

export function Card({ className, children, ...p }: ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cx("rounded-2xl border border-line bg-surface shadow-card", className)} {...p}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, eyebrow, action }: { title: string; subtitle?: ReactNode; eyebrow?: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">{eyebrow}</p>}
        <h1 className="font-display text-[28px] leading-tight font-semibold sm:text-[34px]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-center justify-between gap-3 first:mt-0">
      <h2 className="text-lg font-semibold">{children}</h2>
      {action}
    </div>
  );
}

type Tone = "neutral" | "accent" | "success" | "warn" | "danger" | "gold";
const TONES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  gold: "bg-gold-soft text-gold",
};

export function Pill({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", TONES[tone], className)}>{children}</span>;
}

export function LevelPill({ level }: { level: string }) {
  return <Pill tone={level === "A2" ? "neutral" : level === "B1" ? "accent" : "gold"}>{level}</Pill>;
}

export function Progress({ value, label, tone = "accent", className }: { value: number; label: string; tone?: "accent" | "success" | "gold"; className?: string }) {
  const v = Math.max(0, Math.min(1, value));
  const color = tone === "success" ? "bg-success" : tone === "gold" ? "bg-gold" : "bg-accent";
  return (
    <div className={cx("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)}>
      <div className={cx("h-full rounded-full transition-[width] duration-500", color)} style={{ width: `${v * 100}%` }} />
    </div>
  );
}

export function Ring({ value, size = 120, stroke = 10, label, children }: { value: number; size?: number; stroke?: number; label: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} className="transition-[stroke-dashoffset] duration-700" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted">{label}</p>
      <p className="tabular mt-0.5 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Notice({ tone = "neutral", title, children, icon }: { tone?: Tone; title?: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <div className={cx("flex gap-3 rounded-xl p-4 text-sm", TONES[tone])} role={tone === "danger" ? "alert" : undefined}>
      {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
      <div className="min-w-0 text-ink">
        {title && <p className="mb-0.5 font-semibold">{title}</p>}
        <div className="text-ink/90">{children}</div>
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items, label }: { value: T; onChange: (v: T) => void; items: { id: T; label: string; count?: number }[]; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="-mx-1 mb-5 flex gap-1 overflow-x-auto px-1 pb-1">
      {items.map((it) => (
        <button
          key={it.id}
          role="tab"
          type="button"
          aria-selected={value === it.id}
          onClick={() => onChange(it.id)}
          className={cx(
            "h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors",
            value === it.id ? "bg-ink text-bg" : "bg-surface-2 text-muted hover:text-ink",
          )}
        >
          {it.label}
          {it.count !== undefined && <span className="ml-1.5 tabular">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Select({ label, value, onChange, options, className }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string }) {
  return (
    <label className={cx("flex flex-col gap-1 text-xs text-muted", className)}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SpeakButton({ text, accent, gender, label = "Écouter", size = "md", rate }: { text: string; accent?: Accent; gender?: "female" | "male"; label?: string; size?: "sm" | "md"; rate?: number }) {
  return (
    <button
      type="button"
      onClick={() => void speak(text, { accent, gender, rate: rate ?? getState().settings.speechRate })}
      className={cx("inline-grid shrink-0 place-items-center rounded-full bg-accent-soft text-accent transition-colors hover:brightness-95", size === "sm" ? "h-8 w-8" : "h-10 w-10")}
      aria-label={`${label} : ${text}`}
      title={label}
    >
      <Volume2 size={size === "sm" ? 16 : 18} aria-hidden />
    </button>
  );
}

/** Rendu minimal du texte enrichi : **gras** et *italique*. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") ? (
          <strong key={i} className="font-semibold">
            {p.slice(2, -2)}
          </strong>
        ) : p.startsWith("*") && p.length > 2 ? (
          <em key={i} lang="en" className="text-accent not-italic font-medium">
            {p.slice(1, -1)}
          </em>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <Card className="p-8 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </Card>
  );
}

export function minutesLabel(sec: number): string {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${String(m % 60).padStart(2, "0")}`;
}
