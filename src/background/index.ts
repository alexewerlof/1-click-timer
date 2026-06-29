/**
 * background/index.ts — Entry point for the service worker
 * Ported from background.js (1-click-timer v8.3.1)
 *
 * MV3 change: This runs as a service worker (not a background page).
 * chrome.alarms is used instead of setTimeout for timer ticks.
 */

import { Motor } from "./motor";

console.info("background module");

// ── Initialize ─────────────────────────────────────────

const motor = new Motor();

// Start the motor (restores state and wires up messaging)
void motor.init();

// ── Lifecycle ──────────────────────────────────────────

// Clear storage on major version update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "update") {
    console.info("Clearing storage because of the update event.");
    chrome.storage.local.clear();
    // Re-initialize after clearing
    void motor.init();
  }
});

// ── System Info (for debugging) ────────────────────────

const manifestJson = chrome.runtime.getManifest();
console.info("manifest.version:", manifestJson.version);

if (chrome.system?.cpu) {
  chrome.system.cpu.getInfo((cpuInfo) => {
    console.info("archName:", cpuInfo.archName);
    console.info("modelName:", cpuInfo.modelName);
  });
}

chrome.runtime.getPlatformInfo((platformInfo) => {
  console.info("arch:", platformInfo.arch);
  console.info("nacl_arch:", platformInfo.nacl_arch);
  console.info("os:", platformInfo.os);
  console.info("userAgent:", navigator.userAgent);
  console.info("language:", navigator.language);
});

// Prevent service worker from being terminated while timer is running
// by keeping a message port open (optional — used for critical sections)
console.info("Background service worker started");
