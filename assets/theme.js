(function () {
  const STORAGE_KEY = "kf_theme"; // "dark" or "light"
  const root = document.documentElement;

  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;

    // If nothing saved, follow the user's OS preference:
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }

  function applyTheme(theme) {
    if (theme === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme"); // default dark

    const icon = document.getElementById("themeIcon");
    if (icon) icon.textContent = theme === "light" ? "☀️" : "🌙";

    localStorage.setItem(STORAGE_KEY, theme);
  }

  function toggleTheme() {
    const current = root.getAttribute("data-theme") === "light" ? "light" : "dark";
    applyTheme(current === "light" ? "dark" : "light");
  }

  // Apply immediately on load
  applyTheme(getPreferredTheme());

  // Wire up button (if present on page)
  window.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("themeToggle");
    if (btn) btn.addEventListener("click", toggleTheme);
  });
})();
