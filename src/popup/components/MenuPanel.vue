<script setup lang="ts">
/**
 * MenuPanel.vue — Slide-up menu with alarm sounds, support links, and social sharing
 * Ported from the menu section of popup.html
 */

defineProps<{
  visible: boolean;
  version: string;
}>();

const emit = defineEmits<{
  close: [];
  "set-alarm-signal": [index: number];
  "open-link": [url: string];
}>();
</script>

<template>
  <div
    v-show="visible"
    id="menu"
  >
    <!-- Hide menu -->
    <button
      id="menu-btn-hide"
      title="Hide menu"
      @click="emit('close')"
    >
      <i class="fa fa-chevron-up" />
    </button>

    <!-- Alarm sound selection -->
    <button
      id="menu-btn-alarm-soothing"
      title="Guitar tones"
      @click="emit('set-alarm-signal', 0)"
    >
      <i class="fa fa-music" />
    </button>
    <button
      id="menu-btn-alarm-classic"
      title="Classic sound"
      @click="emit('set-alarm-signal', 1)"
    >
      <i class="fa fa-clock-o" />
    </button>
    <button
      id="menu-btn-alarm-hard"
      title="Alarming sound"
      @click="emit('set-alarm-signal', 2)"
    >
      <i class="fa fa-bolt" />
    </button>

    <!-- Support links -->
    <button
      id="menu-btn-support-bug"
      title="Report a bug"
      @click="
        emit(
          'open-link',
          'https://chrome.google.com/webstore/support/igloknlllonknnbkfgggfkigmeegmakf',
        )
      "
    >
      <i class="fa fa-bug" />
    </button>
    <button
      id="menu-btn-support-feature"
      title="Request a feature"
      @click="
        emit(
          'open-link',
          'https://chrome.google.com/webstore/support/igloknlllonknnbkfgggfkigmeegmakf',
        )
      "
    >
      <i class="fa fa-lightbulb-o" />
    </button>
    <button
      id="menu-btn-support-review"
      title="Write a review"
      @click="
        emit(
          'open-link',
          'https://chrome.google.com/webstore/review/igloknlllonknnbkfgggfkigmeegmakf',
        )
      "
    >
      <i class="fa fa-star" />
    </button>

    <!-- Social share -->
    <button
      id="menu-btn-share-facebook"
      title="Share on Facebook"
      @click="
        emit(
          'open-link',
          'https://www.facebook.com/sharer/sharer.php?u=https://chrome.google.com/webstore/detail/igloknlllonknnbkfgggfkigmeegmakf',
        )
      "
    >
      <i class="fa fa-facebook" />
    </button>
    <button
      id="menu-btn-share-twitter"
      title="Share on Twitter"
      @click="
        emit(
          'open-link',
          'https://twitter.com/intent/tweet?text=1-click%20timer%20for%20Chrome&url=https://chrome.google.com/webstore/detail/igloknlllonknnbkfgggfkigmeegmakf',
        )
      "
    >
      <i class="fa fa-twitter" />
    </button>
    <button
      id="menu-btn-share-google"
      title="Share on Google+"
      @click="
        emit(
          'open-link',
          'https://plus.google.com/share?url=https://chrome.google.com/webstore/detail/igloknlllonknnbkfgggfkigmeegmakf',
        )
      "
    >
      <i class="fa fa-google-plus" />
    </button>

    <!-- UserPixel link (original author's site) -->
    <button
      id="menu-btn-link-userpixel"
      title="UserPixel"
      @click="emit('open-link', 'https://www.userpixel.com/')"
    >
      <i class="fa fa-user" />
    </button>

    <!-- Version -->
    <div id="version">
      v{{ version }}
    </div>
  </div>
</template>
