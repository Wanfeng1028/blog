"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary, SupportedLang } from "./get-dictionary";

const LangContext = createContext<{
  lang: SupportedLang;
  dictionary: Dictionary | null;
  toggle: () => void;
}>({ lang: "zh", dictionary: null, toggle: () => { } });

export function LangProvider({
  lang: initialLang,
  dictionary,
  children
}: {
  lang: SupportedLang;
  dictionary: Dictionary;
  children: ReactNode;
}) {
  const router = useRouter();
  const [lang, setLang] = useState<SupportedLang>(initialLang);

  useEffect(() => {
    // Sync state with prop if it changes from server
    setLang(initialLang);
  }, [initialLang]);

  const toggle = () => {
    const nextLang: SupportedLang = lang === "zh" ? "en" : "zh";
    // Set cookie for server rendering (1 year expiration)
    document.cookie = `site_lang=${nextLang}; path=/; max-age=31536000`;
    // Update local state and router
    setLang(nextLang);
    router.refresh(); // Refresh the page to fetch the new dictionary from the server
  };

  return <LangContext.Provider value={{ lang, dictionary, toggle }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export function useDictionary() {
  const context = useContext(LangContext);
  if (!context.dictionary) {
    throw new Error("useDictionary must be used within a LangProvider with dictionary prop");
  }
  return context.dictionary;
}
