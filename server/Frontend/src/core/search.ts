export type SearchTargetKind = "menu" | "machine" | "task" | "result";

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

function scoreTarget(query: string, target: SearchTarget): number {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return 0;

  const normalizedTitle = normalize(target.title);
  const normalizedSubtitle = normalize(target.subtitle ?? "");
  const normalizedKeywords = (target.keywords ?? []).map(normalize);
  const haystack = [normalizedTitle, normalizedSubtitle, ...normalizedKeywords]
    .filter(Boolean)
    .join(" ");

  if (!haystack.includes(normalizedQuery)) {
    const tokens = normalizedQuery.split(" ").filter(Boolean);
    if (!tokens.length || !tokens.every((token) => haystack.includes(token))) {
      return 0;
    }
  }

  let score = 100;
  if (normalizedTitle === normalizedQuery) {
    score += 400;
  } else if (normalizedTitle.startsWith(normalizedQuery)) {
    score += 300;
  } else if (normalizedTitle.includes(normalizedQuery)) {
    score += 220;
  }

  if (normalizedSubtitle.startsWith(normalizedQuery)) {
    score += 120;
  } else if (normalizedSubtitle.includes(normalizedQuery)) {
    score += 70;
  }

  if (normalizedKeywords.some((keyword) => keyword.startsWith(normalizedQuery))) {
    score += 80;
  } else if (normalizedKeywords.some((keyword) => keyword.includes(normalizedQuery))) {
    score += 40;
  }

  return score;
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
