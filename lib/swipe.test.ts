import { describe, expect, it } from "vitest";

import { clampOffset, settleOffset, swipeAxis, viewSwipeStep } from "@/lib/swipe";

describe("swipeAxis", () => {
  it("drobny ruch nie rozstrzyga kierunku", () => {
    expect(swipeAxis(0, 0)).toBe("pending");
    expect(swipeAxis(-7, 5)).toBe("pending");
  });

  it("przeważający ruch poziomy to przesunięcie", () => {
    expect(swipeAxis(-20, 5)).toBe("horizontal");
    expect(swipeAxis(12, -3)).toBe("horizontal");
  });

  it("pionowy ruch i remis to przewijanie", () => {
    expect(swipeAxis(3, 20)).toBe("vertical");
    expect(swipeAxis(-10, -10)).toBe("vertical");
  });
});

describe("clampOffset", () => {
  it("trzyma przesunięcie między szerokością akcji a zerem", () => {
    expect(clampOffset(30, 128)).toBe(0);
    expect(clampOffset(-60, 128)).toBe(-60);
    expect(clampOffset(-300, 128)).toBe(-128);
  });
});

describe("settleOffset", () => {
  it("przyciąga do zera poniżej progu", () => {
    expect(settleOffset(0, 128)).toBe(0);
    expect(settleOffset(-50, 128)).toBe(0);
    expect(settleOffset(20, 128)).toBe(0);
  });

  it("przyciąga do szerokości akcji powyżej progu", () => {
    expect(settleOffset(-52, 128)).toBe(-128);
    expect(settleOffset(-500, 128)).toBe(-128);
  });
});

describe("viewSwipeStep", () => {
  it("w lewo – następny widok, w prawo – poprzedni", () => {
    expect(viewSwipeStep(-80, 10)).toBe(1);
    expect(viewSwipeStep(80, -10)).toBe(-1);
  });

  it("za krótko albo bardziej w pionie – bez zmiany", () => {
    expect(viewSwipeStep(-59, 0)).toBeNull();
    expect(viewSwipeStep(-80, 90)).toBeNull();
    expect(viewSwipeStep(80, 80)).toBeNull();
  });
});
