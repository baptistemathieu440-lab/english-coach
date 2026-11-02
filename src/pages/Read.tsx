import { useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Check, Clock, X } from "lucide-react";
import { ARTICLES, articleById } from "@/content";
import type { Article } from "@/content/types";
import { evaluateText } from "@/lib/evaluate";
import { recordAttempt, recordEvent } from "@/state/actions";
import { getState, useAppState } from "@/state/store";
import { usePlanId } from "@/lib/hooks";
import { recommendedLevel } from "@/lib/plan";
import { ClickableText } from "@/components/media";
import { Button, ButtonLink, Card, EmptyState, LevelPill, Notice, PageHeader, Pill, Select, cx } from "@/components/ui";
import { TextFeedback } from "./Listen";

export function readingTime(a: Article): number {
  return Math.max(1, Math.round(a.paragraphs.join(" ").split(/\s+/).length / 120));
}

export function ReadLibrary() {
  const s = useAppState();
  const [level, setLevel] = useState("all");
  const [cat, setCat] = useState("all");
  const cats = [...new Set(ARTICLES.map((a) => a.category))];
  const list = ARTICLES.filter((a) => (level === "all" || a.level === level) && (cat === "all" || a.category === cat));
  return (
    <div>
      <PageHeader eyebrow="Lire" title="Articles et compréhension écrite" subtitle={`Textes originaux sur l'économie, la société, la technologie et l'entreprise. Touchez un mot inconnu pour le traduire et l'enregistrer. Niveau conseillé : ${recommendedLevel(s, "reading")}.`} />
      <div className="mb-5 grid grid-cols-2 gap-2 sm:max-w-md">
        <Select label="Niveau" value={level} onChange={setLevel} options={[{ value: "all", label: "Tous" }, ...["A2", "B1", "B2"].map((x) => ({ value: x, label: x }))]} />
        <Select label="Catégorie" value={cat} onChange={setCat} options={[{ value: "all", label: "Toutes" }, ...cats.map((x) => ({ value: x, label: x }))]} />
      </div>
      {list.length === 0 ? (
        <EmptyState title="Aucun article ne correspond" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((a) => (
            <Link key={a.id} to={`/lire/${a.id}`} className="rounded-2xl border border-line bg-surface p-4 hover:border-accent">
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-lg font-semibold leading-snug" lang="en">
                  {a.title}
                </p>
                <LevelPill level={a.level} />
              </div>
              <p className="mt-1 text-sm text-muted">{a.intro}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Pill>{a.category}</Pill>
                <Pill>
                  <Clock size={12} /> {readingTime(a)} min
                </Pill>
                {s.reading[a.id] && <Pill tone={s.reading[a.id].best >= 70 ? "success" : "warn"}>{s.reading[a.id].best} %</Pill>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ArticlePage() {
  const { id } = useParams();
  const a = articleById.get(id ?? "");
  const planId = usePlanId();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [score, setScore] = useState<number | null>(null);
  const [summary, setSummary] = useState("");
  const [ev, setEv] = useState<ReturnType<typeof evaluateText> | null>(null);
  if (!a) return <Notice tone="danger">Article introuvable.</Notice>;
  const all = a.questions.every((q) => answers[q.id] !== undefined);

  const check = () => {
    const ok = a.questions.filter((q) => answers[q.id] === q.answer).length;
    const sc = Math.round((ok / a.questions.length) * 100);
    setScore(sc);
    recordAttempt("reading", a.id, sc);
    recordEvent({ type: "reading", skill: "reading", ref: a.id, score: sc, level: a.level, xp: ok * 8 }, planId);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/lire" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> Tous les articles
      </Link>
      <div className="mb-3 flex flex-wrap gap-2">
        <LevelPill level={a.level} />
        <Pill>{a.category}</Pill>
        <Pill>
          <Clock size={12} /> {readingTime(a)} min de lecture
        </Pill>
      </div>
      <h1 className="font-display text-[32px] leading-tight font-semibold" lang="en">
        {a.title}
      </h1>
      <p className="mt-2 text-sm text-muted">{a.intro} · Texte original rédigé pour l'application.</p>
      <article className="mt-6 space-y-4 text-[17px]">
        {a.paragraphs.map((p, i) => (
          <ClickableText key={i} text={p} source={a.title} />
        ))}
      </article>
      <p className="mt-3 text-xs text-muted">Astuce : touchez n'importe quel mot pour le traduire et l'ajouter à votre carnet.</p>

      <Card className="mt-6 p-4">
        <h2 className="mb-2 font-semibold">Vocabulaire</h2>
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          {a.glossary.map((g) => (
            <li key={g.term}>
              <strong lang="en">{g.term}</strong> — {g.fr}
            </li>
          ))}
        </ul>
      </Card>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Compréhension</h2>
        <ol className="space-y-5">
          {a.questions.map((q, n) => (
            <li key={q.id}>
              <p className="mb-2 font-medium" lang="en">
                {n + 1}. {q.prompt}
              </p>
              <div className="grid gap-2">
                {q.options.map((o, i) => {
                  const picked = answers[q.id] === i;
                  const right = score !== null && i === q.answer;
                  const wrong = score !== null && picked && i !== q.answer;
                  return (
                    <button key={i} type="button" disabled={score !== null} aria-pressed={picked} onClick={() => setAnswers((x) => ({ ...x, [q.id]: i }))} className={cx("flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left", right ? "border-success bg-success-soft" : wrong ? "border-danger bg-danger-soft" : picked ? "border-accent bg-accent-soft" : "border-line bg-surface hover:bg-surface-2")} lang="en">
                      <span className="flex-1">{o}</span>
                      {right && <Check size={16} className="text-success" aria-label="Bonne réponse" />}
                      {wrong && <X size={16} className="text-danger" aria-label="Incorrect" />}
                    </button>
                  );
                })}
              </div>
              {score !== null && <p className="mt-1 text-sm text-muted">{q.explanation}</p>}
            </li>
          ))}
        </ol>
        {score === null ? (
          <Button full size="lg" className="mt-5" disabled={!all} onClick={check}>
            Valider mes réponses
          </Button>
        ) : (
          <Notice tone={score >= 70 ? "success" : "warn"} title={`Score : ${score} %`}>
            {score >= 70 ? "Bonne compréhension." : "Relisez les passages indiqués dans les explications."}
          </Notice>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-1 text-lg font-semibold">Résumé en anglais</h2>
        <p className="mb-2 text-sm text-muted" lang="en">
          {a.summaryPrompt}
        </p>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={5} lang="en" spellCheck={false} aria-label="Votre résumé" className="w-full rounded-2xl border border-line bg-surface p-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
        <Button
          variant="secondary"
          className="mt-2"
          disabled={summary.trim().split(/\s+/).length < 10}
          onClick={() => {
            const r = evaluateText(summary, { minWords: a.level === "B2" ? 70 : 35 });
            setEv(r);
            recordAttempt("reading", a.id, getState().reading[a.id]?.last ?? 0, { summary });
            recordEvent({ type: "writing", skill: "writing", ref: `summary:${a.id}`, score: r.score, level: a.level, xp: 10 });
          }}
        >
          Faire corriger mon résumé
        </Button>
        {ev && <TextFeedback ev={ev} />}
      </section>

      {planId && score !== null && (
        <ButtonLink to="/" size="lg" full className="mt-6">
          Retour au programme
        </ButtonLink>
      )}
    </div>
  );
}
