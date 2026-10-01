export interface BaselineEntry {
  file: string;
  rule: string;
  line: number;
  reason: string;
}

export interface BaselineIssue {
  rule: string;
  line: number;
}

export function isKnownBaselineIssue(
  baseline: BaselineEntry[],
  file: string,
  issue: BaselineIssue,
): boolean {
  const normalizedFile = file.replace(/\\/g, '/');

  return baseline.some(
    (entry) =>
      entry.file.replace(/\\/g, '/') === normalizedFile &&
      entry.rule === issue.rule &&
      entry.line === issue.line,
  );
}
