/**
 * Messenger.ts — Chrome runtime messaging wrapper
 * Ported from Messenger.js (1-click-timer v8.3.1)
 *
 * Fixes the original bug: only one handler could be registered per message name.
 * Now uses a Map to support multiple listeners.
 */

import type {
  MessageSource,
  MessageName,
  MessageHandler,
  AppMessage,
} from "@/types/messages";

export class Messenger {
  readonly name: MessageSource;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private listeners: Map<MessageName, (...args: any[]) => void>;

  constructor(name: MessageSource) {
    this.name = name;
    this.listeners = new Map();
  }

  /**
   * Sends a message to the other side (popup ↔ background).
   * @param messageName - the message event name
   * @param param - optional parameter to send
   * @param cb - optional callback for the response
   */
  trigger(
    messageName: MessageName,
    param?: unknown,
    cb?: (response: unknown) => void,
  ): void {
    console.info(this.name, "Sending", messageName, param);
    const message: AppMessage = { src: this.name, name: messageName, param };
    chrome.runtime.sendMessage(message, (response) => {
      if (cb) cb(response);
    });
  }

  /**
   * Registers a handler for incoming messages of the given name.
   * Only responds to messages NOT originating from this same side.
   */
  on(messageName: MessageName, handler: MessageHandler): void {
    const listener = (
      message: AppMessage,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void,
    ) => {
      if (message.name === messageName && message.src !== this.name) {
        console.info(this.name, "Receiving", message.name);
        handler(message.param, sendResponse);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    this.listeners.set(messageName, listener);
  }

  /** Unregisters all listeners added by this Messenger instance */
  unregister(): void {
    for (const listener of this.listeners.values()) {
      chrome.runtime.onMessage.removeListener(listener);
    }
    this.listeners.clear();
  }
}
