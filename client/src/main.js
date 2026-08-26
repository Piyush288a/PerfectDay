import "./styles/main.css";
import { initTheme } from "./components/ThemeToggle.js";
import { initRouter } from "./utils/router.js";
import { authStore } from "./store/auth.js";

const bootstrap = async () => {
  initTheme();
  initRouter();
  // Perform startup session restoration check
  await authStore.checkSession();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
