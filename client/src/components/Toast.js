let toastContainer = null;

const ensureToastContainer = () => {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    toastContainer.setAttribute("aria-live", "polite");
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

export const showToast = ({ message, type = "info", duration = 3500 }) => {
  const container = ensureToastContainer();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const iconName =
    type === "success"
      ? "check-circle-2"
      : type === "error"
      ? "alert-triangle"
      : "info";

  toast.innerHTML = `
    <i data-lucide="${iconName}" class="toast-icon" style="width: 18px; height: 18px;"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Import Lucide dynamically for newly injected icons if present
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px) scale(0.95)";
    setTimeout(() => toast.remove(), 250);
  }, duration);
};
