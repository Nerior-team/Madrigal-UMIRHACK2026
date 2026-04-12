export type SearchTargetKind =
  | "menu"
  | "machine"
  | "task"
  | "result"
  | "access"
  | "profile"
  | "api_key"
  | "report";

export type SearchTarget = {
  id: string;
  kind: SearchTargetKind;
  title: string;
  subtitle?: string;
  href: string;
  keywords?: string[];
};

export type SearchMatch = SearchTarget & {
  score: number;
};

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isSubsequence(needle: string, haystack: string): boolean {
  if (!needle) return true;
  let needleIndex = 0;

  for (const character of haystack) {
    if (character === needle[needleIndex]) {
      needleIndex += 1;
      if (needleIndex === needle.length) {
        return true;
      }
    }
  }

  return false;
}

function scoreToken(token: string, value: string): number {
  if (!value) return 0;
  if (value === token) return 180;
  if (value.startsWith(token)) return 140;
  if (value.includes(token)) return 90;
  if (isSubsequence(token, value)) return 40;
  return 0;
}

function scoreField(tokens: string[], value: string): number {
  const normalizedValue = normalize(value);
  if (!normalizedValue) return 0;

  let score = 0;
  for (const token of tokens) {
    const tokenScore = scoreToken(token, normalizedValue);
    if (tokenScore <= 0) {
      return 0;
    }
    score += tokenScore;
  }

  return score;
}

function scoreTarget(query: string, target: SearchTarget): number {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return 0;

  const tokens = normalizedQuery.split(" ").filter(Boolean);
  if (!tokens.length) return 0;

  const title = normalize(target.title);
  const subtitle = normalize(target.subtitle ?? "");
  const keywords = (target.keywords ?? []).map(normalize).filter(Boolean);

  let distributedScore = 0;
  for (const token of tokens) {
    const bestTokenScore = Math.max(
      scoreToken(token, title),
      scoreToken(token, subtitle),
      ...keywords.map((keyword) => scoreToken(token, keyword)),
    );
    if (bestTokenScore <= 0) {
      return 0;
    }
    distributedScore += bestTokenScore;
  }

  const titleScore = scoreField(tokens, title);
  const subtitleScore = scoreField(tokens, subtitle);
  const keywordScores = keywords.map((keyword) => scoreField(tokens, keyword));
  const bestKeywordScore = keywordScores.length ? Math.max(...keywordScores) : 0;
  const bestFieldScore = Math.max(
    titleScore,
    subtitleScore,
    bestKeywordScore,
    distributedScore,
  );
  if (bestFieldScore <= 0) {
    return 0;
  }

  let score = bestFieldScore;

  if (title === normalizedQuery) {
    score += 420;
  } else if (title.startsWith(normalizedQuery)) {
    score += 260;
  } else if (title.includes(normalizedQuery)) {
    score += 180;
  } else if (isSubsequence(normalizedQuery, title)) {
    score += 70;
  }

  if (subtitle && subtitle.startsWith(normalizedQuery)) {
    score += 120;
  } else if (subtitle && subtitle.includes(normalizedQuery)) {
    score += 70;
  }

  if (keywords.some((keyword) => keyword.startsWith(normalizedQuery))) {
    score += 80;
  } else if (keywords.some((keyword) => keyword.includes(normalizedQuery))) {
    score += 40;
  }

  const kindWeight: Record<SearchTargetKind, number> = {
    menu: 12,
    machine: 16,
    task: 10,
    result: 8,
    access: 9,
    profile: 11,
    api_key: 7,
    report: 6,
  };

  return score + kindWeight[target.kind];
}

export function getSearchMatches(
  query: string,
  targets: SearchTarget[],
  limit = 8,
): SearchMatch[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  return targets
    .map((target) => ({
      ...target,
      score: scoreTarget(normalizedQuery, target),
    }))
    .filter((target) => target.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (left.kind !== right.kind) {
        return left.kind.localeCompare(right.kind, "ru");
      }

      return left.title.localeCompare(right.title, "ru");
    })
    .slice(0, limit);
}
