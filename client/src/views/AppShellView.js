import { renderThemeToggleHTML } from "../components/ThemeToggle.js";
import { showToast } from "../components/Toast.js";
import { authStore } from "../store/auth.js";
import { listStore } from "../store/lists.js";
import { taskStore } from "../store/tasks.js";
import { renderTaskItemHTML } from "../components/TaskItem.js";
import { renderTaskDetailPanelHTML, initTaskDetailPanelEvents } from "../components/TaskDetailPanel.js";
import { showConfirmModal } from "../components/Modal.js";
import { showNotesPopover } from "../components/NotesPopover.js";
import { showProfilePopover } from "../components/ProfilePopover.js";
import { closeDatePicker } from "../components/DatePicker.js";
import { renderAmbientSceneHTML } from "../components/AmbientScene.js";
import { initIcons } from "../utils/icons.js";

let unsubscribeListStore = null;
let unsubscribeTaskStore = null;
let currentRenderedDetailTaskId = null;
let isSidebarCollapsed = false;

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
      placeholder: "Add a task to My Day...",
      emptyTitle: "Your day is clear",
      emptyDesc: "Tasks you add for today will appear here. Plan your day with clarity and focus.",
      emptyIcon: "sun",
      isCustomList: false,
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
      isCustomList: false,
    };
  }

  if (currentView === "planned") {
    return {
      title: "Planned",
      subtitle: "Organized schedule across upcoming days.",
      date: null,
      placeholder: "Add a scheduled task...",
      emptyTitle: "No planned tasks",
      emptyDesc: "Tasks with upcoming due dates will automatically organize into scheduled day columns.",
      emptyIcon: "calendar",
      isCustomList: false,
    };
  }

  if (currentView === "all-tasks") {
    return {
      title: "Tasks",
      subtitle: "All your active and completed tasks.",
      date: null,
      placeholder: "Add a task...",
      emptyTitle: "All caught up",
      emptyDesc: "You don't have any tasks right now. Create one below to get started.",
      emptyIcon: "list-todo",
      isCustomList: false,
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
    isCustomList: true,
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
    ${renderAmbientSceneHTML()}

    <!-- Header -->
    <header class="shell-header">
      <div class="shell-header-left">
        <button type="button" id="sidebar-toggle" class="sidebar-toggle-btn" title="Toggle Navigation" aria-label="Toggle Navigation Sidebar">
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
    <div class="shell-body ${isSidebarCollapsed ? "collapsed-nav" : ""}">
      <!-- Collapsible Translucent Navigation Rail / Sidebar -->
      <aside class="shell-sidebar ${isSidebarCollapsed ? "collapsed" : ""}" id="shell-sidebar">
        <div class="sidebar-top">
          <!-- User Summary Card in Sidebar -->
          <div class="sidebar-user-card" id="sidebar-user-card">
            <div class="user-avatar-btn" style="width: 32px; height: 32px; font-size: 0.75rem; flex-shrink: 0;">
              <span>${initials}</span>
            </div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">${escapeHTML(userName)}</div>
              <div class="sidebar-user-email">${escapeHTML(user?.email || "")}</div>
            </div>
          </div>

          <!-- Main Views -->
          <nav class="sidebar-nav-section" aria-label="Main Views">
            <a href="javascript:void(0)" class="sidebar-nav-item ${currentView === "my-day" ? "active" : ""}" data-nav="my-day" title="My Day">
              <div class="sidebar-nav-item-left">
                <i data-lucide="sun" style="width: 18px; height: 18px;"></i>
                <span class="nav-item-label">My Day</span>
              </div>
            </a>

            <a href="javascript:void(0)" class="sidebar-nav-item ${currentView === "important" ? "active" : ""}" data-nav="important" title="Important">
              <div class="sidebar-nav-item-left">
                <i data-lucide="star" style="width: 18px; height: 18px;"></i>
                <span class="nav-item-label">Important</span>
              </div>
            </a>

            <a href="javascript:void(0)" class="sidebar-nav-item ${currentView === "planned" ? "active" : ""}" data-nav="planned" title="Planned">
              <div class="sidebar-nav-item-left">
                <i data-lucide="calendar" style="width: 18px; height: 18px;"></i>
                <span class="nav-item-label">Planned</span>
              </div>
            </a>

            <a href="javascript:void(0)" class="sidebar-nav-item ${currentView === "all-tasks" ? "active" : ""}" data-nav="all-tasks" title="Tasks">
              <div class="sidebar-nav-item-left">
                <i data-lucide="list-todo" style="width: 18px; height: 18px;"></i>
                <span class="nav-item-label">Tasks</span>
              </div>
              ${defaultListCount > 0 ? `<span class="sidebar-badge">${defaultListCount}</span>` : ""}
            </a>
          </nav>

          <!-- Custom Lists Section -->
          <div class="sidebar-section-title">
            <span class="section-title-label">Lists</span>
          </div>

          <nav class="sidebar-nav-section" id="sidebar-custom-lists" aria-label="Custom Lists">
            ${customLists
              .map(
                (list) => `
                <div class="sidebar-list-item ${currentView === list.id ? "active" : ""}" data-nav="${list.id}" title="${escapeHTML(list.name)}">
                  <div class="sidebar-nav-item-left">
                    <i data-lucide="layout-grid" style="width: 16px; height: 16px;"></i>
                    <span class="nav-item-label">${escapeHTML(list.name)}</span>
                  </div>
                  <div class="sidebar-item-actions-wrap">
                    ${list._count?.tasks > 0 ? `<span class="sidebar-badge">${list._count.tasks}</span>` : ""}
                    <div class="sidebar-list-actions">
                      <button 
                        type="button" 
                        class="sidebar-list-btn rename-list-btn" 
                        data-action="rename-list" 
                        data-list-id="${list.id}"
                        data-list-name="${escapeHTML(list.name)}"
                        title="Rename list" 
                        aria-label="Rename list"
                      >
                        <i data-lucide="edit-3" style="width: 13px; height: 13px;"></i>
                      </button>

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
            <button type="button" class="sidebar-add-list-btn" id="add-list-btn" title="Create new list">
              <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
              <span class="nav-item-label">New list</span>
            </button>
          </div>
        </div>

        <div class="sidebar-footer">
          <span class="sidebar-version-label">PerfectDay v0.7.5</span>
        </div>
      </aside>

      <!-- Main Workspace -->
      <main class="shell-workspace ${currentView === "planned" ? "planned-mode" : ""}" id="shell-workspace">
        <div class="workspace-header">
          <div class="workspace-title-row">
            <div class="workspace-title-left">
              <h1 class="workspace-title" id="workspace-title">${escapeHTML(meta.title)}</h1>
              ${meta.date ? `<span class="workspace-date">${meta.date}</span>` : ""}
              ${meta.isCustomList ? `
                <button type="button" class="workspace-header-action-btn" id="workspace-rename-list-btn" data-list-id="${meta.listId}" title="Rename this list">
                  <i data-lucide="edit-3" style="width: 16px; height: 16px;"></i>
                </button>
              ` : ""}
            </div>
          </div>
          <p class="workspace-subtitle" id="workspace-subtitle">${meta.subtitle}</p>
        </div>

        <!-- Tasks Content Container -->
        <div id="workspace-tasks-container" class="workspace-content-scroll">
          <div class="loading-skeleton">
            <div class="skeleton-bar"></div>
            <div class="skeleton-bar"></div>
          </div>
        </div>

        <!-- Bottom-Anchored Quick Add Bar -->
        <div class="bottom-quick-add-container">
          <form class="quick-add-task-bar glass-card" id="quick-add-form">
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
        </div>
      </main>

      <!-- Slide-Over Task Detail Panel -->
      <aside class="task-detail-panel" id="task-detail-panel" aria-label="Task Details"></aside>
    </div>
  </div>
  `;
};

// Render Tasks List for Standard Views & Custom Lists
const renderStandardTaskList = (tasks, currentView, lists, selectedTaskId) => {
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
      <div class="task-list-section" style="margin-top: var(--space-6);">
        <div class="task-section-title">Completed (${completedTasks.length})</div>
        <div class="task-list">
          ${completedTasks.map((task) => renderTaskItemHTML(task, currentView, lists, selectedTaskId)).join("")}
        </div>
      </div>
    `;
  }

  html += `</div>`;
  return html;
};

// Render Planned View (Horizontal Date Columns)
const renderPlannedHorizontalView = (tasks, lists, selectedTaskId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Group tasks by category/date
  const overdueTasks = [];
  const todayTasks = [];
  const tomorrowTasks = [];
  const upcomingMap = new Map(); // dateISO -> tasks[]
  const noDateTasks = [];

  tasks.forEach((task) => {
    if (!task.dueDate) {
      if (task.myDayOn) {
        // Rule 6: Task with myDayOn == today AND no dueDate -> appears in Today bucket in Planned
        todayTasks.push(task);
      } else {
        noDateTasks.push(task);
      }
      return;
    }

    const d = new Date(task.dueDate);
    d.setHours(0, 0, 0, 0);
    const iso = d.toISOString().split("T")[0];

    if (d.getTime() < today.getTime() && !task.isCompleted) {
      overdueTasks.push(task);
    } else if (d.getTime() === today.getTime()) {
      todayTasks.push(task);
    } else if (d.getTime() === tomorrow.getTime()) {
      tomorrowTasks.push(task);
    } else {
      if (!upcomingMap.has(iso)) {
        upcomingMap.set(iso, []);
      }
      upcomingMap.get(iso).push(task);
    }
  });

  // Sort today tasks so My Day tasks appear first within Today
  todayTasks.sort((a, b) => {
    if (Boolean(a.myDayOn) && !Boolean(b.myDayOn)) return -1;
    if (!Boolean(a.myDayOn) && Boolean(b.myDayOn)) return 1;
    return 0;
  });

  // Sort upcoming dates
  const sortedUpcomingDates = Array.from(upcomingMap.keys()).sort();

  let html = `
    <div class="planned-board-viewport planned-horizontal-workspace" id="planned-horizontal-workspace">
      <div class="planned-board-track">
  `;

  // 1. Overdue Column (if any)
  if (overdueTasks.length > 0) {
    html += `
      <div class="planned-date-column overdue-column glass-card">
        <div class="planned-col-header">
          <span class="planned-col-title overdue-title">Overdue</span>
          <span class="planned-col-count overdue-badge">${overdueTasks.length}</span>
        </div>
        <div class="planned-col-tasks">
          ${overdueTasks.map((t) => renderTaskItemHTML(t, "planned", lists, selectedTaskId)).join("")}
        </div>
      </div>
    `;
  }

  // 2. Today Column
  html += `
    <div class="planned-date-column today-column glass-card">
      <div class="planned-col-header">
        <span class="planned-col-title">Today</span>
        <span class="planned-col-count">${todayTasks.length}</span>
      </div>
      <div class="planned-col-tasks">
        ${todayTasks.length > 0
          ? todayTasks.map((t) => renderTaskItemHTML(t, "planned", lists, selectedTaskId)).join("")
          : `<div class="planned-empty-col">No tasks scheduled for today</div>`}
      </div>
    </div>
  `;

  // 3. Tomorrow Column
  html += `
    <div class="planned-date-column glass-card">
      <div class="planned-col-header">
        <span class="planned-col-title">Tomorrow</span>
        <span class="planned-col-count">${tomorrowTasks.length}</span>
      </div>
      <div class="planned-col-tasks">
        ${tomorrowTasks.length > 0
          ? tomorrowTasks.map((t) => renderTaskItemHTML(t, "planned", lists, selectedTaskId)).join("")
          : `<div class="planned-empty-col">No tasks scheduled</div>`}
      </div>
    </div>
  `;

  // 4. Upcoming Day Columns
  sortedUpcomingDates.forEach((dateISO) => {
    const d = new Date(dateISO);
    const dayName = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const colTasks = upcomingMap.get(dateISO) || [];

    html += `
      <div class="planned-date-column glass-card">
        <div class="planned-col-header">
          <span class="planned-col-title">${dayName}</span>
          <span class="planned-col-count">${colTasks.length}</span>
        </div>
        <div class="planned-col-tasks">
          ${colTasks.map((t) => renderTaskItemHTML(t, "planned", lists, selectedTaskId)).join("")}
        </div>
      </div>
    `;
  });

  // 5. Someday / Later Column (if any)
  if (noDateTasks.length > 0) {
    html += `
      <div class="planned-date-column glass-card">
        <div class="planned-col-header">
          <span class="planned-col-title">Later / Unscheduled</span>
          <span class="planned-col-count">${noDateTasks.length}</span>
        </div>
        <div class="planned-col-tasks">
          ${noDateTasks.map((t) => renderTaskItemHTML(t, "planned", lists, selectedTaskId)).join("")}
        </div>
      </div>
    `;
  }

  html += `
      </div>
    </div>
  `;
  return html;
};

// Render Master/Detail Tasks View
const renderMasterDetailTasksView = (tasks, lists, selectedTaskId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const overdue = [];
  const todayTasks = [];
  const tomorrowTasks = [];
  const upcomingTasks = [];
  const noDateTasks = [];
  const completedTasks = [];

  tasks.forEach((t) => {
    if (t.isCompleted) {
      completedTasks.push(t);
      return;
    }

    if (!t.dueDate) {
      if (t.myDayOn) {
        // My Day with no due date -> Today group
        todayTasks.push(t);
      } else {
        noDateTasks.push(t);
      }
      return;
    }

    const d = new Date(t.dueDate);
    d.setHours(0, 0, 0, 0);

    if (d.getTime() < today.getTime()) {
      overdue.push(t);
    } else if (d.getTime() === today.getTime()) {
      todayTasks.push(t);
    } else if (d.getTime() === tomorrow.getTime()) {
      tomorrowTasks.push(t);
    } else {
      upcomingTasks.push(t);
    }
  });

  // Sort today tasks so My Day tasks appear first within Today
  todayTasks.sort((a, b) => {
    if (Boolean(a.myDayOn) && !Boolean(b.myDayOn)) return -1;
    if (!Boolean(a.myDayOn) && Boolean(b.myDayOn)) return 1;
    return 0;
  });

  let html = `<div class="tasks-master-view">`;

  const renderSection = (title, items, isOverdue = false) => {
    if (!items || items.length === 0) return "";
    return `
      <div class="task-date-group-section">
        <div class="task-date-group-header ${isOverdue ? "overdue" : ""}">
          <span>${title}</span>
          <span class="group-count-badge">${items.length}</span>
        </div>
        <div class="task-list">
          ${items.map((t) => renderTaskItemHTML(t, "all-tasks", lists, selectedTaskId)).join("")}
        </div>
      </div>
    `;
  };

  html += renderSection("Overdue", overdue, true);
  html += renderSection("Today", todayTasks);
  html += renderSection("Tomorrow", tomorrowTasks);
  html += renderSection("Upcoming", upcomingTasks);
  html += renderSection("No Due Date", noDateTasks);
  html += renderSection("Completed", completedTasks);

  html += `</div>`;
  return html;
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

  if (currentView === "planned") {
    container.innerHTML = renderPlannedHorizontalView(tasks, lists, selectedTaskId);
  } else if (currentView === "all-tasks") {
    container.innerHTML = renderMasterDetailTasksView(tasks, lists, selectedTaskId);
  } else {
    container.innerHTML = renderStandardTaskList(tasks, currentView, lists, selectedTaskId);
  }

  initIcons();
};

const updateDetailPanel = () => {
  const { selectedTask, selectedTaskId } = taskStore.getState();
  const { lists } = listStore.getState();
  const panel = document.getElementById("task-detail-panel");
  if (!panel) return;

  if (!selectedTask || !selectedTaskId) {
    panel.classList.remove("open");
    panel.innerHTML = "";
    currentRenderedDetailTaskId = null;
    return;
  }

  // Preserve active input focus if user is currently typing in the detail panel
  const activeEl = document.activeElement;
  const isEditingInPanel = activeEl && panel.contains(activeEl) &&
    (activeEl.id === "detail-title-input" || activeEl.id === "detail-notes-input");

  if (currentRenderedDetailTaskId === selectedTaskId && isEditingInPanel) {
    // Only update non-input parts to prevent destroying the textarea
    const completeBtn = panel.querySelector("#detail-toggle-complete");
    if (completeBtn) {
      const isCompleted = Boolean(selectedTask.isCompleted);
      completeBtn.className = `task-checkbox-btn ${isCompleted ? "checked" : ""}`;
    }

    const myDayBtn = panel.querySelector("#detail-toggle-myday");
    if (myDayBtn) {
      const inMyDay = Boolean(selectedTask.myDayOn);
      myDayBtn.className = `detail-action-row ${inMyDay ? "active" : ""}`;
      const textSpan = myDayBtn.querySelector(".detail-action-row-left span");
      if (textSpan) textSpan.textContent = inMyDay ? "Added to My Day" : "Add to My Day";
    }

    const dateText = panel.querySelector("#detail-date-display-text");
    if (dateText && selectedTask.dueDate) {
      dateText.textContent = new Date(selectedTask.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return;
  }

  currentRenderedDetailTaskId = selectedTaskId;
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
      <div class="sidebar-list-item ${currentView === list.id ? "active" : ""}" data-nav="${list.id}" title="${escapeHTML(list.name)}">
        <div class="sidebar-nav-item-left">
          <i data-lucide="layout-grid" style="width: 16px; height: 16px;"></i>
          <span class="nav-item-label">${escapeHTML(list.name)}</span>
        </div>
        <div class="sidebar-item-actions-wrap">
          ${list._count?.tasks > 0 ? `<span class="sidebar-badge">${list._count.tasks}</span>` : ""}
          <div class="sidebar-list-actions">
            <button 
              type="button" 
              class="sidebar-list-btn rename-list-btn" 
              data-action="rename-list" 
              data-list-id="${list.id}"
              data-list-name="${escapeHTML(list.name)}"
              title="Rename list" 
              aria-label="Rename list"
            >
              <i data-lucide="edit-3" style="width: 13px; height: 13px;"></i>
            </button>

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

  const sidebar = document.getElementById("shell-sidebar");
  const shellBody = document.querySelector(".shell-body");
  const toggleBtn = document.getElementById("sidebar-toggle");

  // Sidebar Toggle (Mobile Drawer & Desktop Rail Collapse)
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.toggle("open");
      } else {
        isSidebarCollapsed = !isSidebarCollapsed;
        sidebar.classList.toggle("collapsed", isSidebarCollapsed);
        if (shellBody) shellBody.classList.toggle("collapsed-nav", isSidebarCollapsed);
      }
    });
  }

  // Header User Profile Popover
  const profileBtn = document.getElementById("user-profile-btn");
  if (profileBtn) {
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showProfilePopover({ anchorEl: profileBtn });
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

  // Global Keyboard Handling (Escape closes detail panel or popovers)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDatePicker();
      const { selectedTaskId } = taskStore.getState();
      if (selectedTaskId) {
        taskStore.closeDetail();
      }
    }
  });

  // Prompt helper for List Renaming
  const handleRenameList = (listId, currentName) => {
    const newName = window.prompt("Enter new list name:", currentName);
    if (!newName || !newName.trim() || newName.trim() === currentName) return;

    listStore.updateList(listId, newName.trim())
      .then(() => {
        showToast({ message: `List renamed to "${newName.trim()}".`, type: "info" });
        updateWorkspaceHeader();
      })
      .catch((err) => {
        showToast({ message: err.message || "Failed to rename list.", type: "error" });
      });
  };

  // Workspace Header Rename Button (for custom lists)
  const headerRenameBtn = document.getElementById("workspace-rename-list-btn");
  if (headerRenameBtn) {
    headerRenameBtn.addEventListener("click", () => {
      const listId = headerRenameBtn.dataset.listId;
      const list = listStore.getListById(listId);
      if (list) {
        handleRenameList(listId, list.name);
      }
    });
  }

  // Navigation Click Handling (Delegated on Sidebar)
  if (sidebar) {
    sidebar.addEventListener("click", async (e) => {
      // 1. Rename List Click
      const renameBtn = e.target.closest('[data-action="rename-list"]');
      if (renameBtn) {
        e.stopPropagation();
        e.preventDefault();
        const listId = renameBtn.dataset.listId;
        const listName = renameBtn.dataset.listName || "";
        handleRenameList(listId, listName);
        return;
      }

      // 2. Delete List Click
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

      // 3. Navigation Item Click
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
          <button type="button" class="sidebar-add-list-btn" id="add-list-btn" title="Create new list">
            <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
            <span class="nav-item-label">New list</span>
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

  // Quick Add Task Form Submission (Bottom-Anchored)
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
      } else if (currentView === "planned") {
        taskPayload.dueDate = new Date().toISOString().split("T")[0];
      } else if (currentView !== "all-tasks") {
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
      // 1. Notes Preview Popover Click (CRITICAL: stops propagation so detail panel does not open!)
      const notesBtn = e.target.closest('[data-action="preview-notes"]');
      if (notesBtn) {
        e.stopPropagation();
        e.preventDefault();
        const taskId = notesBtn.dataset.taskId;
        const task = taskStore.getState().tasks.find((t) => t.id === taskId);
        if (task) {
          showNotesPopover({ anchorEl: notesBtn, task });
        }
        return;
      }

      // 2. Completion Toggle
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

      // 3. Priority Toggle
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

      // 4. Delete Task with Confirmation Modal
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

      // 5. Open Task Detail Panel
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
