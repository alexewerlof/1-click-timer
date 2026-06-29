<script setup lang="ts">
/**
 * App.vue — Root component replacing AngularJS PopupController
 * Ported from popup.js (1-click-timer v8.3.1)
 */
import { ref, reactive, watch, onMounted, onUnmounted } from "vue";
import { Messenger } from "@/utils/messenger";
import {
  ms2hms,
  angleFromCenter,
  angleToRotation,
  rotationToMin,
  minToRotation,
} from "@/utils/convert";
import type { HMS } from "@/types/messages";

import ClockFace from "./components/ClockFace.vue";
import TimerControls from "./components/TimerControls.vue";
import VolumeControls from "./components/VolumeControls.vue";
import MenuPanel from "./components/MenuPanel.vue";
import AlarmPlayer from "./components/AlarmPlayer.vue";

// ── Messenger ──────────────────────────────────────────

const msg = new Messenger("FRONTEND");

// ── State ──────────────────────────────────────────────

const menuVisible = ref(false);
const minuteSet = ref(0);
const isMinuteSetting = ref(false);
const alarmControlsVisible = ref(false);
const volume = ref(100);
const isMuted = ref(false);
const isRunning = ref(false);
const motorTime = ref(0);
const alarmPlaying = ref(false);
const version = chrome.runtime.getManifest().version;

const remainingTime = reactive<HMS>({
  hf: 0,
  h: 0,
  mf: 0,
  m: 0,
  sf: 0,
  s: 0,
  ms: 0,
  time: 0,
});

// ── Methods ────────────────────────────────────────────

function moveMinuteSet(event: MouseEvent): void {
  const target = event.currentTarget as HTMLElement;
  const a = angleFromCenter(event.offsetX, event.offsetY, target.clientWidth);
  const rot = angleToRotation(a);
  minuteSet.value = Math.round(rotationToMin(rot)) || 60;
  event.stopPropagation();
}

function getRotationAngle(minute: number): string {
  return `rotate(${minToRotation(minute)}rad)`;
}

function motorControlBtn(): void {
  msg.trigger("motor.toggle");
}

function resetTimer(): void {
  msg.trigger("motor.reset");
}

function startTimer(value: number): void {
  msg.trigger("motor.start", value);
}

function restartTimer(): void {
  msg.trigger("motor.restart");
}

function setAlarmSignal(signalIndex: number): void {
  msg.trigger("alarm.setSignalIndex", signalIndex);
}

function goBigger(): void {
  chrome.tabs.getCurrent((tab) => {
    if (tab) {
      // Already in a tab — toggle fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.body.requestFullscreen();
      }
    } else {
      // In popup — open in a new tab
      chrome.tabs.create({
        url: chrome.runtime.getURL("index.html"),
        active: true,
        pinned: true,
      });
    }
  });
}

function openLink(url: string): void {
  chrome.tabs.create({ url, active: true });
}

function setVolume(newVolume: number): void {
  volume.value = newVolume;
  alarmControlsVisible.value = false;
}

// ── Lifecycle ──────────────────────────────────────────

onMounted(() => {
  // Get initial state from background
  msg.trigger("alarm.getVolume", undefined, (vol) => {
    if (typeof vol === "number") volume.value = vol;
  });

  msg.trigger("motor.getState", undefined, (state) => {
    isRunning.value = state === "running";
  });

  // Listen for motor events from background
  msg.on("motor.tick", (time) => {
    const t = Math.round((time as number) / 1000) * 1000;
    motorTime.value = t;
    Object.assign(remainingTime, ms2hms(Math.round(t as number)));
    isRunning.value = true;
  });

  msg.on("motor.pause", () => {
    isRunning.value = false;
  });

  msg.on("motor.end", () => {
    isRunning.value = false;
    alarmPlaying.value = true;
  });

  msg.on("motor.stop", () => {
    isRunning.value = false;
    alarmPlaying.value = false;
  });
});

onUnmounted(() => {
  console.info("Popup unmounting, unregistering listeners");
  msg.unregister();
});

// Watch volume changes and sync to background
watch(volume, (newVal) => {
  if (isFinite(newVal)) {
    isMuted.value = newVal === 0;
    msg.trigger("alarm.setVolume", newVal);
  }
});
</script>

<template>
  <main :class="{ 'menu-visible': menuVisible }">
    <div id="face">
      <ClockFace
        :remaining-time="remainingTime"
        :is-running="isRunning"
        :is-minute-setting="isMinuteSetting"
        :minute-set="minuteSet"
        :motor-time="motorTime"
        :get-rotation-angle="getRotationAngle"
        @mousemove-minute="moveMinuteSet"
        @start-timer="startTimer(minuteSet * 60000)"
        @mouseenter-minute="isMinuteSetting = true"
        @mouseleave-minute="isMinuteSetting = false"
      />
    </div>

    <TimerControls
      :is-running="isRunning"
      :is-minute-setting="isMinuteSetting"
      @reset="resetTimer"
      @toggle-menu="menuVisible = true"
      @go-bigger="goBigger"
      @motor-control="motorControlBtn"
      @restart="restartTimer"
    />

    <VolumeControls
      :alarm-controls-visible="alarmControlsVisible"
      :is-muted="isMuted"
      @toggle="alarmControlsVisible = !alarmControlsVisible"
      @set-volume="setVolume"
    />

    <MenuPanel
      :visible="menuVisible"
      :version="version"
      @close="menuVisible = false"
      @set-alarm-signal="setAlarmSignal"
      @open-link="openLink"
    />

    <AlarmPlayer
      :playing="alarmPlaying"
      @ended="alarmPlaying = false"
    />
  </main>
</template>
