import { ButtonLink, EmptyState } from "@/components/ui";

export function NotFound() {
  return <EmptyState title="Page introuvable" action={<ButtonLink to="/">Retour à l'accueil</ButtonLink>}>Ce contenu n'existe pas ou a été déplacé.</EmptyState>;
}
