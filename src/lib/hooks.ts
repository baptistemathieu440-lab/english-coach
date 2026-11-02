import { useSearchParams } from "react-router";

/** Identifiant de l'activité du programme du jour (paramètre ?plan=…), s'il y en a un. */
export function usePlanId(): string | undefined {
  const [sp] = useSearchParams();
  return sp.get("plan") ?? undefined;
}
