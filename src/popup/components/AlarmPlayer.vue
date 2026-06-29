<script setup lang="ts">
/**
 * AlarmPlayer.vue — Manages audio playback for alarm sounds
 * MV3: Moved to popup since service workers can't access DOM/audio APIs
 */

import { watch, ref } from "vue";

const props = defineProps<{
  playing: boolean;
}>();

const emit = defineEmits<{
  ended: [];
}>();

const audioRef = ref<HTMLAudioElement | null>(null);
let signalIndex = 0;

// Load the signal index from storage
async function loadSignalIndex(): Promise<void> {
  try {
    const result = await chrome.storage.local.get("timer.alarm._signalIndex");
    if (result["timer.alarm._signalIndex"]) {
      signalIndex = (result["timer.alarm._signalIndex"] as { value: number })
        .value;
    }
  } catch {
    signalIndex = 0;
  }
}

// Watch for play signal
watch(
  () => props.playing,
  (isPlaying) => {
    if (isPlaying && audioRef.value) {
      void loadSignalIndex().then(() => {
        if (audioRef.value) {
          audioRef.value.src = `/audio/${signalIndex}.mp3`;
          audioRef.value.load();
          audioRef.value.currentTime = 0;
          void audioRef.value.play();
        }
      });
    } else if (!isPlaying && audioRef.value) {
      audioRef.value.pause();
    }
  },
);

function onEnded(): void {
  emit("ended");
}
</script>

<template>
  <audio
    ref="audioRef"
    loop
    @ended="onEnded"
  />
</template>
