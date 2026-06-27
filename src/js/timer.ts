/**
 * Timer state machine — pure TypeScript, no DOM, no setInterval.
 *
 * Stores the absolute endTime (timestamp in ms) and computes remaining
 * seconds on demand as max(0, (endTime - Date.now()) / 1000). This survives
 * service-worker termination: as long as endTime is persisted, the remaining
 * time is always accurate when recomputed.
 */

type ListenerFn = (...args: any[]) => void;
type ListenerMap = Record<string, ListenerFn>;

interface Timer {
  MAX_SEC: number;
  running: boolean;
  endTime: number | null;
  alarming: boolean;
  _listeners: Record<string, ListenerFn[]>;
  on(event: string | ListenerMap, fn?: ListenerFn): void;
  off(event?: string | ListenerMap, fn?: ListenerFn): void;
  _emit(event: string, data?: any): void;
  set(sec: number): void;
  get(): number;
  getM(): number;
  getS(): number;
  getSS(): string;
  reset(): void;
  stop(): void;
  start(sec?: number): void;
  isRunning(): boolean;
  isAlarming(): boolean;
  silent(): void;
  restore(endTime: number): void;
}

const timer: Timer = {
  MAX_SEC: 3600,

  running: false,
  endTime: null,
  alarming: false,

  _listeners: {},

  on(event: string | ListenerMap, fn?: ListenerFn) {
    if (typeof event === "object") {
      for (const key in event) {
        if (Object.prototype.hasOwnProperty.call(event, key)) {
          this.on(key, event[key]);
        }
      }
      return;
    }
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(fn!);
  },

  off(event?: string | ListenerMap, fn?: ListenerFn) {
    if (typeof event === "undefined") {
      this._listeners = {};
      return;
    }
    if (typeof event === "object") {
      for (const key in event) {
        if (Object.prototype.hasOwnProperty.call(event, key)) {
          this.off(key, event[key]);
        }
      }
      return;
    }
    const list = this._listeners[event];
    if (!list) return;
    if (typeof fn === "undefined") {
      delete this._listeners[event];
    } else {
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i] === fn) list.splice(i, 1);
      }
    }
  },

  _emit(event: string, data?: any) {
    const list = this._listeners[event];
    if (list) {
      const copy = list.slice();
      for (let i = 0; i < copy.length; i++) {
        copy[i](data);
      }
    }
  },

  set(sec: number) {
    if (typeof sec !== "number") {
      throw new Error("Invalid type for sec: " + typeof sec);
    }
    if (sec < 0) {
      sec = 0;
    } else if (sec > this.MAX_SEC) {
      sec = this.MAX_SEC;
    }
    this.endTime = Date.now() + sec * 1000;
    this._emit("set", sec);
  },

  get(): number {
    if (!this.endTime) return 0;
    return Math.max(0, Math.round((this.endTime - Date.now()) / 1000));
  },

  getM(): number {
    return Math.floor(this.get() / 60);
  },

  getS(): number {
    return this.get() % 60;
  },

  getSS(): string {
    const s = this.getS();
    return s < 10 ? "0" + s : String(s);
  },

  reset() {
    this.set(0);
    this.stop();
    this.alarming = false;
    this._emit("reset");
  },

  stop() {
    if (this.running) {
      this.running = false;
      this._emit("stop");
    }
  },

  start(sec?: number) {
    if (typeof sec !== "undefined") {
      this.set(sec);
    }
    if (!this.running && this.get() > 0) {
      this.running = true;
      this._emit("start");
    }
  },

  isRunning(): boolean {
    return this.running;
  },

  isAlarming(): boolean {
    return this.alarming;
  },

  silent() {
    if (this.alarming) {
      this.alarming = false;
      this._emit("silent");
    }
  },

  restore(endTime: number) {
    this.endTime = endTime;
    this.running = true;
    this._emit("set", this.get());
  },
};

timer.set(0);

export default timer;
