<script setup lang="ts">
/**
 * ClockFace.vue — The analog clock face with rotating hands
 * Ported from the clock face section of popup.html
 */
import type { HMS } from "@/types/messages";

defineProps<{
  remainingTime: HMS;
  isRunning: boolean;
  isMinuteSetting: boolean;
  minuteSet: number;
  motorTime: number;
  getRotationAngle: (minute: number) => string;
}>();

const emit = defineEmits<{
  "mousemove-minute": [event: MouseEvent];
  "start-timer": [];
  "mouseenter-minute": [];
  "mouseleave-minute": [];
}>();

function msToShortMin(ms: number): string {
  if (ms === 0) return "";
  const sec = ms / 1000;
  const min = Math.round(sec / 60);
  if (min <= 1) return Math.round(sec) + "s";
  return Math.round(min) + "m";
}
</script>

<template>
  <!-- Minute hand -->
  <div
    id="minute"
    :style="{ transform: getRotationAngle(remainingTime.mf) }"
  />

  <!-- Second hand (hidden during minute setting) -->
  <div
    v-show="!isMinuteSetting"
    id="second"
    :style="{ transform: getRotationAngle(remainingTime.s) }"
  />

  <!-- Minute number display (shown when running) -->
  <div
    v-show="isRunning"
    id="minute-number"
  >
    <span>{{ msToShortMin(motorTime) }}</span>
  </div>

  <!-- Minute-set hand (shown during minute setting) -->
  <div
    v-show="isMinuteSetting"
    id="minute-set"
    :style="{ transform: getRotationAngle(minuteSet) }"
  />

  <!-- Minute-set number -->
  <div
    v-show="isMinuteSetting"
    id="minute-set-number"
  >
    <span>{{ minuteSet }}</span>
  </div>

  <!-- Invisible area for mouse-based minute setting -->
  <div
    id="minute-area"
    @mouseenter="emit('mouseenter-minute')"
    @mouseleave="emit('mouseleave-minute')"
    @mousemove="emit('mousemove-minute', $event)"
    @click="emit('start-timer')"
  />
</template>
