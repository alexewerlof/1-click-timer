// Shared types for Chrome extension messaging between popup and background

/** Message source identifiers */
export type MessageSource = "FRONTEND" | "BACKEND";

/** All possible message names exchanged between popup and background */
export type MessageName =
  | "motor.toggle"
  | "motor.reset"
  | "motor.start"
  | "motor.restart"
  | "motor.getState"
  | "motor.tick"
  | "motor.pause"
  | "motor.end"
  | "motor.stop"
  | "alarm.setVolume"
  | "alarm.getVolume"
  | "alarm.setSignalIndex";

/** Motor state */
export type MotorState = "running" | "paused" | "stopped";

/** Structure of a message sent via chrome.runtime.sendMessage */
export interface AppMessage {
  src: MessageSource;
  name: MessageName;
  param?: unknown;
}

/** Handler function for incoming messages */
export type MessageHandler = (
  param: unknown,
  cb: (response?: unknown) => void,
) => void;

/** HMS breakdown of time */
export interface HMS {
  hf: number;
  h: number;
  mf: number;
  m: number;
  sf: number;
  s: number;
  ms: number;
  time: number;
}

/** Alarm signal index */
export type AlarmSignal = 0 | 1 | 2;
