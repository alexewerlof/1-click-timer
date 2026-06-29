/**
 * notify.ts — Chrome Notification API wrapper
 * Ported from notify.js (1-click-timer v8.3.1)
 */

const TITLE = "1-click timer";
const TAG = "1-click-timer-notification";

let currentNotification: Notification | null = null;

/**
 * Shows a Chrome notification. Only one notification is shown at a time
 * (tag-based deduplication).
 * @param message - body text of the notification
 * @param cb - called with 'close' or 'click' when user interacts
 */
export function showNotification(
  message: string,
  cb: (action: string) => void,
): void {
  console.info("Showing notification:", `"${message}"`);

  currentNotification = new Notification(TITLE, {
    body: message,
    tag: TAG,
    icon: "img/logo-128.png",
  });

  currentNotification.onshow = () => {
    console.log("Notification.onshow");
  };

  currentNotification.onclose = () => {
    console.log("Notification.onclose");
    cb("close");
  };

  currentNotification.onclick = () => {
    console.log("Notification.onclick");
    cb("click");
  };
}

/**
 * Hides the currently displayed notification.
 */
export function hideNotification(): void {
  if (currentNotification) {
    currentNotification.close();
    currentNotification = null;
  }
}
