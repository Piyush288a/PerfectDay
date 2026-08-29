import { authStore } from "../store/auth.js";
import { showToast } from "./Toast.js";
import { initIcons } from "../utils/icons.js";

export const showProfilePopover = ({ anchorEl }) => {
  closeProfilePopover();

  const { user } = authStore.getState();
  if (!user) return;

  const popover = document.createElement("div");
  popover.id = "pd-profile-popover";
  popover.className = "profile-popover";
  popover.setAttribute("role", "menu");
  popover.setAttribute("aria-label", "User Account Menu");

  const displayName = user.displayName || "User";
  const initials = (user.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("")
    : user.email.slice(0, 2)
  ).toUpperCase().slice(0, 2);

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Recently";

  popover.innerHTML = `
    <div class="profile-popover-card">
      <div class="profile-popover-user-row">
        <div class="user-avatar-btn" style="width: 42px; height: 42px; font-size: var(--text-sm); font-weight: 700;">
          <span>${initials}</span>
        </div>
        <div class="profile-user-info">
          <div class="profile-name">${escapeHTML(displayName)}</div>
          <div class="profile-email">${escapeHTML(user.email)}</div>
          <div class="profile-badge">Member since ${memberSince}</div>
        </div>
      </div>

      <div class="profile-popover-divider"></div>

      <div class="profile-meta-row">
        <span class="profile-meta-label">Timezone:</span>
        <span class="profile-meta-val">${escapeHTML(user.timezone || "UTC")}</span>
      </div>

      <div class="profile-popover-divider"></div>

      <button type="button" class="profile-popover-logout-btn" id="popover-logout-btn">
        <i data-lucide="log-out" style="width: 15px; height: 15px;"></i>
        <span>Sign out</span>
      </button>
    </div>
  `;

  document.body.appendChild(popover);
  initIcons();

  if (anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    const popoverWidth = 260;
    const popoverHeight = 200;

    let top = rect.bottom + 8;
    let left = rect.right - popoverWidth;

    if (top + popoverHeight > window.innerHeight) {
      top = Math.max(10, rect.top - popoverHeight - 8);
    }
    if (left < 10) {
      left = 10;
    }

    popover.style.position = "fixed";
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    popover.style.zIndex = "2500";
  }

  // Logout Click
  popover.querySelector("#popover-logout-btn")?.addEventListener("click", async () => {
    closeProfilePopover();
    showToast({ message: "Signing out...", type: "info" });
    try {
      await authStore.logout();
    } catch {
      authStore.clearUser();
    }
  });

  const onOutsideClick = (e) => {
    if (!popover.contains(e.target) && (!anchorEl || !anchorEl.contains(e.target))) {
      closeProfilePopover();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      closeProfilePopover();
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

export const closeProfilePopover = () => {
  const existing = document.getElementById("pd-profile-popover");
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
