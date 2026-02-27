import 'server-only';

export type SupportedLang = "zh" | "en";

export type Dictionary = typeof import("./dictionaries/zh.json");

const dictionaries: Record<SupportedLang, () => Promise<Dictionary>> = {
    zh: () => import("./dictionaries/zh.json").then((module) => module.default),
    en: () => import("./dictionaries/en.json").then((module) => module.default),
};

export const getDictionary = async (lang: SupportedLang | string | undefined | null): Promise<Dictionary> => {
    const selectedLang = (lang === "en" ? "en" : "zh") as SupportedLang;
    return dictionaries[selectedLang]();
};
