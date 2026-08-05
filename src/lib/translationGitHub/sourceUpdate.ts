import ts from "typescript";
import type {
  TranslationLanguage,
  TranslationModuleId,
} from "../translationBrowser/registry";
import type { ValidatedTranslationChange } from "../translationBrowser/validateProposal";

export const approvedTranslationFiles = {
  ne: {
    main: "src/i18n/ne.ts",
    eventSubmission: "src/i18n/eventSubmission.ne.ts",
    directorySubmission: "src/i18n/directorySubmission.ne.ts",
  },
  nb: {
    main: "src/i18n/nb.ts",
    eventSubmission: "src/i18n/eventSubmission.nb.ts",
    directorySubmission: "src/i18n/directorySubmission.nb.ts",
  },
} as const;

type SourceTarget = {
  filePath: string;
  exportName: string;
  sourceKey: string;
};

type SourceReplacement = {
  start: number;
  end: number;
  replacement: string;
  key: string;
};

const mainExportNames: Record<TranslationLanguage, string> = {
  ne: "ne",
  nb: "nb",
};

const eventSubmissionExportNames: Record<TranslationLanguage, string> = {
  ne: "eventSubmissionNe",
  nb: "eventSubmissionNB",
};

const directorySubmissionExportNames: Record<TranslationLanguage, string> = {
  ne: "directorySubmissionNe",
  nb: "directorySubmissionNB",
};

const unwrapExpression = (node: ts.Expression): ts.Expression => {
  let current = node;

  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current) ||
    ts.isTypeAssertionExpression(current)
  ) {
    current = current.expression;
  }

  return current;
};

const propertyName = (
  name: ts.PropertyName,
  sourceFile: ts.SourceFile,
): string | null => {
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name)
  ) {
    return name.text;
  }

  if (ts.isComputedPropertyName(name)) {
    return null;
  }

  return name.getText(sourceFile);
};

const parseKeySegments = (key: string): Array<string | number> => {
  const segments: Array<string | number> = [];
  const pattern = /([A-Za-z_$][A-Za-z0-9_$]*)|\[(\d+)\]/gu;
  let index = 0;

  for (const match of key.matchAll(pattern)) {
    if (match.index !== index) {
      if (key[index] === ".") {
        index += 1;
      }
      if (match.index !== index) {
        throw new Error(`InvalidTranslationKey:${key}`);
      }
    }

    if (match[1]) {
      segments.push(match[1]);
    } else if (match[2]) {
      segments.push(Number(match[2]));
    }

    index = match.index + match[0].length;
    if (key[index] === ".") index += 1;
  }

  if (index !== key.length || segments.length === 0) {
    throw new Error(`InvalidTranslationKey:${key}`);
  }

  return segments;
};

const resolveTarget = (
  language: TranslationLanguage,
  moduleId: TranslationModuleId,
  key: string,
): SourceTarget => {
  const files = approvedTranslationFiles[language];

  if (moduleId === "event-submission") {
    const prefix = "events.submission.";
    if (!key.startsWith(prefix)) throw new Error(`TranslationKeyModuleMismatch:${key}`);
    return {
      filePath: files.eventSubmission,
      exportName: eventSubmissionExportNames[language],
      sourceKey: key.slice(prefix.length),
    };
  }

  if (moduleId === "directory-submission") {
    const prefix = "directory.submission.";
    if (!key.startsWith(prefix)) throw new Error(`TranslationKeyModuleMismatch:${key}`);
    return {
      filePath: files.directorySubmission,
      exportName: directorySubmissionExportNames[language],
      sourceKey: key.slice(prefix.length),
    };
  }

  return {
    filePath: files.main,
    exportName: mainExportNames[language],
    sourceKey: key,
  };
};

const findExportInitializer = (
  sourceFile: ts.SourceFile,
  exportName: string,
): ts.Expression => {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const isExported = statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (!isExported) continue;

    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === exportName &&
        declaration.initializer
      ) {
        return unwrapExpression(declaration.initializer);
      }
    }
  }

  throw new Error(`TranslationExportNotFound:${exportName}`);
};

const findStringLiteral = (
  root: ts.Expression,
  segments: Array<string | number>,
  sourceFile: ts.SourceFile,
  fullKey: string,
): ts.StringLiteral | ts.NoSubstitutionTemplateLiteral => {
  let current = unwrapExpression(root);

  for (const segment of segments) {
    if (typeof segment === "number") {
      if (!ts.isArrayLiteralExpression(current)) {
        throw new Error(`TranslationStructureMismatch:${fullKey}`);
      }
      const element = current.elements[segment];
      if (!element || ts.isSpreadElement(element)) {
        throw new Error(`TranslationArrayIndexNotFound:${fullKey}`);
      }
      current = unwrapExpression(element as ts.Expression);
      continue;
    }

    if (!ts.isObjectLiteralExpression(current)) {
      throw new Error(`TranslationStructureMismatch:${fullKey}`);
    }

    const property = current.properties.find(
      (candidate): candidate is ts.PropertyAssignment =>
        ts.isPropertyAssignment(candidate) &&
        propertyName(candidate.name, sourceFile) === segment,
    );

    if (!property) throw new Error(`TranslationKeyNotFound:${fullKey}`);
    current = unwrapExpression(property.initializer);
  }

  if (
    !ts.isStringLiteral(current) &&
    !ts.isNoSubstitutionTemplateLiteral(current)
  ) {
    throw new Error(`TranslationValueIsNotString:${fullKey}`);
  }

  return current;
};

const escapeForQuote = (value: string, quote: string) => {
  let escaped = value
    .replaceAll("\\", "\\\\")
    .replaceAll("\r", "\\r")
    .replaceAll("\n", "\\n")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");

  if (quote === '"') escaped = escaped.replaceAll('"', '\\"');
  if (quote === "'") escaped = escaped.replaceAll("'", "\\'");
  if (quote === "`") {
    escaped = escaped.replaceAll("`", "\\`").replaceAll("${", "\\${");
  }

  return escaped;
};

const replacementForLiteral = (
  literal: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral,
  source: string,
  proposedValue: string,
) => {
  const originalToken = source.slice(literal.getStart(), literal.getEnd());
  const quote = originalToken[0];

  if (quote !== '"' && quote !== "'" && quote !== "`") {
    throw new Error("UnsupportedTranslationQuote");
  }

  return `${quote}${escapeForQuote(proposedValue, quote)}${quote}`;
};

export type TranslationSourceUpdateResult = {
  files: Array<{
    filePath: string;
    originalSource: string;
    updatedSource: string;
    changedKeys: string[];
  }>;
};

export const updateTranslationSources = (
  language: TranslationLanguage,
  moduleId: TranslationModuleId,
  changes: ValidatedTranslationChange[],
  sourceByFile: ReadonlyMap<string, string>,
): TranslationSourceUpdateResult => {
  if (changes.length === 0) throw new Error("NoTranslationChanges");

  const grouped = new Map<
    string,
    { exportName: string; changes: Array<ValidatedTranslationChange & { sourceKey: string }> }
  >();

  for (const change of changes) {
    const target = resolveTarget(language, moduleId, change.key);
    const group = grouped.get(target.filePath) ?? {
      exportName: target.exportName,
      changes: [],
    };

    if (group.exportName !== target.exportName) {
      throw new Error("TranslationExportBoundaryMismatch");
    }

    group.changes.push({ ...change, sourceKey: target.sourceKey });
    grouped.set(target.filePath, group);
  }

  const files = [...grouped.entries()].map(([filePath, group]) => {
    const source = sourceByFile.get(filePath);
    if (source === undefined) throw new Error(`TranslationSourceMissing:${filePath}`);

    const sourceFile = ts.createSourceFile(
      filePath,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );

    const sourceParseDiagnostics = (
      sourceFile as ts.SourceFile & {
        parseDiagnostics: readonly ts.Diagnostic[];
      }
    ).parseDiagnostics;

    if (sourceParseDiagnostics.length > 0) {
      throw new Error(`TranslationSourceParseFailed:${filePath}`);
    }

    const root = findExportInitializer(sourceFile, group.exportName);
    const replacements: SourceReplacement[] = [];
    const changedKeys = new Set<string>();

    for (const change of group.changes) {
      if (changedKeys.has(change.key)) throw new Error(`DuplicateTranslationKey:${change.key}`);
      changedKeys.add(change.key);

      const literal = findStringLiteral(
        root,
        parseKeySegments(change.sourceKey),
        sourceFile,
        change.key,
      );

      if (literal.text !== change.originalValue) {
        throw new Error(`StaleTranslationSource:${change.key}`);
      }

      replacements.push({
        start: literal.getStart(sourceFile),
        end: literal.getEnd(),
        replacement: replacementForLiteral(literal, source, change.proposedValue),
        key: change.key,
      });
    }

    replacements.sort((left, right) => right.start - left.start);

    for (let index = 1; index < replacements.length; index += 1) {
      if (replacements[index - 1].start < replacements[index].end) {
        throw new Error("OverlappingTranslationReplacements");
      }
    }

    let updatedSource = source;
    for (const replacement of replacements) {
      updatedSource =
        updatedSource.slice(0, replacement.start) +
        replacement.replacement +
        updatedSource.slice(replacement.end);
    }

    const updatedFile = ts.createSourceFile(
      filePath,
      updatedSource,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    const updatedParseDiagnostics = (
      updatedFile as ts.SourceFile & {
        parseDiagnostics: readonly ts.Diagnostic[];
      }
    ).parseDiagnostics;

    if (updatedParseDiagnostics.length > 0) {
      throw new Error(`UpdatedTranslationSourceParseFailed:${filePath}`);
    }

    return {
      filePath,
      originalSource: source,
      updatedSource,
      changedKeys: [...changedKeys],
    };
  });

  return { files };
};
