import {
  getTranslationModule,
  isTranslationLanguage,
  isTranslationModuleId,
  type TranslationLanguage,
  type TranslationModuleId,
} from "./registry";

const MAX_CHANGES = 200;
const MAX_VALUE_LENGTH = 5_000;
const PLACEHOLDER_PATTERN = /\{[A-Za-z][A-Za-z0-9_]*\}/gu;

export type TranslationProposalChange = {
  key: string;
  originalValue: string;
  proposedValue: string;
};

export type ValidatedTranslationChange = TranslationProposalChange;

type ValidationError = {
  code: string;
  message: string;
  key?: string;
};

export type TranslationProposalValidation =
  | {
      ok: true;
      language: TranslationLanguage;
      moduleId: TranslationModuleId;
      changes: ValidatedTranslationChange[];
    }
  | {
      ok: false;
      errors: ValidationError[];
    };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasOnlyKeys = (
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
) => Object.keys(value).every((key) => allowedKeys.includes(key));

const placeholders = (value: string) =>
  [...value.matchAll(PLACEHOLDER_PATTERN)]
    .map((match) => match[0])
    .sort();

const sameStrings = (left: string[], right: string[]) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

export const validateTranslationProposal = (
  payload: unknown,
): TranslationProposalValidation => {
  if (
    !isRecord(payload) ||
    !hasOnlyKeys(payload, ["language", "module", "changes"])
  ) {
    return {
      ok: false,
      errors: [
        {
          code: "invalid_payload",
          message: "The proposal payload is not valid.",
        },
      ],
    };
  }

  const language =
    typeof payload.language === "string" ? payload.language : undefined;
  const moduleId =
    typeof payload.module === "string" ? payload.module : undefined;

  if (!isTranslationLanguage(language)) {
    return {
      ok: false,
      errors: [
        {
          code: "invalid_language",
          message: "The translation language is not supported.",
        },
      ],
    };
  }

  if (!isTranslationModuleId(moduleId)) {
    return {
      ok: false,
      errors: [
        {
          code: "invalid_module",
          message: "The translation module is not recognized.",
        },
      ],
    };
  }

  if (!Array.isArray(payload.changes) || payload.changes.length === 0) {
    return {
      ok: false,
      errors: [
        {
          code: "no_changes",
          message: "No translation changes were submitted.",
        },
      ],
    };
  }

  if (payload.changes.length > MAX_CHANGES) {
    return {
      ok: false,
      errors: [
        {
          code: "too_many_changes",
          message: `A proposal may contain at most ${MAX_CHANGES} changes.`,
        },
      ],
    };
  }

  const currentModule = getTranslationModule(language, moduleId);
  const currentByKey = new Map(
    currentModule.entries.map((entry) => [entry.key, entry.value]),
  );
  const seenKeys = new Set<string>();
  const errors: ValidationError[] = [];
  const changes: ValidatedTranslationChange[] = [];

  payload.changes.forEach((candidate, index) => {
    if (
      !isRecord(candidate) ||
      !hasOnlyKeys(candidate, ["key", "originalValue", "proposedValue"])
    ) {
      errors.push({
        code: "invalid_change",
        message: `Change ${index + 1} is not valid.`,
      });
      return;
    }

    const { key, originalValue, proposedValue } = candidate;

    if (
      typeof key !== "string" ||
      typeof originalValue !== "string" ||
      typeof proposedValue !== "string"
    ) {
      errors.push({
        code: "invalid_change",
        message: `Change ${index + 1} must contain string values.`,
      });
      return;
    }

    if (seenKeys.has(key)) {
      errors.push({
        code: "duplicate_key",
        key,
        message: "The same translation key was submitted more than once.",
      });
      return;
    }

    seenKeys.add(key);
    const currentValue = currentByKey.get(key);

    if (currentValue === undefined) {
      errors.push({
        code: "unknown_key",
        key,
        message: "This translation key is not allowlisted for the selected module.",
      });
      return;
    }

    if (currentValue !== originalValue) {
      errors.push({
        code: "stale_source",
        key,
        message:
          "The source wording changed after this page was loaded. Reload before continuing.",
      });
      return;
    }

    if (!proposedValue.trim()) {
      errors.push({
        code: "empty_value",
        key,
        message: "The proposed wording cannot be empty.",
      });
      return;
    }

    if (proposedValue !== proposedValue.trim()) {
      errors.push({
        code: "outer_whitespace",
        key,
        message: "Remove unintended leading or trailing whitespace.",
      });
      return;
    }

    if (proposedValue.length > MAX_VALUE_LENGTH) {
      errors.push({
        code: "value_too_long",
        key,
        message: `The proposed wording exceeds ${MAX_VALUE_LENGTH} characters.`,
      });
      return;
    }

    if (proposedValue.includes("\0")) {
      errors.push({
        code: "invalid_character",
        key,
        message: "The proposed wording contains an invalid character.",
      });
      return;
    }

    if (
      !sameStrings(
        placeholders(currentValue),
        placeholders(proposedValue),
      )
    ) {
      errors.push({
        code: "placeholder_mismatch",
        key,
        message: "Required placeholders must remain unchanged.",
      });
      return;
    }

    if (proposedValue === currentValue) {
      return;
    }

    changes.push({ key, originalValue, proposedValue });
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  if (changes.length === 0) {
    return {
      ok: false,
      errors: [
        {
          code: "no_changes",
          message: "No translation wording was changed.",
        },
      ],
    };
  }

  return {
    ok: true,
    language,
    moduleId,
    changes,
  };
};
