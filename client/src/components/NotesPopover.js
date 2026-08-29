import { taskStore } from "../store/tasks.js";
import { initIcons } from "../utils/icons.js";

export const showNotesPopover = ({ anchorEl, task }) => {
  closeNotesPopover();
  if (!task) return;

  const popover = document.createElement("div");
  popover.id = "pd-notes-popover";
  popover.className = "notes-popover";
  popover.setAttribute("role", "tooltip");
  popover.setAttribute("aria-label", `Notes for ${task.title}`);

  const hasNotes = Boolean(task.notes && task.notes.trim());

  popover.innerHTML = `
    <div class="notes-popover-header">
      <div class="notes-popover-title">
        <i data-lucide="file-text" style="width: 14px; height: 14px; color: var(--color-primary);"></i>
        <span>Notes</span>
      </div>
      <button type="button" class="notes-popover-close" id="notes-popover-close" aria-label="Close notes preview">
        <i data-lucide="x" style="width: 13px; height: 13px;"></i>
      </button>
    </div>

    <div class="notes-popover-content ${hasNotes ? "" : "empty"}">
      ${hasNotes ? escapeHTML(task.notes).replace(/\n/g, "<br>") : "<em>No notes added yet.</em>"}
    </div>

    <div class="notes-popover-footer">
      <button type="button" class="notes-popover-action-btn" id="notes-popover-open-detail">
        <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
        <span>Edit in details</span>
      </button>
    </div>
  `;

  document.body.appendChild(popover);
  initIcons();

  if (anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    const popoverWidth = 260;
    const popoverHeight = 160;

    let top = rect.bottom + 6;
    let left = rect.left;

    if (top + popoverHeight > window.innerHeight) {
      top = Math.max(10, rect.top - popoverHeight - 6);
    }
    if (left + popoverWidth > window.innerWidth) {
      left = Math.max(10, window.innerWidth - popoverWidth - 16);
    }

    popover.style.position = "fixed";
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    popover.style.zIndex = "2200";
  }

  // Open Details Action
  popover.querySelector("#notes-popover-open-detail")?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeNotesPopover();
    taskStore.selectTask(task.id);
  });

  popover.querySelector("#notes-popover-close")?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeNotesPopover();
  });

  const onOutsideClick = (e) => {
    if (!popover.contains(e.target) && (!anchorEl || !anchorEl.contains(e.target))) {
      closeNotesPopover();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      closeNotesPopover();
    }
  };

  setTimeout(() => {
    document.addEventListener("click", onOutsideClick);
    document.addEventListener("keydown", onKeyDown);
  }, 10);

  popover._cleanup = () => {
    document.removeEventListener("click", onOutsideClick);
    document.removeEventListener("keydown", onKeyDown);
  };
};

export const closeNotesPopover = () => {
  const existing = document.getElementById("pd-notes-popover");
  if (existing) {
    if (existing._cleanup) existing._cleanup();
    existing.remove();
  }
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
