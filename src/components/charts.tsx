import { useState } from "react";
import { cx } from "./ui";

/** Histogramme mono-série (minutes par jour). Info-bulle au survol / focus, tableau accessible. */
export function BarChart({ data, unit, label }: { data: { label: string; value: number; full: string }[]; unit: string; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const H = 140;
  return (
    <figure className="relative overflow-hidden">
      <div className="relative">
        <div className="flex h-[140px] items-end gap-[2px]" role="group" aria-label={label}>
          {data.map((d, i) => (
            <button
              key={i}
              type="button"
              className="group relative flex h-full flex-1 items-end justify-center focus-visible:outline-none"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${d.full} : ${d.value} ${unit}`}
            >
              <span
                className={cx("block w-full max-w-7 rounded-t-[4px] transition-opacity", d.value ? "bg-accent" : "bg-surface-2", hover !== null && hover !== i && "opacity-50")}
                style={{ height: Math.max(3, (d.value / max) * (H - 8)) }}
              />
            </button>
          ))}
        </div>
        {hover !== null && (
          <div className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-card" style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}>
            <p className="text-muted">{data[hover].full}</p>
            <p className="tabular font-semibold">
              {data[hover].value} {unit}
            </p>
          </div>
        )}
      </div>
      <div className="mt-1.5 flex gap-[2px] border-t border-line pt-1.5">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center text-[10px] text-muted">
            {d.label}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <th>{d.full}</th>
              <td>
                {d.value} {unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Courbe mono-série (score hebdomadaire). Les semaines sans donnée (-1) interrompent la ligne. */
export function LineChart({ values, labels, label }: { values: number[]; labels: string[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 320;
  const H = 120;
  const pad = 8;
  const x = (i: number) => pad + (i * (W - 2 * pad)) / Math.max(1, values.length - 1);
  const y = (v: number) => H - pad - (v / 100) * (H - 2 * pad);
  const segments: string[] = [];
  let cur = "";
  values.forEach((v, i) => {
    if (v < 0) {
      if (cur) segments.push(cur);
      cur = "";
    } else cur += `${cur ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
  });
  if (cur) segments.push(cur);
  const has = values.some((v) => v >= 0);
  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[120px] w-full" role="img" aria-label={label} preserveAspectRatio="none">
        {[0, 50, 100].map((g) => (
          <line key={g} x1={pad} x2={W - pad} y1={y(g)} y2={y(g)} stroke="var(--border)" strokeWidth={1} vectorEffect="non-scaling-stroke" strokeDasharray={g === 0 ? undefined : "3 3"} />
        ))}
        {segments.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--accent)" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {hover !== null && values[hover] >= 0 && <line x1={x(hover)} x2={x(hover)} y1={pad} y2={H - pad} stroke="var(--muted)" strokeWidth={1} vectorEffect="non-scaling-stroke" />}
      </svg>
      {/* Points en HTML pour garder des cercles ronds malgré l'étirement */}
      <div className="pointer-events-none absolute inset-0">
        {values.map((v, i) =>
          v >= 0 ? (
            <span key={i} className={cx("absolute block rounded-full border-2 border-surface bg-accent", hover === i ? "h-3 w-3" : "h-2 w-2")} style={{ left: `${(x(i) / W) * 100}%`, top: `${(y(v) / H) * 100}%`, transform: "translate(-50%,-50%)" }} />
          ) : null,
        )}
      </div>
      <div className="absolute inset-0 flex">
        {values.map((v, i) => (
          <button key={i} type="button" className="h-full flex-1 focus-visible:outline-none" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} aria-label={`${labels[i]} : ${v >= 0 ? `${v} %` : "pas de donnée"}`} />
        ))}
      </div>
      {hover !== null && (
        <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-card" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <p className="text-muted">{labels[hover]}</p>
          <p className="tabular font-semibold">{values[hover] >= 0 ? `${values[hover]} %` : "Aucune activité notée"}</p>
        </div>
      )}
      {!has && <p className="absolute inset-0 grid place-items-center text-sm text-muted">Pas encore de résultats notés</p>}
    </figure>
  );
}

/** Calendrier d'activité (12 semaines). Une seule teinte, intensité = minutes. */
export function Heatmap({ days, label }: { days: { key: string; minutes: number; date: Date }[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const level = (m: number) => (m <= 0 ? 0 : m < 10 ? 1 : m < 25 ? 2 : m < 40 ? 3 : 4);
  const fill = ["var(--surface-2)", "color-mix(in oklab, var(--accent) 30%, var(--surface))", "color-mix(in oklab, var(--accent) 55%, var(--surface))", "color-mix(in oklab, var(--accent) 78%, var(--surface))", "var(--accent)"];
  const cols: (typeof days)[] = [];
  for (let i = 0; i < days.length; i += 7) cols.push(days.slice(i, i + 7));
  return (
    <figure>
      <div className="relative">
        <p className="sr-only">
          {label} : {days.filter((d) => d.minutes > 0).length} jours actifs sur {days.length}, {days.reduce((a, d) => a + d.minutes, 0)} minutes au total.
        </p>
        <div className="flex gap-[3px] overflow-x-auto" aria-hidden>
          {cols.map((col, c) => (
            <div key={c} className="flex flex-col gap-[3px]">
              {col.map((d, r) => {
                const idx = c * 7 + r;
                return (
                  <span
                    key={d.key}
                    className="block h-4 w-4 rounded-[4px] sm:h-[18px] sm:w-[18px]"
                    style={{ background: fill[level(d.minutes)] }}
                    onMouseEnter={() => setHover(idx)}
                    onMouseLeave={() => setHover(null)}
                    title={`${d.date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} : ${d.minutes} min`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        {hover !== null && (
          <p className="mt-2 text-xs text-muted" aria-hidden>
            {days[hover].date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} — <span className="tabular font-semibold text-ink">{days[hover].minutes} min</span>
          </p>
        )}
      </div>
      <figcaption className="mt-2 flex items-center gap-1.5 text-xs text-muted">
        Moins
        {fill.map((f, i) => (
          <span key={i} className="h-3 w-3 rounded-[3px]" style={{ background: f }} />
        ))}
        Plus
      </figcaption>
    </figure>
  );
}
