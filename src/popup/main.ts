import { createApp } from "vue";
import App from "./App.vue";

import "./styles/base.css";
import "./styles/clock.css";
import "./styles/controls.css";
import "./styles/menu.css";

const app = createApp(App);
app.mount("#app");
