import { renderThemeToggleHTML } from "../components/ThemeToggle.js";
import { showToast } from "../components/Toast.js";
import { authStore } from "../store/auth.js";
import { listStore } from "../store/lists.js";
import { taskStore } from "../store/tasks.js";
import { renderTaskItemHTML } from "../components/TaskItem.js";
import { renderTaskDetailPanelHTML, initTaskDetailPanelEvents } from "../components/TaskDetailPanel.js";
import { showConfirmModal } from "../components/Modal.js";
import { initIcons } from "../utils/icons.js";

let unsubscribeListStore = null;
let unsubscribeTaskStore = null;

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

const getContextMeta = (currentView, lists) => {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (currentView === "my-day") {
    return {
      title: "My Day",
      subtitle: "Focus on what matters most today.",
      date: today,
      placeholder: "Add a task for today...",
      emptyTitle: "Your day is clear",
      emptyDesc: "Tasks you add for today will appear here. Plan your day with clarity and focus.",
      emptyIcon: "sun",
    };
  }

  if (currentView === "important") {
    return {
      title: "Important",
      subtitle: "Prioritize your highest impact items.",
      date: null,
      placeholder: "Add an important task...",
      emptyTitle: "No important tasks",
      emptyDesc: "Star tasks to highlight priorities and keep them organized here.",
      emptyIcon: "star",
    };
  }

  if (currentView === "planned") {
    return {
      title: "Planned",
      subtitle: "Keep track of scheduled deadlines.",
      date: null,
      placeholder: "Add a task with a due date...",
      emptyTitle: "No planned tasks",
      emptyDesc: "Tasks with upcoming due dates will automatically appear here.",
      emptyIcon: "calendar",
    };
  }

  if (currentView === "all-tasks") {
    return {
      title: "Tasks",
      subtitle: "All your active and completed tasks.",
      date: null,
      placeholder: "Add a task...",
      emptyTitle: "All caught up",
      emptyDesc: "You don't have any tasks right now. Create one above to get started.",
      emptyIcon: "list-todo",
    };
  }

  // Custom list
  const activeList = lists.find((l) => l.id === currentView);
  const listName = activeList ? activeList.name : "List";

  return {
    title: listName,
    subtitle: `Tasks in ${listName}`,
    date: null,
    placeholder: `Add a task to ${listName}...`,
    emptyTitle: `No tasks in ${listName}`,
    emptyDesc: "Create tasks specifically for this list to stay organized.",
    emptyIcon: "layout-grid",
    listId: currentView,
  };
};

export const renderAppShellView = () => {
  const { user } = authStore.getState();
  const { lists } = listStore.getState();
  const { currentView } = taskStore.getState();

  const initials = getInitials(user);
  const userName = user?.displayName || user?.email?.split("@")[0] || "User";
  const meta = getContextMeta(currentView, lists);

  // Default tasks list item
  const defaultList = listStore.getDefaultList();
  const defaultListCount = defaultList?._count?.tasks || 0;

  // Custom lists (excluding default list)
  const customLists = lists.filter((l) => !l.isDefault);

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
            <a href="javascript:void(0)" class="sidebar-nav-item ${currentView === "my-day" ? "active" : ""}" data-nav="my-day">
              <div class="sidebar-nav-item-left">
                <i data-lucide="sun" style="width: 18px; height: 18px;"></i>
                <span>My Day</span>
              </div>
            </a>

            <a href="javascript:void(0)" class="sidebar-nav-item ${currentView === "important" ? "active" : ""}" data-nav="important">
              <div class="sidebar-nav-item-left">
                <i data-lucide="star" style="width: 18px; height: 18px;"></i>
                <span>Important</span>
              </div>
            </a>

            <a href="javascript:void(0)" class="sidebar-nav-item ${currentView === "planned" ? "active" : ""}" data-nav="planned">
              <div class="sidebar-nav-item-left">
                <i data-lucide="calendar" style="width: 18px; height: 18px;"></i>
                <span>Planned</span>
              </div>
            </a>

            <a href="javascript:void(0)" class="sidebar-nav-item ${currentView === "all-tasks" ? "active" : ""}" data-nav="all-tasks">
              <div class="sidebar-nav-item-left">
                <i data-lucide="list-todo" style="width: 18px; height: 18px;"></i>
                <span>Tasks</span>
              </div>
              ${defaultListCount > 0 ? `<span class="sidebar-badge">${defaultListCount}</span>` : ""}
            </a>
          </nav>

          <!-- Custom Lists -->
          <div class="sidebar-section-title">Lists</div>
          <nav class="sidebar-nav-section" id="sidebar-custom-lists" aria-label="Custom Lists">
            ${customLists
              .map(
                (list) => `
                <div class="sidebar-list-item ${currentView === list.id ? "active" : ""}" data-nav="${list.id}">
                  <div class="sidebar-nav-item-left">
                    <i data-lucide="layout-grid" style="width: 16px; height: 16px;"></i>
                    <span>${escapeHTML(list.name)}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    ${list._count?.tasks > 0 ? `<span class="sidebar-badge">${list._count.tasks}</span>` : ""}
                    <div class="sidebar-list-actions">
                      <button 
                        type="button" 
                        class="sidebar-list-btn delete-list-btn" 
                        data-action="delete-list" 
                        data-list-id="${list.id}"
                        data-list-count="${list._count?.tasks || 0}"
                        data-list-name="${escapeHTML(list.name)}"
                        title="Delete list" 
                        aria-label="Delete list"
                      >
                        <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                      </button>
                    </div>
                  </div>
                </div>
              `
              )
              .join("")}
          </nav>

          <!-- Inline Add List Area -->
          <div id="inline-add-list-container">
            <button type="button" class="sidebar-add-list-btn" id="add-list-btn">
              <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
              <span>New list</span>
            </button>
          </div>
        </div>

        <div style="padding-top: var(--space-4); border-top: 1px solid var(--color-border-subtle); font-size: var(--text-xs); color: var(--color-text-muted);">
          <span>PerfectDay v0.7.1</span>
        </div>
      </aside>

      <!-- Main Workspace -->
      <main class="shell-workspace" id="shell-workspace">
        <div class="workspace-header">
          <div class="workspace-title-row">
            <div class="workspace-title-left">
              <h1 class="workspace-title" id="workspace-title">${escapeHTML(meta.title)}</h1>
              ${meta.date ? `<span class="workspace-date">${meta.date}</span>` : ""}
            </div>
          </div>
          <p class="workspace-subtitle" id="workspace-subtitle">${meta.subtitle}</p>
        </div>

        <!-- Quick Add Bar -->
        <form class="quick-add-task-bar" id="quick-add-form">
          <i data-lucide="plus" style="width: 18px; height: 18px; color: var(--color-primary);"></i>
          <input 
            type="text" 
            class="quick-add-input" 
            id="quick-task-input" 
            placeholder="${meta.placeholder}" 
            aria-label="Add a task"
            autocomplete="off"
          />
          <button type="submit" class="btn btn-primary" id="quick-add-btn" style="padding: 0.45rem 1rem; font-size: var(--text-xs);">
            <span>Add</span>
          </button>
        </form>

        <!-- Tasks Content Container -->
        <div id="workspace-tasks-container">
          <div class="loading-skeleton">
            <div class="skeleton-bar"></div>
            <div class="skeleton-bar"></div>
          </div>
        </div>
      </main>

      <!-- Slide-Over Task Detail Panel -->
      <aside class="task-detail-panel" id="task-detail-panel" aria-label="Task Details"></aside>
    </div>
  </div>
  `;
};

const renderTasksListContent = () => {
  const { tasks, loading, currentView, selectedTaskId } = taskStore.getState();
  const { lists } = listStore.getState();
  const container = document.getElementById("workspace-tasks-container");
  if (!container) return;

  if (loading) {
    container.innerHTML = `
      <div class="loading-skeleton">
        <div class="skeleton-bar"></div>
        <div class="skeleton-bar"></div>
        <div class="skeleton-bar"></div>
      </div>
    `;
    return;
  }

  if (tasks.length === 0) {
    const meta = getContextMeta(currentView, lists);
    container.innerHTML = `
      <div class="workspace-empty-state">
        <div class="empty-state-icon-wrap">
          <i data-lucide="${meta.emptyIcon}" style="width: 28px; height: 28px;"></i>
        </div>
        <h2 class="empty-state-title">${meta.emptyTitle}</h2>
        <p class="empty-state-desc">${meta.emptyDesc}</p>
      </div>
    `;
    initIcons();
    return;
  }

  const activeTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);

  let html = `<div class="task-list-container">`;

  if (activeTasks.length > 0) {
    html += `
      <div class="task-list">
        ${activeTasks.map((task) => renderTaskItemHTML(task, currentView, lists, selectedTaskId)).join("")}
      </div>
    `;
  }

  if (completedTasks.length > 0) {
    html += `
      <div class="task-list-section" style="margin-top: var(--space-4);">
        <div class="task-section-title">Completed (${completedTasks.length})</div>
        <div class="task-list">
          ${completedTasks.map((task) => renderTaskItemHTML(task, currentView, lists, selectedTaskId)).join("")}
        </div>
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
  initIcons();
};

const updateDetailPanel = () => {
  const { selectedTask } = taskStore.getState();
  const { lists } = listStore.getState();
  const panel = document.getElementById("task-detail-panel");
  if (!panel) return;

  if (!selectedTask) {
    panel.classList.remove("open");
    panel.innerHTML = "";
    return;
  }

  panel.classList.add("open");
  panel.innerHTML = renderTaskDetailPanelHTML(selectedTask, lists);
  initTaskDetailPanelEvents(panel);
  initIcons();
};

const updateSidebarLists = () => {
  const { lists } = listStore.getState();
  const { currentView } = taskStore.getState();
  const customNav = document.getElementById("sidebar-custom-lists");
  if (!customNav) return;

  const customLists = lists.filter((l) => !l.isDefault);
  customNav.innerHTML = customLists
    .map(
      (list) => `
      <div class="sidebar-list-item ${currentView === list.id ? "active" : ""}" data-nav="${list.id}">
        <div class="sidebar-nav-item-left">
          <i data-lucide="layout-grid" style="width: 16px; height: 16px;"></i>
          <span>${escapeHTML(list.name)}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          ${list._count?.tasks > 0 ? `<span class="sidebar-badge">${list._count.tasks}</span>` : ""}
          <div class="sidebar-list-actions">
            <button 
              type="button" 
              class="sidebar-list-btn delete-list-btn" 
              data-action="delete-list" 
              data-list-id="${list.id}"
              data-list-count="${list._count?.tasks || 0}"
              data-list-name="${escapeHTML(list.name)}"
              title="Delete list" 
              aria-label="Delete list"
            >
              <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
            </button>
          </div>
        </div>
      </div>
    `
    )
    .join("");

  // Update default task count badge
  const defaultList = listStore.getDefaultList();
  const tasksNavBadge = document.querySelector('[data-nav="all-tasks"] .sidebar-badge');
  const defaultCount = defaultList?._count?.tasks || 0;

  if (tasksNavBadge) {
    tasksNavBadge.textContent = defaultCount;
    tasksNavBadge.style.display = defaultCount > 0 ? "inline-block" : "none";
  }

  initIcons();
};

const updateWorkspaceHeader = () => {
  const { currentView } = taskStore.getState();
  const { lists } = listStore.getState();
  const meta = getContextMeta(currentView, lists);

  const titleEl = document.getElementById("workspace-title");
  const subtitleEl = document.getElementById("workspace-subtitle");
  const quickInput = document.getElementById("quick-task-input");

  if (titleEl) titleEl.textContent = meta.title;
  if (subtitleEl) subtitleEl.textContent = meta.subtitle;
  if (quickInput) quickInput.placeholder = meta.placeholder;
};

export const initAppShellEvents = () => {
  // Clean previous subscriptions if any
  if (unsubscribeListStore) unsubscribeListStore();
  if (unsubscribeTaskStore) unsubscribeTaskStore();

  // Mobile Sidebar Toggle
  const toggleBtn = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("shell-sidebar");

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  // Logout Button
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

  // Global Keyboard Handling (Escape closes detail panel)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const { selectedTaskId } = taskStore.getState();
      if (selectedTaskId) {
        taskStore.closeDetail();
      }
    }
  });

  // Navigation Click Handling (Delegated on Sidebar)
  if (sidebar) {
    sidebar.addEventListener("click", async (e) => {
      // 1. Delete List Click
      const deleteListBtn = e.target.closest('[data-action="delete-list"]');
      if (deleteListBtn) {
        e.stopPropagation();
        e.preventDefault();
        const listId = deleteListBtn.dataset.listId;
        const listName = deleteListBtn.dataset.listName || "this list";
        const taskCount = parseInt(deleteListBtn.dataset.listCount || "0", 10);

        if (taskCount > 0) {
          showToast({
            message: "Cannot delete a list that contains tasks. Please delete or move tasks first.",
            type: "error",
          });
          return;
        }

        showConfirmModal({
          title: "Delete list?",
          message: `Are you sure you want to delete the list "${listName}"?`,
          confirmText: "Delete",
          isDestructive: true,
          onConfirm: async () => {
            try {
              await listStore.deleteList(listId);
              showToast({
                message: "List deleted successfully.",
                type: "info",
              });
              if (taskStore.getState().currentView === listId) {
                taskStore.setView("my-day");
              }
            } catch (err) {
              showToast({
                message: err.message || "Failed to delete list.",
                type: "error",
              });
            }
          },
        });
        return;
      }

      // 2. Navigation Item Click
      const navItem = e.target.closest("[data-nav]");
      if (navItem) {
        e.preventDefault();
        const targetView = navItem.dataset.nav;

        // Close sidebar on mobile
        if (window.innerWidth <= 768 && sidebar) {
          sidebar.classList.remove("open");
        }

        taskStore.closeDetail();
        taskStore.setView(targetView);
      }
    });
  }

  // Inline List Creation
  const addListBtn = document.getElementById("add-list-btn");
  const inlineListContainer = document.getElementById("inline-add-list-container");

  if (addListBtn && inlineListContainer) {
    addListBtn.addEventListener("click", () => {
      inlineListContainer.innerHTML = `
        <form class="inline-add-list-form" id="inline-add-list-form">
          <input 
            type="text" 
            class="inline-add-list-input" 
            id="inline-list-input" 
            placeholder="List name..." 
            autocomplete="off"
            maxlength="100"
          />
        </form>
      `;

      const form = document.getElementById("inline-add-list-form");
      const input = document.getElementById("inline-list-input");
      if (input) input.focus();

      const cancelAddList = () => {
        inlineListContainer.innerHTML = `
          <button type="button" class="sidebar-add-list-btn" id="add-list-btn">
            <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
            <span>New list</span>
          </button>
        `;
        initAppShellEvents();
      };

      if (input) {
        input.addEventListener("keydown", (e) => {
          if (e.key === "Escape") cancelAddList();
        });
        input.addEventListener("blur", () => {
          if (!input.value.trim()) cancelAddList();
        });
      }

      if (form) {
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          const name = input?.value.trim();
          if (!name) {
            cancelAddList();
            return;
          }

          try {
            const newList = await listStore.createList(name);
            showToast({
              message: `Created list "${name}".`,
              type: "info",
            });
            cancelAddList();
            if (newList?.id) {
              taskStore.setView(newList.id);
            }
          } catch (err) {
            showToast({
              message: err.message || "Failed to create list.",
              type: "error",
            });
          }
        });
      }
    });
  }

  // Quick Add Task Form Submission
  const quickAddForm = document.getElementById("quick-add-form");
  const quickTaskInput = document.getElementById("quick-task-input");
  const quickAddBtn = document.getElementById("quick-add-btn");

  if (quickAddForm) {
    quickAddForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = quickTaskInput?.value.trim();
      if (!title) return;

      const { currentView } = taskStore.getState();
      const taskPayload = { title };

      if (currentView === "my-day") {
        taskPayload.myDayOn = new Date().toISOString().split("T")[0];
      } else if (currentView === "important") {
        taskPayload.priority = "HIGH";
      } else if (currentView !== "all-tasks" && currentView !== "planned") {
        // Custom list ID
        taskPayload.listId = currentView;
      }

      if (quickAddBtn) quickAddBtn.disabled = true;
      if (quickTaskInput) quickTaskInput.value = "";

      try {
        await taskStore.createTask(taskPayload);
      } catch (err) {
        showToast({
          message: err.message || "Failed to create task.",
          type: "error",
        });
        if (quickTaskInput) quickTaskInput.value = title;
      } finally {
        if (quickAddBtn) quickAddBtn.disabled = false;
        if (quickTaskInput) quickTaskInput.focus();
      }
    });
  }

  // Workspace Delegated Task Item Actions
  const workspace = document.getElementById("shell-workspace");
  if (workspace) {
    workspace.addEventListener("click", async (e) => {
      // 1. Completion Toggle
      const completeBtn = e.target.closest('[data-action="toggle-complete"]');
      if (completeBtn) {
        e.stopPropagation();
        const taskId = completeBtn.dataset.taskId;
        try {
          await taskStore.toggleComplete(taskId);
        } catch (err) {
          showToast({
            message: err.message || "Failed to update task.",
            type: "error",
          });
        }
        return;
      }

      // 2. Priority Toggle
      const starBtn = e.target.closest('[data-action="toggle-priority"]');
      if (starBtn) {
        e.stopPropagation();
        const taskId = starBtn.dataset.taskId;
        try {
          await taskStore.togglePriority(taskId);
        } catch (err) {
          showToast({
            message: err.message || "Failed to update priority.",
            type: "error",
          });
        }
        return;
      }

      // 3. Delete Task with Confirmation Modal
      const deleteBtn = e.target.closest('[data-action="delete-task"]');
      if (deleteBtn) {
        e.stopPropagation();
        const taskId = deleteBtn.dataset.taskId;
        const taskObj = taskStore.getState().tasks.find((t) => t.id === taskId);
        const title = taskObj?.title || "this task";

        showConfirmModal({
          title: "Delete task?",
          message: `Are you sure you want to permanently delete "${title}"?`,
          confirmText: "Delete",
          isDestructive: true,
          onConfirm: async () => {
            try {
              await taskStore.deleteTask(taskId);
              showToast({
                message: "Task deleted.",
                type: "info",
              });
            } catch (err) {
              showToast({
                message: err.message || "Failed to delete task.",
                type: "error",
              });
            }
          },
        });
        return;
      }

      // 4. Open Task Detail Panel
      const taskContent = e.target.closest('[data-action="open-detail"]');
      if (taskContent) {
        const taskId = taskContent.dataset.taskId;
        taskStore.selectTask(taskId);
      }
    });
  }

  // Store Subscriptions
  unsubscribeListStore = listStore.subscribe(() => {
    updateSidebarLists();
    updateWorkspaceHeader();
    updateDetailPanel();
  });

  unsubscribeTaskStore = taskStore.subscribe(() => {
    renderTasksListContent();
    updateWorkspaceHeader();
    updateDetailPanel();

    // Highlight active nav item
    const { currentView } = taskStore.getState();
    document.querySelectorAll("[data-nav]").forEach((el) => {
      if (el.dataset.nav === currentView) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });
  });

  // Initial Data Fetch
  listStore.fetchLists();
  taskStore.fetchTasks();
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
