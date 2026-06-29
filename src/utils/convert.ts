/**
 * convert.ts — Math and time conversion utilities
 * Ported from the original convert.js (1-click-timer v8.3.1)
 */

import type { HMS } from "@/types/messages";

// ── Constants ──────────────────────────────────────────────

const PI = Math.PI;
const PIx2 = 2 * PI;
const PI_2 = PI / 2;
const PI_30 = PI / 30;

// ── Radian / Degree ────────────────────────────────────────

/** Converts radian to degree */
export function rad2deg(rad: number): number {
  return (rad / PI) * 180;
}

/** Converts degree to radian */
export function deg2rad(deg: number): number {
  return (deg / 180) * PI;
}

// ── Angle / Rotation / Minute ──────────────────────────────

/**
 * Calculates the angle from the center for a point (x, y)
 * in a square with width and height `w`.
 * @returns angle in radians
 */
export function angleFromCenter(x: number, y: number, w: number): number {
  const w_2 = w / 2;
  return Math.atan2(w_2 - y, x - w_2);
}

/**
 * Converts an angle into a rotation value suitable for CSS rotate().
 */
export function angleToRotation(angle: number): number {
  if (angle < PI_2) {
    return -angle + PI_2;
  } else {
    return -angle + 5 * PI_2;
  }
}

/**
 * Converts a rotation angle into a minute value.
 */
export function rotationToMin(rotation: number): number {
  return (rotation * 60) / PIx2;
}

/**
 * Converts a minute (0–60) into a rotation angle.
 */
export function minToRotation(minute: number): number {
  return (minute * PIx2) / 60;
}

// ── Normalization ──────────────────────────────────────────

/** Normalizes a radian value to be between -PI and PI */
export function radNorm(rad: number): number {
  while (rad < -PI) rad += PIx2;
  while (rad > PI) rad -= PIx2;
  return rad;
}

/**
 * Normalizes a minute value to be between 0 and 60.
 * -120 → 0, 120 → 60
 */
export function minNorm(min: number): number {
  while (min < 0) min += 60;
  while (min > 60) min -= 60;
  return min;
}

// ── Radian ↔ Minute ────────────────────────────────────────

/** Converts radian to minute */
export function rad2min(rad: number): number {
  return -(30 * rad) / PI;
}

/** Converts minute to radian */
export function min2rad(min: number): number {
  return PI_2 - PI_30 * min;
}

/** Normalizes and then converts radian to minute */
export function rad2minNorm(rad: number): number {
  return minNorm(rad2min(rad));
}

/** Normalizes and then converts minute to radian (clockwise) */
export function min2radNorm(min: number): number {
  return radNorm(min2rad(min));
}

// ── Clockwise ↔ Anticlockwise ──────────────────────────────

/** Converts an angle from clockwise to anticlockwise (CSS/Canvas) */
export function clockwise2anticlockwise(a: number): number {
  return -a;
}

/** Converts an angle from anticlockwise to clockwise */
export function anticlockwise2clockwise(a: number): number {
  return -a;
}

// ── Space Mapping ──────────────────────────────────────────

/**
 * Maps a value from one numeric range to another.
 * @param srcMin - minimum possible value in the source space
 * @param srcMax - maximum possible value in the source space
 * @param dstMin - minimum possible value in the destination space
 * @param dstMax - maximum possible value in the destination space
 * @param x - the value in the source space
 * @returns the mapped value in the destination space
 */
export function mapSpace(
  srcMin: number,
  srcMax: number,
  dstMin: number,
  dstMax: number,
  x: number,
): number {
  return ((x - srcMin) * (dstMax - dstMin)) / (srcMax - srcMin) + dstMin;
}

// ── Number Formatting ──────────────────────────────────────

/**
 * Formats a number as a double-digit string (0-padded).
 * Defaults to 0 if no argument provided.
 */
export function doubleDigit(n: number = 0): string {
  const ret = n.toString();
  return n < 10 ? "0" + ret : ret;
}

/**
 * Converts a number of seconds to MM:SS string format.
 * Minutes over 60 are shown as-is (no hour display).
 */
export function msToString(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % (m * 60) || 0;
  return doubleDigit(m) + ":" + doubleDigit(s);
}

/** Converts minutes to MM:00 string format */
export function minToMMSS(minutes: number): string {
  return doubleDigit(minutes) + ":00";
}

// ── Value Clamping ─────────────────────────────────────────

/**
 * Clamps a value to the specified range [min, max].
 */
export function putInRange(val: number, min: number, max: number): number {
  if (val > max) return max;
  if (val < min) return min;
  return val;
}

// ── Time Conversion ────────────────────────────────────────

/**
 * Converts milliseconds to hour, minute, and second components.
 */
export function ms2hms(time: number): HMS {
  let ms = time;
  const hf = ms / 3_600_000;
  const h = Math.floor(hf);
  ms -= h * 3_600_000;
  const mf = ms / 60_000;
  const m = Math.floor(mf);
  ms -= m * 60_000;
  const sf = ms / 1000;
  const s = Math.floor(sf);
  ms -= s * 1000;
  return { hf, h, mf, m, sf, s, ms, time };
}

/** Converts milliseconds to a formatted string like "1:02:03" or "02:03" */
export function ms2hmsString(time: number): string {
  return hms2String(ms2hms(time));
}

/** Converts an HMS object to a display string */
export function hms2String(hms: HMS): string {
  return hourMinSec2String(hms.h, hms.m, hms.s);
}

/** Formats hours, minutes, seconds into a display string */
export function hourMinSec2String(
  hours: number,
  minutes: number,
  seconds: number,
): string {
  let ret = "";
  if (hours > 0) ret += hours + ":";
  ret += doubleDigit(minutes) + ":" + doubleDigit(seconds);
  return ret;
}

/** Converts seconds to HMS */
export function s2hms(s: number): HMS {
  return ms2hms(s * 1000);
}

/** Converts minutes to milliseconds */
export function m2ms(minutes: number): number {
  return minutes * 60_000;
}

// ── String Utilities ───────────────────────────────────────

/** Converts kebab-case-string to camelCaseString */
export function kebabToCamel(kebabCasedString: string): string {
  return kebabCasedString.replace(/-\w/g, (letter) =>
    letter.substring(1).toUpperCase(),
  );
}

// ── Badge Display ──────────────────────────────────────────

/**
 * Converts milliseconds to a max-4-char string suitable for the badge counter.
 * Returns empty string when ms is 0.
 */
export function msToShortMin(ms: number = 0): string {
  if (ms === 0) return "";
  const sec = ms / 1000;
  const min = Math.round(sec / 60);
  if (min <= 1) {
    return Math.round(sec) + "s";
  } else {
    return Math.round(min) + "m";
  }
}
