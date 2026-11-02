import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Bot, Check, ChevronDown, Cpu, Languages, Lightbulb, Mic, RotateCcw, Sparkles, Square, Volume2, X } from "lucide-react";
import { DRILLS, FREE_TOPICS, SCENARIOS, WRITING, scenarioById } from "@/content";
import type { FreeTopic, Scenario } from "@/content/types";
import { evaluateAnswer, type SpokenEvaluation } from "@/lib/evaluate";
import { speak, stopSpeaking, sttSupported } from "@/lib/speech";
import { wordOverlap } from "@/lib/text";
import { analyse, aiChat, loadWebLlm, OfflineTutor, parseAiReply, systemPrompt, webGpuAvailable, webLlmReady, type ChatMessage, type TutorFeedback } from "@/lib/tutor";
import { validatedLevel } from "@/lib/progress";
import { recordAttempt, recordEvent } from "@/state/actions";
import { getState, useAppState } from "@/state/store";
import { usePlanId } from "@/lib/hooks";
import { useRepeat, VoiceInput } from "@/components/media";
import { Button, ButtonLink, Card, LevelPill, Notice, PageHeader, Pill, Progress, SpeakButton, Tabs, cx } from "@/components/ui";

const CAT: Record<Scenario["category"], string> = { daily: "Vie quotidienne", travel: "Voyage", social: "Relations", work: "Travail", business: "Business", opinion: "Opinion" };

export function SpeakHub() {
  const s = useAppState();
  const [tab, setTab] = useState<"guided" | "free" | "pron" | "write">(location.hash === "#ecrit" ? "write" : "guided");
  return (
    <div>
      <PageHeader eyebrow="Parler" title="Expression orale et écrite" subtitle="Votre professeur virtuel : il vous pose des questions, comprend votre réponse (reconnaissance vocale du navigateur), corrige vos erreurs en français et vous fait répéter la bonne formulation." />
      {!sttSupported() && (
        <div className="mb-5">
          <Notice tone="warn" icon={<Mic size={18} />} title="Micro : reconnaissance vocale indisponible ici">
            Ce navigateur ne propose pas la reconnaissance vocale. Vous pouvez répondre par écrit ; pour parler, utilisez Chrome, Edge ou Safari.
          </Notice>
        </div>
      )}
      <Tabs label="Type d'exercice" value={tab} onChange={setTab} items={[{ id: "guided", label: "Conversations guidées", count: SCENARIOS.length }, { id: "free", label: "Conversation libre" }, { id: "pron", label: "Prononciation" }, { id: "write", label: "Expression écrite", count: WRITING.length }]} />
      {tab === "guided" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {SCENARIOS.map((sc) => (
            <Link key={sc.id} to={`/parler/scenario/${sc.id}`} className="rounded-2xl border border-line bg-surface p-4 hover:border-accent">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{sc.title}</p>
                <LevelPill level={sc.level} />
              </div>
              <p className="mt-1 text-sm text-muted">{sc.goal}</p>
              <div className="mt-2 flex gap-1">
                <Pill tone={sc.category === "business" ? "gold" : "neutral"}>{CAT[sc.category]}</Pill>
                {s.speaking[sc.id] && <Pill tone={s.speaking[sc.id].best >= 60 ? "success" : "warn"}>{s.speaking[sc.id].best} %</Pill>}
              </div>
            </Link>
          ))}
        </div>
      )}
      {tab === "free" && (
        <div>
          <AiStatus />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {FREE_TOPICS.map((t) => (
              <Link key={t.id} to={`/parler/libre/${t.id}`} className="rounded-2xl border border-line bg-surface p-4 hover:border-accent">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{t.title}</p>
                  <LevelPill level={t.level} />
                </div>
                <p className="mt-1 text-sm text-muted" lang="en">
                  {t.questions[0]}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
      {tab === "pron" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {DRILLS.map((d) => (
            <Link key={d.id} to={`/parler/prononciation/${d.id}`} className="rounded-2xl border border-line bg-surface p-4 hover:border-accent">
              <p className="font-medium">{d.title}</p>
              <p className="text-sm text-muted">{d.focus}</p>
            </Link>
          ))}
        </div>
      )}
      {tab === "write" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {WRITING.map((w) => (
            <Link key={w.id} to={`/ecrire/${w.id}`} className="rounded-2xl border border-line bg-surface p-4 hover:border-accent">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{w.title}</p>
                <LevelPill level={w.level} />
              </div>
              <p className="mt-1 text-sm text-muted">{w.minWords} mots minimum</p>
              {s.writing[w.id] && <Pill tone={s.writing[w.id].best >= 60 ? "success" : "warn"} className="mt-2">{s.writing[w.id].best} %</Pill>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function AiStatus() {
  const s = useAppState();
  const mode = s.settings.ai.mode;
  return (
    <Notice tone={mode === "off" ? "neutral" : "accent"} icon={mode === "off" ? <Bot size={18} /> : <Cpu size={18} />} title={mode === "off" ? "Professeur intégré (sans IA)" : mode === "webllm" ? "IA locale activée (WebLLM)" : "IA sur votre ordinateur (Ollama)"}>
      {mode === "off" ? (
        <>Questions par thème, relances et correction des erreurs typiques des francophones, hors connexion. Pour une conversation vraiment libre, vous pouvez activer gratuitement une IA locale dans les <Link to="/reglages" className="font-medium text-accent underline">réglages</Link> (appareil compatible requis).</>
      ) : (
        <>L'IA tourne sur votre matériel : gratuite, sans compte, sans envoi de vos conversations à un service tiers. Ses corrections peuvent être imparfaites. <Link to="/reglages" className="font-medium text-accent underline">Changer</Link></>
      )}
    </Notice>
  );
}

/* ---------- Feedback commun ---------- */

function Correction({ issues, corrected, original }: { issues: TutorFeedback["issues"]; corrected: string; original: string }) {
  if (!issues.length) return <p className="flex items-center gap-1.5 text-sm text-success"><Check size={14} /> Aucune erreur fréquente détectée.</p>;
  return (
    <div className="space-y-1.5 text-sm">
      {issues.map((i) => (
        <p key={i.id + i.start}>
          <span className="text-danger line-through" lang="en">{i.found}</span>
          {i.suggestion && (
            <>
              {" → "}
              <strong lang="en">{i.suggestion}</strong>
            </>
          )}
          <span className="block text-muted">{i.message}</span>
        </p>
      ))}
      {corrected !== original && (
        <p className="flex items-start gap-2 pt-1">
          <span className="min-w-0">
            <span className="text-muted">Corrigé : </span>
            <span lang="en" className="font-medium">{corrected}</span>
          </span>
          <SpeakButton text={corrected} size="sm" />
        </p>
      )}
    </div>
  );
}

function Shadow({ text, onScore }: { text: string; onScore?: (n: number) => void }) {
  const { rec, heard, error, start, stop } = useRepeat();
  const [res, setRes] = useState<ReturnType<typeof wordOverlap> | null>(null);
  if (!sttSupported())
    return (
      <div className="flex items-center gap-2 text-sm">
        <SpeakButton text={text} size="sm" />
        <span className="text-muted">Écoutez puis répétez à voix haute (reconnaissance vocale indisponible ici).</span>
      </div>
    );
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <SpeakButton text={text} size="sm" label="Écouter le modèle" />
        <Button
          size="sm"
          variant={rec ? "danger" : "secondary"}
          onClick={() =>
            rec
              ? stop()
              : (stopSpeaking(),
                start((t) => {
                  const r = wordOverlap(text, t);
                  setRes(r);
                  onScore?.(r.score);
                }))
          }
        >
          {rec ? <Square size={14} /> : <Mic size={14} />} {rec ? "Terminer" : "Répéter la phrase"}
        </Button>
        {res && <Pill tone={res.score >= 80 ? "success" : "warn"}>{res.score} % reconnu</Pill>}
      </div>
      {(rec || heard) && <p className="mt-1 text-sm text-muted" lang="en">Entendu : « {heard || "…"} »</p>}
      {res && (
        <p className="mt-1 text-sm" lang="en">
          {res.words.map((w, i) => (
            <span key={i} className={cx("mr-1", !w.ok && "rounded bg-danger-soft px-0.5 text-danger underline")}>
              {w.w}
            </span>
          ))}
        </p>
      )}
      {res && res.score < 80 && <p className="text-xs text-muted">Les mots soulignés n'ont pas été reconnus : écoutez le modèle et insistez sur ces mots.</p>}
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}

/* ---------- Conversation guidée ---------- */

interface Turn {
  text: string;
  ev: SpokenEvaluation;
}

export function ScenarioPage() {
  const { id } = useParams();
  const sc = scenarioById.get(id ?? "");
  const planId = usePlanId();
  const [step, setStep] = useState(0);
  const [turns, setTurns] = useState<(Turn | null)[]>([]);
  const [current, setCurrent] = useState<Turn | null>(null);
  const [showFr, setShowFr] = useState(false);
  const [finished, setFinished] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sc && !finished && step < sc.steps.length) void speak(sc.steps[step].tutor, { accent: "gb", gender: "female", rate: getState().settings.speechRate });
    return () => stopSpeaking();
  }, [sc, step, finished]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [current, step]);

  if (!sc) return <Notice tone="danger">Scénario introuvable.</Notice>;
  const st = sc.steps[step];

  const answer = (text: string) => setCurrent({ text, ev: evaluateAnswer(text, st.expect, st.minWords) });
  const next = () => {
    const all = [...turns, current];
    setTurns(all);
    setCurrent(null);
    if (step + 1 < sc.steps.length) setStep(step + 1);
    else {
      const scored = all.filter(Boolean) as Turn[];
      const score = Math.round(scored.reduce((a, t) => a + t.ev.score, 0) / Math.max(1, sc.steps.length));
      recordAttempt("speaking", sc.id, score);
      recordEvent({ type: "speaking", skill: "speaking", ref: sc.id, score, level: sc.level, xp: 30 + Math.round(score / 5) }, planId);
      setFinished(true);
    }
  };

  if (finished) {
    const scored = turns.filter(Boolean) as Turn[];
    const score = Math.round(scored.reduce((a, t) => a + t.ev.score, 0) / sc.steps.length);
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-6 text-center">
          <Sparkles size={32} className="mx-auto text-gold" aria-hidden />
          <p className="mt-3 text-5xl font-semibold tabular">{score} %</p>
          <h1 className="font-display mt-2 text-2xl font-semibold">{sc.title} : terminé</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">Score indicatif : pertinence (mots attendus), longueur et erreurs détectées. Refaites le scénario dans quelques jours : la répétition espacée vaut aussi pour l'oral.</p>
        </Card>
        <Card className="mt-4 p-5">
          <h2 className="mb-3 font-semibold">Les formulations à retenir</h2>
          <ul className="space-y-3">
            {sc.steps.map((x, i) => (
              <li key={i} className="flex items-start gap-2">
                <SpeakButton text={x.model} size="sm" />
                <div className="min-w-0 text-sm">
                  <p lang="en" className="font-medium">{x.model}</p>
                  {turns[i] && turns[i]!.ev.issues.length > 0 && <p className="text-muted">Vous : <span lang="en">{turns[i]!.text}</span></p>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <ButtonLink to={planId ? "/" : "/parler"} size="lg">{planId ? "Retour au programme" : "Autres conversations"}</ButtonLink>
          <Button size="lg" variant="secondary" onClick={() => { setTurns([]); setStep(0); setFinished(false); }}>
            <RotateCcw size={16} /> Recommencer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/parler" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> Conversations
      </Link>
      <PageHeader eyebrow={`${CAT[sc.category]} · ${sc.level}`} title={sc.title} subtitle={sc.goal} />
      <Card className="mb-4 p-4 text-sm">
        <p><strong>Situation :</strong> {sc.setting}</p>
        <p className="mt-1 text-muted">Votre interlocuteur : <span lang="en">{sc.tutorRole}</span></p>
        <details className="mt-3">
          <summary className="cursor-pointer font-medium text-accent">Expressions utiles</summary>
          <ul className="mt-2 space-y-1">
            {sc.phrases.map((p) => (
              <li key={p.en} className="flex items-center gap-2">
                <SpeakButton text={p.en} size="sm" /> <span lang="en" className="font-medium">{p.en}</span> <span className="text-muted">— {p.fr}</span>
              </li>
            ))}
          </ul>
        </details>
      </Card>
      <div className="mb-2 flex items-center gap-3">
        <Progress value={step / sc.steps.length} label="Avancement du scénario" />
        <span className="text-sm text-muted tabular">{step + 1}/{sc.steps.length}</span>
      </div>

      <div className="space-y-3">
        {sc.steps.slice(0, step + 1).map((x, i) => (
          <div key={i} className="space-y-3">
            <TutorBubble text={x.tutor} fr={x.tutorFr} showFr={showFr} />
            {turns[i] && <UserBubble text={turns[i]!.text} />}
          </div>
        ))}
        {current && <UserBubble text={current.text} />}
      </div>

      {!current ? (
        <div className="mt-4">
          <div className="mb-2 flex flex-wrap gap-3 text-sm">
            <button type="button" onClick={() => setShowFr((v) => !v)} className="inline-flex items-center gap-1 text-muted hover:text-ink">
              <Languages size={14} /> {showFr ? "Masquer la traduction" : "Traduire la question"}
            </button>
            <details className="text-muted">
              <summary className="inline-flex cursor-pointer items-center gap-1 hover:text-ink"><Lightbulb size={14} /> Un indice</summary>
              <p className="mt-1 text-ink">{st.hint}</p>
            </details>
          </div>
          <VoiceInput onSubmit={answer} />
        </div>
      ) : (
        <Card className="mt-4 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold">Correction du professeur</p>
            <Pill tone={current.ev.score >= 70 ? "success" : current.ev.score >= 45 ? "warn" : "danger"}>{current.ev.score} %</Pill>
          </div>
          {!current.ev.relevant && <p className="mb-2 text-sm text-warn">Votre réponse ne semble pas répondre à la question. Indice : {st.hint}</p>}
          {current.ev.tooShort && current.ev.relevant && <p className="mb-2 text-sm text-warn">Réponse un peu courte : développez avec une précision ou une raison.</p>}
          <Correction issues={current.ev.issues} corrected={current.ev.corrected} original={current.text} />
          <div className="mt-4 rounded-xl bg-accent-soft p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Une formulation naturelle</p>
            <p className="mt-1 font-medium" lang="en">{st.model}</p>
            <div className="mt-2">
              <Shadow text={st.model} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => setCurrent(null)}>
              <RotateCcw size={16} /> Réessayer
            </Button>
            <Button className="flex-1" onClick={next}>
              {step + 1 < sc.steps.length ? "Continuer" : "Terminer"}
            </Button>
          </div>
        </Card>
      )}
      <div ref={bottom} />
    </div>
  );
}

function TutorBubble({ text, fr, showFr }: { text: string; fr?: string; showFr?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-accent-fg" aria-hidden>
        <Bot size={18} />
      </span>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-surface p-3 shadow-card">
        <p lang="en">{text}</p>
        {showFr && fr && <p className="mt-1 text-sm text-muted">{fr}</p>}
        <button type="button" onClick={() => void speak(text, { accent: "gb", gender: "female", rate: getState().settings.speechRate })} className="mt-1 inline-flex items-center gap-1 text-xs text-accent" aria-label="Réécouter">
          <Volume2 size={12} /> Réécouter
        </button>
      </div>
    </div>
  );
}

function UserBubble({ text, children }: { text: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-accent-soft p-3">
        <p lang="en">{text}</p>
      </div>
      {children}
    </div>
  );
}

/* ---------- Conversation libre ---------- */

interface FreeMsg {
  role: "tutor" | "user";
  text: string;
  feedback?: TutorFeedback;
  ai?: { correction?: string; explanation?: string };
}

export function FreeConversationPage() {
  const { id } = useParams();
  const topic = FREE_TOPICS.find((t) => t.id === id);
  if (!topic) return <Notice tone="danger">Thème introuvable.</Notice>;
  return <FreeConversation key={topic.id} topic={topic} />;
}

function FreeConversation({ topic }: { topic: FreeTopic }) {
  const s = useAppState();
  const planId = usePlanId();
  const ai = s.settings.ai;
  const tutor = useRef(new OfflineTutor(topic));
  const [msgs, setMsgs] = useState<FreeMsg[]>(() => [{ role: "tutor", text: tutor.current.opening() }]);
  const [busy, setBusy] = useState(false);
  const [aiState, setAiState] = useState<"idle" | "loading" | "ready" | "error">(ai.mode === "off" ? "idle" : ai.mode === "ollama" || webLlmReady(ai.model) ? "ready" : "idle");
  const [progress, setProgress] = useState<{ progress: number; text: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const useAi = ai.mode !== "off" && aiState === "ready";
  const bottom = useRef<HTMLDivElement>(null);
  const level = validatedLevel(s).label;

  useEffect(() => {
    const last = msgs[msgs.length - 1];
    if (last?.role === "tutor") void speak(last.text, { accent: "gb", gender: "female", rate: getState().settings.speechRate });
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs]);
  useEffect(() => () => stopSpeaking(), []);

  const loadModel = async () => {
    setAiState("loading");
    setAiError(null);
    try {
      await loadWebLlm(ai.model, setProgress);
      setAiState("ready");
    } catch (e) {
      setAiState("error");
      setAiError(e instanceof Error ? e.message : String(e));
    }
  };

  const send = async (text: string) => {
    const feedback = analyse(text);
    const withUser: FreeMsg[] = [...msgs, { role: "user", text, feedback }];
    setMsgs(withUser);
    if (useAi) {
      setBusy(true);
      try {
        const history: ChatMessage[] = [{ role: "system", content: systemPrompt(level, topic.title) }, ...withUser.slice(-10).map((m): ChatMessage => ({ role: m.role === "tutor" ? "assistant" : "user", content: m.text }))];
        const raw = await aiChat(ai, history);
        const p = parseAiReply(raw);
        setMsgs((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { ...copy[copy.length - 1], ai: { correction: p.correction, explanation: p.explanation } };
          return [...copy, { role: "tutor", text: p.reply || "Could you say that again?" }];
        });
      } catch (e) {
        setAiError(`L'IA n'a pas répondu (${e instanceof Error ? e.message : e}). Le professeur intégré prend le relais.`);
        setAiState("error");
        const r = tutor.current.respond(text);
        setMsgs((m) => [...m, { role: "tutor", text: r.reply }]);
      } finally {
        setBusy(false);
      }
    } else {
      const r = tutor.current.respond(text);
      setMsgs((m) => [...m, { role: "tutor", text: r.reply }]);
      if (tutor.current.finished) finish(withUser);
    }
  };

  const finish = (list = msgs) => {
    const user = list.filter((m) => m.role === "user" && m.feedback);
    if (!user.length) return setEnded(true);
    const score = Math.round(user.reduce((a, m) => a + m.feedback!.score, 0) / user.length);
    recordEvent({ type: "conversation", skill: "speaking", ref: topic.id, score, level: topic.level, xp: 10 + user.length * 5 }, planId);
    setEnded(true);
  };

  const userCount = msgs.filter((m) => m.role === "user").length;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/parler" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> Conversations
      </Link>
      <PageHeader eyebrow={`Conversation libre · ${topic.level}`} title={topic.title} subtitle={useAi ? "Conversation avec l'IA locale. Corrections de l'IA + détecteur d'erreurs intégré." : "Le professeur intégré pose les questions du thème et vous relance ; vos phrases sont corrigées une par une."} />

      {ai.mode === "webllm" && aiState !== "ready" && (
        <Card className="mb-4 p-4 text-sm">
          {!webGpuAvailable() ? (
            <p className="text-warn">Ce navigateur ne prend pas en charge WebGPU : l'IA locale ne peut pas fonctionner ici. Le professeur intégré est utilisé.</p>
          ) : aiState === "loading" ? (
            <>
              <p className="font-medium">Chargement du modèle local…</p>
              <Progress value={progress?.progress ?? 0} label="Chargement du modèle" className="mt-2" />
              <p className="mt-1 text-xs text-muted">{progress?.text}</p>
            </>
          ) : (
            <>
              <p>L'IA locale est activée. Le premier chargement télécharge le modèle (plusieurs centaines de Mo, une seule fois) ; ensuite il reste en cache sur l'appareil.</p>
              <Button size="sm" className="mt-2" onClick={loadModel}>
                <Cpu size={14} /> Charger le modèle
              </Button>
            </>
          )}
        </Card>
      )}
      {aiError && <div className="mb-4"><Notice tone="warn">{aiError}</Notice></div>}

      <div className="space-y-3">
        {msgs.map((m, i) =>
          m.role === "tutor" ? (
            <TutorBubble key={i} text={m.text} />
          ) : (
            <UserBubble key={i} text={m.text}>
              {m.feedback && <MsgFeedback m={m} />}
            </UserBubble>
          ),
        )}
        {busy && <p className="text-sm text-muted" role="status">Le professeur réfléchit…</p>}
      </div>

      {ended ? (
        <Card className="mt-5 p-5 text-center">
          <p className="font-semibold">Conversation terminée — {userCount} réponse{userCount > 1 ? "s" : ""}.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <ButtonLink to={planId ? "/" : "/parler"}>{planId ? "Retour au programme" : "Autres thèmes"}</ButtonLink>
          </div>
        </Card>
      ) : (
        <div className="mt-4">
          <VoiceInput onSubmit={(t) => void send(t)} disabled={busy} />
          {userCount >= 2 && (
            <button type="button" className="mt-3 text-sm font-medium text-accent" onClick={() => finish()}>
              Terminer la conversation
            </button>
          )}
        </div>
      )}
      <div ref={bottom} />
    </div>
  );
}

function MsgFeedback({ m }: { m: FreeMsg }) {
  const [open, setOpen] = useState(m.feedback!.issues.length > 0 || !!m.ai?.correction);
  const fb = m.feedback!;
  const n = fb.issues.length + (m.ai?.correction ? 1 : 0);
  return (
    <div className="mt-1 w-full max-w-[85%] text-sm">
      <button type="button" onClick={() => setOpen((o) => !o)} className={cx("inline-flex items-center gap-1 text-xs font-medium", n ? "text-warn" : "text-success")} aria-expanded={open}>
        {n ? <X size={12} /> : <Check size={12} />} {n ? `${n} point${n > 1 ? "s" : ""} à corriger` : "Pas d'erreur détectée"} <ChevronDown size={12} className={cx(open && "rotate-180")} />
      </button>
      {open && (
        <Card className="mt-1 space-y-2 p-3">
          <Correction issues={fb.issues} corrected={fb.corrected} original={m.text} />
          {m.ai?.correction && (
            <div>
              <p className="text-muted">Reformulation proposée par l'IA :</p>
              <p className="font-medium" lang="en">{m.ai.correction}</p>
              {m.ai.explanation && <p className="text-muted">{m.ai.explanation}</p>}
              <div className="mt-2"><Shadow text={m.ai.correction} /></div>
            </div>
          )}
          {fb.notes.map((x) => <p key={x} className="text-muted">{x}</p>)}
        </Card>
      )}
    </div>
  );
}

/* ---------- Prononciation ---------- */

export function DrillPage() {
  const { id } = useParams();
  const d = DRILLS.find((x) => x.id === id);
  const planId = usePlanId();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  if (!d) return <Notice tone="danger">Exercice introuvable.</Notice>;
  const items = [...(d.pairs?.flat() ?? []), ...d.sentences];
  const avg = Object.values(scores).length ? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length) : null;
  const finish = () => {
    recordEvent({ type: "pronunciation", skill: "speaking", ref: d.id, score: avg ?? undefined, xp: 15 }, planId);
    setDone(true);
  };
  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/parler" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> Parler
      </Link>
      <PageHeader eyebrow={`Prononciation · ${d.focus}`} title={d.title} subtitle={d.explanation} />
      <Notice tone="neutral">La reconnaissance vocale mesure si vos mots sont compris (intelligibilité), pas la finesse de votre accent. Écoutez, imitez, puis répétez jusqu'à être reconnu.</Notice>
      {d.pairs && (
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">Paires minimales</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {d.pairs.map(([a, b]) => (
              <Card key={a} className="space-y-3 p-4">
                {[a, b].map((w) => (
                  <div key={w}>
                    <p className="mb-1 text-lg font-semibold" lang="en">{w}</p>
                    <Shadow text={w} onScore={(n) => setScores((x) => ({ ...x, [w]: n }))} />
                  </div>
                ))}
              </Card>
            ))}
          </div>
        </section>
      )}
      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Phrases</h2>
        <div className="space-y-3">
          {d.sentences.map((t) => (
            <Card key={t} className="p-4">
              <p className="mb-2 text-lg font-medium" lang="en">{t}</p>
              <Shadow text={t.replace(/[A-Z]{2,}/g, (m) => m.toLowerCase())} onScore={(n) => setScores((x) => ({ ...x, [t]: n }))} />
            </Card>
          ))}
        </div>
      </section>
      <div className="mt-6">
        {done ? (
          <ButtonLink to={planId ? "/" : "/parler"} size="lg" full>{planId ? "Retour au programme" : "Autres exercices"}</ButtonLink>
        ) : (
          <Button size="lg" full onClick={finish}>
            Terminer {avg !== null && `(${Object.keys(scores).length}/${items.length} essais · ${avg} %)`}
          </Button>
        )}
      </div>
    </div>
  );
}
