import { nb } from "../../i18n/nb";
import { ne } from "../../i18n/ne";

export const assignedTopLevelSections = [
  "languageName",
  "navigation",
  "home",
  "news",
  "events",
  "directory",
  "information",
  "footer",
  "common",
] as const;

type TranslationSource = Record<string, unknown>;

type TranslationLanguageAvailability = "both" | "ne-only" | "nb-only";

export type TranslationDiagnosticEntry = {
  key: string;
  value: string;
};

export type TranslationStructureIssue = {
  path: string;
  nepaliKind: string;
  norwegianKind: string;
};

export type UnassignedTranslationSection = {
  name: string;
  availability: TranslationLanguageAvailability;
  nepaliEntries: TranslationDiagnosticEntry[];
  norwegianEntries: TranslationDiagnosticEntry[];
  structuralIssues: TranslationStructureIssue[];
};

export type TranslationDiagnostics = {
  unassignedSections: UnassignedTranslationSection[];
  structuralIssues: TranslationStructureIssue[];
};

const assignedSections = new Set<string>(assignedTopLevelSections);

const approvedDirectionalCounterparts = [
  {
    nepaliPath: "news.readInNorwegian",
    norwegianPath: "news.readInNepali",
  },
  {
    nepaliPath: "information.readInNorwegian",
    norwegianPath: "information.readInNepali",
  },
] as const;

const isPlainObject = (value: unknown): value is TranslationSource =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const valueKind = (value: unknown) => {
  if (typeof value === "string") return "string";
  if (typeof value === "function") return "function";
  if (Array.isArray(value)) return "array";
  if (isPlainObject(value)) return "object";
  if (value === undefined) return "missing";
  if (value === null) return "null";
  return typeof value;
};

const flattenStrings = (
  value: unknown,
  prefix: string,
): TranslationDiagnosticEntry[] => {
  if (typeof value === "string") {
    return [{ key: prefix, value }];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      flattenStrings(item, `${prefix}[${index}]`),
    );
  }

  if (!isPlainObject(value)) {
    return [];
  }

  return Object.entries(value).flatMap(([key, item]) =>
    flattenStrings(item, prefix ? `${prefix}.${key}` : key),
  );
};

const collectStructure = (
  value: unknown,
  prefix: string,
  result = new Map<string, string>(),
) => {
  const kind = valueKind(value);
  result.set(prefix || "(root)", kind);

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectStructure(item, `${prefix}[${index}]`, result),
    );
  } else if (isPlainObject(value)) {
    for (const [key, item] of Object.entries(value)) {
      collectStructure(item, prefix ? `${prefix}.${key}` : key, result);
    }
  }

  return result;
};

const compareStructure = (
  nepaliValue: unknown,
  norwegianValue: unknown,
  prefix = "",
): TranslationStructureIssue[] => {
  const nepaliStructure = collectStructure(nepaliValue, prefix);
  const norwegianStructure = collectStructure(norwegianValue, prefix);
  const paths = new Set([
    ...nepaliStructure.keys(),
    ...norwegianStructure.keys(),
  ]);

  const approvedDirectionalPaths = new Set<string>();

  for (const counterpart of approvedDirectionalCounterparts) {
    const isApproved =
      nepaliStructure.get(counterpart.nepaliPath) === "string" &&
      !norwegianStructure.has(counterpart.nepaliPath) &&
      !nepaliStructure.has(counterpart.norwegianPath) &&
      norwegianStructure.get(counterpart.norwegianPath) === "string";

    if (isApproved) {
      approvedDirectionalPaths.add(counterpart.nepaliPath);
      approvedDirectionalPaths.add(counterpart.norwegianPath);
    }
  }

  return [...paths]
    .sort()
    .flatMap((path) => {
      const nepaliKind = nepaliStructure.get(path) ?? "missing";
      const norwegianKind = norwegianStructure.get(path) ?? "missing";

      return nepaliKind === norwegianKind ||
        approvedDirectionalPaths.has(path)
        ? []
        : [{ path, nepaliKind, norwegianKind }];
    });
};

export const analyzeTranslationSources = (
  nepaliSource: TranslationSource,
  norwegianSource: TranslationSource,
): TranslationDiagnostics => {
  const allTopLevelSections = new Set([
    ...Object.keys(nepaliSource),
    ...Object.keys(norwegianSource),
  ]);

  const unassignedNames = [...allTopLevelSections]
    .filter((section) => !assignedSections.has(section))
    .sort();

  const unassignedSections = unassignedNames.map((name) => {
    const hasNepali = Object.hasOwn(nepaliSource, name);
    const hasNorwegian = Object.hasOwn(norwegianSource, name);
    const availability: TranslationLanguageAvailability =
      hasNepali && hasNorwegian
        ? "both"
        : hasNepali
          ? "ne-only"
          : "nb-only";

    return {
      name,
      availability,
      nepaliEntries: hasNepali
        ? flattenStrings(nepaliSource[name], name)
        : [],
      norwegianEntries: hasNorwegian
        ? flattenStrings(norwegianSource[name], name)
        : [],
      structuralIssues: compareStructure(
        nepaliSource[name],
        norwegianSource[name],
        name,
      ),
    };
  });

  return {
    unassignedSections,
    structuralIssues: compareStructure(nepaliSource, norwegianSource),
  };
};

export const getTranslationDiagnostics = () =>
  analyzeTranslationSources(
    ne as unknown as TranslationSource,
    nb as unknown as TranslationSource,
  );
