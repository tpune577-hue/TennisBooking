"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type MarketingLang = "en" | "th";

const LANG_KEY = "gta-lang";

const LangContext = createContext<{
  lang: MarketingLang;
  setLang: (lang: MarketingLang) => void;
} | null>(null);

export function MarketingLangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<MarketingLang>("en");

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "th" || stored === "en") setLangState(stored);
  }, []);

  const setLang = useCallback((next: MarketingLang) => {
    localStorage.setItem(LANG_KEY, next);
    setLangState(next);
  }, []);

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <div
        className={`marketing-site lang-${lang}`}
        lang={lang === "th" ? "th" : "en"}
        suppressHydrationWarning
      >
        {children}
      </div>
    </LangContext.Provider>
  );
}

export function useMarketingLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useMarketingLang must be used within MarketingLangProvider");
  return ctx;
}

export function Bilingual({ en, th }: { en: ReactNode; th: ReactNode }) {
  return (
    <>
      <span className="t-en">{en}</span>
      <span className="t-th">{th}</span>
    </>
  );
}
