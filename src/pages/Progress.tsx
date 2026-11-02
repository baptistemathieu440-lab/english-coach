import { Link } from "react-router";
import { Award, Check, Clock, Lock, Trophy } from "lucide-react";
import { EXAMS, STAGES } from "@/content";
import { SKILLS } from "@/content/types";
import { BADGES, examAvailableAt, examPassed, overallProgress, secondsSince, skillStats, stageProgress, streak, validatedLevel, vocabStats, xpTier } from "@/lib/progress";
import { dayKey, useAppState } from "@/state/store";
import { BarChart, Heatmap, LineChart } from "@/components/charts";
import { ButtonLink, Card, PageHeader, Pill, Progress, Ring, SectionTitle, Stat, minutesLabel, cx } from "@/components/ui";
import { SKILL_LABEL } from "./Assessment";

const DAY = 86_400_000;

export function ProgressPage() {
  const s = useAppState();
  const level = validatedLevel(s);
  const overall = overallProgress(s);
  const st = streak(s);
  const vs = vocabStats(s);
  const skills = skillStats(s);
  const tier = xpTier(s.xp);

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const t = Date.now() - (13 - i) * DAY;
    const d = new Date(t - 4 * 3_600_000);
    return { label: d.toLocaleDateString("fr-FR", { weekday: "narrow" }), full: d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }), value: Math.round((s.days[dayKey(t)]?.seconds ?? 0) / 60) };
  });
  // 12 semaines, du lundi au dimanche
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - 11 * 7);
  const heat = Array.from({ length: 84 }, (_, i) => {
    const date = new Date(start.getTime() + i * DAY);
    const key = dayKey(date.getTime() + 4 * 3_600_000);
    return { key, date, minutes: date.getTime() > Date.now() ? 0 : Math.round((s.days[key]?.seconds ?? 0) / 60) };
  });
  const weekLabels = Array.from({ length: 8 }, (_, i) => (i === 7 ? "Cette semaine" : `Il y a ${7 - i} sem.`));

  return (
    <div>
      <PageHeader eyebrow="Progression" title="Vos progrès" subtitle="Le niveau affiché ne monte qu'avec un examen blanc réussi. Les pourcentages par compétence reflètent vos 20 dernières activités notées." />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card className="flex items-center gap-6 p-5">
          <Ring value={overall} size={128} stroke={11} label={`Progression vers B2 : ${Math.round(overall * 100)} %`}>
            <div>
              <p className="text-2xl font-semibold tabular">{Math.round(overall * 100)} %</p>
              <p className="text-xs text-muted">vers B2</p>
            </div>
          </Ring>
          <div className="min-w-0">
            <p className="text-sm text-muted">Niveau actuel</p>
            <p className="font-display text-4xl font-semibold">{level.label}</p>
            <p className="text-xs text-muted">{level.basis}</p>
            <p className="mt-3 text-sm">
              Objectif : <strong>B2</strong>
            </p>
          </div>
        </Card>
        <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
          <Stat label="Temps total" value={minutesLabel(s.totalSeconds)} />
          <Stat label="Cette semaine" value={minutesLabel(secondsSince(s, 7))} />
          <Stat label="Série" value={`${st.current} j`} hint={`record : ${st.best} j`} />
          <Stat label="Mots appris" value={vs.learned} hint={`${vs.total} dans le carnet`} />
          <Stat label="Mots maîtrisés" value={vs.mastered} hint="≥ 21 jours" />
          <Stat label="Points XP" value={s.xp} hint={`palier ${tier.tier} · ${tier.into}/${tier.size}`} />
        </Card>
      </div>

      {/* Parcours */}
      <SectionTitle>Parcours A2 → B2</SectionTitle>
      <div className="grid gap-3 md:grid-cols-4">
        {STAGES.map((stg) => {
          const p = stageProgress(s, stg.stage);
          return (
            <Card key={stg.stage} className={cx("p-4", p.examPassed && "border-success/40")}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Étape {stg.stage}</p>
                {p.examPassed ? <Pill tone="success"><Check size={12} /> validée</Pill> : <span className="text-sm tabular text-muted">{Math.round(p.value * 100)} %</span>}
              </div>
              <p className="mt-1 font-medium">
                {stg.from} → {stg.to}
              </p>
              <Progress value={p.value} label={`Étape ${stg.stage}`} className="mt-2" tone={p.examPassed ? "success" : "accent"} />
              <ul className="mt-3 space-y-0.5 text-xs text-muted tabular">
                <li>Leçons : {p.lessons.mastered}/{p.lessons.total}</li>
                <li>Mots : {p.words.learned}/{p.words.total}</li>
                <li>Écoute & lecture : {p.comprehension.done}/{p.comprehension.total}</li>
                <li>Oral & écrit : {p.production.done}/{p.production.total}</li>
              </ul>
            </Card>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">Sans examen réussi, une étape plafonne à 90 % : accumuler des activités ne suffit pas, il faut démontrer le niveau.</p>

      {/* Compétences */}
      <SectionTitle>Résultats par compétence</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {SKILLS.map((k) => {
          const x = skills[k];
          return (
            <Card key={k} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{SKILL_LABEL[k]}</p>
                  <p className="text-xs text-muted">
                    {x.count} activité{x.count > 1 ? "s" : ""} notée{x.count > 1 ? "s" : ""}
                    {x.demonstrated && ` · niveau démontré ${x.demonstrated}`}
                  </p>
                </div>
                <p className="text-2xl font-semibold tabular">{x.score === null ? "—" : `${x.score} %`}</p>
              </div>
              <div className="mt-2">
                <LineChart values={x.trend} labels={weekLabels} label={`${SKILL_LABEL[k]} : score moyen par semaine sur 8 semaines`} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Temps */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Minutes d'apprentissage (14 jours)</h2>
          <BarChart data={last14} unit="min" label="Minutes d'apprentissage par jour sur les 14 derniers jours" />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Calendrier d'apprentissage (12 semaines)</h2>
          <Heatmap days={heat} label="Calendrier des minutes d'apprentissage sur 12 semaines" />
        </Card>
      </div>

      {/* Évaluations */}
      <SectionTitle>Évaluations</SectionTitle>
      <Card className="divide-y divide-line">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-medium">Test de positionnement</p>
            <p className="text-sm text-muted">{s.placement ? `Passé le ${new Date(s.placement.date).toLocaleDateString("fr-FR")} · niveau estimé ${s.placement.level}` : "Non passé"}</p>
          </div>
          <ButtonLink to="/test/positionnement" variant="secondary" size="sm">
            {s.placement ? "Le repasser" : "Passer le test"}
          </ButtonLink>
        </div>
        {EXAMS.map((e) => {
          const results = s.assessments.filter((a) => a.id === e.id);
          const last = results.at(-1);
          const passed = examPassed(s, e.id);
          const prevPassed = e.stage === 1 || examPassed(s, EXAMS[e.stage - 2].id);
          const wait = examAvailableAt(s, e.id);
          return (
            <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium">
                  {passed ? <Trophy size={16} className="text-gold" aria-hidden /> : !prevPassed ? <Lock size={14} className="text-muted" aria-hidden /> : null}
                  {e.title}
                </p>
                <p className="text-sm text-muted">
                  {last ? `Dernière tentative : ${new Date(last.date).toLocaleDateString("fr-FR")} · ${last.overall} % · ${last.passed ? "réussi" : "non validé"}` : `Valide le niveau ${e.validates}`}
                </p>
                {last && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(last.scores).map(([k, v]) => (
                      <Pill key={k} tone={(v ?? 0) >= (k === "writing" || k === "speaking" ? 60 : 70) ? "success" : "warn"}>
                        {SKILL_LABEL[k as keyof typeof SKILL_LABEL]} {v} %
                      </Pill>
                    ))}
                  </div>
                )}
              </div>
              {prevPassed && !passed && (wait > Date.now() ? <span className="flex items-center gap-1 text-sm text-muted"><Clock size={14} /> dès le {new Date(wait).toLocaleDateString("fr-FR")}</span> : <ButtonLink to={`/examen/${e.id}`} size="sm">Passer l'examen</ButtonLink>)}
              {passed && <ButtonLink to={`/examen/${e.id}`} size="sm" variant="ghost">Refaire (bilan)</ButtonLink>}
            </div>
          );
        })}
      </Card>
      <p className="mt-2 text-xs text-muted">Une évaluation complète est conseillée chaque mois : elle mesure les cinq compétences et met à jour vos priorités.</p>

      {/* Badges */}
      <SectionTitle>Badges</SectionTitle>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {BADGES.map((b) => {
          const got = s.badges[b.id];
          return (
            <div key={b.id} className={cx("rounded-2xl border p-3", got ? "border-gold/40 bg-gold-soft" : "border-dashed border-line bg-surface")}>
              <Award size={20} className={got ? "text-gold" : "text-muted"} aria-hidden />
              <p className="mt-1 text-sm font-semibold">{b.title}</p>
              <p className="text-xs text-muted">{b.description}</p>
              <p className="mt-1 text-xs">{got ? `Obtenu le ${new Date(got).toLocaleDateString("fr-FR")}` : <span className="text-muted">À débloquer</span>}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted">
        Les XP récompensent les réponses justes, la maîtrise et la régularité ; ils ne font pas monter le niveau. <Link to="/reglages" className="underline">Exporter mes progrès</Link>
      </p>
    </div>
  );
}
