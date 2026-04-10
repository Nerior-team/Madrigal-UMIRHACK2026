import { describe, expect, it } from "vitest";
import { getPaginationState } from "./pagination";

describe("getPaginationState", () => {
  it("clamps the current page inside the valid range", () => {
    expect(getPaginationState({ page: 9, pageSize: 20, totalItems: 35 })).toEqual(
      expect.objectContaining({
        page: 2,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      }),
    );
  });

  it("calculates a stable visible page window", () => {
    expect(getPaginationState({ page: 5, pageSize: 10, totalItems: 120, windowSize: 5 })).toEqual(
      expect.objectContaining({
        page: 5,
        totalPages: 12,
        visiblePages: [3, 4, 5, 6, 7],
      }),
    );
  });
});
