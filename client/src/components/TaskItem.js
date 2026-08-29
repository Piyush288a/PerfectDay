import { showNotesPopover } from "./NotesPopover.js";

export const renderTaskItemHTML = (task, activeView, lists = [], selectedTaskId = null) => {
  const isHighPriority = task.priority === "HIGH";
  const isCompleted = Boolean(task.isCompleted);
  const isSelected = task.id === selectedTaskId;

  // Format due date if available
  let dueDateHTML = "";
  if (task.dueDate) {
    const d = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(d);
    checkDate.setHours(0, 0, 0, 0);

    let dateText = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    let isOverdue = false;
    let isToday = false;

    if (checkDate.getTime() === today.getTime()) {
      dateText = "Today";
      isToday = true;
    } else if (checkDate.getTime() < today.getTime() && !isCompleted) {
      isOverdue = true;
    }

    dueDateHTML = `
      <span class="task-meta-pill task-meta-due ${isOverdue ? "overdue" : ""} ${isToday ? "today" : ""}">
        <i data-lucide="calendar" style="width: 12px; height: 12px;"></i>
        <span>${isOverdue ? "Overdue: " : ""}${dateText}</span>
      </span>
    `;
  }

  // Format priority pill for LOW and MEDIUM (HIGH is displayed by star)
  let priorityPillHTML = "";
  if (task.priority === "MEDIUM") {
    priorityPillHTML = `
      <span class="task-meta-pill task-meta-priority-med">
        <i data-lucide="flag" style="width: 11px; height: 11px;"></i>
        <span>Med</span>
      </span>
    `;
  } else if (task.priority === "LOW") {
    priorityPillHTML = `
      <span class="task-meta-pill task-meta-priority-low">
        <i data-lucide="flag" style="width: 11px; height: 11px;"></i>
        <span>Low</span>
      </span>
    `;
  }

  // Format list badge if not in specific list view
  let listBadgeHTML = "";
  if (activeView !== task.listId && task.list?.name) {
    listBadgeHTML = `
      <span class="task-meta-pill task-meta-list">
        <i data-lucide="list" style="width: 12px; height: 12px;"></i>
        <span>${escapeHTML(task.list.name)}</span>
      </span>
    `;
  }

  // Format My Day badge
  let myDayBadgeHTML = "";
  if (task.myDayOn && activeView !== "my-day") {
    myDayBadgeHTML = `
      <span class="task-meta-pill task-meta-myday">
        <i data-lucide="sun" style="width: 12px; height: 12px;"></i>
        <span>My Day</span>
      </span>
    `;
  }

  // Format notes indicator icon (clickable for preview popover)
  let notesIndicatorHTML = "";
  if (task.notes && task.notes.trim()) {
    notesIndicatorHTML = `
      <button 
        type="button" 
        class="task-meta-pill task-meta-notes-btn" 
        data-action="preview-notes" 
        data-task-id="${task.id}"
        title="View note preview"
        aria-label="View note preview"
      >
        <i data-lucide="file-text" style="width: 12px; height: 12px;"></i>
      </button>
    `;
  }

  return `
    <div class="task-item ${isCompleted ? "completed" : ""} ${isSelected ? "selected" : ""}" data-task-id="${task.id}">
      <!-- Checkbox -->
      <button 
        type="button" 
        class="task-checkbox-btn ${isCompleted ? "checked" : ""}" 
        data-action="toggle-complete" 
        data-task-id="${task.id}"
        aria-label="${isCompleted ? "Mark task incomplete" : "Mark task complete"}"
      >
        <i data-lucide="${isCompleted ? "check" : "circle"}" style="width: 18px; height: 18px;"></i>
      </button>

      <!-- Content (Click to open detail) -->
      <div class="task-content" data-action="open-detail" data-task-id="${task.id}">
        <span class="task-title">${escapeHTML(task.title)}</span>
        
        <div class="task-meta-row">
          ${myDayBadgeHTML}
          ${dueDateHTML}
          ${priorityPillHTML}
          ${listBadgeHTML}
          ${notesIndicatorHTML}
        </div>
      </div>

      <!-- Actions -->
      <div class="task-actions">
        <button 
          type="button" 
          class="task-action-btn star-btn ${isHighPriority ? "starred" : ""}" 
          data-action="toggle-priority" 
          data-task-id="${task.id}"
          title="${isHighPriority ? "Remove importance" : "Mark as important"}"
          aria-label="${isHighPriority ? "Remove importance" : "Mark as important"}"
        >
          <i data-lucide="star" style="width: 16px; height: 16px; ${isHighPriority ? "fill: var(--color-accent); color: var(--color-accent);" : ""}"></i>
        </button>

        <button 
          type="button" 
          class="task-action-btn delete-btn" 
          data-action="delete-task" 
          data-task-id="${task.id}"
          title="Delete task"
          aria-label="Delete task"
        >
          <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
        </button>
      </div>
    </div>
  `;
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
