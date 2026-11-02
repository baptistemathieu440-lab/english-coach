import { useState } from "react";
import { Link, useParams } from "react-router";
import { BookmarkPlus, Check, ChevronRight, Lock } from "lucide-react";
import { LESSONS, STAGES, THEMES, WORDS, themeById } from "@/content";
import { currentStage, lessonUnlocked, stageProgress } from "@/lib/progress";
import { addCard, addWords } from "@/state/actions";
import { useAppState } from "@/state/store";
import { isLearned } from "@/lib/srs";
import { Button, Card, LevelPill, Notice, PageHeader, Pill, Progress, SpeakButton, Tabs, cx } from "@/components/ui";

export function Learn() {
  const s = useAppState();
  const [tab, setTab] = useState<"grammar" | "vocab">("grammar");
  const cur = currentStage(s);
  return (
    <div>
      <PageHeader eyebrow="Apprendre" title="Cours structurés" subtitle="Le parcours A2 → B2 en quatre étapes. Chaque leçon se débloque quand ses bases sont acquises (70 % minimum) ; une leçon est maîtrisée à 80 %." />
      <Tabs label="Type de cours" value={tab} onChange={setTab} items={[{ id: "grammar", label: "Grammaire", count: LESSONS.length }, { id: "vocab", label: "Vocabulaire", count: WORDS.length }]} />
      {tab === "grammar" ? (
        <div className="space-y-8">
          {STAGES.map((st) => {
            const p = stageProgress(s, st.stage);
            const lessons = LESSONS.filter((l) => l.stage === st.stage);
            return (
              <section key={st.stage} aria-labelledby={`stage-${st.stage}`}>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Étape {st.stage} · {st.from} → {st.to} · {st.months}
                    </p>
                    <h2 id={`stage-${st.stage}`} className="text-xl font-semibold">
                      {st.title}
                    </h2>
                  </div>
                  <div className="w-40">
                    <Progress value={p.value} label={`Progression étape ${st.stage}`} />
                    <p className="mt-1 text-right text-xs text-muted tabular">
                      {p.lessons.mastered}/{p.lessons.total} maîtrisées
                    </p>
                  </div>
                </div>
                {st.stage > cur && <p className="mb-3 text-sm text-muted">Débloquée après l'examen blanc de l'étape {st.stage - 1}.</p>}
                <div className="grid gap-2 sm:grid-cols-2">
                  {lessons.map((l) => {
                    const u = lessonUnlocked(s, l);
                    const a = s.lessons[l.id];
                    return (
                      <Link
                        key={l.id}
                        to={`/apprendre/${l.id}`}
                        className={cx("flex items-center gap-3 rounded-2xl border bg-surface p-4 transition-colors", u.ok ? "border-line hover:border-accent" : "border-dashed border-line")}
                      >
                        <span className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-semibold", a?.mastered ? "bg-success text-white" : u.ok ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted")}>
                          {a?.mastered ? <Check size={18} aria-label="Maîtrisée" /> : u.ok ? <span className="tabular">{a ? `${a.best}%` : "•"}</span> : <Lock size={16} aria-label="Verrouillée" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{l.title}</span>
                          <span className="block truncate text-sm text-muted">
                            {u.ok ? l.objective : u.stageLocked ? `Étape ${l.stage}` : `Prérequis : ${u.missing.map((m) => m.title).join(", ")}`}
                          </span>
                        </span>
                        <LevelPill level={l.level} />
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <VocabThemes />
      )}
    </div>
  );
}

function VocabThemes() {
  const s = useAppState();
  return (
    <div className="space-y-8">
      <Notice tone="accent">Les nouveaux mots arrivent chaque jour dans votre programme, dans l'ordre du parcours. Vous pouvez aussi ajouter un thème entier à votre carnet ; les mots apparaîtront ensuite dans les révisions (10 nouveaux par jour par défaut).</Notice>
      {STAGES.map((st) => (
        <section key={st.stage}>
          <h2 className="mb-3 text-lg font-semibold">Étape {st.stage}</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {st.vocabThemes.map((tid) => {
              const t = themeById.get(tid)!;
              const words = WORDS.filter((w) => w.theme === tid);
              const learned = words.filter((w) => s.cards[`word:${w.id}`] && isLearned(s.cards[`word:${w.id}`])).length;
              return (
                <Link key={tid} to={`/apprendre/vocabulaire/${tid}`} className="rounded-2xl border border-line bg-surface p-4 hover:border-accent">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{t.title}</p>
                    {t.business && <Pill tone="gold">Business</Pill>}
                  </div>
                  <p className="mt-1 text-sm text-muted tabular">
                    {learned}/{words.length} mots appris
                  </p>
                  <Progress value={learned / words.length} label={`${t.title} : mots appris`} className="mt-2" />
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function VocabularyTheme() {
  const { theme } = useParams();
  const s = useAppState();
  const t = THEMES.find((x) => x.id === theme);
  if (!t) return <Notice tone="danger">Thème introuvable.</Notice>;
  const words = WORDS.filter((w) => w.theme === t.id);
  const missing = words.filter((w) => !s.cards[`word:${w.id}`]);
  return (
    <div>
      <PageHeader eyebrow={`Vocabulaire · ${t.level}`} title={t.title} subtitle={`${words.length} mots et expressions, avec prononciation, définition et exemple.`} action={missing.length > 0 && <Button onClick={() => addWords(missing.map((w) => w.id))}><BookmarkPlus size={16} /> Tout ajouter au carnet ({missing.length})</Button>} />
      <div className="grid gap-3 md:grid-cols-2">
        {words.map((w) => {
          const inBook = !!s.cards[`word:${w.id}`];
          return (
            <Card key={w.id} className="p-4">
              <div className="flex items-start gap-3">
                <SpeakButton text={w.en} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold" lang="en">
                    {w.en} <span className="font-normal text-muted">{w.ipa}</span>
                  </p>
                  <p className="text-sm">
                    {w.fr} <span className="text-muted">· {w.pos}</span>
                  </p>
                  <p className="mt-1 text-sm text-muted" lang="en">
                    {w.def}
                  </p>
                  <p className="mt-2 text-sm" lang="en">
                    « {w.example} »
                  </p>
                  <p className="text-sm text-muted">{w.exampleFr}</p>
                </div>
                {inBook ? (
                  <Check size={18} className="shrink-0 text-success" aria-label="Dans le carnet" />
                ) : (
                  <button type="button" onClick={() => addCard("word", w.id)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-surface-2" aria-label={`Ajouter ${w.en} au carnet`}>
                    <BookmarkPlus size={18} className="text-accent" />
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      <Link to="/apprendre" className="mt-6 inline-flex items-center gap-1 text-sm text-accent">
        Tous les thèmes <ChevronRight size={14} />
      </Link>
    </div>
  );
}
