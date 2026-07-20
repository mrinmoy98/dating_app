import { useEffect, useState } from "react";
import { api } from "../lib/api";

export const MAX_LANGUAGES = 3;

const FALLBACK = [
  "English", "Hindi", "Bengali", "Tamil", "Telugu", "Marathi",
  "Gujarati", "Kannada", "Malayalam", "Punjabi", "Urdu",
];

export function useLanguages() {
  const [languages, setLanguages] = useState<string[]>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .languages()
      .then((rows) => {
        if (!active || !rows?.length) return;
        setLanguages(rows.map((r) => r.title).filter(Boolean));
      })
      .catch(() => {
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { languages, loading, MAX_LANGUAGES };
}
