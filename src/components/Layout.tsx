import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { BarChart3, BookOpen, Briefcase, Flame, Headphones, Home, Layers, Mic, MoreHorizontal, Newspaper, Settings, X } from "lucide-react";
import { useAppState } from "@/state/store";
import { addSeconds, unlockBadges } from "@/state/actions";
import { BADGES, streak } from "@/lib/progress";
import type { Skill } from "@/content/types";
import { cx } from "./ui";

export const NAV = [
  { to: "/", label: "Accueil", icon: Home, end: true },
  { to: "/apprendre", label: "Apprendre", icon: BookOpen },
  { to: "/ecouter", label: "Écouter", icon: Headphones },
  { to: "/parler", label: "Parler", icon: Mic },
  { to: "/lire", label: "Lire", icon: Newspaper },
  { to: "/business", label: "Business English", icon: Briefcase },
  { to: "/revisions", label: "Révisions", icon: Layers },
  { to: "/progression", label: "Progression", icon: BarChart3 },
];

const MOBILE_MAIN = ["/", "/apprendre", "/revisions", "/parler"];

function skillForPath(path: string): Skill | undefined {
  if (path.startsWith("/apprendre")) return "grammar";
  if (path.startsWith("/revisions")) return "vocabulary";
  if (path.startsWith("/ecouter")) return "listening";
  if (path.startsWith("/lire")) return "reading";
  if (path.startsWith("/ecrire")) return "writing";
  if (path.startsWith("/parler")) return "speaking";
  if (path.startsWith("/business")) return "vocabulary";
  return undefined;
}

/** Compte le temps d'apprentissage réel : onglet visible et activité dans les 90 dernières secondes. */
function useStudyTimer() {
  const location = useLocation();
  const last = useRef(Date.now());
  const path = useRef(location.pathname);
  path.current = location.pathname;
  useEffect(() => {
    const bump = () => (last.current = Date.now());
    const events = ["pointerdown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const t = setInterval(() => {
      const speaking = typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.speaking;
      if (document.visibilityState === "visible" && (Date.now() - last.current < 90_000 || speaking)) {
        const p = path.current;
        if (p !== "/reglages") addSeconds(15, skillForPath(p));
      }
    }, 15_000);
    return () => {
      clearInterval(t);
      events.forEach((e) => window.removeEventListener(e, bump));
    };
  }, []);
}

function useTheme(theme: "system" | "light" | "dark") {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && mq.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0f1312" : "#0f5e57");
    };
    apply();
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* stockage indisponible */
    }
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
}

export function Layout() {
  const s = useAppState();
  const location = useLocation();
  const [more, setMore] = useState(false);
  useStudyTimer();
  useTheme(s.settings.theme);
  const st = streak(s);

  useEffect(() => {
    const fresh = BADGES.filter((b) => !s.badges[b.id] && b.check(s)).map((b) => b.id);
    if (fresh.length) unlockBadges(fresh);
  }, [s]);

  useEffect(() => {
    setMore(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">
        Aller au contenu
      </a>

      {/* Barre latérale (tablette et ordinateur) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface px-3 py-5 lg:flex">
        <NavLink to="/" className="mb-6 flex items-center gap-2.5 px-3">
          <Logo />
          <span className="font-display text-lg font-semibold">English Coach</span>
        </NavLink>
        <nav aria-label="Navigation principale" className="flex flex-1 flex-col gap-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cx("flex h-10 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors", isActive ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-ink")}
            >
              <Icon size={19} aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1">
          <div className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2.5 text-sm">
            <Flame size={18} className={st.current ? "text-gold" : "text-muted"} aria-hidden />
            <span className="tabular font-semibold">{st.current}</span>
            <span className="text-muted">jour{st.current > 1 ? "s" : ""} d'affilée</span>
          </div>
          <NavLink to="/reglages" className={({ isActive }) => cx("flex h-10 items-center gap-3 rounded-xl px-3 text-[15px] font-medium", isActive ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-ink")}>
            <Settings size={19} aria-hidden /> Réglages
          </NavLink>
        </div>
      </aside>

      {/* En-tête mobile */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-bg/90 px-4 backdrop-blur lg:hidden">
        <NavLink to="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-display font-semibold">English Coach</span>
        </NavLink>
        <div className="flex items-center gap-1">
          <NavLink to="/progression" className="flex h-9 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-sm" aria-label={`Série : ${st.current} jours`}>
            <Flame size={16} className={st.current ? "text-gold" : "text-muted"} aria-hidden />
            <span className="tabular font-semibold">{st.current}</span>
          </NavLink>
          <NavLink to="/reglages" className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface-2" aria-label="Réglages">
            <Settings size={19} aria-hidden />
          </NavLink>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 lg:ml-64 lg:w-auto lg:max-w-none lg:px-10 lg:pb-12 lg:pt-10">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>

      {/* Navigation mobile */}
      <nav aria-label="Navigation principale" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {NAV.filter((n) => MOBILE_MAIN.includes(n.to)).map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cx("flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium", isActive ? "text-accent" : "text-muted")}>
              <Icon size={22} aria-hidden />
              {label}
            </NavLink>
          ))}
          <button type="button" onClick={() => setMore(true)} aria-expanded={more} aria-controls="more-menu" className="flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted">
            <MoreHorizontal size={22} aria-hidden />
            Plus
          </button>
        </div>
      </nav>

      {more && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Autres rubriques" id="more-menu">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Fermer" onClick={() => setMore(false)} />
          <div className="pb-safe animate-pop absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-line bg-surface p-4">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="font-semibold">Toutes les rubriques</p>
              <button type="button" onClick={() => setMore(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2" aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[...NAV.filter((n) => !MOBILE_MAIN.includes(n.to)), { to: "/reglages", label: "Réglages", icon: Settings }].map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={({ isActive }) => cx("flex h-14 items-center gap-3 rounded-2xl px-4 font-medium", isActive ? "bg-accent-soft text-accent" : "bg-surface-2")}>
                  <Icon size={20} aria-hidden />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden>
      <rect width="512" height="512" rx="112" fill="var(--accent)" />
      <path d="M150 168h120M150 256h96M150 344h120M150 168v176" stroke="var(--accent-fg)" strokeWidth="40" strokeLinecap="round" fill="none" />
      <circle cx="352" cy="300" r="62" stroke="#f2c14e" strokeWidth="36" fill="none" />
    </svg>
  );
}
