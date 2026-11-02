import { Navigate, Route, Routes, useLocation } from "react-router";
import { Layout } from "./components/Layout";
import { useAppState } from "./state/store";
import { Home } from "./pages/Home";
import { Onboarding } from "./pages/Onboarding";
import { AssessmentPage } from "./pages/Assessment";
import { Learn, VocabularyTheme } from "./pages/Learn";
import { LessonPage } from "./pages/Lesson";
import { ListenLibrary, ListenItemPage, DictationPage } from "./pages/Listen";
import { SpeakHub, ScenarioPage, FreeConversationPage, DrillPage } from "./pages/Speak";
import { ReadLibrary, ArticlePage } from "./pages/Read";
import { WritingPage } from "./pages/Write";
import { BusinessHub, BusinessThemePage } from "./pages/Business";
import { ReviewHub, ReviewSession, NewWords, Notebook } from "./pages/Review";
import { ProgressPage } from "./pages/Progress";
import { SettingsPage } from "./pages/Settings";
import { NotFound } from "./pages/NotFound";

export function App() {
  const s = useAppState();
  const loc = useLocation();
  if (!s.onboarded && loc.pathname !== "/bienvenue" && !loc.pathname.startsWith("/test")) return <Navigate to="/bienvenue" replace />;
  return (
    <Routes>
      <Route path="/bienvenue" element={<Onboarding />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="test/positionnement" element={<AssessmentPage id="placement" />} />
        <Route path="examen/:id" element={<AssessmentPage />} />
        <Route path="apprendre" element={<Learn />} />
        <Route path="apprendre/vocabulaire/:theme" element={<VocabularyTheme />} />
        <Route path="apprendre/:id" element={<LessonPage />} />
        <Route path="ecouter" element={<ListenLibrary />} />
        <Route path="ecouter/:id" element={<ListenItemPage />} />
        <Route path="ecouter/:id/dictee" element={<DictationPage />} />
        <Route path="parler" element={<SpeakHub />} />
        <Route path="parler/scenario/:id" element={<ScenarioPage />} />
        <Route path="parler/libre/:id" element={<FreeConversationPage />} />
        <Route path="parler/prononciation/:id" element={<DrillPage />} />
        <Route path="lire" element={<ReadLibrary />} />
        <Route path="lire/:id" element={<ArticlePage />} />
        <Route path="ecrire/:id" element={<WritingPage />} />
        <Route path="business" element={<BusinessHub />} />
        <Route path="business/:id" element={<BusinessThemePage />} />
        <Route path="revisions" element={<ReviewHub />} />
        <Route path="revisions/session" element={<ReviewSession />} />
        <Route path="revisions/nouveaux" element={<NewWords />} />
        <Route path="revisions/carnet" element={<Notebook />} />
        <Route path="progression" element={<ProgressPage />} />
        <Route path="reglages" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
