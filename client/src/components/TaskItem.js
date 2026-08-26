export const renderTaskItemHTML = (task, activeView, lists = []) => {
  const isHighPriority = task.priority === "HIGH";
  const isCompleted = Boolean(task.isCompleted);

  // Format due date if available
  let dueDateHTML = "";
  if (task.dueDate) {
    const d = new Date(task.dueDate);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dueDateHTML = `
      <span class="task-meta-pill task-meta-due">
        <i data-lucide="calendar" style="width: 12px; height: 12px;"></i>
        <span>${dateStr}</span>
      </span>
    `;
  }

  // Format list badge if not in specific list view
  let listBadgeHTML = "";
  if (activeView !== task.listId && task.list?.name) {
    listBadgeHTML = `
      <span class="task-meta-pill task-meta-list">
        <i data-lucide="list" style="width: 12px; height: 12px;"></i>
        <span>${task.list.name}</span>
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

  return `
    <div class="task-item ${isCompleted ? "completed" : ""}" data-task-id="${task.id}">
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

      <!-- Content -->
      <div class="task-content">
        <span class="task-title" data-action="edit-title" data-task-id="${task.id}">${escapeHTML(task.title)}</span>
        
        <div class="task-meta-row">
          ${myDayBadgeHTML}
          ${dueDateHTML}
          ${listBadgeHTML}
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
