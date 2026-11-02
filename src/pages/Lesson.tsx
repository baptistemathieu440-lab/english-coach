import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { AlertTriangle, ArrowLeft, Check, ChevronRight, Lightbulb, Lock, RotateCcw, Trophy, X } from "lucide-react";
import { LESSONS, lessonById } from "@/content";
import type { Exercise, GrammarLesson } from "@/content/types";
import { lessonUnlocked } from "@/lib/progress";
import { addCard, MASTERY, recordEvent, recordLesson, UNLOCK } from "@/state/actions";
import { getState, useAppState } from "@/state/store";
import { usePlanId } from "@/lib/hooks";
import { ExerciseView, type ExerciseResult } from "@/components/ExerciseView";
import { Button, ButtonLink, Card, LevelPill, Notice, Progress, Rich, SpeakButton } from "@/components/ui";

type Mode = "course" | "exercises" | "extra" | "test";

export function LessonPage() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const lesson = lessonById.get(id ?? "");
  const s = useAppState();
  const remedialStart = sp.get("renfort") === "1" || (lesson && s.lessons[lesson.id] && s.lessons[lesson.id].best < UNLOCK);
  const [mode, setMode] = useState<Mode>("course");
  if (!lesson) return <Notice tone="danger">Leçon introuvable.</Notice>;
  const u = lessonUnlocked(s, lesson);

  if (!u.ok)
    return (
      <div className="mx-auto max-w-2xl">
        <BackLink />
        <Card className="p-6 text-center">
          <Lock size={28} className="mx-auto text-muted" aria-hidden />
          <h1 className="font-display mt-3 text-2xl font-semibold">{lesson.title}</h1>
          {u.stageLocked ? (
            <p className="mt-2 text-muted">Cette leçon fait partie de l'étape {lesson.stage}. Elle se débloque quand l'examen blanc de l'étape {lesson.stage - 1} est réussi.</p>
          ) : (
            <>
              <p className="mt-2 text-muted">Pour bien la comprendre, il faut d'abord maîtriser (70 % minimum) :</p>
              <ul className="mt-3 space-y-2">
                {u.missing.map((m) => (
                  <li key={m.id}>
                    <Link to={`/apprendre/${m.id}`} className="font-medium text-accent underline">
                      {m.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>
    );

  if (mode !== "course") return <Runner key={mode} lesson={lesson} mode={mode} onExit={(m) => setMode(m)} />;

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink />
      <header className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <LevelPill level={lesson.level} />
          <span className="text-sm text-muted">Étape {lesson.stage}</span>
          {s.lessons[lesson.id] && <span className="text-sm text-muted tabular">· meilleur score {s.lessons[lesson.id].best} %</span>}
        </div>
        <h1 className="font-display text-[30px] leading-tight font-semibold">{lesson.title}</h1>
        <p className="mt-1 text-muted" lang="en">
          {lesson.titleEn}
        </p>
        <p className="mt-3 rounded-xl bg-accent-soft p-3 text-sm">
          <strong>Objectif :</strong> {lesson.objective}
        </p>
      </header>

      {remedialStart && (
        <div className="mb-5">
          <Notice tone="warn" icon={<RotateCcw size={18} />} title="Renforcement">
            Votre dernier score était inférieur à 70 %. Relisez l'explication et les erreurs fréquentes, puis faites les exercices de renfort avant de retenter la leçon.
          </Notice>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. L'explication</h2>
        {lesson.explanation.map((p, i) => (
          <p key={i} className="leading-relaxed">
            <Rich text={p} />
          </p>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">2. La règle</h2>
        <Card className="divide-y divide-line">
          {lesson.rule.map((r) => (
            <div key={r.label} className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
              <p className="text-sm font-semibold text-accent">{r.label}</p>
              <p className="text-[15px]">{r.value}</p>
            </div>
          ))}
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">3. Exemples</h2>
        <ul className="space-y-2">
          {lesson.examples.map((e) => (
            <li key={e.en} className="flex items-start gap-3 rounded-xl bg-surface p-3">
              <SpeakButton text={e.en} size="sm" />
              <div>
                <p className="font-medium" lang="en">
                  {e.en}
                </p>
                <p className="text-sm text-muted">{e.fr}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">4. Les erreurs fréquentes</h2>
        <ul className="space-y-2">
          {lesson.mistakes.map((m) => (
            <li key={m.wrong} className="rounded-xl border border-line bg-surface p-3">
              <p className="flex flex-wrap items-center gap-x-2" lang="en">
                <X size={16} className="text-danger" aria-label="Incorrect" />
                <span className="text-danger line-through">{m.wrong}</span>
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2" lang="en">
                <Check size={16} className="text-success" aria-label="Correct" />
                <span className="font-medium">{m.right}</span>
              </p>
              <p className="mt-1 text-sm text-muted">{m.why}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">5. Pour mémoriser</h2>
        <ul className="space-y-2">
          {lesson.tips.map((t) => (
            <li key={t} className="flex gap-2 rounded-xl bg-gold-soft p-3 text-sm">
              <Lightbulb size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
      </section>

      <Card className="mt-8 p-5">
        <h2 className="text-lg font-semibold">6. Exercices</h2>
        <p className="mt-1 text-sm text-muted">
          {lesson.exercises.length} exercices progressifs, corrigés et expliqués. Les erreurs reviennent en fin de série et dans vos révisions. Leçon maîtrisée à {MASTERY} %.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {remedialStart ? (
            <>
              <Button size="lg" onClick={() => setMode("extra")}>
                Exercices de renfort
              </Button>
              <Button size="lg" variant="secondary" onClick={() => setMode("exercises")}>
                Retenter la leçon
              </Button>
            </>
          ) : (
            <>
              <Button size="lg" onClick={() => setMode("exercises")}>
                Commencer les exercices
              </Button>
              {!s.lessons[lesson.id] && (
                <Button size="lg" variant="secondary" onClick={() => setMode("test")} title="Pour passer rapidement une notion déjà maîtrisée">
                  Je connais déjà : test de sortie
                </Button>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/apprendre" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
      <ArrowLeft size={16} /> Tous les cours
    </Link>
  );
}

function Runner({ lesson, mode, onExit }: { lesson: GrammarLesson; mode: Mode; onExit: (m: Mode) => void }) {
  const planId = usePlanId();
  const nav = useNavigate();
  const initial = useMemo<Exercise[]>(() => {
    if (mode === "extra") return [...lesson.extra, ...lesson.exercises.filter((_, i) => i % 2 === 1)];
    if (mode === "test") return lesson.exercises.filter((e) => e.kind !== "mcq").slice(0, 6);
    return lesson.exercises;
  }, [lesson, mode]);
  const [queue, setQueue] = useState<Exercise[]>(initial);
  const [pos, setPos] = useState(0);
  const [firstTry, setFirstTry] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState<number | null>(null);

  const onNext = (r: ExerciseResult) => {
    const ex = queue[pos];
    const isFirst = firstTry[ex.id] === undefined;
    const ft = isFirst ? { ...firstTry, [ex.id]: r.correct } : firstTry;
    if (isFirst) setFirstTry(ft);
    let q = queue;
    if (!r.correct && isFirst) {
      // Réactivation immédiate : l'exercice raté revient en fin de série…
      q = [...queue, ex];
      setQueue(q);
      // … et dans les révisions espacées.
      addCard("exercise", `${lesson.id}/${ex.id}`);
    }
    if (pos + 1 < q.length) setPos(pos + 1);
    else {
      const total = initial.length;
      const ok = initial.filter((e) => ft[e.id]).length;
      const score = Math.round((ok / total) * 100);
      setFinished(score);
      const wasMastered = !!getState().lessons[lesson.id]?.mastered;
      recordLesson(lesson.id, score, mode === "test");
      recordEvent({ type: "lesson", skill: "grammar", ref: lesson.id, score, level: lesson.level, xp: ok * 10 + (score >= MASTERY && !wasMastered ? 50 : 0) }, planId);
    }
  };

  if (finished !== null) {
    const idx = LESSONS.findIndex((l) => l.id === lesson.id);
    const next = LESSONS[idx + 1];
    const mastered = finished >= MASTERY;
    const weak = finished < UNLOCK;
    const missed = initial.filter((e) => !firstTry[e.id]);
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-6 text-center">
          {mastered ? <Trophy size={36} className="mx-auto text-gold" aria-hidden /> : weak ? <AlertTriangle size={36} className="mx-auto text-warn" aria-hidden /> : <Check size={36} className="mx-auto text-accent" aria-hidden />}
          <p className="mt-3 text-5xl font-semibold tabular">{finished} %</p>
          <p className="mt-1 text-muted">réussis du premier coup</p>
          <h1 className="font-display mt-4 text-2xl font-semibold">{mastered ? "Leçon maîtrisée !" : weak ? "Cette notion mérite un renfort" : "Bien, encore un petit effort"}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            {mastered
              ? finished >= 90 ? "Excellent résultat : vous pouvez passer à la suite. Cette notion reviendra dans vos révisions pour rester solide." : "La notion est acquise. Les erreurs commises reviendront dans vos révisions."
              : weak
                ? "Relisez l'explication et les erreurs fréquentes, puis faites les exercices de renfort. Les leçons suivantes se débloquent à 70 %."
                : `La leçon suivante est débloquée. Visez ${MASTERY} % pour la maîtriser.`}
          </p>
        </Card>
        {missed.length > 0 && (
          <Card className="mt-4 p-5">
            <h2 className="mb-2 font-semibold">À retravailler ({missed.length})</h2>
            <p className="mb-3 text-sm text-muted">Ces exercices ont été ajoutés à vos révisions.</p>
            <ul className="space-y-2 text-sm">
              {missed.map((e) => (
                <li key={e.id} className="rounded-xl bg-surface-2 p-3">
                  {e.explanation}
                </li>
              ))}
            </ul>
          </Card>
        )}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {weak ? (
            <>
              <Button size="lg" onClick={() => onExit("course")}>
                Revoir le cours
              </Button>
              <Button size="lg" variant="secondary" onClick={() => onExit("extra")}>
                Exercices de renfort
              </Button>
            </>
          ) : (
            <>
              {planId ? (
                <ButtonLink to="/" size="lg">
                  Retour au programme du jour
                </ButtonLink>
              ) : next ? (
                <Button size="lg" onClick={() => nav(`/apprendre/${next.id}`)}>
                  Leçon suivante <ChevronRight size={18} />
                </Button>
              ) : null}
              {!mastered && (
                <Button size="lg" variant="secondary" onClick={() => onExit("exercises")}>
                  Refaire la série
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  const done = Object.keys(firstTry).length;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={() => onExit("course")} className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-surface-2" aria-label="Quitter les exercices">
          <X size={20} />
        </button>
        <Progress value={done / initial.length} label="Avancement des exercices" />
        <span className="shrink-0 text-sm text-muted tabular">
          {Math.min(pos + 1, queue.length)}/{queue.length}
        </span>
      </div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
        {lesson.title}
        {mode === "extra" && " · renfort"}
        {mode === "test" && " · test de sortie"}
        {pos >= initial.length && " · deuxième chance"}
      </p>
      <Card className="p-5 sm:p-6">
        <ExerciseView key={`${queue[pos].id}-${pos}`} exercise={queue[pos]} onNext={onNext} nextLabel={pos + 1 < queue.length ? "Continuer" : "Voir le résultat"} />
      </Card>
    </div>
  );
}
