import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, BookmarkPlus, Check, Play, Plus, Search, Trash2, X } from "lucide-react";
import { LESSONS, WORDS, lessonById, themeById, wordById } from "@/content";
import type { Exercise, Word } from "@/content/types";
import { cardMode, categorize, isDue, previewIntervals, type Card as SrsCard, type Grade } from "@/lib/srs";
import { matchAnswer, shuffle } from "@/lib/text";
import { nextNewWords, vocabStats } from "@/lib/progress";
import { addCustomWord, addWords, deleteCustomWord, gradeCard, markPlanDone, recordEvent, removeCard } from "@/state/actions";
import { getState, useAppState, type CustomWord } from "@/state/store";
import { usePlanId } from "@/lib/hooks";
import { speak } from "@/lib/speech";
import { ExerciseView } from "@/components/ExerciseView";
import { Button, ButtonLink, Card, EmptyState, Notice, PageHeader, Pill, Progress, SpeakButton, Stat, Tabs, cx } from "@/components/ui";

export function ReviewHub() {
  const s = useAppState();
  const v = vocabStats(s);
  const cats: { label: string; value: number; hint: string }[] = [
    { label: "À revoir aujourd'hui", value: v.due, hint: "mots et erreurs" },
    { label: "Récemment appris", value: v.recent, hint: "ajoutés cette semaine" },
    { label: "En cours d'apprentissage", value: v.learning, hint: "étapes courtes" },
    { label: "Maîtrisés", value: v.mastered, hint: "intervalle ≥ 21 jours" },
    { label: "Oubliés récemment", value: v.forgotten, hint: "oubliés ces 14 jours" },
    { label: "Difficiles", value: v.difficult, hint: "souvent oubliés" },
  ];
  return (
    <div>
      <PageHeader eyebrow="Révisions" title="Mémorisation durable" subtitle="Répétition espacée : chaque carte revient juste avant que vous ne l'oubliiez. On commence par reconnaître le mot, puis on doit le retrouver, l'écrire et le reconnaître à l'oral." />
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="p-5">
          <p className="text-sm text-muted">Session du jour</p>
          <p className="mt-1 text-4xl font-semibold tabular">{v.due}</p>
          <p className="text-sm text-muted">carte{v.due > 1 ? "s" : ""} à revoir{v.newCards ? ` · ${v.newCards} nouvelle${v.newCards > 1 ? "s" : ""} en attente` : ""} · {v.mistakes} erreur{v.mistakes > 1 ? "s" : ""} de grammaire en suivi</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {v.sessionable ? (
              <ButtonLink to="/revisions/session" size="lg">
                <Play size={16} /> Réviser maintenant
              </ButtonLink>
            ) : (
              <p className="flex h-12 items-center text-sm text-muted">Aucune carte à revoir pour l'instant.</p>
            )}
            <ButtonLink to="/revisions/nouveaux" size="lg" variant="secondary">
              <Plus size={16} /> Nouveaux mots
            </ButtonLink>
          </div>
        </Card>
        <Card className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
          {cats.map((c) => (
            <Stat key={c.label} label={c.label} value={c.value} hint={c.hint} />
          ))}
        </Card>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink to="/revisions/carnet" variant="secondary">
          Mon carnet de vocabulaire ({v.total})
        </ButtonLink>
      </div>
    </div>
  );
}

/* ---------- Session ---------- */

function buildQueue(cards: Record<string, SrsCard>, newLimit: number, now = Date.now()): string[] {
  const due = Object.values(cards).filter((c) => isDue(c, now));
  // Cartes en apprentissage d'abord, puis les plus en retard.
  const sorted = due.sort((a, b) => (a.state === "learning" || a.state === "relearning" ? -1 : 0) - (b.state === "learning" || b.state === "relearning" ? -1 : 0) || a.due - b.due).map((c) => c.id);
  // Puis les nouvelles cartes du carnet, dans l'ordre d'ajout, dans la limite quotidienne.
  const fresh = Object.values(cards).filter((c) => c.state === "new").sort((a, b) => a.addedAt - b.addedAt).slice(0, newLimit).map((c) => c.id);
  return [...sorted, ...fresh];
}

/** Nouvelles cartes encore autorisées aujourd'hui (celles déjà vues aujourd'hui sont décomptées). */
function newLimitToday(s: ReturnType<typeof getState>): number {
  const start = new Date();
  start.setHours(4, 0, 0, 0);
  if (new Date().getHours() < 4) start.setDate(start.getDate() - 1);
  const seen = Object.values(s.cards).filter((c) => c.state !== "new" && c.reps > 0 && c.history.length === c.reps && c.addedAt >= start.getTime()).length;
  return Math.max(0, s.settings.newWordsPerDay + 5 - seen);
}

export function ReviewSession() {
  const s = useAppState();
  const planId = usePlanId();
  const nav = useNavigate();
  const [queue, setQueue] = useState<string[]>(() => buildQueue(getState().cards, newLimitToday(getState())).slice(0, 80));
  const [done, setDone] = useState(0);
  const [correct, setCorrect] = useState(0);
  const id = queue[0];
  const card = id ? s.cards[id] : undefined;
  useEffect(() => {
    if (!card && planId && done > 0) markPlanDone(planId);
  }, [card, planId, done]);

  const grade = (g: Grade) => {
    gradeCard(id, g);
    setDone((d) => d + 1);
    if (g >= 3) setCorrect((c) => c + 1);
    const updated = getState().cards[id];
    const rest = queue.slice(1);
    // Une carte encore en apprentissage revient dans la même session.
    setQueue(updated && (updated.state === "learning" || updated.state === "relearning") && updated.due < Date.now() + 15 * 60_000 ? [...rest, id] : rest);
  };

  if (!card) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="p-6 text-center">
          <Check size={36} className="mx-auto text-success" aria-hidden />
          <h1 className="font-display mt-3 text-2xl font-semibold">{done ? "Révisions terminées !" : "Rien à réviser pour l'instant"}</h1>
          {done > 0 && (
            <p className="mt-2 text-muted tabular">
              {done} cartes revues · {Math.round((correct / done) * 100)} % retrouvées
            </p>
          )}
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">Les cartes reviendront automatiquement au bon moment. Ajoutez de nouveaux mots pour continuer à enrichir votre vocabulaire.</p>
        </Card>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button size="lg" onClick={() => nav(planId ? "/" : "/revisions")}>{planId ? "Retour au programme" : "Révisions"}</Button>
          <ButtonLink to="/revisions/nouveaux" size="lg" variant="secondary">Nouveaux mots</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-5 flex items-center gap-3">
        <Link to="/revisions" className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-surface-2" aria-label="Quitter">
          <X size={20} />
        </Link>
        <Progress value={done / (done + queue.length)} label="Avancement des révisions" />
        <span className="shrink-0 text-sm text-muted tabular">{queue.length} restantes</span>
      </div>
      {card.kind === "exercise" ? <ExerciseCard key={`${id}-${done}`} card={card} onGrade={grade} /> : <WordCard key={`${id}-${done}`} card={card} onGrade={grade} />}
    </div>
  );
}

function resolveWord(card: SrsCard): { en: string; fr: string; word?: Word; custom?: CustomWord } | null {
  if (card.kind === "word") {
    const w = wordById.get(card.ref);
    return w ? { en: w.en, fr: w.fr, word: w } : null;
  }
  const c = getState().customWords[card.ref];
  return c ? { en: c.en, fr: c.fr, custom: c } : null;
}

function GradeButtons({ card, onGrade, suggested }: { card: SrsCard; onGrade: (g: Grade) => void; suggested?: Grade }) {
  const p = previewIntervals(card);
  const labels: [Grade, string, string][] = [
    [1, "Oublié", "bg-danger-soft text-danger"],
    [2, "Difficile", "bg-warn-soft text-warn"],
    [3, "Correct", "bg-accent-soft text-accent"],
    [4, "Facile", "bg-success-soft text-success"],
  ];
  return (
    <div className="mt-5 grid grid-cols-4 gap-2">
      {labels.map(([g, l, c]) => (
        <button key={g} type="button" onClick={() => onGrade(g)} className={cx("flex flex-col items-center rounded-xl py-2.5 text-sm font-medium", c, suggested === g && "ring-2 ring-current")}>
          {l}
          <span className="text-xs font-normal opacity-80 tabular">{p[g]}</span>
        </button>
      ))}
    </div>
  );
}

function WordCard({ card, onGrade }: { card: SrsCard; onGrade: (g: Grade) => void }) {
  const data = resolveWord(card);
  const mode = cardMode(card);
  const [revealed, setRevealed] = useState(false);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ReturnType<typeof matchAnswer> | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const options = useMemo(() => {
    if (!data) return [];
    const others = shuffle(WORDS.filter((w) => w.fr !== data.fr && (!data.word || w.pos === data.word.pos)), Math.abs(card.reps * 0.13 + card.ref.length * 0.07) % 1).slice(0, 3).map((w) => w.fr);
    return shuffle([data.fr, ...others], (card.ref.length * 0.11) % 1);
  }, [data, card.ref, card.reps]);

  if (!data)
    return (
      <Card className="p-6 text-center">
        <p>Ce mot n'existe plus.</p>
        <Button className="mt-3" onClick={() => onGrade(3)}>Passer</Button>
      </Card>
    );

  const w = data.word;
  const cloze = w ? w.example.replace(new RegExp(w.en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "_____") : null;
  const effective = mode === "cloze" && cloze && cloze.includes("_____") ? "cloze" : mode === "cloze" ? "produce" : mode;
  const check = () => {
    const r = matchAnswer(input, [data.en]);
    setResult(r);
    setRevealed(true);
  };
  const suggested: Grade | undefined = result ? (result.status === "correct" ? 3 : result.status === "wrong" ? 1 : 2) : picked !== null ? (options[picked] === data.fr ? 3 : 1) : undefined;

  const back = (
    <div className="mt-5 border-t border-line pt-5 text-left">
      <div className="flex items-center gap-3">
        <SpeakButton text={data.en} />
        <div>
          <p className="text-2xl font-semibold" lang="en">{data.en}</p>
          {w && <p className="text-sm text-muted">{w.ipa} · {w.pos} · {w.level}</p>}
        </div>
      </div>
      <p className="mt-2 text-lg">{data.fr}</p>
      {w && (
        <>
          <p className="mt-2 text-sm text-muted" lang="en">{w.def}</p>
          <p className="mt-3 text-[15px]" lang="en">« {w.example} »</p>
          <p className="text-sm text-muted">{w.exampleFr}</p>
        </>
      )}
      {data.custom?.source && <p className="mt-2 text-xs text-muted">Source : {data.custom.source}</p>}
    </div>
  );

  return (
    <Card className="p-6 text-center">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">
        {effective === "recognize" && "Que signifie ce mot ?"}
        {effective === "choice" && "Choisissez la traduction"}
        {effective === "produce" && "Écrivez le mot anglais"}
        {effective === "listen" && "Écoutez et écrivez le mot"}
        {effective === "cloze" && "Complétez la phrase"}
      </p>

      {(effective === "recognize" || effective === "choice") && (
        <div className="flex items-center justify-center gap-3">
          <p className="font-display text-4xl font-semibold" lang="en">{data.en}</p>
          <SpeakButton text={data.en} size="sm" />
        </div>
      )}
      {effective === "produce" && <p className="font-display text-3xl font-semibold">{data.fr}</p>}
      {effective === "listen" && (
        <Button size="lg" onClick={() => void speak(data.en, { rate: getState().settings.speechRate })}>
          <Play size={18} /> Écouter
        </Button>
      )}
      {effective === "cloze" && (
        <div>
          <p className="text-xl font-medium" lang="en">{cloze}</p>
          <p className="mt-1 text-sm text-muted">{data.fr}</p>
        </div>
      )}

      {effective === "choice" && (
        <div className="mt-5 grid gap-2">
          {options.map((o, i) => (
            <button key={o} type="button" disabled={picked !== null} onClick={() => { setPicked(i); setRevealed(true); }} className={cx("min-h-11 rounded-xl border px-3 py-2", picked === null ? "border-line hover:bg-surface-2" : o === data.fr ? "border-success bg-success-soft" : picked === i ? "border-danger bg-danger-soft" : "border-line opacity-60")}>
              {o}
            </button>
          ))}
        </div>
      )}

      {(effective === "produce" || effective === "listen" || effective === "cloze") && !revealed && (
        <div className="mt-5">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && input.trim() && check()} autoFocus autoCapitalize="off" autoCorrect="off" spellCheck={false} lang="en" aria-label="Mot en anglais" className="h-12 w-full rounded-xl border border-line bg-surface px-3 text-center text-xl outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" onClick={() => { setResult({ status: "wrong", expected: data.en }); setRevealed(true); }}>
              Je ne sais pas
            </Button>
            <Button className="flex-1" disabled={!input.trim()} onClick={check}>Vérifier</Button>
          </div>
        </div>
      )}

      {effective === "recognize" && !revealed && (
        <Button size="lg" full className="mt-6" onClick={() => setRevealed(true)}>
          Afficher la réponse
        </Button>
      )}

      {result && (
        <p className={cx("mt-4 font-semibold", result.status === "wrong" ? "text-danger" : "text-success")} role="status">
          {result.status === "correct" ? "Correct !" : result.status === "wrong" ? "Pas tout à fait" : "Presque (faute de frappe)"}
        </p>
      )}
      {revealed && back}
      {revealed && <GradeButtons card={card} onGrade={onGrade} suggested={suggested} />}
    </Card>
  );
}

function ExerciseCard({ card, onGrade }: { card: SrsCard; onGrade: (g: Grade) => void }) {
  const [lessonId, exId] = card.ref.split("/");
  const lesson = lessonById.get(lessonId);
  const ex: Exercise | undefined = lesson ? [...lesson.exercises, ...lesson.extra].find((e) => e.id === exId) : undefined;
  if (!lesson || !ex)
    return (
      <Card className="p-6 text-center">
        <p>Cet exercice n'existe plus.</p>
        <Button className="mt-3" onClick={() => { removeCard(card.id); onGrade(3); }}>Passer</Button>
      </Card>
    );
  return (
    <Card className="p-5 sm:p-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">Erreur à retravailler · {lesson.title}</p>
      <ExerciseView exercise={ex} onNext={(r) => onGrade(r.correct ? (r.status === "correct" ? 3 : 2) : 1)} nextLabel="Carte suivante" />
    </Card>
  );
}

/* ---------- Nouveaux mots ---------- */

export function NewWords() {
  const s = useAppState();
  const planId = usePlanId();
  const [ids] = useState(() => nextNewWords(getState(), getState().settings.newWordsPerDay));
  const [i, setI] = useState(0);
  const [added, setAdded] = useState(false);
  const words = ids.map((id) => wordById.get(id)!).filter(Boolean);

  if (!words.length) return <EmptyState title="Tous les mots disponibles pour votre étape sont déjà dans votre carnet" action={<ButtonLink to="/revisions">Retour</ButtonLink>}>Les mots des étapes suivantes se débloquent avec l'examen de fin d'étape. Vous pouvez aussi ajouter vos propres mots dans le carnet.</EmptyState>;

  const finish = () => {
    addWords(ids);
    recordEvent({ type: "words", skill: "vocabulary", xp: words.length * 2 }, planId);
    setAdded(true);
  };

  if (added) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="p-6 text-center">
          <BookmarkPlus size={32} className="mx-auto text-accent" aria-hidden />
          <h1 className="font-display mt-3 text-2xl font-semibold">{words.length} mots ajoutés à votre carnet</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">Première révision maintenant : vous les reverrez dans une minute, dans dix minutes, puis demain.</p>
        </Card>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <ButtonLink to={`/revisions/session${planId ? `?plan=review` : ""}`} size="lg">Les réviser maintenant</ButtonLink>
          <ButtonLink to={planId ? "/" : "/revisions"} size="lg" variant="secondary">{planId ? "Retour au programme" : "Révisions"}</ButtonLink>
        </div>
      </div>
    );
  }

  const w = words[i];
  return (
    <div className="mx-auto max-w-xl">
      <Link to="/revisions" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> Révisions
      </Link>
      <div className="mb-4 flex items-center gap-3">
        <Progress value={i / words.length} label="Découverte des mots" />
        <span className="shrink-0 text-sm text-muted tabular">{i + 1}/{words.length}</span>
      </div>
      <Card className="p-6" key={w.id}>
        <div className="flex items-start justify-between gap-2">
          <Pill tone="accent">{themeById.get(w.theme)?.title}</Pill>
          <Pill>{w.level}</Pill>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <SpeakButton text={w.en} />
          <div>
            <p className="font-display text-4xl font-semibold" lang="en">{w.en}</p>
            <p className="text-muted">{w.ipa} · {w.pos}</p>
          </div>
        </div>
        <p className="mt-4 text-xl">{w.fr}</p>
        <p className="mt-2 text-muted" lang="en">{w.def}</p>
        <div className="mt-4 rounded-xl bg-surface-2 p-3">
          <div className="flex items-start gap-2">
            <SpeakButton text={w.example} size="sm" />
            <div>
              <p lang="en">{w.example}</p>
              <p className="text-sm text-muted">{w.exampleFr}</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted">Répétez le mot et la phrase à voix haute : l'apprentissage actif aide la mémoire.</p>
        <Button full size="lg" className="mt-5" onClick={() => (i + 1 < words.length ? setI(i + 1) : finish())}>
          {i + 1 < words.length ? "Mot suivant" : "Ajouter ces mots à mon carnet"}
        </Button>
      </Card>
      <p className="mt-3 text-center text-sm text-muted">{s.settings.newWordsPerDay} nouveaux mots par jour (modifiable dans les réglages).</p>
    </div>
  );
}

/* ---------- Carnet ---------- */

type Filter = "all" | "due" | "recent" | "mastered" | "forgotten" | "difficult" | "mine";

export function Notebook() {
  const s = useAppState();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [en, setEn] = useState("");
  const [fr, setFr] = useState("");
  const now = Date.now();
  const rows = Object.values(s.cards)
    .filter((c) => c.kind !== "exercise")
    .map((c) => ({ c, d: resolveWord(c) }))
    .filter((x): x is { c: SrsCard; d: NonNullable<ReturnType<typeof resolveWord>> } => !!x.d)
    .filter(({ c }) => {
      const cats = categorize(c, now);
      if (filter === "due") return isDue(c, now);
      if (filter === "mine") return c.kind === "custom";
      if (filter === "all") return true;
      return cats.includes(filter);
    })
    .filter(({ d }) => !q || d.en.toLowerCase().includes(q.toLowerCase()) || d.fr.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.d.en.localeCompare(b.d.en));
  const mistakes = Object.values(s.cards).filter((c) => c.kind === "exercise");

  return (
    <div>
      <Link to="/revisions" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> Révisions
      </Link>
      <PageHeader eyebrow="Carnet" title="Mon vocabulaire" subtitle="Tous vos mots, avec leur état de mémorisation. Ajoutez vos propres mots : ils entrent dans la répétition espacée." />
      <Card className="mb-5 p-4">
        <p className="mb-2 font-medium">Ajouter un mot personnel</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input value={en} onChange={(e) => setEn(e.target.value)} placeholder="Anglais" aria-label="Mot anglais" lang="en" className="h-11 flex-1 rounded-xl border border-line bg-surface px-3" />
          <input value={fr} onChange={(e) => setFr(e.target.value)} placeholder="Français" aria-label="Traduction française" className="h-11 flex-1 rounded-xl border border-line bg-surface px-3" />
          <Button disabled={!en.trim() || !fr.trim()} onClick={() => { addCustomWord(en, fr, "Ajout manuel"); setEn(""); setFr(""); }}>
            <Plus size={16} /> Ajouter
          </Button>
        </div>
      </Card>
      <Tabs label="Filtrer" value={filter} onChange={setFilter} items={[{ id: "all", label: "Tous" }, { id: "due", label: "À revoir" }, { id: "recent", label: "Récents" }, { id: "mastered", label: "Maîtrisés" }, { id: "forgotten", label: "Oubliés" }, { id: "difficult", label: "Difficiles" }, { id: "mine", label: "Mes ajouts" }]} />
      <label className="relative mb-4 block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher" aria-label="Rechercher un mot" className="h-11 w-full rounded-xl border border-line bg-surface pl-9 pr-3" />
      </label>
      {rows.length === 0 ? (
        <EmptyState title="Aucun mot ici pour l'instant">Ajoutez des mots depuis les articles, les écoutes, les thèmes de vocabulaire ou la page « Nouveaux mots ».</EmptyState>
      ) : (
        <Card className="divide-y divide-line">
          {rows.map(({ c, d }) => {
            const cats = categorize(c, now);
            return (
              <div key={c.id} className="flex items-center gap-3 p-3">
                <SpeakButton text={d.en} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium" lang="en">{d.en} {d.word && <span className="font-normal text-muted">{d.word.ipa}</span>}</p>
                  <p className="truncate text-sm text-muted">{d.fr}</p>
                </div>
                <div className="hidden shrink-0 gap-1 sm:flex">
                  {cats.includes("mastered") && <Pill tone="success">maîtrisé</Pill>}
                  {cats.includes("difficult") && <Pill tone="danger">difficile</Pill>}
                  {cats.includes("forgotten") && <Pill tone="warn">oublié</Pill>}
                  {c.state === "new" && <Pill>nouveau</Pill>}
                </div>
                <span className="w-16 shrink-0 text-right text-xs text-muted tabular">{c.state === "new" ? "—" : isDue(c, now) ? "aujourd'hui" : `${Math.max(1, Math.round((c.due - now) / 86_400_000))} j`}</span>
                <button type="button" onClick={() => (c.kind === "custom" ? deleteCustomWord(c.ref) : removeCard(c.id))} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-danger" aria-label={`Retirer ${d.en} du carnet`}>
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </Card>
      )}
      {mistakes.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-lg font-semibold">Erreurs de grammaire en suivi ({mistakes.length})</h2>
          <Card className="divide-y divide-line">
            {mistakes.map((c) => {
              const [lid] = c.ref.split("/");
              return (
                <div key={c.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <span>{lessonById.get(lid)?.title ?? lid}</span>
                  <span className="text-muted tabular">{isDue(c, now) ? "à revoir" : `dans ${Math.max(1, Math.round((c.due - now) / 86_400_000))} j`}</span>
                </div>
              );
            })}
          </Card>
          <p className="mt-2 text-xs text-muted">Leçons : {LESSONS.length}. Les exercices ratés reviennent dans vos révisions jusqu'à être réussis durablement.</p>
        </>
      )}
      <Notice tone="neutral">
        <span className="text-sm">Astuce : le mode de chaque carte évolue — reconnaissance, choix, puis production écrite, phrase à compléter et écoute.</span>
      </Notice>
    </div>
  );
}
