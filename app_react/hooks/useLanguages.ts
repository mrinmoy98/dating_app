import { useEffect, useState } from "react";
import { api } from "../lib/api";

/** A user may pick at most this many languages (mirrors the backend DTO). */
export const MAX_LANGUAGES = 3;

/** Used only if the backend is unreachable, so the picker is never empty. */
const FALLBACK = [
  "English", "Hindi", "Bengali", "Tamil", "Telugu", "Marathi",
  "Gujarati", "Kannada", "Malayalam", "Punjabi", "Urdu",
];

/**
 * Language list managed by the super admin (CMS → Languages).
 * Drives the registration picker and the profile editor.
 */
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
        /* keep the fallback list */
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { languages, loading, MAX_LANGUAGES };
}
