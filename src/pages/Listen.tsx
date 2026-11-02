import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Check, Eye, Headphones, PenLine, Play, Snail, X } from "lucide-react";
import { LISTENING, listeningById } from "@/content";
import type { Accent, ListeningItem } from "@/content/types";
import { ACCENT_LABEL, speak } from "@/lib/speech";
import { evaluateText } from "@/lib/evaluate";
import { normalize, wordOverlap } from "@/lib/text";
import { recordAttempt, recordEvent } from "@/state/actions";
import { getState, useAppState } from "@/state/store";
import { usePlanId } from "@/lib/hooks";
import { ClickableText, DialoguePlayer } from "@/components/media";
import { Button, ButtonLink, Card, EmptyState, LevelPill, Notice, PageHeader, Pill, Select, cx } from "@/components/ui";
import { recommendedLevel } from "@/lib/plan";

export function durationMin(it: ListeningItem): number {
  const words = it.lines.reduce((a, l) => a + l.en.split(/\s+/).length, 0);
  return Math.max(1, Math.round(words / 140));
}

export function ListenLibrary() {
  const s = useAppState();
  const [level, setLevel] = useState("all");
  const [theme, setTheme] = useState("all");
  const [accent, setAccent] = useState("all");
  const [dur, setDur] = useState("all");
  const themes = [...new Set(LISTENING.map((l) => l.theme))];
  const list = LISTENING.filter(
    (l) =>
      (level === "all" || l.level === level) &&
      (theme === "all" || l.theme === theme) &&
      (accent === "all" || l.speakers.some((x) => x.accent === accent)) &&
      (dur === "all" || (dur === "short" ? durationMin(l) <= 1 : durationMin(l) > 1)),
  );
  const rec = recommendedLevel(s, "listening");
  return (
    <div>
      <PageHeader eyebrow="Écouter" title="Compréhension orale" subtitle={`Dialogues originaux à écouter sans texte, puis questions, transcription, traduction et dictée. Niveau conseillé aujourd'hui : ${rec}.`} />
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Select label="Niveau" value={level} onChange={setLevel} options={[{ value: "all", label: "Tous" }, ...["A2", "B1", "B2"].map((x) => ({ value: x, label: x }))]} />
        <Select label="Thème" value={theme} onChange={setTheme} options={[{ value: "all", label: "Tous" }, ...themes.map((x) => ({ value: x, label: x }))]} />
        <Select label="Accent" value={accent} onChange={setAccent} options={[{ value: "all", label: "Tous" }, ...(Object.keys(ACCENT_LABEL) as Accent[]).map((x) => ({ value: x, label: ACCENT_LABEL[x] }))]} />
        <Select label="Durée" value={dur} onChange={setDur} options={[{ value: "all", label: "Toutes" }, { value: "short", label: "≈ 1 min" }, { value: "long", label: "2 min et plus" }]} />
      </div>
      {list.length === 0 ? (
        <EmptyState title="Aucune écoute ne correspond à ces filtres" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((l) => {
            const a = s.listening[l.id];
            return (
              <Link key={l.id} to={`/ecouter/${l.id}`} className="rounded-2xl border border-line bg-surface p-4 hover:border-accent">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium" lang="en">
                    {l.title}
                  </p>
                  <LevelPill level={l.level} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  {l.theme} · ≈ {durationMin(l)} min · {"●".repeat(l.difficulty)}
                  <span className="opacity-30">{"●".repeat(3 - l.difficulty)}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {[...new Set(l.speakers.map((x) => x.accent))].map((ac) => (
                    <Pill key={ac}>{ACCENT_LABEL[ac]}</Pill>
                  ))}
                  {a && <Pill tone={a.best >= 70 ? "success" : "warn"}>{a.best} %</Pill>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ListenItemPage() {
  const { id } = useParams();
  const it = listeningById.get(id ?? "");
  const planId = usePlanId();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState<number | null>(null);
  const [showFr, setShowFr] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryScore, setSummaryScore] = useState<ReturnType<typeof evaluateText> | null>(null);
  if (!it) return <Notice tone="danger">Écoute introuvable.</Notice>;
  const allAnswered = it.questions.every((q) => answers[q.id] !== undefined);
  const transcriptOpen = checked !== null || reveal;

  const check = () => {
    const ok = it.questions.filter((q) => answers[q.id] === q.answer).length;
    const score = Math.round((ok / it.questions.length) * 100);
    setChecked(score);
    recordAttempt("listening", it.id, score);
    recordEvent({ type: "listening", skill: "listening", ref: it.id, score, level: it.level, xp: ok * 8 }, planId);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/ecouter" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> Bibliothèque audio
      </Link>
      <PageHeader eyebrow={`${it.theme} · ${it.level}`} title={it.title} subtitle="1. Écoutez sans lire (deux fois si besoin). 2. Répondez. 3. Consultez la transcription, la traduction et le dictionnaire." />

      <Card className="p-4 sm:p-5">
        <DialoguePlayer item={it} showText={false} />
      </Card>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Questions de compréhension</h2>
        <ol className="space-y-5">
          {it.questions.map((q, n) => (
            <li key={q.id}>
              <p className="mb-2 font-medium" lang="en">
                {n + 1}. {q.prompt}
              </p>
              <div className="grid gap-2">
                {q.options.map((o, i) => {
                  const picked = answers[q.id] === i;
                  const right = checked !== null && i === q.answer;
                  const wrong = checked !== null && picked && i !== q.answer;
                  return (
                    <button key={i} type="button" disabled={checked !== null} onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))} aria-pressed={picked} className={cx("flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left", right ? "border-success bg-success-soft" : wrong ? "border-danger bg-danger-soft" : picked ? "border-accent bg-accent-soft" : "border-line bg-surface hover:bg-surface-2")} lang="en">
                      <span className="flex-1">{o}</span>
                      {right && <Check size={16} className="text-success" aria-label="Bonne réponse" />}
                      {wrong && <X size={16} className="text-danger" aria-label="Incorrect" />}
                    </button>
                  );
                })}
              </div>
              {checked !== null && <p className="mt-1 text-sm text-muted">{q.explanation}</p>}
            </li>
          ))}
        </ol>
        {checked === null ? (
          <Button full size="lg" className="mt-5" disabled={!allAnswered} onClick={check}>
            Valider mes réponses
          </Button>
        ) : (
          <Notice tone={checked >= 70 ? "success" : "warn"} title={`Score : ${checked} %`}>
            {checked >= 70 ? "Bonne compréhension. Lisez maintenant la transcription pour repérer ce qui vous a échappé." : "Réécoutez en lisant la transcription, puis tentez la dictée : c'est le meilleur moyen de progresser à l'oral."}
          </Notice>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Transcription</h2>
          {transcriptOpen && (
            <Button size="sm" variant="secondary" onClick={() => setShowFr((v) => !v)}>
              {showFr ? "Masquer la traduction" : "Afficher la traduction"}
            </Button>
          )}
        </div>
        {transcriptOpen ? (
          <Card className="p-4">
            <p className="mb-3 text-xs text-muted">Touchez un mot pour sa traduction et l'ajouter à votre carnet.</p>
            <ol className="space-y-3">
              {it.lines.map((l, i) => (
                <li key={i}>
                  <div className="flex items-start gap-2">
                    <button type="button" onClick={() => void speak(l.en, { accent: it.speakers[l.s].accent, gender: it.speakers[l.s].voice, rate: getState().settings.speechRate })} className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-accent" aria-label="Écouter cette réplique">
                      <Play size={12} />
                    </button>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-muted">{it.speakers[l.s].name}</p>
                      <ClickableText text={l.en} source={it.title} />
                      {showFr && <p className="text-sm text-muted">{l.fr}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        ) : (
          <Card className="p-5 text-center">
            <p className="text-sm text-muted">La transcription s'affiche après vos réponses, pour entraîner vraiment l'oreille.</p>
            <button type="button" onClick={() => setReveal(true)} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent">
              <Eye size={14} /> L'afficher quand même
            </button>
          </Card>
        )}
      </section>

      {transcriptOpen && (
        <>
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">Vocabulaire clé</h2>
            <div className="flex flex-wrap gap-2">
              {it.glossary.map((g) => (
                <span key={g.term} className="rounded-xl bg-surface px-3 py-2 text-sm">
                  <strong lang="en">{g.term}</strong> — {g.fr}
                </span>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="mb-1 text-lg font-semibold">Résumé</h2>
            <p className="mb-2 text-sm text-muted">{it.summaryPrompt} (en anglais)</p>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} lang="en" spellCheck={false} aria-label="Votre résumé en anglais" className="w-full rounded-2xl border border-line bg-surface p-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
            <Button
              className="mt-2"
              variant="secondary"
              disabled={summary.trim().split(/\s+/).length < 8}
              onClick={() => {
                const ev = evaluateText(summary, { minWords: 25 });
                setSummaryScore(ev);
                recordAttempt("listening", it.id, getState().listening[it.id]?.last ?? 0, { summary });
                recordEvent({ type: "writing", skill: "writing", ref: `summary:${it.id}`, score: ev.score, level: it.level, xp: 10 });
              }}
            >
              Faire corriger mon résumé
            </Button>
            {summaryScore && <TextFeedback ev={summaryScore} />}
          </section>

          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <ButtonLink to={`/ecouter/${it.id}/dictee`} size="lg">
              <PenLine size={18} /> Faire la dictée
            </ButtonLink>
            {planId && (
              <ButtonLink to="/" size="lg" variant="secondary">
                Retour au programme
              </ButtonLink>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function TextFeedback({ ev }: { ev: ReturnType<typeof evaluateText> }) {
  return (
    <Card className="mt-3 p-4 text-sm">
      <p className="font-semibold">
        Estimation : <span className="tabular">{ev.score} / 100</span>
      </p>
      <ul className="mt-2 grid gap-1 sm:grid-cols-2">
        {ev.parts.map((p) => (
          <li key={p.label} className="flex justify-between gap-2 rounded-lg bg-surface-2 px-2 py-1">
            <span>{p.label}</span>
            <span className="tabular">
              {p.score}/{p.max}
            </span>
          </li>
        ))}
      </ul>
      {ev.checklist.length > 0 && (
        <ul className="mt-3 space-y-1">
          {ev.checklist.map((c) => (
            <li key={c.label} className="flex items-center gap-2">
              {c.ok ? <Check size={14} className="text-success" aria-label="Présent" /> : <X size={14} className="text-danger" aria-label="Absent" />}
              {c.label}
            </li>
          ))}
        </ul>
      )}
      {ev.issues.length > 0 ? (
        <div className="mt-3">
          <p className="font-medium">Erreurs repérées ({ev.issues.length})</p>
          <ul className="mt-1 space-y-1">
            {ev.issues.map((i) => (
              <li key={i.id + i.start}>
                <span className="text-danger line-through" lang="en">{i.found}</span>
                {i.suggestion && (
                  <>
                    {" → "}
                    <strong lang="en">{i.suggestion}</strong>
                  </>
                )}{" "}
                — {i.message}
              </li>
            ))}
          </ul>
          <p className="mt-2 font-medium">Version corrigée</p>
          <p className="whitespace-pre-line" lang="en">
            {ev.corrected}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-muted">Aucune erreur fréquente détectée. Le correcteur intégré ne repère pas tout : relisez accords, temps et prépositions.</p>
      )}
      <p className="mt-2 text-xs text-muted">Connecteurs utilisés : {ev.connectors.length ? ev.connectors.join(", ") : "aucun"}.</p>
    </Card>
  );
}

export function DictationPage() {
  const { id } = useParams();
  const it = listeningById.get(id ?? "");
  const planId = usePlanId();
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [results, setResults] = useState<number[]>([]);
  const [shown, setShown] = useState<ReturnType<typeof wordOverlap> | null>(null);
  const speaker = useMemo(() => {
    if (!it) return null;
    const line = it.lines.find((l) => normalize(l.en).includes(normalize(it.dictation[i] ?? "")));
    return it.speakers[line?.s ?? 0];
  }, [it, i]);
  if (!it || !speaker) return <Notice tone="danger">Dictée introuvable.</Notice>;
  const sentence = it.dictation[i];
  const finished = results.length === it.dictation.length && !shown;
  const play = (slow = false) => void speak(sentence, { accent: speaker.accent, gender: speaker.voice, rate: slow ? 0.65 : getState().settings.speechRate });

  const check = () => {
    const r = wordOverlap(sentence, value);
    setShown(r);
    const next = [...results, r.score];
    setResults(next);
    recordEvent({ type: "dictation", skill: "listening", ref: `${it.id}#${i}`, score: r.score, level: it.level, xp: Math.round(r.score / 20) });
    if (next.length === it.dictation.length) {
      const avg = Math.round(next.reduce((a, b) => a + b, 0) / next.length);
      recordAttempt("listening", it.id, getState().listening[it.id]?.best ?? 0, { dictation: Math.max(avg, getState().listening[it.id]?.dictation ?? 0) });
      if (planId) recordEvent({ type: "dictation", skill: "listening", ref: it.id, xp: 5 }, planId);
    }
  };

  if (finished) {
    const avg = Math.round(results.reduce((a, b) => a + b, 0) / results.length);
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-6 text-center">
          <Headphones size={32} className="mx-auto text-accent" aria-hidden />
          <p className="mt-3 text-5xl font-semibold tabular">{avg} %</p>
          <p className="mt-1 text-muted">de mots correctement écrits</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted">{avg >= 80 ? "Très bonne oreille !" : "Les petits mots (articles, auxiliaires, terminaisons) sont les plus difficiles à entendre : réécoutez au ralenti en lisant la transcription."}</p>
        </Card>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <ButtonLink to={planId ? "/" : "/ecouter"} size="lg">
            {planId ? "Retour au programme" : "Autres écoutes"}
          </ButtonLink>
          <ButtonLink to={`/ecouter/${it.id}`} size="lg" variant="secondary">
            Revoir le dialogue
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to={`/ecouter/${it.id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> {it.title}
      </Link>
      <PageHeader eyebrow={`Dictée · phrase ${i + 1}/${it.dictation.length}`} title="Écrivez ce que vous entendez" subtitle="Écoutez autant de fois que nécessaire, au ralenti si besoin. La ponctuation et les majuscules ne comptent pas." />
      <Card className="p-5">
        <div className="mb-4 flex gap-2">
          <Button onClick={() => play()}>
            <Play size={16} /> Écouter
          </Button>
          <Button variant="secondary" onClick={() => play(true)}>
            <Snail size={16} /> Au ralenti
          </Button>
        </div>
        <textarea value={value} onChange={(e) => setValue(e.target.value)} disabled={!!shown} rows={2} lang="en" spellCheck={false} autoCapitalize="sentences" aria-label="Ce que vous entendez" className="w-full rounded-xl border border-line bg-surface p-3 text-lg outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" placeholder="Type what you hear…" />
        {!shown ? (
          <Button full className="mt-3" disabled={!value.trim()} onClick={check}>
            Vérifier
          </Button>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-muted">Correction ({shown.score} %) :</p>
            <p className="mt-1 text-lg" lang="en">
              {shown.words.map((w, k) => (
                <span key={k} className={cx("mr-1 rounded px-0.5", w.ok ? "" : "bg-danger-soft text-danger underline decoration-2")}>
                  {w.w}
                </span>
              ))}
            </p>
            <p className="mt-1 text-xs text-muted">Les mots soulignés manquaient ou étaient mal orthographiés.</p>
            <Button
              full
              className="mt-4"
              onClick={() => {
                setShown(null);
                setValue("");
                if (i + 1 < it.dictation.length) setI(i + 1);
              }}
            >
              {i + 1 < it.dictation.length ? "Phrase suivante" : "Voir le résultat"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
