/**
 * alarm.ts — Audio alarm management
 * Ported from Alarm.js (1-click-timer v8.3.1)
 *
 * MV3 change: Audio playback data (signalIndex, volume) is stored in
 * chrome.storage so the popup can play sounds. The background service
 * worker cannot access DOM APIs like <audio>.
 */

import { Static } from "@/utils/static";
import type { AlarmSignal } from "@/types/messages";

export class Alarm {
  private _volume: Static<number>;
  private _signalIndex: Static<AlarmSignal>;

  constructor() {
    this._volume = new Static<number>("alarm.volume", 100);
    this._signalIndex = new Static<AlarmSignal>("alarm._signalIndex", 0);
  }

  /** Load persisted values */
  async init(): Promise<void> {
    await this._volume.load();
    await this._signalIndex.load();
  }

  /** Set alarm signal index (0=smoothing, 1=classic, 2=hard) */
  async setSignalIndex(index: AlarmSignal): Promise<AlarmSignal> {
    console.log("Setting alarm signal to", index);
    return this._signalIndex.save(index);
  }

  /** Get current alarm signal index */
  async getSignalIndex(): Promise<AlarmSignal> {
    return this._signalIndex.load();
  }

  /**
   * Set volume (0–100 percent)
   */
  async setVolume(volume: number): Promise<number> {
    if (!isFinite(volume)) {
      console.info("Ignoring non-finite value for volume", volume);
      return this._volume.load();
    }
    const clamped = Math.max(0, Math.min(100, Math.round(volume)));
    console.log("Setting volume to", clamped + "%");
    return this._volume.save(clamped);
  }

  /** Get current volume (0–100) */
  async getVolume(): Promise<number> {
    return this._volume.load();
  }
}

/** Singleton instance */
export const alarm = new Alarm();
