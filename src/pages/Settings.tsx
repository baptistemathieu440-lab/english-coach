import { useEffect, useRef, useState } from "react";
import { Download, Smartphone, Upload } from "lucide-react";
import { ACCENT_LABEL, accentAvailable, englishVoices, speak, sttSupported } from "@/lib/speech";
import { AI_MODES, WEBLLM_MODELS, webGpuAvailable } from "@/lib/tutor";
import type { Accent } from "@/content/types";
import { initialState, replaceState, setState, useAppState, type AppState, type Settings } from "@/state/store";
import { Button, Card, Notice, PageHeader, Pill, Select, SectionTitle, cx } from "@/components/ui";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
}

export function SettingsPage() {
  const s = useAppState();
  const [voices, setVoices] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<Settings>) => setState((x) => ({ ...x, settings: { ...x.settings, ...patch } }));
  const setAi = (patch: Partial<Settings["ai"]>) => setState((x) => ({ ...x, settings: { ...x.settings, ai: { ...x.settings.ai, ...patch } } }));

  useEffect(() => {
    const t = setTimeout(() => setVoices(englishVoices().length), 300);
    const h = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", h);
    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", h);
    };
  }, []);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(s, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `english-coach-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importData = async (f: File) => {
    try {
      const data = JSON.parse(await f.text()) as AppState;
      if (data.version !== 1 || typeof data.cards !== "object") throw new Error("format");
      if (!confirm("Remplacer les progrès de cet appareil par cette sauvegarde ?")) return;
      await replaceState(data);
      setMsg("Sauvegarde importée.");
    } catch {
      setMsg("Fichier invalide : choisissez une sauvegarde exportée depuis English Coach.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Réglages" title="Préférences" />

      <SectionTitle>Affichage et séance</SectionTitle>
      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <Select label="Thème" value={s.settings.theme} onChange={(v) => set({ theme: v as Settings["theme"] })} options={[{ value: "system", label: "Automatique (système)" }, { value: "light", label: "Clair" }, { value: "dark", label: "Sombre" }]} />
        <Select label="Durée de la séance quotidienne" value={String(s.settings.dailyMinutes)} onChange={(v) => set({ dailyMinutes: Number(v) as 30 | 45 })} options={[{ value: "30", label: "30 minutes" }, { value: "45", label: "45 minutes" }]} />
        <Select label="Nouveaux mots par jour" value={String(s.settings.newWordsPerDay)} onChange={(v) => set({ newWordsPerDay: Number(v) })} options={[5, 8, 10, 15, 20].map((n) => ({ value: String(n), label: `${n} mots` }))} />
        <label className="flex flex-col gap-1 text-xs text-muted">
          Prénom
          <input value={s.name} onChange={(e) => setState((x) => ({ ...x, name: e.target.value }))} className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink" />
        </label>
      </Card>

      <SectionTitle>Voix et micro</SectionTitle>
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <Select className="w-48" label="Vitesse de lecture" value={String(s.settings.speechRate)} onChange={(v) => set({ speechRate: Number(v) })} options={[0.7, 0.8, 0.9, 0.95, 1, 1.1].map((r) => ({ value: String(r), label: `×${r}` }))} />
          <Button variant="secondary" onClick={() => void speak("Hello! This is how I sound at this speed.", { rate: s.settings.speechRate })}>
            Tester la voix
          </Button>
        </div>
        <div>
          <p className="text-sm">
            {voices} voix anglaise{voices > 1 ? "s" : ""} sur cet appareil. Accents disponibles :
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {(Object.keys(ACCENT_LABEL) as Accent[]).map((a) => (
              <Pill key={a} tone={accentAvailable(a) ? "success" : "neutral"}>
                {ACCENT_LABEL[a]} {accentAvailable(a) ? "✓" : "—"}
              </Pill>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">Les voix dépendent du système. Pour plus d'accents : Android (Paramètres › Synthèse vocale › installer des données vocales), iPhone/iPad (Réglages › Accessibilité › Contenu énoncé › Voix), Windows (Paramètres › Heure et langue › Voix), macOS (Réglages › Accessibilité › Contenu énoncé).</p>
        </div>
        <p className="text-sm">
          Reconnaissance vocale : {sttSupported() ? <Pill tone="success">disponible</Pill> : <Pill tone="warn">indisponible dans ce navigateur</Pill>}
        </p>
        <p className="text-xs text-muted">La reconnaissance vocale est celle du navigateur : gratuite, mais Chrome et Edge envoient l'audio aux serveurs de Google ou Microsoft pour la transcrire (Safari peut transcrire sur l'appareil). Elle nécessite alors une connexion. Firefox ne la propose pas : vous pouvez toujours répondre par écrit.</p>
      </Card>

      <SectionTitle>Professeur de conversation</SectionTitle>
      <Card className="space-y-3 p-5">
        <div role="radiogroup" aria-label="Mode du professeur" className="space-y-2">
          {AI_MODES.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={s.settings.ai.mode === m.id} onClick={() => setAi({ mode: m.id })} className={cx("w-full rounded-xl border p-3 text-left", s.settings.ai.mode === m.id ? "border-accent bg-accent-soft" : "border-line")}>
              <p className="font-medium">{m.label}</p>
              <p className="mt-0.5 text-sm text-muted">{m.description}</p>
            </button>
          ))}
        </div>
        {s.settings.ai.mode === "webllm" && (
          <div className="space-y-2">
            {!webGpuAvailable() && <Notice tone="warn">WebGPU n'est pas disponible dans ce navigateur : l'IA locale ne fonctionnera pas ici (le professeur intégré sera utilisé).</Notice>}
            <Select label="Modèle (téléchargé une fois, puis en cache)" value={s.settings.ai.model} onChange={(v) => setAi({ model: v })} options={WEBLLM_MODELS.map((m) => ({ value: m.id, label: m.label }))} />
            <p className="text-xs text-muted">Moteur : WebLLM (open source, Apache 2.0). Modèles : Qwen (Apache 2.0) et Llama 3.2 (licence communautaire Meta). Le téléchargement des modèles vient de Hugging Face ; aucune conversation n'est envoyée.</p>
          </div>
        )}
        {s.settings.ai.mode === "ollama" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs text-muted">
              Adresse d'Ollama
              <input value={s.settings.ai.ollamaUrl} onChange={(e) => setAi({ ollamaUrl: e.target.value })} className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink" />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted">
              Modèle
              <input value={s.settings.ai.ollamaModel} onChange={(e) => setAi({ ollamaModel: e.target.value })} className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink" />
            </label>
            <p className="text-xs text-muted sm:col-span-2">
              Installez Ollama (ollama.com), puis <code>ollama pull llama3.2</code>. Pour autoriser l'application à l'appeler, lancez Ollama avec <code>OLLAMA_ORIGINS=*</code> (voir la documentation du projet).
            </p>
          </div>
        )}
      </Card>

      <SectionTitle>Installer l'application</SectionTitle>
      <Card className="p-5 text-sm">
        <p className="flex items-center gap-2">
          <Smartphone size={18} className="text-accent" aria-hidden /> Une fois installée, l'application fonctionne hors connexion (cours, exercices, révisions, écoutes si les voix sont locales).
        </p>
        {install ? (
          <Button className="mt-3" onClick={() => void install.prompt()}>
            Installer sur cet appareil
          </Button>
        ) : (
          <p className="mt-2 text-muted">iPhone/iPad : bouton Partager › « Sur l'écran d'accueil ». Android/Chrome/Edge : menu › « Installer l'application ».</p>
        )}
      </Card>

      <SectionTitle>Mes données</SectionTitle>
      <Card className="space-y-3 p-5 text-sm">
        <p>Vos progrès sont enregistrés uniquement sur cet appareil (stockage du navigateur). Aucun compte, aucun serveur, aucun traceur. Exportez une sauvegarde pour changer d'appareil ou en cas de nettoyage du navigateur.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportData}>
            <Download size={16} /> Exporter mes progrès
          </Button>
          <Button variant="secondary" onClick={() => file.current?.click()}>
            <Upload size={16} /> Importer une sauvegarde
          </Button>
          <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && void importData(e.target.files[0])} />
        </div>
        {msg && <p role="status">{msg}</p>}
        <Button
          variant="danger"
          onClick={() => {
            if (confirm("Effacer tous vos progrès sur cet appareil ? Cette action est définitive (pensez à exporter avant).")) void replaceState(initialState());
          }}
        >
          Tout réinitialiser
        </Button>
      </Card>
    </div>
  );
}
