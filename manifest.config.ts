import { ManifestV3Export } from "@crxjs/vite-plugin";

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: "1-click timer",
  short_name: "1-click-timer",
  description: "A slick and reliable timer app for Google Chrome",
  version: "9.0.0",
  minimum_chrome_version: "88",
  permissions: ["storage", "notifications", "alarms"],
  host_permissions: [],
  action: {
    default_title: "1-click timer",
    default_popup: "index.html",
    default_icon: {
      "19": "img/popup-icon-off-19.png",
      "38": "img/popup-icon-off-38.png",
    },
  },
  icons: {
    "16": "img/logo-16.png",
    "48": "img/logo-48.png",
    "128": "img/logo-128.png",
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
};

export default manifest;
