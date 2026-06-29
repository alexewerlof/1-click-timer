<script setup lang="ts">
/**
 * TimerControls.vue — Pause/resume, reset, repeat, fullscreen buttons
 * Ported from the control buttons section of popup.html
 */

defineProps<{
  isRunning: boolean;
  isMinuteSetting: boolean;
}>();

const emit = defineEmits<{
  reset: [];
  "toggle-menu": [];
  "go-bigger": [];
  "motor-control": [];
  restart: [];
}>();
</script>

<template>
  <!-- Reset / Center button -->
  <button
    id="center-btn"
    title="Reset timer to 0"
    :class="{ 'minute-set': isMinuteSetting }"
    @click="emit('reset')"
  >
    <span class="fa fa-close" />
  </button>

  <!-- Show menu -->
  <button
    id="show-menu-btn"
    @click="emit('toggle-menu')"
  >
    <i class="fa fa-chevron-down" />
  </button>

  <!-- Full screen -->
  <button
    id="full-screen-btn"
    title="Open in a tab"
    @click="emit('go-bigger')"
  >
    <i class="fa fa-arrows-alt" />
  </button>

  <!-- Pause / Resume -->
  <button
    id="pause-resume-btn"
    @click="emit('motor-control')"
  >
    <img
      :class="{ 'animate-cog': isRunning }"
      src="/img/cog.svg"
      alt=""
    >
  </button>

  <!-- Repeat last timer -->
  <button
    id="repeat-btn"
    title="Repeat the last timer"
    @click="emit('restart')"
  >
    <i class="fa fa-history" />
  </button>
</template>
