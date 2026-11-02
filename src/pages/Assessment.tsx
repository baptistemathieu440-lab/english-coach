import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { AlertTriangle, Check, ChevronRight, Clock, X } from "lucide-react";
import { assessmentById } from "@/content";
import { passMark } from "@/content/assessments";
import type { Assessment, AssessmentSection, Cefr, McqExercise, Skill } from "@/content/types";
import { evaluateText } from "@/lib/evaluate";
import { examAvailableAt, validatedLevel } from "@/lib/progress";
import { recordAssessment, recordEvent } from "@/state/actions";
import { useAppState, type AssessmentResult } from "@/state/store";
import { DialoguePlayer, VoiceInput } from "@/components/media";
import { Button, ButtonLink, Card, Notice, PageHeader, Pill, Progress, cx } from "@/components/ui";

export const SKILL_LABEL: Record<Skill, string> = {
  grammar: "Grammaire",
  vocabulary: "Vocabulaire",
  listening: "Compréhension orale",
  reading: "Compréhension écrite",
  writing: "Expression écrite",
  speaking: "Expression orale",
};

const SKILL_LINK: Record<Skill, string> = {
  grammar: "/apprendre",
  vocabulary: "/revisions",
  listening: "/ecouter",
  reading: "/lire",
  writing: "/parler#ecrit",
  speaking: "/parler",
};

type Answers = Record<string, number>;
type Texts = Partial<Record<Skill, string>>;

function estimateLevel(items: McqExercise[], answers: Answers): Cefr {
  const order: Cefr[] = ["A1", "A2", "B1", "B2"];
  let level: Cefr = "A1";
  for (let i = 0; i < order.length; i++) {
    const upto = items.filter((q) => order.indexOf(q.level ?? "A2") <= i);
    const at = items.filter((q) => (q.level ?? "A2") === order[i]);
    if (!at.length) continue;
    const acc = (list: McqExercise[]) => list.filter((q) => answers[q.id] === q.answer).length / list.length;
    if (acc(upto) >= 0.7 && acc(at) >= 0.6) level = order[i];
    else break;
  }
  return level;
}

function productiveLevel(score: number): Cefr {
  return score >= 75 ? "B1" : score >= 45 ? "A2" : "A1";
}

export function AssessmentPage({ id: fixed }: { id?: string }) {
  const params = useParams();
  const id = fixed ?? params.id!;
  const a = assessmentById.get(id);
  const s = useAppState();
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Answers>({});
  const [texts, setTexts] = useState<Texts>({});
  const [result, setResult] = useState<(AssessmentResult & { perSkill: Partial<Record<Skill, Cefr>> }) | null>(null);

  if (!a) return <Notice tone="danger">Évaluation introuvable.</Notice>;
  const available = examAvailableAt(s, a.id);

  if (result) return <Results a={a} result={result} answers={answers} texts={texts} />;

  if (step === -1)
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader eyebrow={a.id === "placement" ? "Évaluation initiale" : `Étape ${a.stage}`} title={a.title} subtitle={a.description} />
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Déroulement</h2>
          <ol className="space-y-2">
            {a.sections.map((sec, i) => (
              <li key={sec.skill} className="flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">{i + 1}</span>
                <span className="flex-1">{sec.title}</span>
                <span className="text-sm text-muted">{sec.items.length ? `${sec.items.length} questions` : "1 production"}</span>
              </li>
            ))}
          </ol>
          <ul className="mt-4 space-y-1 text-sm text-muted">
            <li>• Pas de correction pendant l'évaluation : vous verrez tout à la fin.</li>
            <li>• Pour l'oral, autorisez le micro ; sinon vous pourrez répondre par écrit.</li>
            <li>• L'expression écrite et orale est notée automatiquement : c'est une estimation, détaillée critère par critère.</li>
          </ul>
          {available > Date.now() ? (
            <Notice tone="warn" icon={<Clock size={18} />} title="Nouvelle tentative bientôt disponible">
              Pour que l'examen mesure de vrais progrès (et non la mémoire des questions), une nouvelle tentative est possible le {new Date(available).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}. En attendant, travaillez les compétences signalées dans votre dernier bilan.
            </Notice>
          ) : (
            <Button size="lg" full className="mt-5" onClick={() => setStep(0)}>
              Commencer
            </Button>
          )}
        </Card>
      </div>
    );

  const section = a.sections[step];
  const next = () => {
    if (step < a.sections.length - 1) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    } else setResult(score(a, answers, texts));
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">{a.title}</span>
          <span className="text-muted tabular">
            Partie {step + 1} / {a.sections.length}
          </span>
        </div>
        <Progress value={step / a.sections.length} label="Avancement de l'évaluation" />
      </div>
      <h1 className="font-display mb-4 text-2xl font-semibold">{section.title}</h1>
      <SectionRunner key={section.skill} section={section} answers={answers} setAnswers={setAnswers} text={texts[section.skill] ?? ""} setText={(t) => setTexts((x) => ({ ...x, [section.skill]: t }))} onNext={next} last={step === a.sections.length - 1} />
    </div>
  );
}

function SectionRunner({ section, answers, setAnswers, text, setText, onNext, last }: { section: AssessmentSection; answers: Answers; setAnswers: (f: (a: Answers) => Answers) => void; text: string; setText: (t: string) => void; onNext: () => void; last: boolean }) {
  const [played, setPlayed] = useState(false);
  const allAnswered = section.items.every((q) => answers[q.id] !== undefined);
  const label = last ? "Terminer et voir mon bilan" : "Partie suivante";

  if (section.task) {
    const spoken = section.skill === "speaking";
    return (
      <div>
        <Card className="mb-4 p-5">
          <p className="font-medium">{section.task.instruction}</p>
        </Card>
        {spoken ? (
          <>
            {text ? (
              <Card className="p-4">
                <p className="text-sm text-muted">Votre réponse (transcription) :</p>
                <p className="mt-1" lang="en">
                  {text}
                </p>
                <button type="button" className="mt-2 text-sm font-medium text-accent" onClick={() => setText("")}>
                  Recommencer
                </button>
              </Card>
            ) : (
              <VoiceInput onSubmit={(t) => setText(t)} minRows={4} />
            )}
          </>
        ) : (
          <>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} lang="en" spellCheck={false} aria-label="Votre texte en anglais" className="w-full rounded-2xl border border-line bg-surface p-4 text-[16px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" placeholder="Write in English…" />
            <p className="mt-1 text-right text-xs text-muted tabular">
              {text.trim() ? text.trim().split(/\s+/).length : 0} mots (minimum {section.task.minWords})
            </p>
          </>
        )}
        <Button full size="lg" className="mt-5" disabled={!text.trim()} onClick={onNext}>
          {label}
        </Button>
        <button type="button" className="mt-3 w-full text-center text-sm text-muted underline" onClick={onNext}>
          Je ne peux pas répondre (0 point)
        </button>
      </div>
    );
  }

  return (
    <div>
      {section.passage && (
        <Card className="mb-5 space-y-3 p-5" lang="en">
          {section.passage.map((p, i) => (
            <p key={i} className="leading-relaxed">
              {p}
            </p>
          ))}
        </Card>
      )}
      {section.listening && (
        <div className="mb-5">
          <p className="mb-2 text-sm text-muted">Écoutez le dialogue (deux écoutes conseillées), puis répondez. La transcription n'est pas disponible pendant l'évaluation.</p>
          <DialoguePlayer item={section.listening} showText={false} onPlayed={() => setPlayed(true)} />
        </div>
      )}
      <ol className="space-y-5">
        {section.items.map((q, n) => (
          <li key={q.id}>
            <p className="mb-2 font-medium" lang="en">
              {n + 1}. {q.prompt}
            </p>
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label={q.prompt}>
              {q.options.map((o, i) => (
                <button key={i} type="button" role="radio" aria-checked={answers[q.id] === i} onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))} className={cx("min-h-11 rounded-xl border px-3 py-2 text-left text-[15px]", answers[q.id] === i ? "border-accent bg-accent-soft font-medium" : "border-line bg-surface hover:bg-surface-2")} lang="en">
                  {o}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>
      {section.listening && !played && <p className="mt-4 text-sm text-muted">Astuce : écoutez le dialogue jusqu'au bout avant de répondre.</p>}
      <Button full size="lg" className="mt-6" disabled={!allAnswered} onClick={onNext}>
        {label}
      </Button>
    </div>
  );
}

function score(a: Assessment, answers: Answers, texts: Texts) {
  const scores: Partial<Record<Skill, number>> = {};
  const perSkill: Partial<Record<Skill, Cefr>> = {};
  for (const sec of a.sections) {
    if (sec.task) {
      const t = texts[sec.skill] ?? "";
      const minWords = sec.skill === "speaking" ? Math.round(sec.task.minWords * 1.2) : sec.task.minWords;
      const ev = evaluateText(t, { minWords, checklist: sec.task.any.map((g, i) => ({ label: `Élément ${i + 1}`, any: g })) });
      scores[sec.skill] = t.trim() ? ev.score : 0;
      perSkill[sec.skill] = productiveLevel(scores[sec.skill]!);
    } else {
      const ok = sec.items.filter((q) => answers[q.id] === q.answer).length;
      scores[sec.skill] = Math.round((ok / sec.items.length) * 100);
      perSkill[sec.skill] = sec.items.some((q) => q.level) ? estimateLevel(sec.items, answers) : undefined;
    }
  }
  const vals = Object.values(scores) as number[];
  const overall = Math.round(vals.reduce((x, y) => x + y, 0) / vals.length);
  let level: Cefr;
  let passed: boolean;
  if (a.id === "placement") {
    const order: Cefr[] = ["A1", "A2", "B1", "B2"];
    const lv = (Object.values(perSkill).filter(Boolean) as Cefr[]).map((l) => order.indexOf(l)).sort((x, y) => x - y);
    level = order[lv[Math.floor(lv.length / 2)] ?? 1];
    passed = true;
  } else {
    passed = a.sections.every((sec) => (scores[sec.skill] ?? 0) >= passMark(a, sec.skill));
    level = passed ? a.validates : "A2";
  }
  const result = { id: a.id, date: Date.now(), scores, overall, passed, level, perSkill };
  recordAssessment(result, a.id === "placement" ? result : undefined);
  for (const sec of a.sections) recordEvent({ type: "assessment", skill: sec.skill, ref: a.id, score: scores[sec.skill], level: a.id === "placement" ? undefined : a.validates === "B2" ? "B2" : a.stage === 1 ? "A2" : "B1", xp: a.id === "placement" ? 10 : 20 });
  return result;
}

function Results({ a, result, answers, texts }: { a: Assessment; result: AssessmentResult & { perSkill: Partial<Record<Skill, Cefr>> }; answers: Answers; texts: Texts }) {
  const nav = useNavigate();
  const s = useAppState();
  const sorted = useMemo(() => (Object.entries(result.scores) as [Skill, number][]).sort((x, y) => y[1] - x[1]), [result]);
  const strengths = sorted.slice(0, 2);
  const gaps = sorted.slice(-2).reverse();
  const isPlacement = a.id === "placement";
  const wrong = a.sections.flatMap((sec) => sec.items.filter((q) => answers[q.id] !== q.answer));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Bilan" title={isPlacement ? "Votre profil de départ" : result.passed ? "Examen réussi !" : "Examen non validé pour l'instant"} subtitle={isPlacement ? `Niveau estimé : ${result.level}. Ce résultat personnalise votre parcours ; le niveau affiché sur l'accueil (${validatedLevel(s).label}) ne monte qu'avec un examen blanc réussi.` : result.passed ? `Niveau validé : ${a.validates}. L'étape suivante est débloquée.` : "Pas d'inquiétude : le bilan ci-dessous indique précisément quoi travailler. Nouvelle tentative possible dans 7 jours."} />

      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Résultats par compétence</h2>
        <ul className="space-y-4">
          {a.sections.map((sec) => {
            const sc = result.scores[sec.skill] ?? 0;
            const need = isPlacement ? null : passMark(a, sec.skill);
            const ok = need === null || sc >= need;
            return (
              <li key={sec.skill}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{SKILL_LABEL[sec.skill]}</span>
                  <span className="flex items-center gap-2">
                    {result.perSkill[sec.skill] && isPlacement && <Pill tone="accent">{result.perSkill[sec.skill]}</Pill>}
                    {need !== null && (ok ? <Pill tone="success"><Check size={12} /> validé</Pill> : <Pill tone="danger"><X size={12} /> {need} % requis</Pill>)}
                    <span className="tabular font-semibold">{sc} %</span>
                  </span>
                </div>
                <Progress value={sc / 100} label={SKILL_LABEL[sec.skill]} tone={ok ? "accent" : "gold"} />
              </li>
            );
          })}
        </ul>
        {(texts.writing !== undefined || texts.speaking !== undefined) && <p className="mt-4 text-xs text-muted">Expression écrite et orale : note automatique (longueur, éléments attendus, connecteurs, variété, erreurs fréquentes). C'est une estimation, pas l'avis d'un examinateur.</p>}
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-2 font-semibold">Points forts</h2>
          <ul className="space-y-1 text-sm">
            {strengths.map(([k, v]) => (
              <li key={k}>
                {SKILL_LABEL[k]} <span className="text-muted tabular">({v} %)</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="mb-2 font-semibold">Priorités</h2>
          <ul className="space-y-1 text-sm">
            {gaps.map(([k, v]) => (
              <li key={k}>
                <Link to={SKILL_LINK[k]} className="text-accent underline">
                  {SKILL_LABEL[k]}
                </Link>{" "}
                <span className="text-muted tabular">({v} %)</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {isPlacement && (result.level === "B1" || result.level === "B2") && (
        <div className="mt-4">
          <Notice tone="accent" title="Vous semblez au-dessus du A2">
            Vous pouvez tenter directement l'examen de fin d'étape 1 pour valider le B1 et passer à l'étape 2. Sinon, les leçons de l'étape 1 proposent un « test de sortie » pour avancer vite sur ce que vous maîtrisez déjà.
            <div className="mt-3">
              <ButtonLink to="/examen/exam-stage-1" size="sm">
                Tenter l'examen de l'étape 1
              </ButtonLink>
            </div>
          </Notice>
        </div>
      )}
      {isPlacement && result.level === "A1" && (
        <div className="mt-4">
          <Notice tone="warn" icon={<AlertTriangle size={18} />} title="Bases à consolider">
            Vos résultats indiquent un niveau proche de A1. Le parcours commence à l'étape 1 ; prenez le temps de bien maîtriser chaque leçon avant d'avancer, et révisez vos mots chaque jour.
          </Notice>
        </div>
      )}

      {wrong.length > 0 && (
        <Card className="mt-4 p-5">
          <h2 className="mb-3 font-semibold">Corrections ({wrong.length})</h2>
          <ul className="space-y-3 text-sm">
            {wrong.map((q) => (
              <li key={q.id} className="rounded-xl bg-surface-2 p-3">
                <p lang="en">{q.prompt}</p>
                <p className="mt-1">
                  <span className="text-danger line-through" lang="en">{answers[q.id] !== undefined ? q.options[answers[q.id]] : "—"}</span> → <strong lang="en">{q.options[q.answer]}</strong>
                </p>
                <p className="text-muted">{q.explanation}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {a.sections.filter((x) => x.task).map((sec) => (
        <Card key={sec.skill} className="mt-4 p-5">
          <h2 className="mb-2 font-semibold">{SKILL_LABEL[sec.skill]} : exemple de réponse attendue</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed" lang="en">{sec.task!.model}</p>
        </Card>
      ))}

      <Button full size="lg" className="mt-6" onClick={() => nav("/")}>
        Voir mon programme <ChevronRight size={18} />
      </Button>
    </div>
  );
}
