import { useEffect, useMemo, useRef, useState } from "react";
import { BookmarkPlus, Check, Mic, Pause, Play, SkipBack, SkipForward, Square, X } from "lucide-react";
import type { Accent, ListeningItem } from "@/content/types";
import { ACCENT_LABEL, accentAvailable, listen, speak, stopSpeaking, sttErrorMessage, sttSupported, ttsSupported, type Listening } from "@/lib/speech";
import { lookup, type DictEntry } from "@/lib/dictionary";
import { addCard, addCustomWord } from "@/state/actions";
import { getState, useAppState } from "@/state/store";
import { Button, Notice, SpeakButton, cx } from "./ui";

/* ---------- Lecteur de dialogue (synthèse vocale) ---------- */

export function DialoguePlayer({ item, showText, onLineChange, onPlayed }: { item: ListeningItem; showText: boolean; onLineChange?: (i: number) => void; onPlayed?: () => void }) {
  const s = useAppState();
  const [playing, setPlaying] = useState(false);
  const [line, setLine] = useState(0);
  const [rate, setRate] = useState(s.settings.speechRate);
  const token = useRef(0);
  const played = useRef(false);

  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => {
    onLineChange?.(line);
  }, [line, onLineChange]);

  const play = async (from: number) => {
    const my = ++token.current;
    stopSpeaking();
    setPlaying(true);
    for (let i = from; i < item.lines.length; i++) {
      if (token.current !== my) return;
      setLine(i);
      const sp = item.speakers[item.lines[i].s];
      await speak(item.lines[i].en, { accent: sp.accent, gender: sp.voice, rate });
      if (token.current !== my) return;
      await new Promise((r) => setTimeout(r, 350));
    }
    if (token.current === my) {
      setPlaying(false);
      setLine(0);
      if (!played.current) {
        played.current = true;
        onPlayed?.();
      }
    }
  };
  const pause = () => {
    token.current++;
    stopSpeaking();
    setPlaying(false);
  };
  const jump = (d: number) => {
    const n = Math.max(0, Math.min(item.lines.length - 1, line + d));
    setLine(n);
    if (playing) void play(n);
  };

  const accents = [...new Set(item.speakers.map((x) => x.accent))];
  const missing = accents.filter((a) => !accentAvailable(a));

  if (!ttsSupported())
    return (
      <Notice tone="warn" title="Synthèse vocale indisponible">
        Ce navigateur ne propose pas de voix de synthèse. Utilisez un navigateur récent (Chrome, Edge, Safari, Firefox) ou lisez la transcription.
      </Notice>
    );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface-2 p-3">
        <button type="button" onClick={() => jump(-1)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface" aria-label="Réplique précédente">
          <SkipBack size={18} />
        </button>
        <button
          type="button"
          onClick={() => (playing ? pause() : void play(line))}
          className="grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-fg shadow-card"
          aria-label={playing ? "Pause" : "Écouter le dialogue"}
        >
          {playing ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
        </button>
        <button type="button" onClick={() => jump(1)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface" aria-label="Réplique suivante">
          <SkipForward size={18} />
        </button>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium tabular">
            Réplique {line + 1} / {item.lines.length}
          </p>
          <p className="truncate text-muted">{item.speakers[item.lines[line].s].name}</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          Vitesse
          <select value={rate} onChange={(e) => setRate(Number(e.target.value))} className="h-9 rounded-lg border border-line bg-surface px-2 text-ink">
            {[0.6, 0.75, 0.9, 1, 1.15].map((r) => (
              <option key={r} value={r}>
                ×{r}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-2 text-xs text-muted">
        Accents : {accents.map((a) => ACCENT_LABEL[a]).join(", ")}.{" "}
        {missing.length > 0 && <>Voix {missing.map((a) => ACCENT_LABEL[a]).join(", ")} non installée{missing.length > 1 ? "s" : ""} sur cet appareil : une autre voix anglaise est utilisée. </>}
        Audio généré par la synthèse vocale de votre appareil.
      </p>
      {showText && (
        <ol className="mt-4 space-y-2">
          {item.lines.map((l, i) => (
            <li key={i} className={cx("rounded-xl px-3 py-2 transition-colors", i === line && playing ? "bg-accent-soft" : "")}>
              <p className="text-xs font-semibold text-muted">{item.speakers[l.s].name}</p>
              <ClickableText text={l.en} source={item.title} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ---------- Texte cliquable + dictionnaire ---------- */

export function ClickableText({ text, source, className }: { text: string; source?: string; className?: string }) {
  const [open, setOpen] = useState<{ word: string; i: number } | null>(null);
  const tokens = useMemo(() => text.split(/(\s+)/), [text]);
  return (
    <p className={cx("leading-relaxed", className)} lang="en">
      {tokens.map((t, i) => {
        if (/^\s+$/.test(t) || !/[a-z]/i.test(t)) return <span key={i}>{t}</span>;
        const m = t.match(/^([^A-Za-z']*)([A-Za-z'’-]+)(.*)$/);
        if (!m) return <span key={i}>{t}</span>;
        const isOpen = open?.i === i;
        return (
          <span key={i} className="relative">
            {m[1]}
            <button type="button" className="word-btn" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : { word: m[2], i })}>
              {m[2]}
            </button>
            {m[3]}
            {isOpen && <WordPopover word={m[2]} source={source} onClose={() => setOpen(null)} />}
          </span>
        );
      })}
    </p>
  );
}

function WordPopover({ word, source, onClose }: { word: string; source?: string; onClose: () => void }) {
  const s = useAppState();
  const entries: DictEntry[] = lookup(word, Object.values(s.customWords));
  const [fr, setFr] = useState("");
  const [saved, setSaved] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onClose();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    setTimeout(() => document.addEventListener("click", h), 0);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("click", h);
      document.removeEventListener("keydown", k);
    };
  }, [onClose]);

  const save = (e: DictEntry) => {
    if (e.word) addCard("word", e.word.id);
    else addCustomWord(e.term, e.fr, source);
    setSaved(true);
  };
  const inNotebook = (e: DictEntry) => (e.word ? !!s.cards[`word:${e.word.id}`] : Object.values(s.customWords).some((c) => c.en.toLowerCase() === e.term.toLowerCase()));

  return (
    <div ref={ref} role="dialog" aria-label={`Dictionnaire : ${word}`} className="animate-pop absolute left-0 top-full z-40 mt-1 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-4 text-left text-sm font-normal shadow-card" lang="fr">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-base font-semibold" lang="en">
          {word}
        </p>
        <div className="flex items-center gap-1">
          <SpeakButton text={word} size="sm" />
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface-2" aria-label="Fermer">
            <X size={16} />
          </button>
        </div>
      </div>
      {entries.length > 0 ? (
        <ul className="space-y-2">
          {entries.map((e, i) => (
            <li key={i} className="rounded-xl bg-surface-2 p-2.5">
              <p>
                <span className="font-medium" lang="en">
                  {e.term}
                </span>{" "}
                {e.word && <span className="text-muted">{e.word.ipa}</span>}
              </p>
              <p>{e.fr}</p>
              {e.word && (
                <p className="mt-1 text-xs text-muted" lang="en">
                  {e.word.def}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted">{e.source}</span>
                {inNotebook(e) || saved ? (
                  <span className="inline-flex items-center gap-1 text-xs text-success">
                    <Check size={14} /> Dans le carnet
                  </span>
                ) : (
                  <button type="button" onClick={() => save(e)} className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                    <BookmarkPlus size={14} /> Ajouter au carnet
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : saved ? (
        <p className="text-success">Ajouté à votre carnet.</p>
      ) : (
        <div>
          <p className="mb-2 text-muted">Mot absent du dictionnaire intégré. Ajoutez votre propre traduction pour le réviser :</p>
          <div className="flex gap-2">
            <input value={fr} onChange={(e) => setFr(e.target.value)} placeholder="Traduction" aria-label="Traduction française" className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-surface px-2" />
            <Button size="sm" disabled={!fr.trim()} onClick={() => save({ term: word.toLowerCase(), fr, source: "Mon carnet" })}>
              Ajouter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Saisie vocale avec repli clavier ---------- */

export function VoiceInput({ onSubmit, placeholder = "Votre réponse en anglais…", disabled, minRows = 2 }: { onSubmit: (text: string, spoken: boolean) => void; placeholder?: string; disabled?: boolean; minRows?: number }) {
  const [text, setText] = useState("");
  const [rec, setRec] = useState<Listening | null>(null);
  const [error, setError] = useState<string | null>(null);
  const spoken = useRef(false);
  const supported = sttSupported();

  useEffect(() => () => rec?.stop(), [rec]);

  const start = () => {
    setError(null);
    stopSpeaking();
    const l = listen({ lang: "en-GB", onInterim: (t) => setText(t) });
    setRec(l);
    spoken.current = true;
    l.result
      .then((r) => {
        if (r.transcript) setText(r.transcript);
      })
      .catch((e) => setError(sttErrorMessage(e)))
      .finally(() => setRec(null));
  };

  const submit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim(), spoken.current);
    setText("");
    spoken.current = false;
  };

  return (
    <div>
      <div className="flex items-end gap-2">
        {supported && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => (rec ? rec.stop() : start())}
            className={cx("grid h-14 w-14 shrink-0 place-items-center rounded-full transition-colors", rec ? "bg-danger text-white" : "bg-accent text-accent-fg")}
            aria-label={rec ? "Arrêter l'enregistrement" : "Parler"}
          >
            {rec ? <Square size={20} /> : <Mic size={22} />}
          </button>
        )}
        <textarea
          value={text}
          disabled={disabled}
          onChange={(e) => {
            setText(e.target.value);
            if (!rec) spoken.current = false;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={minRows}
          lang="en"
          spellCheck={false}
          aria-label="Votre réponse"
          placeholder={rec ? "Je vous écoute…" : supported ? `${placeholder} (ou touchez le micro)` : placeholder}
          className="min-w-0 flex-1 resize-none rounded-2xl border border-line bg-surface p-3 text-[16px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
        <Button onClick={submit} disabled={disabled || !text.trim() || !!rec} className="h-14">
          Envoyer
        </Button>
      </div>
      {rec && <p className="mt-2 text-sm text-danger" role="status">● Enregistrement… parlez puis touchez le carré pour terminer.</p>}
      {error && <p className="mt-2 text-sm text-danger" role="alert">{error}</p>}
      {!supported && <p className="mt-2 text-xs text-muted">Reconnaissance vocale indisponible dans ce navigateur : répondez par écrit (Chrome, Edge et Safari la proposent).</p>}
    </div>
  );
}

/** Lit une phrase puis écoute l'apprenant la répéter ; renvoie la transcription. */
export function useRepeat() {
  const [rec, setRec] = useState<Listening | null>(null);
  const [heard, setHeard] = useState("");
  const [error, setError] = useState<string | null>(null);
  const start = (onDone: (t: string) => void) => {
    setError(null);
    setHeard("");
    const l = listen({ lang: "en-GB", onInterim: setHeard });
    setRec(l);
    l.result
      .then((r) => {
        setHeard(r.transcript);
        onDone(r.transcript);
      })
      .catch((e) => setError(sttErrorMessage(e)))
      .finally(() => setRec(null));
  };
  return { rec, heard, error, start, stop: () => rec?.stop() };
}

export function speakText(text: string, accent?: Accent) {
  return speak(text, { accent, rate: getState().settings.speechRate });
}
