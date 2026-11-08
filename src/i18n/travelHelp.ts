import {en} from "./en";
import {nb} from "./nb";
import {ne} from "./ne";

type TranslationShape<T> = {
  [K in keyof T]: T[K] extends string ? string : TranslationShape<T[K]>;
};

export type TravelHelpLabels = TranslationShape<typeof en.travelHelp>;
export const travelHelp = {en: en.travelHelp, nb: nb.travelHelp, ne: ne.travelHelp};

export function getTravelHelpLabels(language: string, labels?: Partial<TravelHelpLabels>): TravelHelpLabels {
  const localized = language === "ne" ? ne.travelHelp : language === "nb" ? nb.travelHelp : en.travelHelp;
  const defined = Object.fromEntries(Object.entries(labels ?? {}).filter(([, value]) => value !== undefined));
  const localizedDefined = Object.fromEntries(Object.entries(localized).filter(([, value]) => value !== undefined));
  return {
    ...en.travelHelp,
    ...localizedDefined,
    ...defined,
    modes: {...en.travelHelp.modes, ...localized.modes, ...labels?.modes},
  };
}

export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (token, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : token,
  );
}
