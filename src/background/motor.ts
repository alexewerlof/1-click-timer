/**
 * motor.ts — Core timer engine
 * Ported from Motor.js (1-click-timer v8.3.1)
 *
 * MV3 changes:
 * - Uses chrome.alarms instead of recursive setTimeout
 *   (service workers terminate after ~30s of inactivity)
 * - Uses chrome.storage (via Static) instead of localStorage
 * - Alarm audio playback is delegated to popup (SW has no DOM)
 */

import { Static } from "@/utils/static";
import { Messenger } from "@/utils/messenger";
import { alarm } from "./alarm";
import { setBadgeTime, setBadgeState } from "./badger";
import { showNotification, hideNotification } from "./notify";
import type { MotorState } from "@/types/messages";

const ALARM_NAME = "motor-tick";

const msg = new Messenger("BACKEND");

export class Motor {
  private _startTime: Static<number>;
  private _remainingTime: Static<number>;
  private _timerPeriod: Static<number>;
  private _state: Static<MotorState>;

  constructor() {
    this._startTime = new Static<number>("motor.startTime", 0);
    this._remainingTime = new Static<number>("motor.remainingTime", 0);
    this._timerPeriod = new Static<number>("motor.timerPeriod", 0);
    this._state = new Static<MotorState>("motor.state", "stopped");
  }

  /** Initialize the motor: restore state and wire up messaging */
  async init(): Promise<void> {
    // Initialize alarm module
    await alarm.init();

    // Restore badge from persisted state
    const state = await this._state.load();
    setBadgeState(state);

    // If was running before SW terminated, resume
    if (state === "running") {
      await this.resume();
    }

    // Wire up message handlers
    msg.on("motor.toggle", () => {
      void this.toggle();
    });
    msg.on("motor.reset", () => {
      void this.stop();
    });
    msg.on("motor.start", (param) => {
      void this.start(param as number);
    });
    msg.on("motor.restart", () => {
      void this.restart();
    });
    msg.on("motor.getState", (_, cb) => {
      cb(this._state.load());
    });

    msg.on("alarm.setVolume", (param) => {
      void alarm.setVolume(param as number);
    });
    msg.on("alarm.getVolume", async (_, cb) => {
      cb(await alarm.getVolume());
    });
    msg.on("alarm.setSignalIndex", (param) => {
      void alarm.setSignalIndex(param as number as 0 | 1 | 2);
    });

    // Listen for chrome.alarms
    chrome.alarms.onAlarm.addListener((alarmInfo) => {
      if (alarmInfo.name === ALARM_NAME) {
        void this._tick();
      }
    });
  }

  // ── Tick Logic ─────────────────────────────────────

  private async _tick(): Promise<void> {
    const startTime = await this._startTime.load();
    const timerPeriod = await this._timerPeriod.load();
    const remaining = startTime + timerPeriod - Date.now();

    await this._remainingTime.save(remaining);

    if (remaining <= 0) {
      // Timer expired
      console.log("Tick past the planned alarm moment by", remaining, "ms");
      await this.stop();
      // Notify popup to play alarm sound
      msg.trigger("motor.tick", 0);
      msg.trigger("motor.end", timerPeriod);
      // Show notification (this also serves as alarm if popup is closed)
      showNotification("Time up!", () => {
        // User dismissed notification
      });
      setBadgeTime(0);
    } else {
      setBadgeTime(remaining);
      msg.trigger("motor.tick", remaining);

      // Schedule the next tick using chrome.alarms
      // We tick at the next whole-second boundary for precision
      const wholeSecondsRemaining = Math.floor(remaining / 1000);
      const nextTickMs = remaining - wholeSecondsRemaining * 1000;

      if (await this.isRunning()) {
        console.log(
          "Scheduling next tick in",
          nextTickMs,
          "ms",
          "remaining:",
          wholeSecondsRemaining,
        );
        await chrome.alarms.create(ALARM_NAME, {
          delayInMinutes: nextTickMs / 60_000,
        });
      }
    }
  }

  // ── State Queries ───────────────────────────────────

  async isRunning(): Promise<boolean> {
    return (await this._state.load()) === "running";
  }

  async isPaused(): Promise<boolean> {
    return (await this._state.load()) === "paused";
  }

  async isStopped(): Promise<boolean> {
    return (await this._state.load()) === "stopped";
  }

  // ── Timer Controls ─────────────────────────────────

  async toggle(): Promise<void> {
    if (await this.isRunning()) {
      await this.pause();
    } else if (await this.isPaused()) {
      await this.resume();
    }
  }

  /**
   * Set the timer to end in `endIn` milliseconds from now.
   */
  async start(endIn: number): Promise<void> {
    await chrome.alarms.clear(ALARM_NAME);
    await this._startTime.save(Date.now());
    await this._timerPeriod.save(endIn);
    hideNotification();
    await this._state.save("running");
    setBadgeState("running");
    setBadgeTime(endIn);
    msg.trigger("motor.start", endIn);
    // Kick off the tick loop
    await this._tick();
  }

  /** Resumes a paused timer */
  async resume(): Promise<void> {
    console.log("Resuming the motor from pause");
    const remaining = await this._remainingTime.load();
    const timerPeriod = await this._timerPeriod.load();
    const endTime = Date.now() + remaining;
    // Set a virtual startTime so tick algorithms work correctly
    await this._startTime.save(endTime - timerPeriod);
    await this._state.save("running");
    setBadgeState("running");
    await this._tick();
  }

  /** Pauses the timer. Can be resumed or reset. */
  async pause(): Promise<void> {
    console.log("Pausing the motor");
    await chrome.alarms.clear(ALARM_NAME);
    await this._state.save("paused");
    setBadgeState("paused");
    hideNotification();
    const remaining = await this._remainingTime.load();
    setBadgeTime(remaining);
    msg.trigger("motor.tick", remaining);
    msg.trigger("motor.pause", remaining);
  }

  /** Stops the timer completely and resets to zero. */
  async stop(): Promise<void> {
    console.log("Stopping the motor");
    await chrome.alarms.clear(ALARM_NAME);
    await this._state.save("stopped");
    setBadgeState("stopped");
    await this._remainingTime.reset();
    hideNotification();
    setBadgeTime(0);
    msg.trigger("motor.tick", 0);
    msg.trigger("motor.stop");
  }

  /** Restarts the timer with the last used period */
  async restart(): Promise<void> {
    console.info("Motor restart");
    const period = await this._timerPeriod.load();
    await this.start(period);
  }
}
