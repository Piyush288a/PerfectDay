import { renderThemeToggleHTML } from "../components/ThemeToggle.js";
import { showToast } from "../components/Toast.js";
import { authStore } from "../store/auth.js";

const getInitials = (user) => {
  if (user?.displayName) {
    const parts = user.displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (user?.email) {
    return user.email.slice(0, 2).toUpperCase();
  }
  return "PD";
};

export const renderAppShellView = () => {
  const { user } = authStore.getState();
  const initials = getInitials(user);
  const userName = user?.displayName || user?.email?.split("@")[0] || "User";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return `
  <div class="app-shell">
    <!-- Header -->
    <header class="shell-header">
      <div class="shell-header-left">
        <button type="button" id="sidebar-toggle" class="sidebar-toggle-btn" aria-label="Toggle Navigation Sidebar">
          <i data-lucide="menu" style="width: 20px; height: 20px;"></i>
        </button>

        <a href="#app" class="brand-logo" style="font-size: var(--text-base);">
          <span class="brand-logo-icon">
            <i data-lucide="sun" style="width: 20px; height: 20px;"></i>
          </span>
          <span>PerfectDay</span>
        </a>
      </div>

      <div class="shell-header-right">
        ${renderThemeToggleHTML()}

        <button type="button" class="header-icon-btn" id="notifications-btn" title="Notifications" aria-label="Notifications">
          <i data-lucide="bell" style="width: 18px; height: 18px;"></i>
        </button>

        <div style="position: relative;">
          <button type="button" class="user-avatar-btn" id="user-profile-btn" title="${userName} (${user?.email || ''})" aria-label="User profile">
            <span>${initials}</span>
          </button>
        </div>

        <button type="button" class="btn btn-outline" id="logout-btn" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; border-radius: var(--radius-full);">
          <i data-lucide="log-out" style="width: 14px; height: 14px;"></i>
          <span>Sign out</span>
        </button>
      </div>
    </header>

    <!-- Shell Body -->
    <div class="shell-body">
      <!-- Sidebar -->
      <aside class="shell-sidebar" id="shell-sidebar">
        <div class="sidebar-top">
          <!-- User Summary Card in Sidebar -->
          <div style="padding: var(--space-3); margin-bottom: var(--space-3); border-radius: var(--radius-lg); background: var(--color-bg-subtle); display: flex; align-items: center; gap: var(--space-3);">
            <div class="user-avatar-btn" style="width: 32px; height: 32px; font-size: 0.75rem;">
              <span>${initials}</span>
            </div>
            <div style="overflow: hidden;">
              <div style="font-size: var(--text-xs); font-weight: 600; color: var(--color-text-primary); text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${userName}</div>
              <div style="font-size: 0.65rem; color: var(--color-text-muted); text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${user?.email || ""}</div>
            </div>
          </div>

          <!-- Main Views -->
          <nav class="sidebar-nav-section" aria-label="Main Views">
            <a href="javascript:void(0)" class="sidebar-nav-item active" data-nav="my-day">
              <div class="sidebar-nav-item-left">
                <i data-lucide="sun" style="width: 18px; height: 18px;"></i>
                <span>My Day</span>
              </div>
              <span class="sidebar-badge">0</span>
            </a>

            <a href="javascript:void(0)" class="sidebar-nav-item" data-nav="important">
              <div class="sidebar-nav-item-left">
                <i data-lucide="star" style="width: 18px; height: 18px;"></i>
                <span>Important</span>
              </div>
            </a>

            <a href="javascript:void(0)" class="sidebar-nav-item" data-nav="planned">
              <div class="sidebar-nav-item-left">
                <i data-lucide="calendar" style="width: 18px; height: 18px;"></i>
                <span>Planned</span>
              </div>
            </a>

            <a href="javascript:void(0)" class="sidebar-nav-item" data-nav="all-tasks">
              <div class="sidebar-nav-item-left">
                <i data-lucide="list-todo" style="width: 18px; height: 18px;"></i>
                <span>Tasks</span>
              </div>
            </a>
          </nav>

          <!-- Custom Lists -->
          <div class="sidebar-section-title">Lists</div>
          <nav class="sidebar-nav-section" aria-label="Custom Lists">
            <a href="javascript:void(0)" class="sidebar-nav-item" data-nav="list-personal">
              <div class="sidebar-nav-item-left">
                <i data-lucide="layout-grid" style="width: 16px; height: 16px;"></i>
                <span>Personal</span>
              </div>
            </a>
          </nav>

          <button type="button" class="sidebar-add-list-btn" id="add-list-btn">
            <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
            <span>New list</span>
          </button>
        </div>

        <div style="padding-top: var(--space-4); border-top: 1px solid var(--color-border-subtle); font-size: var(--text-xs); color: var(--color-text-muted);">
          <span>PerfectDay v0.6.0</span>
        </div>
      </aside>

      <!-- Main Workspace -->
      <main class="shell-workspace">
        <div class="workspace-header">
          <div class="workspace-title-row">
            <h1 class="workspace-title">My Day</h1>
            <span class="workspace-date">${today}</span>
          </div>
          <p class="text-secondary text-sm">Focus on what matters most today.</p>
        </div>

        <!-- Quick Add Bar -->
        <div class="quick-add-task-bar">
          <i data-lucide="plus" style="width: 18px; height: 18px; color: var(--color-primary);"></i>
          <input 
            type="text" 
            class="quick-add-input" 
            id="quick-task-input" 
            placeholder="Add a task for today..." 
            aria-label="Add a task"
          />
          <button type="button" class="btn btn-primary" id="quick-add-btn" style="padding: 0.45rem 1rem; font-size: var(--text-xs);">
            <span>Add</span>
          </button>
        </div>

        <!-- Empty State Preview -->
        <div class="workspace-empty-state">
          <div class="empty-state-icon-wrap">
            <i data-lucide="sparkles" style="width: 28px; height: 28px;"></i>
          </div>
          <h2 class="empty-state-title">Your day is clear</h2>
          <p class="empty-state-desc">
            Tasks you add will appear here. Plan your day with clarity and focus.
          </p>
        </div>
      </main>
    </div>
  </div>
  `;
};

export const initAppShellEvents = () => {
  // Mobile Sidebar Toggle
  const toggleBtn = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("shell-sidebar");

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  // Logout Button Action
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      logoutBtn.disabled = true;
      logoutBtn.innerHTML = `
        <span class="btn-spinner" style="width: 12px; height: 12px;"></span>
        <span>Signing out...</span>
      `;
      try {
        await authStore.logout();
        showToast({
          message: "Signed out successfully.",
          type: "info",
        });
      } catch {
        authStore.clearUser();
      }
    });
  }

  // Sidebar navigation switching
  const navItems = document.querySelectorAll(".sidebar-nav-item");
  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      navItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      const title = item.querySelector("span")?.textContent || "Tasks";
      const titleEl = document.querySelector(".workspace-title");
      if (titleEl) titleEl.textContent = title;
    });
  });

  // Quick Add Button (Demonstration note for Phase 8 Task CRUD)
  const quickInput = document.getElementById("quick-task-input");
  const addBtn = document.getElementById("quick-add-btn");

  const handleQuickAdd = () => {
    const text = quickInput?.value.trim();
    if (!text) return;

    showToast({
      message: `Task creation will be connected to the Task API in Phase 8.`,
      type: "info",
    });

    if (quickInput) quickInput.value = "";
  };

  if (addBtn) addBtn.addEventListener("click", handleQuickAdd);
  if (quickInput) {
    quickInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleQuickAdd();
    });
  }

  // Add list button
  const addListBtn = document.getElementById("add-list-btn");
  if (addListBtn) {
    addListBtn.addEventListener("click", () => {
      showToast({
        message: "Custom list creation will be connected in Phase 9.",
        type: "info",
      });
    });
  }

  // Notifications button
  const notifBtn = document.getElementById("notifications-btn");
  if (notifBtn) {
    notifBtn.addEventListener("click", () => {
      showToast({
        message: "No new notifications.",
        type: "info",
      });
    });
  }
};
