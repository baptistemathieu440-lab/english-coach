import { useEffect, useMemo } from "react";
import { Link } from "react-router";
import { Award, BookOpen, Check, ChevronRight, ClipboardCheck, Flame, Headphones, Layers, Mic, Newspaper, PenLine, Target, Trophy } from "lucide-react";
import { useAppState, dayKey } from "@/state/store";
import { savePlan, resetPlan } from "@/state/actions";
import { buildPlanIds, planItem, BLOCKS, type PlanItem } from "@/lib/plan";
import { currentStage, overallProgress, stageProgress, streak, validatedLevel, vocabStats, weeklyChallenges, examAvailableAt } from "@/lib/progress";
import { stageInfo } from "@/content/curriculum";
import { ButtonLink, Card, Notice, Pill, Progress, Ring, SectionTitle, minutesLabel, cx } from "@/components/ui";
import type { Skill } from "@/content/types";

const ICON: Record<Skill, typeof BookOpen> = { grammar: BookOpen, vocabulary: Layers, listening: Headphones, reading: Newspaper, writing: PenLine, speaking: Mic };

export function Home() {
  const s = useAppState();
  const today = s.days[dayKey()];
  const ids = useMemo(() => today?.plan ?? buildPlanIds(s), [today?.plan, s]);
  useEffect(() => {
    if (!today?.plan) savePlan(ids);
  }, [today?.plan, ids]);
  const items = ids.map((id) => planItem(id, s)).filter((x): x is PlanItem => !!x);
  const done = new Set(today?.done ?? []);
  const doneCount = items.filter((i) => done.has(i.id)).length;
  const totalMin = items.reduce((a, i) => a + i.minutes, 0);
  const st = streak(s);
  const level = validatedLevel(s);
  const stage = currentStage(s);
  const sp = stageProgress(s, stage);
  const info = stageInfo(stage);
  const vs = vocabStats(s);
  const goalSec = s.settings.dailyMinutes * 60;
  const todaySec = today?.seconds ?? 0;
  const examReady = sp.value >= 0.7 && !sp.examPassed && examAvailableAt(s, info.exam) <= Date.now();
  const lastExam = [...s.assessments].reverse().find((a) => a.id !== "placement");
  const monthly = s.placement && (!lastExam || Date.now() - lastExam.date > 30 * 86_400_000) && Date.now() - s.createdAt > 28 * 86_400_000;
  const hour = new Date().getHours();
  const hello = hour < 5 || hour >= 18 ? "Bonsoir" : "Bonjour";

  return (
    <div>
      <header className="mb-6">
        <p className="text-sm text-muted">{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="font-display text-[30px] leading-tight font-semibold sm:text-[36px]">
          {hello}
          {s.name ? `, ${s.name}` : ""}.
        </h1>
        <p className="mt-1 text-muted">
          {doneCount === items.length && items.length > 0 ? "Programme du jour terminé. Bravo pour votre régularité !" : `Votre séance du jour : environ ${totalMin} minutes.`}
        </p>
      </header>

      {!s.placement && (
        <div className="mb-6">
          <Notice tone="accent" icon={<ClipboardCheck size={18} />} title="Personnalisez votre parcours">
            Le test de positionnement (≈ 20 min) confirme votre niveau, repère vos points forts et vos lacunes.{" "}
            <Link to="/test/positionnement" className="font-semibold text-accent underline">
              Passer le test
            </Link>
          </Notice>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Programme du jour */}
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Programme du jour</h2>
              <p className="text-sm text-muted tabular">
                {doneCount} / {items.length} activités · {s.settings.dailyMinutes} min visées
              </p>
            </div>
            <Ring value={items.length ? doneCount / items.length : 0} size={56} stroke={6} label={`${doneCount} activités terminées sur ${items.length}`}>
              <span className="text-xs font-semibold tabular">
                {doneCount}/{items.length}
              </span>
            </Ring>
          </div>
          {(["A", "B", "C", "D"] as const).map((b) => {
            const list = items.filter((i) => i.block === b);
            if (!list.length) return null;
            return (
              <div key={b} className="mt-4 first:mt-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  {b}. {BLOCKS[b]}
                </p>
                <ul className="space-y-2">
                  {list.map((it) => {
                    const Icon = ICON[it.skill];
                    const isDone = done.has(it.id);
                    return (
                      <li key={it.id}>
                        <Link to={it.href} className={cx("group flex items-center gap-3 rounded-xl border p-3 transition-colors", isDone ? "border-transparent bg-success-soft" : "border-line hover:border-accent hover:bg-accent-soft")}>
                          <span className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-xl", isDone ? "bg-success text-white" : "bg-accent-soft text-accent")}>
                            {isDone ? <Check size={18} aria-label="Terminé" /> : <Icon size={18} aria-hidden />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{it.title}</span>
                            <span className="block truncate text-sm text-muted">{it.subtitle}</span>
                          </span>
                          <span className="shrink-0 text-xs text-muted tabular">{it.minutes} min</span>
                          <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
          {doneCount === items.length && items.length > 0 && (
            <button type="button" onClick={resetPlan} className="mt-4 text-sm font-medium text-accent">
              Je veux continuer : proposer d'autres activités
            </button>
          )}
        </Card>

        <div className="grid content-start gap-4">
          {/* Niveau */}
          <Card className="p-5">
            <div className="flex items-center gap-5">
              <Ring value={overallProgress(s)} size={104} stroke={9} label={`Progression vers le B2 : ${Math.round(overallProgress(s) * 100)} %`}>
                <div>
                  <p className="text-xl font-semibold tabular">{Math.round(overallProgress(s) * 100)} %</p>
                  <p className="text-[11px] text-muted">vers B2</p>
                </div>
              </Ring>
              <div className="min-w-0">
                <p className="text-xs text-muted">Niveau validé</p>
                <p className="font-display text-3xl font-semibold">{level.label}</p>
                <p className="text-xs text-muted">{level.basis}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium">
                  Étape {stage} · {info.title}
                </span>
                <span className="tabular text-muted">{Math.round(sp.value * 100)} %</span>
              </div>
              <Progress value={sp.value} label={`Progression de l'étape ${stage}`} />
              <p className="mt-2 text-xs text-muted">
                {sp.lessons.mastered}/{sp.lessons.total} leçons maîtrisées · {sp.words.learned}/{sp.words.total} mots appris
              </p>
            </div>
            {examReady && (
              <ButtonLink to={`/examen/${info.exam}`} full className="mt-4" variant="secondary">
                <Trophy size={16} /> Passer l'examen de fin d'étape
              </ButtonLink>
            )}
          </Card>

          {/* Régularité */}
          <Card className="grid grid-cols-3 divide-x divide-line p-4 text-center">
            <div>
              <Flame size={20} className={cx("mx-auto", st.current ? "text-gold" : "text-muted")} aria-hidden />
              <p className="mt-1 text-xl font-semibold tabular">{st.current}</p>
              <p className="text-xs text-muted">jours d'affilée</p>
            </div>
            <div>
              <Target size={20} className="mx-auto text-accent" aria-hidden />
              <p className="mt-1 text-xl font-semibold tabular">{minutesLabel(todaySec)}</p>
              <p className="text-xs text-muted">sur {s.settings.dailyMinutes} min</p>
            </div>
            <div>
              <Layers size={20} className="mx-auto text-accent" aria-hidden />
              <p className="mt-1 text-xl font-semibold tabular">{vs.due}</p>
              <p className="text-xs text-muted">cartes à revoir</p>
            </div>
          </Card>
          <Progress value={todaySec / goalSec} label="Objectif de temps du jour" tone="gold" />

          {monthly && (
            <Notice tone="gold" icon={<Award size={18} />} title="Évaluation mensuelle">
              Cela fait plus d'un mois depuis votre dernière évaluation complète.{" "}
              <Link to={`/examen/${info.exam}`} className="font-semibold underline">
                Faire le bilan
              </Link>
            </Notice>
          )}

          {/* Défis */}
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Défis de la semaine</h2>
            <ul className="space-y-3">
              {weeklyChallenges(s).map(({ c, value, done: ok }) => (
                <li key={c.id}>
                  <div className="mb-1 flex justify-between gap-2 text-sm">
                    <span className={cx(ok && "text-success")}>
                      {ok && <Check size={14} className="mr-1 inline" aria-label="Réussi" />}
                      {c.title}
                    </span>
                    <span className="tabular text-muted">
                      {value}/{c.target}
                    </span>
                  </div>
                  <Progress value={value / c.target} label={c.title} tone={ok ? "success" : "accent"} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <SectionTitle>Objectifs de l'étape {stage}</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {info.goals.map((g) => (
          <Pill key={g} tone="neutral" className="py-1.5 text-sm">
            {g}
          </Pill>
        ))}
      </div>
    </div>
  );
}
