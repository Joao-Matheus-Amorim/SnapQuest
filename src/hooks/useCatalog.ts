import { useCallback, useEffect, useState } from "react";
import { seedFighters } from "../js/core/fighters.js";
import { seedCards } from "../js/core/cards.js";
import { loadCatalog } from "../services/cloudSync";
import type { Fighter } from "../js/core/fighters.js";
import type { EffectCard } from "../js/core/cards.js";

type CatalogStatus = "loading" | "ready" | "fallback" | "error";
type CatalogSource = "cloud" | "seed-empty" | "seed-error";

export function useCatalog() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [cards, setCards] = useState<EffectCard[]>([]);
  const [status, setStatus] = useState<CatalogStatus>("loading");
  const [source, setSource] = useState<CatalogSource>("cloud");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setStatus("loading");
    setErrorMessage(null);

    loadCatalog()
      .then(({ fighters: f, cards: c }) => {
        if (!isMounted) return;

        if (f.length === 0 || c.length === 0) {
          setFighters(f.length > 0 ? f : seedFighters());
          setCards(c.length > 0 ? c : seedCards());
          setSource("seed-empty");
          setStatus("fallback");
          setErrorMessage("Catalogo remoto vazio ou incompleto. Usando base local para completar a batalha rapida.");
          return;
        }

        setFighters(f);
        setCards(c);
        setSource("cloud");
        setStatus("ready");
      })
      .catch((error) => {
        if (!isMounted) return;
        setFighters(seedFighters());
        setCards(seedCards());
        setSource("seed-error");
        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? `Catalogo remoto indisponivel: ${error.message}`
            : "Catalogo remoto indisponivel. Usando base local para batalha rapida."
        );
      });

    return () => {
      isMounted = false;
    };
  }, [tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { fighters, cards, status, source, errorMessage, reload };
}
