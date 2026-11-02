import { Link, useParams } from "react-router";
import { ArrowLeft, BookmarkPlus, Check, Mic, Newspaper, PenLine } from "lucide-react";
import { BUSINESS, WORDS, articleById, scenarioById, themeById, themeStage, writingById } from "@/content";
import { addCard, addWords } from "@/state/actions";
import { useAppState } from "@/state/store";
import { isLearned } from "@/lib/srs";
import { currentStage } from "@/lib/progress";
import { Button, Card, LevelPill, Notice, PageHeader, Pill, Progress, SectionTitle, SpeakButton } from "@/components/ui";

export function BusinessHub() {
  const s = useAppState();
  const stage = currentStage(s);
  return (
    <div>
      <PageHeader eyebrow="Business English" title="L'anglais professionnel" subtitle="Vocabulaire, mises en situation, emails et articles pour travailler en anglais : réunions, négociations, présentations, finance, relation client." />
      <Notice tone="accent">
        Le vocabulaire professionnel est aussi intégré à votre parcours principal : il arrive dans vos nouveaux mots à partir de l'étape 2, et un jour sur trois le programme du jour propose une activité business. Vous êtes à l'étape {stage}.
      </Notice>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BUSINESS.map((b) => {
          const words = WORDS.filter((w) => w.theme === b.vocabTheme);
          const learned = words.filter((w) => s.cards[`word:${w.id}`] && isLearned(s.cards[`word:${w.id}`])).length;
          return (
            <Link key={b.id} to={`/business/${b.id}`} className="flex flex-col rounded-2xl border border-line bg-surface p-4 hover:border-accent">
              <p className="font-semibold">{b.title}</p>
              <p className="text-sm text-muted" lang="en">{b.titleEn}</p>
              <p className="mt-2 flex-1 text-sm text-muted">{b.description}</p>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-muted tabular">
                  <span>{words.length} mots · {b.scenarios.length} mises en situation</span>
                  <span>{learned}/{words.length}</span>
                </div>
                <Progress value={words.length ? learned / words.length : 0} label={`${b.title} : mots appris`} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function BusinessThemePage() {
  const { id } = useParams();
  const s = useAppState();
  const b = BUSINESS.find((x) => x.id === id);
  if (!b) return <Notice tone="danger">Thème introuvable.</Notice>;
  const words = WORDS.filter((w) => w.theme === b.vocabTheme);
  const missing = words.filter((w) => !s.cards[`word:${w.id}`]);
  const stage = themeStage.get(b.vocabTheme);
  return (
    <div>
      <Link to="/business" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> Business English
      </Link>
      <PageHeader eyebrow={`Business · étape ${stage} du parcours`} title={b.title} subtitle={b.description} />

      <SectionTitle>Phrases clés</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-2">
        {b.phrases.map((p) => (
          <Card key={p.en} className="flex items-center gap-3 p-3">
            <SpeakButton text={p.en} size="sm" />
            <div>
              <p className="font-medium" lang="en">{p.en}</p>
              <p className="text-sm text-muted">{p.fr}</p>
            </div>
          </Card>
        ))}
      </div>

      {(b.scenarios.length > 0 || b.writing.length > 0 || b.articles.length > 0) && (
        <>
          <SectionTitle>Mises en situation et pratique</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            {b.scenarios.map((sid) => {
              const sc = scenarioById.get(sid)!;
              return (
                <Link key={sid} to={`/parler/scenario/${sid}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-accent">
                  <Mic size={18} className="text-accent" aria-hidden />
                  <span className="flex-1"><span className="block font-medium">{sc.title}</span><span className="text-sm text-muted">Conversation guidée</span></span>
                  <LevelPill level={sc.level} />
                </Link>
              );
            })}
            {b.writing.map((wid) => {
              const w = writingById.get(wid)!;
              return (
                <Link key={wid} to={`/ecrire/${wid}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-accent">
                  <PenLine size={18} className="text-accent" aria-hidden />
                  <span className="flex-1"><span className="block font-medium">{w.title}</span><span className="text-sm text-muted">Rédaction</span></span>
                  <LevelPill level={w.level} />
                </Link>
              );
            })}
            {b.articles.map((aid) => {
              const a = articleById.get(aid)!;
              return (
                <Link key={aid} to={`/lire/${aid}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-accent">
                  <Newspaper size={18} className="text-accent" aria-hidden />
                  <span className="flex-1"><span className="block font-medium" lang="en">{a.title}</span><span className="text-sm text-muted">Lecture</span></span>
                  <LevelPill level={a.level} />
                </Link>
              );
            })}
          </div>
        </>
      )}

      <SectionTitle action={missing.length > 0 && <Button size="sm" onClick={() => addWords(missing.map((w) => w.id))}><BookmarkPlus size={14} /> Tout ajouter ({missing.length})</Button>}>
        Vocabulaire · {themeById.get(b.vocabTheme)?.title}
      </SectionTitle>
      <div className="grid gap-2 md:grid-cols-2">
        {words.map((w) => (
          <Card key={w.id} className="flex items-start gap-3 p-3">
            <SpeakButton text={w.en} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold" lang="en">{w.en} <span className="font-normal text-muted">{w.ipa}</span></p>
              <p className="text-sm">{w.fr}</p>
              <p className="mt-1 text-sm text-muted" lang="en">{w.example}</p>
            </div>
            {s.cards[`word:${w.id}`] ? <Pill tone="success"><Check size={12} /> carnet</Pill> : (
              <button type="button" onClick={() => addCard("word", w.id)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-2" aria-label={`Ajouter ${w.en}`}>
                <BookmarkPlus size={18} className="text-accent" />
              </button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
