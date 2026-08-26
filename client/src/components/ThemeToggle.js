const THEME_STORAGE_KEY = "perfectday-theme";

export const getStoredTheme = () => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const setTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  updateToggleButtons(theme);
};

export const toggleTheme = () => {
  const current = document.documentElement.getAttribute("data-theme") || getStoredTheme();
  const next = current === "dark" ? "light" : "dark";
  setTheme(next);
};

const updateToggleButtons = (theme) => {
  const lightBtns = document.querySelectorAll(".theme-btn-light");
  const darkBtns = document.querySelectorAll(".theme-btn-dark");

  lightBtns.forEach((btn) => btn.classList.toggle("active", theme === "light"));
  darkBtns.forEach((btn) => btn.classList.toggle("active", theme === "dark"));
};

export const initTheme = () => {
  const theme = getStoredTheme();
  setTheme(theme);

  // Global click handler for theme toggles
  document.addEventListener("click", (e) => {
    const toggleBtn = e.target.closest("[data-action='toggle-theme']");
    if (!toggleBtn) return;

    const targetTheme = toggleBtn.getAttribute("data-set-theme");
    if (targetTheme) {
      setTheme(targetTheme);
    } else {
      toggleTheme();
    }
  });
};

export const renderThemeToggleHTML = () => `
  <div class="theme-toggle" role="group" aria-label="Color theme switcher">
    <button 
      type="button" 
      class="theme-toggle-btn theme-btn-light" 
      data-action="toggle-theme" 
      data-set-theme="light" 
      title="Switch to Light theme" 
      aria-label="Light mode"
    >
      <i data-lucide="sun" style="width: 16px; height: 16px;"></i>
    </button>
    <button 
      type="button" 
      class="theme-toggle-btn theme-btn-dark" 
      data-action="toggle-theme" 
      data-set-theme="dark" 
      title="Switch to Dark theme" 
      aria-label="Dark mode"
    >
      <i data-lucide="moon" style="width: 16px; height: 16px;"></i>
    </button>
  </div>
`;
