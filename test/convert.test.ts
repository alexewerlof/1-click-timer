/**
 * Tests for convert.ts — the math and time conversion utilities
 * Ported from the original test/timer-test.js patterns
 */
import { describe, it, expect } from "vitest";
import {
  rad2deg,
  deg2rad,
  angleFromCenter,
  rotationToMin,
  minToRotation,
  minNorm,
  radNorm,
  doubleDigit,
  m2ms,
  ms2hms,
  msToShortMin,
  msToString,
  minToMMSS,
  putInRange,
  hms2String,
  hourMinSec2String,
  kebabToCamel,
  mapSpace,
} from "@/utils/convert";

const PI = Math.PI;

describe("rad2deg", () => {
  it("converts PI to 180", () => {
    expect(rad2deg(PI)).toBeCloseTo(180);
  });
  it("converts 0 to 0", () => {
    expect(rad2deg(0)).toBe(0);
  });
  it("converts 2*PI to 360", () => {
    expect(rad2deg(2 * PI)).toBeCloseTo(360);
  });
});

describe("deg2rad", () => {
  it("converts 180 to PI", () => {
    expect(deg2rad(180)).toBeCloseTo(PI);
  });
  it("converts 0 to 0", () => {
    expect(deg2rad(0)).toBe(0);
  });
  it("converts 90 to PI/2", () => {
    expect(deg2rad(90)).toBeCloseTo(PI / 2);
  });
});

describe("angleFromCenter", () => {
  it("returns 0 for center-right point", () => {
    // At (w, w/2) — directly to the right of center
    const result = angleFromCenter(300, 150, 300);
    expect(result).toBeCloseTo(0);
  });
  it("returns PI/2 for top-center", () => {
    // At (w/2, 0) — directly above center
    const result = angleFromCenter(150, 0, 300);
    expect(result).toBeCloseTo(PI / 2);
  });
});

describe("rotationToMin", () => {
  it("converts 0 to 0", () => {
    expect(rotationToMin(0)).toBe(0);
  });
  it("converts 2*PI to 60", () => {
    expect(rotationToMin(2 * PI)).toBeCloseTo(60);
  });
});

describe("minToRotation", () => {
  it("converts 0 to 0", () => {
    expect(minToRotation(0)).toBe(0);
  });
  it("converts 60 to 2*PI", () => {
    expect(minToRotation(60)).toBeCloseTo(2 * PI);
  });
});

describe("minNorm", () => {
  it("leaves 30 unchanged", () => {
    expect(minNorm(30)).toBe(30);
  });
  it("wraps -30 to 30", () => {
    expect(minNorm(-30)).toBe(30);
  });
  it("wraps 120 to 60", () => {
    expect(minNorm(120)).toBe(60);
  });
  it("wraps -120 to 0", () => {
    expect(minNorm(-120)).toBe(0);
  });
});

describe("radNorm", () => {
  it("leaves 1 unchanged", () => {
    expect(radNorm(1)).toBeCloseTo(1);
  });
});

describe("doubleDigit", () => {
  it("pads single digit", () => {
    expect(doubleDigit(5)).toBe("05");
  });
  it("keeps double digit", () => {
    expect(doubleDigit(42)).toBe("42");
  });
  it("defaults to 00 for no arg", () => {
    expect(doubleDigit()).toBe("00");
  });
  it("handles 0", () => {
    expect(doubleDigit(0)).toBe("00");
  });
});

describe("m2ms", () => {
  it("converts 1 minute to 60000ms", () => {
    expect(m2ms(1)).toBe(60000);
  });
  it("converts 5 minutes to 300000ms", () => {
    expect(m2ms(5)).toBe(300000);
  });
});

describe("ms2hms", () => {
  it("breaks down 3661000ms to 1h 1m 1s", () => {
    const result = ms2hms(3661000);
    expect(result.h).toBe(1);
    expect(result.m).toBe(1);
    expect(result.s).toBe(1);
  });
  it("breaks down 0ms", () => {
    const result = ms2hms(0);
    expect(result.h).toBe(0);
    expect(result.m).toBe(0);
    expect(result.s).toBe(0);
  });
  it("breaks down 60000ms to 1m 0s", () => {
    const result = ms2hms(60000);
    expect(result.h).toBe(0);
    expect(result.m).toBe(1);
    expect(result.s).toBe(0);
  });
});

describe("msToShortMin", () => {
  it("returns empty for 0ms", () => {
    expect(msToShortMin(0)).toBe("");
  });
  it("returns 30s for 30000ms", () => {
    expect(msToShortMin(30000)).toBe("30s");
  });
  it("returns 60s for 60000ms (<=1 min shows seconds)", () => {
    expect(msToShortMin(60000)).toBe("60s");
  });
  it("returns 5m for 300000ms", () => {
    expect(msToShortMin(300000)).toBe("5m");
  });
});

describe("msToString", () => {
  it("formats 65 seconds as 01:05", () => {
    expect(msToString(65)).toBe("01:05");
  });
  it("formats 0 seconds as 00:00", () => {
    expect(msToString(0)).toBe("00:00");
  });
});

describe("minToMMSS", () => {
  it("formats 5 minutes as 05:00", () => {
    expect(minToMMSS(5)).toBe("05:00");
  });
});

describe("putInRange", () => {
  it("clamps above max", () => {
    expect(putInRange(150, 0, 100)).toBe(100);
  });
  it("clamps below min", () => {
    expect(putInRange(-10, 0, 100)).toBe(0);
  });
  it("keeps value in range", () => {
    expect(putInRange(50, 0, 100)).toBe(50);
  });
});

describe("hms2String", () => {
  it("formats hms with hours", () => {
    const hms = { hf: 1.5, h: 1, mf: 2.5, m: 2, sf: 3.5, s: 3, ms: 0, time: 0 };
    expect(hms2String(hms)).toBe("1:02:03");
  });
  it("formats hms without hours", () => {
    const hms = { hf: 0, h: 0, mf: 5, m: 5, sf: 30, s: 30, ms: 0, time: 0 };
    expect(hms2String(hms)).toBe("05:30");
  });
});

describe("hourMinSec2String", () => {
  it("includes hours when > 0", () => {
    expect(hourMinSec2String(1, 2, 3)).toBe("1:02:03");
  });
  it("omits hours when 0", () => {
    expect(hourMinSec2String(0, 5, 30)).toBe("05:30");
  });
});

describe("kebabToCamel", () => {
  it("converts kebab-case to camelCase", () => {
    expect(kebabToCamel("hello-world")).toBe("helloWorld");
  });
  it("handles single word", () => {
    expect(kebabToCamel("hello")).toBe("hello");
  });
});

describe("mapSpace", () => {
  it("maps 0 from [-1,1] to [0,100]", () => {
    expect(mapSpace(-1, 1, 0, 100, 0)).toBe(50);
  });
  it("maps -1 from [-1,1] to [0,100]", () => {
    expect(mapSpace(-1, 1, 0, 100, -1)).toBe(0);
  });
  it("maps 1 from [-1,1] to [0,100]", () => {
    expect(mapSpace(-1, 1, 0, 100, 1)).toBe(100);
  });
});
