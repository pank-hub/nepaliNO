import type { SupportedLanguage } from "./config";
import { nb } from "./nb";
import { ne } from "./ne";

const translations = {
  ne,
  nb,
};

export function getTranslations(language: SupportedLanguage) {
  return translations[language];
}