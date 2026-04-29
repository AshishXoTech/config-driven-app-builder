import { createContext, useContext, useState, useCallback } from "react";

/**
 * Supported languages.
 */
const LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "hi", label: "HI", name: "हिन्दी" },
];

const DEFAULT_LANG = "en";

const LanguageContext = createContext({
  lang: DEFAULT_LANG,
  setLang: () => {},
  languages: LANGUAGES,
  resolveLabel: (label) => label,
});

/**
 * Resolve a label value based on the current language.
 *
 * Handles three formats:
 * 1. Object: { en: "Name", hi: "नाम" } → returns current lang, falls back to "en"
 * 2. String: "Name" → returned as-is (backward compatible)
 * 3. Falsy: returns the fallback
 */
function resolve(label, lang, fallback = "") {
  if (!label) return fallback;

  // Plain string — backward compatible with old config format
  if (typeof label === "string") return label;

  // Object — multi-language label
  if (typeof label === "object" && label !== null) {
    return label[lang] || label[DEFAULT_LANG] || label.en || fallback;
  }

  return fallback;
}

/**
 * Language provider — wraps the app to provide language state.
 */
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(DEFAULT_LANG);

  const resolveLabel = useCallback(
    (label, fallback) => resolve(label, lang, fallback),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, languages: LANGUAGES, resolveLabel }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to access language context.
 *
 * Returns:
 * - lang: current language code ("en" | "hi")
 * - setLang: setter function
 * - languages: array of available languages
 * - resolveLabel: function to resolve a label for the current language
 */
export function useLanguage() {
  return useContext(LanguageContext);
}
