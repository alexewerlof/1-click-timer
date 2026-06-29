<script setup lang="ts">
/**
 * VolumeControls.vue — Mute/unmute button with volume level popup
 * Ported from the alarm sound buttons section of popup.html
 */

defineProps<{
  alarmControlsVisible: boolean;
  isMuted: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
  "set-volume": [volume: number];
}>();
</script>

<template>
  <!-- Mute / Unmute toggle -->
  <button
    id="mute-unmute-btn"
    title="Alarm sound"
    @click="emit('toggle')"
  >
    <i
      v-show="isMuted"
      class="fa fa-bell-slash-o"
    />
    <i
      v-show="!isMuted"
      class="fa fa-bell-o"
    />
  </button>

  <!-- Volume Mute -->
  <button
    v-show="alarmControlsVisible"
    id="volume-mute-btn"
    class="animated"
    title="Mute"
    @click="emit('set-volume', 0)"
  >
    <i class="fa fa-bell-slash-o" />
  </button>

  <!-- Volume Low -->
  <button
    v-show="alarmControlsVisible"
    id="volume-low-btn"
    class="animated"
    title="Low"
    @click="emit('set-volume', 20)"
  >
    <span class="fa fa-volume-down" />
  </button>

  <!-- Volume High -->
  <button
    v-show="alarmControlsVisible"
    id="volume-high-btn"
    class="animated"
    title="High"
    @click="emit('set-volume', 100)"
  >
    <span class="fa fa-volume-up" />
  </button>
</template>
