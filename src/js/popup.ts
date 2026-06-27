/**
 * 1-click timer — Popup UI Controller (Manifest V3, TypeScript).
 */

import timer from "./timer.js";

// $ is set globally by zepto (loaded via a classic <script> tag in popup.html)
declare var $: ZeptoStatic;

const LOG_PREFIX = "[1-click-timer:popup]";

const $resetButton = $("#reset-button");
const $face = $("#face");
const $needle = $("#needle");
const $digits = $("#digits");
const $minutesValue = $("#minutes-value");
const $ringing = $("#ringing");
const $body = $("body");

const _PI = Math.PI;
const _2PI = 2 * _PI;
let _localInterval: ReturnType<typeof setInterval> | null = null;
let _audio: HTMLAudioElement | null = null;

// ---- Geometry helpers ------------------------------------------------

function getDegreeFromCenter(x: number, y: number, r: number): number {
  x -= r / 2;
  y = r / 2 - y;
  return rad2deg(Math.atan2(x, y));
}

function rad2deg(rad: number): number {
  if (rad < 0) rad += _2PI;
  return (rad * 180) / _PI;
}

function min2deg(min: number): number {
  return (min / 60) * 360;
}

function deg2min(deg: number): number {
  return Math.round((deg / 360) * 60);
}

// ---- Audio -----------------------------------------------------------

function playAudio(): void {
  if (!_audio) {
    _audio = new Audio(chrome.runtime.getURL("audio/song.ogg"));
    _audio.loop = true;
  }
  _audio.currentTime = 0;
  _audio.play().catch((err: Error) => {
    console.warn(LOG_PREFIX, "audio play failed:", err.message);
  });
  console.log(LOG_PREFIX, "audio playing");
}

function stopAudio(): void {
  if (_audio) {
    _audio.pause();
  }
}

// ---- UI update -------------------------------------------------------

function updateNeedle(): void {
  const deg = min2deg(timer.get() / 60);
  $needle.css("-webkit-transform", "rotate(" + deg.toFixed(3) + "deg)");
  $digits.text(timer.getM() + ":" + timer.getSS());
}

// ---- Local ticking ---------------------------------------------------

function startLocalTick(): void {
  if (_localInterval) return;
  console.log(LOG_PREFIX, "local tick started");
  let tickCount = 0;
  _localInterval = setInterval(() => {
    updateNeedle();
    tickCount++;

    if (tickCount % 5 === 0) {
      console.log(
        LOG_PREFIX,
        `ui: needle=${min2deg(timer.get() / 60).toFixed(1)}° digits=${timer.getM()}:${timer.getSS()}`,
      );
    }

    if (timer.isRunning() && timer.get() <= 0) {
      console.log(LOG_PREFIX, "timeup! playing audio");
      timer.alarming = true;
      timer.running = false;
      stopLocalTick();
      $ringing.show();
      playAudio();
      chrome.runtime.sendMessage({ action: "stop" });
    }
  }, 1000);
}

function stopLocalTick(): void {
  if (_localInterval) {
    clearInterval(_localInterval);
    _localInterval = null;
    console.log(LOG_PREFIX, "local tick stopped");
  }
}

// ---- Timer event listeners -------------------------------------------

const timerEventListeners: Record<string, () => void> = {
  start() {
    $digits.show();
    startLocalTick();
    console.log(LOG_PREFIX, "event: start");
  },
  stop() {
    $digits.hide();
    stopLocalTick();
    console.log(LOG_PREFIX, "event: stop");
  },
  timeup() {
    $ringing.show();
    playAudio();
    console.log(LOG_PREFIX, "event: timeup");
  },
  set() {
    updateNeedle();
  },
  reset() {
    stopLocalTick();
    stopAudio();
    $ringing.hide();
    $digits.hide();
    console.log(LOG_PREFIX, "event: reset");
  },
  silent() {
    stopAudio();
    $ringing.hide();
    updateNeedle();
    console.log(LOG_PREFIX, "event: silent");
  },
};

timer.on(timerEventListeners);

// ---- User interactions (zepto handlers use `any` — zepto has no TS types) ----

$face
  .on("mousemove", (e: any) => {
    const deg = getDegreeFromCenter(e.clientX, e.clientY, $body.width());
    $minutesValue.text(String(deg2min(deg)));
  })
  .on("click", (e: any) => {
    const deg = getDegreeFromCenter(e.clientX, e.clientY, $body.width());
    const seconds = deg2min(deg) * 60;

    if (seconds > 0) {
      timer.start(seconds);
      console.log(LOG_PREFIX, "action → SW: start", { seconds });
      chrome.runtime.sendMessage({ action: "start", seconds });
    } else {
      timer.stop();
      console.log(LOG_PREFIX, "action → SW: stop");
      chrome.runtime.sendMessage({ action: "stop" });
    }
  });

$resetButton.on("click", (e: any) => {
  timer.reset();
  console.log(LOG_PREFIX, "action → SW: reset");
  chrome.runtime.sendMessage({ action: "reset" });
  e.stopPropagation();
});

$ringing.on("click", (e: any) => {
  e.stopPropagation();
  e.preventDefault();
  timer.silent();
  console.log(LOG_PREFIX, "action → SW: silent");
  chrome.runtime.sendMessage({ action: "silent" });
});

// ---- Cleanup ---------------------------------------------------------

$(window).on("unload", () => {
  stopLocalTick();
  timer.off(timerEventListeners);
  console.log(LOG_PREFIX, "CLOSE");
});

// ---- Init: fetch state from service worker ---------------------------

interface SwState {
  running?: boolean;
  endTime?: number | null;
  alarming?: boolean;
  remaining?: number;
}

console.log(LOG_PREFIX, "OPEN");

chrome.runtime.sendMessage({ action: "getState" }, (state: SwState) => {
  if (chrome.runtime.lastError) {
    console.error(
      LOG_PREFIX,
      "ERROR: getState failed:",
      chrome.runtime.lastError.message,
    );
    timer.off(timerEventListeners);
    timer.set(0);
    timer.on(timerEventListeners);
    timerEventListeners.set();
    return;
  }

  console.log(LOG_PREFIX, "state from SW:", JSON.stringify(state));

  timer.off(timerEventListeners);

  if (state && state.running && state.endTime) {
    const remaining = Math.max(
      0,
      Math.round((state.endTime - Date.now()) / 1000),
    );

    if (remaining <= 0) {
      console.log(LOG_PREFIX, "timer already expired, showing timeup");
      timer.alarming = true;
      timer.running = false;
      timer.endTime = state.endTime;
    } else {
      console.log(LOG_PREFIX, `restoring timer: ${remaining}s remaining`);
      timer.restore(state.endTime);
    }
  } else if (state && state.alarming) {
    console.log(LOG_PREFIX, "alarming state, showing ringing");
    timer.alarming = true;
    timer.running = false;
    timer.endTime = null;
  } else {
    timer.set(0);
  }

  timer.on(timerEventListeners);
  timerEventListeners.set();

  if (timer.isRunning()) timerEventListeners.start();
  if (timer.isAlarming()) timerEventListeners.timeup();
});
