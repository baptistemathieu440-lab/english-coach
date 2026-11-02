import { useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Eye } from "lucide-react";
import { writingById } from "@/content";
import { evaluateText } from "@/lib/evaluate";
import { wordCount } from "@/lib/text";
import { recordAttempt, recordEvent } from "@/state/actions";
import { useAppState } from "@/state/store";
import { usePlanId } from "@/lib/hooks";
import { Button, ButtonLink, Card, LevelPill, Notice, PageHeader, Pill } from "@/components/ui";
import { TextFeedback } from "./Listen";

export function WritingPage() {
  const { id } = useParams();
  const w = writingById.get(id ?? "");
  const s = useAppState();
  const planId = usePlanId();
  const [text, setText] = useState(() => (w && s.writing[w.id]?.text) || "");
  const [ev, setEv] = useState<ReturnType<typeof evaluateText> | null>(null);
  const [model, setModel] = useState(false);
  const [self, setSelf] = useState<Record<string, number>>({});
  if (!w) return <Notice tone="danger">Sujet introuvable.</Notice>;
  const n = wordCount(text);

  const submit = () => {
    const r = evaluateText(text, { minWords: w.minWords, checklist: w.checklist });
    setEv(r);
    recordAttempt("writing", w.id, r.score, { text });
    recordEvent({ type: "writing", skill: "writing", ref: w.id, score: r.score, level: w.level, xp: 20 + Math.round(r.score / 5) }, planId);
  };

  const criteria = ["Mon texte répond à toute la consigne", "Mes idées sont organisées en paragraphes", "J'ai varié les temps et les structures", "Je me suis relu (accords, -s, prépositions)"];

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/parler#ecrit" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> Expression écrite
      </Link>
      <div className="mb-2 flex gap-2">
        <LevelPill level={w.level} />
        <Pill>{w.minWords} mots minimum</Pill>
      </div>
      <PageHeader title={w.title} subtitle={w.instruction} />
      <Card className="mb-4 p-4 text-sm">
        <p className="mb-2 font-medium">Éléments attendus</p>
        <ul className="flex flex-wrap gap-1.5">
          {w.checklist.map((c) => (
            <li key={c.label}>
              <Pill tone="accent" className="!whitespace-normal">
                {c.label} : <span lang="en">{c.any.slice(0, 3).join(", ")}…</span>
              </Pill>
            </li>
          ))}
        </ul>
      </Card>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} lang="en" spellCheck={false} aria-label="Votre texte en anglais" className="w-full rounded-2xl border border-line bg-surface p-4 text-[16px] leading-relaxed outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" placeholder="Write in English…" />
      <div className="mt-1 flex justify-between text-xs text-muted tabular">
        <span>Le texte est enregistré quand vous le faites corriger.</span>
        <span className={n >= w.minWords ? "text-success" : ""}>
          {n} / {w.minWords} mots
        </span>
      </div>
      <Button full size="lg" className="mt-3" disabled={n < 10} onClick={submit}>
        Faire corriger
      </Button>
      {ev && (
        <>
          <TextFeedback ev={ev} />
          <Card className="mt-3 p-4 text-sm">
            <p className="mb-2 font-medium">Auto-évaluation (ce que la correction automatique ne voit pas)</p>
            <ul className="space-y-2">
              {criteria.map((c) => (
                <li key={c} className="flex items-center justify-between gap-2">
                  <span>{c}</span>
                  <span className="flex gap-1">
                    {["Non", "En partie", "Oui"].map((l, i) => (
                      <button key={l} type="button" aria-pressed={self[c] === i} onClick={() => setSelf((x) => ({ ...x, [c]: i }))} className={`h-8 rounded-lg px-2 text-xs ${self[c] === i ? "bg-accent text-accent-fg" : "bg-surface-2"}`}>
                        {l}
                      </button>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
          <button type="button" onClick={() => setModel((m) => !m)} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
            <Eye size={14} /> {model ? "Masquer" : "Voir"} un exemple de réponse
          </button>
          {model && (
            <Card className="mt-2 p-4">
              <p className="whitespace-pre-line text-sm leading-relaxed" lang="en">
                {w.model}
              </p>
            </Card>
          )}
          {planId && (
            <ButtonLink to="/" size="lg" full className="mt-6">
              Retour au programme
            </ButtonLink>
          )}
        </>
      )}
    </div>
  );
}
