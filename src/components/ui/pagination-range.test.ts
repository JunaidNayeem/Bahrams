import { describe, expect, it } from "vitest";

import { paginationRange } from "./pagination-range";

describe("paginationRange", () => {
  it("lists every page when they fit", () => {
    expect(paginationRange(1, 1)).toEqual([1]);
    expect(paginationRange(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(paginationRange(1, 0)).toEqual([]);
  });

  it("collapses the end near the start", () => {
    expect(paginationRange(1, 12)).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 12]);
    expect(paginationRange(4, 12)).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 12]);
  });

  it("collapses the start near the end", () => {
    expect(paginationRange(12, 12)).toEqual([1, "ellipsis-start", 8, 9, 10, 11, 12]);
    expect(paginationRange(9, 12)).toEqual([1, "ellipsis-start", 8, 9, 10, 11, 12]);
  });

  it("collapses both sides in the middle", () => {
    expect(paginationRange(6, 12)).toEqual([1, "ellipsis-start", 5, 6, 7, "ellipsis-end", 12]);
  });

  it("clamps out-of-range pages", () => {
    expect(paginationRange(40, 12)).toEqual(paginationRange(12, 12));
    expect(paginationRange(-3, 12)).toEqual(paginationRange(1, 12));
  });
});
