import { useState } from "react";
import { useNavigate } from "react-router";
import { Headphones, Mic, Shield, WifiOff } from "lucide-react";
import { Logo } from "@/components/Layout";
import { Button, Card, cx } from "@/components/ui";
import { flush, setState } from "@/state/store";

export function Onboarding() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState<30 | 45>(30);
  const finish = (to: string) => {
    setState((s) => ({ ...s, onboarded: true, name: name.trim(), settings: { ...s.settings, dailyMinutes: minutes } }));
    void flush();
    nav(to, { replace: true });
  };
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <Logo size={40} />
        <span className="font-display text-2xl font-semibold">English Coach</span>
      </div>
      <h1 className="font-display text-[34px] leading-tight font-semibold">De A2 à B2, 30 à 45 minutes par jour.</h1>
      <p className="mt-3 text-lg text-muted">Un programme complet : grammaire, vocabulaire, écoute, lecture, oral, Business English et évaluations. Gratuit, sans compte, sans publicité.</p>

      <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        {[
          { icon: WifiOff, t: "Fonctionne hors connexion", d: "Installable sur téléphone, tablette et ordinateur." },
          { icon: Shield, t: "Vos données restent chez vous", d: "Progrès enregistrés sur cet appareil, exportables." },
          { icon: Mic, t: "Professeur oral intégré", d: "Reconnaissance et synthèse vocales du navigateur." },
          { icon: Headphones, t: "Plusieurs accents", d: "Selon les voix disponibles sur votre appareil." },
        ].map(({ icon: Icon, t, d }) => (
          <li key={t} className="flex gap-3 rounded-2xl bg-surface p-3">
            <Icon size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <span>
              <span className="block font-medium">{t}</span>
              <span className="text-muted">{d}</span>
            </span>
          </li>
        ))}
      </ul>

      <Card className="mt-8 p-5">
        <label className="block text-sm font-medium">
          Votre prénom (facultatif)
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-line bg-surface px-3 text-base" autoComplete="given-name" />
        </label>
        <fieldset className="mt-5">
          <legend className="text-sm font-medium">Temps par jour</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {([30, 45] as const).map((m) => (
              <button key={m} type="button" aria-pressed={minutes === m} onClick={() => setMinutes(m)} className={cx("rounded-xl border p-3 text-left", minutes === m ? "border-accent bg-accent-soft" : "border-line")}>
                <span className="block font-semibold">{m} minutes</span>
                <span className="text-sm text-muted">{m === 30 ? "4 activités par jour" : "5 à 6 activités par jour"}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <Button full size="lg" className="mt-6" onClick={() => finish("/test/positionnement")}>
          Passer le test de positionnement (≈ 20 min)
        </Button>
        <Button full variant="ghost" className="mt-2" onClick={() => finish("/")}>
          Commencer directement au niveau A2
        </Button>
      </Card>
    </main>
  );
}
