import { useMemo, useRef, useState, type ReactNode } from "react";
import { Check, CornerDownLeft, Lightbulb, RotateCcw, X } from "lucide-react";
import type { Exercise } from "@/content/types";
import { containsTerm, matchAnswer, normalize, shuffle, wordCount, type MatchStatus } from "@/lib/text";
import { checkText, correctText, type Issue } from "@/lib/checker";
import { Button, Pill, SpeakButton, cx } from "./ui";

export interface ExerciseResult {
  correct: boolean;
  status: MatchStatus | "partial";
}

const KIND_LABEL: Record<Exercise["kind"], string> = {
  mcq: "Choisissez la bonne réponse",
  gap: "Complétez la phrase",
  translate: "Traduisez",
  order: "Remettez les mots dans l'ordre",
  error: "Trouvez et corrigez l'erreur",
  build: "Construisez votre phrase",
};

interface Feedback {
  result: ExerciseResult;
  expected?: string;
  english?: string;
  extra?: ReactNode;
}

export function ExerciseView({ exercise, onNext, nextLabel = "Continuer" }: { exercise: Exercise; onNext: (r: ExerciseResult) => void; nextLabel?: string }) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const done = (f: Feedback) => {
    setFeedback(f);
    setTimeout(() => nextRef.current?.focus(), 30);
  };

  return (
    <div className="animate-pop" key={exercise.id}>
      <p className="mb-3 text-sm font-medium text-muted">{exercise.kind === "translate" ? (exercise.direction === "fr-en" ? "Traduisez en anglais" : "Traduisez en français") : KIND_LABEL[exercise.kind]}</p>
      {exercise.kind === "mcq" && <Mcq ex={exercise} locked={!!feedback} onDone={done} />}
      {exercise.kind === "gap" && <Gap ex={exercise} locked={!!feedback} onDone={done} />}
      {exercise.kind === "translate" && <Translate ex={exercise} locked={!!feedback} onDone={done} />}
      {exercise.kind === "order" && <Order ex={exercise} locked={!!feedback} onDone={done} />}
      {exercise.kind === "error" && <ErrorFind ex={exercise} locked={!!feedback} onDone={done} />}
      {exercise.kind === "build" && <Build ex={exercise} locked={!!feedback} onDone={done} />}

      {feedback && (
        <div
          className={cx("mt-5 rounded-2xl border p-4", feedback.result.correct ? "border-success/30 bg-success-soft" : "border-danger/30 bg-danger-soft")}
          role="status"
          aria-live="polite"
        >
          <p className={cx("flex items-center gap-2 font-semibold", feedback.result.correct ? "text-success" : "text-danger")}>
            {feedback.result.correct ? <Check size={18} aria-hidden /> : <X size={18} aria-hidden />}
            {feedback.result.status === "correct" && "Correct !"}
            {feedback.result.status === "typo" && "Correct, avec une petite faute de frappe"}
            {feedback.result.status === "accent" && "Correct — attention aux accents"}
            {feedback.result.status === "partial" && "Presque : à retravailler"}
            {feedback.result.status === "wrong" && "Pas tout à fait"}
          </p>
          {feedback.expected && (
            <div className="mt-2 flex items-start gap-2">
              <p className="min-w-0 text-ink">
                <span className="text-muted">{feedback.result.correct ? "Réponse : " : "Bonne réponse : "}</span>
                <span className="font-medium" lang={feedback.english ? "en" : undefined}>
                  {feedback.expected}
                </span>
              </p>
              {feedback.english && <SpeakButton text={feedback.english} size="sm" />}
            </div>
          )}
          {feedback.extra}
          <p className="mt-2 flex gap-2 text-sm text-ink/90">
            <Lightbulb size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden />
            <span>{exercise.explanation}</span>
          </p>
          <Button ref={nextRef} className="mt-4" full onClick={() => onNext(feedback.result)}>
            {nextLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

type Done = (f: Feedback) => void;

function CheckBar({ disabled, onCheck, locked }: { disabled?: boolean; onCheck: () => void; locked: boolean }) {
  if (locked) return null;
  return (
    <Button className="mt-4" full disabled={disabled} onClick={onCheck}>
      Vérifier <CornerDownLeft size={16} aria-hidden className="opacity-60" />
    </Button>
  );
}

function statusResult(status: MatchStatus): ExerciseResult {
  return { correct: status !== "wrong", status };
}

function Mcq({ ex, locked, onDone }: { ex: Extract<Exercise, { kind: "mcq" }>; locked: boolean; onDone: Done }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div>
      <p className="mb-4 text-xl font-medium" lang="en">
        {ex.prompt}
      </p>
      <div className="grid gap-2">
        {ex.options.map((o, i) => {
          const isAnswer = i === ex.answer;
          const state = picked === null ? "idle" : isAnswer ? "right" : picked === i ? "wrong" : "idle";
          return (
            <button
              key={i}
              type="button"
              disabled={locked}
              onClick={() => {
                setPicked(i);
                onDone({ result: statusResult(i === ex.answer ? "correct" : "wrong"), expected: ex.options[ex.answer], english: /[a-z]/i.test(ex.options[ex.answer]) && !ex.options[ex.answer].includes("—") ? fillGap(ex.prompt, ex.options[ex.answer]) : undefined });
              }}
              className={cx(
                "flex min-h-12 items-center gap-3 rounded-xl border px-4 py-2 text-left text-[15px] transition-colors",
                state === "idle" && "border-line bg-surface hover:border-accent hover:bg-accent-soft disabled:hover:bg-surface disabled:hover:border-line",
                state === "right" && "border-success bg-success-soft",
                state === "wrong" && "border-danger bg-danger-soft",
              )}
              lang="en"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line text-xs text-muted" aria-hidden>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="min-w-0">{o}</span>
              {state === "right" && <Check size={18} className="ml-auto text-success" aria-label="bonne réponse" />}
              {state === "wrong" && <X size={18} className="ml-auto text-danger" aria-label="réponse choisie, incorrecte" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function fillGap(prompt: string, answer: string): string {
  return prompt.includes("___") ? prompt.replace(/_{3}/, answer).replace(/\s*\([^)]*\)/g, "") : answer;
}

function Gap({ ex, locked, onDone }: { ex: Extract<Exercise, { kind: "gap" }>; locked: boolean; onDone: Done }) {
  const parts = ex.prompt.split("___");
  const [values, setValues] = useState<string[]>(parts.slice(1).map(() => ""));
  const filled = values.every((v) => v.trim());
  const check = () => {
    const joined = values.map((v) => v.trim()).join(" ");
    const r = matchAnswer(joined, ex.answers);
    const pieces = r.expected.split(" ");
    let sentence = ex.prompt;
    if (parts.length === 2) sentence = parts[0] + r.expected + parts[1];
    else {
      // Répartit les mots attendus entre les trous (le dernier trou prend le reste).
      sentence = parts.reduce((acc, p, i) => (i === 0 ? p : acc + (i === parts.length - 1 ? pieces.slice(i - 1).join(" ") : pieces[i - 1]) + p), "");
    }
    const clean = sentence.replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
    onDone({ result: statusResult(r.status), expected: r.expected, english: clean });
  };
  return (
    <div>
      <p className="text-xl leading-[2.4] font-medium" lang="en">
        {parts.map((p, i) => (
          <span key={i}>
            {p}
            {i < parts.length - 1 && (
              <input
                aria-label={`Trou ${i + 1}`}
                value={values[i]}
                disabled={locked}
                autoFocus={i === 0}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                onChange={(e) => setValues((v) => v.map((x, j) => (j === i ? e.target.value : x)))}
                onKeyDown={(e) => e.key === "Enter" && filled && !locked && check()}
                className="mx-1 inline-block h-10 w-36 rounded-lg border-b-2 border-accent bg-accent-soft px-2 text-center text-lg font-medium text-ink outline-none focus:ring-2 focus:ring-accent sm:w-44"
              />
            )}
          </span>
        ))}
      </p>
      {ex.hint && <p className="mt-2 text-sm text-muted">Indice : {ex.hint}</p>}
      <CheckBar disabled={!filled} onCheck={check} locked={locked} />
    </div>
  );
}

function Translate({ ex, locked, onDone }: { ex: Extract<Exercise, { kind: "translate" }>; locked: boolean; onDone: Done }) {
  const [v, setV] = useState("");
  const toEn = ex.direction === "fr-en";
  const check = () => {
    const r = matchAnswer(v, ex.answers, toEn ? "en" : "fr");
    onDone({ result: statusResult(r.status), expected: r.expected, english: toEn ? r.expected : undefined });
  };
  return (
    <div>
      <div className="mb-4 flex items-start gap-3">
        <p className="text-xl font-medium" lang={toEn ? "fr" : "en"}>
          {ex.source}
        </p>
        {!toEn && <SpeakButton text={ex.source} size="sm" />}
      </div>
      <textarea
        aria-label={toEn ? "Votre traduction en anglais" : "Votre traduction en français"}
        value={v}
        disabled={locked}
        autoFocus
        rows={2}
        lang={toEn ? "en" : "fr"}
        autoCapitalize="sentences"
        spellCheck={false}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (v.trim() && !locked) check();
          }
        }}
        className="w-full resize-none rounded-xl border border-line bg-surface p-3 text-lg outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        placeholder={toEn ? "Écrivez en anglais…" : "Écrivez en français…"}
      />
      <CheckBar disabled={!v.trim()} onCheck={check} locked={locked} />
    </div>
  );
}

function Order({ ex, locked, onDone }: { ex: Extract<Exercise, { kind: "order" }>; locked: boolean; onDone: Done }) {
  const pool = useMemo(() => {
    const items = ex.words.map((w, i) => ({ w, i }));
    let s = shuffle(items, 0.37 + ex.words.length / 100);
    if (s.every((x, k) => x.i === k)) s = [...s.slice(1), s[0]];
    return s;
  }, [ex]);
  const [chosen, setChosen] = useState<number[]>([]);
  const sentence = chosen.map((i) => ex.words[i]).join(" ");
  const correctSentence = ex.words.join(" ");
  const check = () => {
    const ok = [correctSentence, ...(ex.alternatives ?? [])].some((a) => normalize(a) === normalize(sentence));
    onDone({ result: statusResult(ok ? "correct" : "wrong"), expected: correctSentence + (/[?]$/.test(correctSentence) ? "" : ""), english: correctSentence, extra: ex.translation ? <p className="mt-1 text-sm text-muted">{ex.translation}</p> : undefined });
  };
  return (
    <div>
      <div className="mb-4 flex min-h-16 flex-wrap content-start gap-2 rounded-xl border-2 border-dashed border-line p-3" aria-label="Votre phrase" lang="en">
        {chosen.length === 0 && <span className="self-center text-sm text-muted">Touchez les mots dans l'ordre…</span>}
        {chosen.map((i) => (
          <button key={i} type="button" disabled={locked} onClick={() => setChosen((c) => c.filter((x) => x !== i))} className="h-10 rounded-lg border border-accent bg-accent-soft px-3 font-medium text-ink">
            {ex.words[i]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" lang="en">
        {pool.map(({ w, i }) => (
          <button
            key={i}
            type="button"
            disabled={locked || chosen.includes(i)}
            onClick={() => setChosen((c) => [...c, i])}
            className={cx("h-10 rounded-lg border border-line bg-surface px-3 font-medium transition-opacity", chosen.includes(i) && "opacity-25")}
          >
            {w}
          </button>
        ))}
      </div>
      {!locked && chosen.length > 0 && (
        <button type="button" onClick={() => setChosen([])} className="mt-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <RotateCcw size={14} aria-hidden /> Recommencer
        </button>
      )}
      <CheckBar disabled={chosen.length !== ex.words.length} onCheck={check} locked={locked} />
    </div>
  );
}

function ErrorFind({ ex, locked, onDone }: { ex: Extract<Exercise, { kind: "error" }>; locked: boolean; onDone: Done }) {
  const tokens = useMemo(() => {
    const out: { text: string; start: number; end: number }[] = [];
    const re = /\S+/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(ex.sentence))) out.push({ text: m[0], start: m.index, end: m.index + m[0].length });
    return out;
  }, [ex]);
  const wrongStart = ex.sentence.indexOf(ex.wrong);
  const wrongEnd = wrongStart + ex.wrong.length;
  const [sel, setSel] = useState<number | null>(null);
  const [fix, setFix] = useState("");
  const inWrong = (i: number) => tokens[i].start < wrongEnd && tokens[i].end > wrongStart;
  const fixed = (c: string) => {
    const rep = normalize(c) === "" || c === "∅" ? "" : c;
    return (ex.sentence.slice(0, wrongStart) + rep + ex.sentence.slice(wrongEnd)).replace(/\s+/g, " ").replace(/\s+([,.?!])/g, "$1").trim();
  };
  const submit = (value: string) => {
    const correction = ex.corrections.find((c) => normalize(c) !== "" && c !== "∅" && c !== "(supprimer)") ?? "-";
    const located = sel !== null && inWrong(sel);
    const r = matchAnswer(value, ex.corrections);
    const ok = located && r.status !== "wrong";
    const right = fixed(correction);
    onDone({
      result: { correct: ok, status: ok ? r.status : "wrong" },
      expected: right,
      english: right,
      extra: !located ? <p className="mt-1 text-sm">Le mot fautif était : <strong lang="en">{ex.wrong}</strong></p> : undefined,
    });
  };
  return (
    <div>
      <p className="mb-2 text-sm text-muted">1. Touchez le mot incorrect. 2. Écrivez la correction.</p>
      <p className="mb-4 flex flex-wrap gap-x-1 gap-y-2 text-xl font-medium" lang="en">
        {tokens.map((t, i) => (
          <button
            key={i}
            type="button"
            disabled={locked}
            onClick={() => setSel(i)}
            aria-pressed={sel === i}
            className={cx("rounded-md px-1.5 py-0.5 transition-colors", sel === i ? "bg-warn-soft ring-2 ring-warn" : "hover:bg-surface-2")}
          >
            {t.text}
          </button>
        ))}
      </p>
      {sel !== null && !locked && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            aria-label="Correction"
            value={fix}
            autoFocus
            autoCapitalize="off"
            spellCheck={false}
            onChange={(e) => setFix(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fix.trim() && submit(fix)}
            placeholder={`Remplacer « ${tokens[sel].text} » par…`}
            className="h-11 flex-1 rounded-xl border border-line bg-surface px-3 text-lg outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            lang="en"
          />
          <Button variant="secondary" onClick={() => submit("-")}>
            Ce mot est en trop
          </Button>
        </div>
      )}
      <CheckBar disabled={sel === null || !fix.trim()} onCheck={() => submit(fix)} locked={locked} />
    </div>
  );
}

function Build({ ex, locked, onDone }: { ex: Extract<Exercise, { kind: "build" }>; locked: boolean; onDone: Done }) {
  const [v, setV] = useState("");
  const check = () => {
    const missing = ex.required.filter((g) => !g.some((t) => (t === "?" ? v.includes("?") : containsTerm(v, t))));
    const issues: Issue[] = checkText(v);
    const short = wordCount(v) < (ex.minWords ?? 5);
    const ok = missing.length === 0 && issues.length === 0 && !short;
    const partial = !ok && missing.length === 0 && !short;
    onDone({
      result: { correct: ok, status: ok ? "correct" : partial ? "partial" : "wrong" },
      expected: ex.model,
      english: ex.model,
      extra: (
        <div className="mt-2 space-y-1 text-sm">
          {short && <p>• Phrase trop courte : visez au moins {ex.minWords ?? 5} mots.</p>}
          {missing.map((g, i) => (
            <p key={i}>
              • Élément manquant : <strong lang="en">{g.slice(0, 4).join(" / ")}</strong>
            </p>
          ))}
          {issues.map((i) => (
            <p key={i.id + i.start}>
              • <span lang="en" className="line-through decoration-danger">{i.found}</span>
              {i.suggestion && (
                <>
                  {" → "}
                  <strong lang="en">{i.suggestion}</strong>
                </>
              )}{" "}
              : {i.message}
            </p>
          ))}
          {issues.some((i) => i.suggestion) && (
            <p className="pt-1">
              Votre phrase corrigée : <em lang="en" className="not-italic font-medium">{correctText(v, issues)}</em>
            </p>
          )}
          <p className="pt-1 text-muted">Exemple de réponse modèle ci-dessus. D'autres formulations sont possibles.</p>
        </div>
      ),
    });
  };
  return (
    <div>
      <p className="mb-2 text-lg font-medium">{ex.instruction}</p>
      <p className="mb-3 flex flex-wrap gap-1.5">
        {ex.required.map((g, i) => (
          <Pill key={i} tone="accent">
            <span lang="en">{g.slice(0, 3).join(" / ")}</span>
          </Pill>
        ))}
      </p>
      <textarea
        aria-label="Votre phrase en anglais"
        value={v}
        disabled={locked}
        autoFocus
        rows={3}
        lang="en"
        spellCheck={false}
        onChange={(e) => setV(e.target.value)}
        className="w-full resize-none rounded-xl border border-line bg-surface p-3 text-lg outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        placeholder="Write in English…"
      />
      <p className="mt-1 text-right text-xs text-muted tabular">{wordCount(v)} mots</p>
      <CheckBar disabled={!v.trim()} onCheck={check} locked={locked} />
    </div>
  );
}
