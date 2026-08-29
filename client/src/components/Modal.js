export const showConfirmModal = ({
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  onConfirm = () => {},
}) => {
  // Remove existing modal if any
  const existing = document.getElementById("pd-modal-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "pd-modal-overlay";
  overlay.className = "modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "modal-title");

  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title" id="modal-title">${escapeHTML(title)}</h3>
      </div>
      <div class="modal-body">
        <p class="modal-message">${escapeHTML(message)}</p>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-outline" id="modal-cancel-btn">
          ${escapeHTML(cancelText)}
        </button>
        <button type="button" class="btn ${isDestructive ? "btn-danger" : "btn-primary"}" id="modal-confirm-btn">
          ${escapeHTML(confirmText)}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const cancelBtn = overlay.querySelector("#modal-cancel-btn");
  const confirmBtn = overlay.querySelector("#modal-confirm-btn");

  const close = () => {
    overlay.classList.add("closing");
    setTimeout(() => overlay.remove(), 150);
  };

  cancelBtn.addEventListener("click", () => {
    close();
  });

  confirmBtn.addEventListener("click", async () => {
    confirmBtn.disabled = true;
    try {
      await onConfirm();
    } finally {
      close();
    }
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      close();
      document.removeEventListener("keydown", handleKeyDown);
    }
  };
  document.addEventListener("keydown", handleKeyDown);

  // Focus confirm or cancel
  setTimeout(() => {
    cancelBtn.focus();
  }, 50);
};

const escapeHTML = (str) => {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};
