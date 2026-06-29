/**
 * badger.ts — Chrome extension badge management
 * Ported from badger.js (1-click-timer v8.3.1)
 *
 * Updates the extension's toolbar badge text, color, and icon.
 */

import { ms2hms, msToShortMin } from "@/utils/convert";

/**
 * Updates the badge text and color based on remaining time.
 */
export function setBadgeTime(time: number): void {
  const hms = ms2hms(time);

  let color: string;
  if (hms.mf <= 1) {
    color = "#f00"; // red — less than 1 minute
  } else if (hms.mf <= 10) {
    color = "#e58700"; // orange — 1–10 minutes
  } else {
    color = "#00af1d"; // green — more than 10 minutes
  }

  chrome.action.setBadgeText({ text: msToShortMin(time) });
  chrome.action.setBadgeBackgroundColor({ color });
}

/**
 * Updates the browser action icon based on timer state.
 */
export function setBadgeState(state: "running" | "paused" | "stopped"): void {
  let icon: { "19": string; "38": string };
  switch (state) {
    case "running":
      icon = {
        "19": "img/popup-icon-on-19.png",
        "38": "img/popup-icon-on-38.png",
      };
      break;
    case "paused":
    case "stopped":
    default:
      icon = {
        "19": "img/popup-icon-off-19.png",
        "38": "img/popup-icon-off-38.png",
      };
      break;
  }
  chrome.action.setIcon({ path: icon });
}
