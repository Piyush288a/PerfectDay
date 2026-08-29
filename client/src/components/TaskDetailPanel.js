import { taskStore } from "../store/tasks.js";
import { listStore } from "../store/lists.js";
import { showConfirmModal } from "./Modal.js";
import { showToast } from "./Toast.js";
import { showDatePicker, closeDatePicker } from "./DatePicker.js";
import { initIcons } from "../utils/icons.js";

export const renderTaskDetailPanelHTML = (task, lists = []) => {
  if (!task) return "";

  const isCompleted = Boolean(task.isCompleted);
  const inMyDay = Boolean(task.myDayOn);

  // Format due date for display
  let dueDateText = "Set due date";
  let isOverdue = false;
  let isToday = false;

  if (task.dueDate) {
    const d = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(d);
    checkDate.setHours(0, 0, 0, 0);

    const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    if (checkDate.getTime() === today.getTime()) {
      dueDateText = "Today";
      isToday = true;
    } else if (checkDate.getTime() < today.getTime() && !isCompleted) {
      dueDateText = `Overdue: ${formatted}`;
      isOverdue = true;
    } else {
      dueDateText = formatted;
    }
  }

  // Format created at
  const createdDate = new Date(task.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `
    <div class="detail-panel-inner" id="detail-panel-inner" data-task-id="${task.id}">
      <!-- Header -->
      <div class="detail-header">
        <div style="display: flex; align-items: center; gap: var(--space-3);">
          <button 
            type="button" 
            class="task-checkbox-btn ${isCompleted ? "checked" : ""}" 
            id="detail-toggle-complete" 
            title="${isCompleted ? "Mark incomplete" : "Mark complete"}"
            aria-label="${isCompleted ? "Mark incomplete" : "Mark complete"}"
          >
            <i data-lucide="${isCompleted ? "check" : "circle"}" style="width: 20px; height: 20px;"></i>
          </button>
          <span style="font-size: var(--text-xs); color: var(--color-text-muted); font-weight: 500;">
            ${isCompleted ? "Completed" : "Active task"}
          </span>
        </div>

        <button 
          type="button" 
          class="header-icon-btn" 
          id="detail-close-btn" 
          title="Close details (Esc)" 
          aria-label="Close details"
        >
          <i data-lucide="x" style="width: 18px; height: 18px;"></i>
        </button>
      </div>

      <!-- Scrollable Body -->
      <div class="detail-body">
        <!-- Title Input (Single-Line Glass Input) -->
        <div class="detail-section detail-title-wrap">
          <input 
            type="text" 
            class="detail-title-input" 
            id="detail-title-input" 
            value="${escapeHTML(task.title)}" 
            placeholder="Task title..." 
            aria-label="Task title"
            autocomplete="off"
          />
        </div>

        <!-- My Day Quick Action -->
        <div class="detail-card-action">
          <button 
            type="button" 
            class="detail-action-row ${inMyDay ? "active" : ""}" 
            id="detail-toggle-myday"
          >
            <div class="detail-action-row-left">
              <i data-lucide="sun" style="width: 18px; height: 18px; color: ${inMyDay ? "var(--color-accent)" : "inherit"};"></i>
              <span>${inMyDay ? "Added to My Day" : "Add to My Day"}</span>
            </div>
            ${inMyDay ? `<i data-lucide="check" style="width: 16px; height: 16px; color: var(--color-accent);"></i>` : ""}
          </button>
        </div>

        <!-- Graphical Due Date Section -->
        <div class="detail-card-section">
          <div class="detail-field-label">
            <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
            <span>Due Date</span>
          </div>

          <button 
            type="button" 
            class="detail-date-trigger-btn ${task.dueDate ? "has-date" : ""} ${isOverdue ? "overdue" : ""} ${isToday ? "today" : ""}" 
            id="detail-date-picker-btn"
            aria-label="Change due date"
          >
            <div style="display: flex; align-items: center; gap: var(--space-2);">
              <i data-lucide="calendar" style="width: 15px; height: 15px;"></i>
              <span id="detail-date-display-text">${escapeHTML(dueDateText)}</span>
            </div>
            <i data-lucide="chevron-down" style="width: 14px; height: 14px; opacity: 0.7;"></i>
          </button>
        </div>

        <!-- Priority Selector -->
        <div class="detail-card-section">
          <div class="detail-field-label">
            <i data-lucide="flag" style="width: 14px; height: 14px;"></i>
            <span>Priority</span>
          </div>

          <div class="detail-priority-grid">
            <button type="button" class="priority-chip ${task.priority === "NONE" ? "active" : ""}" data-priority="NONE">
              None
            </button>
            <button type="button" class="priority-chip priority-low ${task.priority === "LOW" ? "active" : ""}" data-priority="LOW">
              Low
            </button>
            <button type="button" class="priority-chip priority-med ${task.priority === "MEDIUM" ? "active" : ""}" data-priority="MEDIUM">
              Med
            </button>
            <button type="button" class="priority-chip priority-high ${task.priority === "HIGH" ? "active" : ""}" data-priority="HIGH">
              <i data-lucide="star" style="width: 12px; height: 12px; fill: currentColor;"></i>
              High
            </button>
          </div>
        </div>

        <!-- List Selector -->
        <div class="detail-card-section">
          <div class="detail-field-label">
            <i data-lucide="list" style="width: 14px; height: 14px;"></i>
            <span>Move to List</span>
          </div>

          <select class="detail-select-input" id="detail-list-select" aria-label="Select List">
            ${lists
              .map(
                (l) => `
              <option value="${l.id}" ${task.listId === l.id ? "selected" : ""}>
                ${escapeHTML(l.name)} ${l.isDefault ? "(Default)" : ""}
              </option>
            `
              )
              .join("")}
          </select>
        </div>

        <!-- Notes Section (Multi-character Continuous Editing) -->
        <div class="detail-card-section">
          <div class="detail-field-label">
            <i data-lucide="file-text" style="width: 14px; height: 14px;"></i>
            <span>Notes</span>
          </div>

          <textarea 
            class="detail-notes-textarea" 
            id="detail-notes-input" 
            placeholder="Add notes, context, or links..." 
            rows="4" 
            aria-label="Task notes"
          >${escapeHTML(task.notes || "")}</textarea>
        </div>
      </div>

      <!-- Footer -->
      <div class="detail-footer">
        <span class="detail-created-text">Created ${createdDate}</span>

        <button 
          type="button" 
          class="detail-delete-btn" 
          id="detail-delete-task-btn" 
          title="Delete task" 
          aria-label="Delete task"
        >
          <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
          <span>Delete</span>
        </button>
      </div>
    </div>
  `;
};

export const initTaskDetailPanelEvents = (panelEl) => {
  if (!panelEl) return;
  const inner = panelEl.querySelector("#detail-panel-inner");
  if (!inner) return;

  const taskId = inner.dataset.taskId;
  if (!taskId) return;

  // 1. Close Button
  const closeBtn = panelEl.querySelector("#detail-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      closeDatePicker();
      taskStore.closeDetail();
    });
  }

  // 2. Title Input (Single-line Debounced save & Enter key support)
  const titleInput = panelEl.querySelector("#detail-title-input");
  if (titleInput) {
    titleInput.addEventListener("input", () => {
      const val = titleInput.value;
      taskStore.debouncedUpdateTask(taskId, { title: val }, 500);
    });

    titleInput.addEventListener("blur", () => {
      const val = titleInput.value;
      if (val.trim()) {
        taskStore.updateTask(taskId, { title: val });
      }
    });

    titleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        titleInput.blur();
      }
    });
  }

  // 3. Complete Toggle
  const completeBtn = panelEl.querySelector("#detail-toggle-complete");
  if (completeBtn) {
    completeBtn.addEventListener("click", async () => {
      try {
        await taskStore.toggleComplete(taskId);
      } catch (err) {
        showToast({ message: err.message || "Failed to update task.", type: "error" });
      }
    });
  }

  // 4. My Day Toggle
  const myDayBtn = panelEl.querySelector("#detail-toggle-myday");
  if (myDayBtn) {
    myDayBtn.addEventListener("click", async () => {
      const { selectedTask } = taskStore.getState();
      const inMyDay = Boolean(selectedTask?.myDayOn);
      const nextMyDay = inMyDay ? null : new Date().toISOString().split("T")[0];

      try {
        await taskStore.updateTask(taskId, { myDayOn: nextMyDay });
        showToast({
          message: inMyDay ? "Removed from My Day." : "Added to My Day.",
          type: "info",
        });
      } catch (err) {
        showToast({ message: err.message || "Failed to update My Day.", type: "error" });
      }
    });
  }

  // 5. Graphical Date Picker Trigger
  const dateBtn = panelEl.querySelector("#detail-date-picker-btn");
  if (dateBtn) {
    dateBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const { selectedTask } = taskStore.getState();
      showDatePicker({
        anchorEl: dateBtn,
        currentDate: selectedTask?.dueDate || null,
        onSelect: async (selectedISO) => {
          try {
            await taskStore.updateTask(taskId, { dueDate: selectedISO });
            showToast({ message: `Due date set to ${selectedISO}`, type: "info" });
          } catch (err) {
            showToast({ message: err.message || "Failed to update due date.", type: "error" });
          }
        },
        onClear: async () => {
          try {
            await taskStore.updateTask(taskId, { dueDate: null });
            showToast({ message: "Due date cleared.", type: "info" });
          } catch (err) {
            showToast({ message: err.message || "Failed to clear due date.", type: "error" });
          }
        },
      });
    });
  }

  // 6. Priority Selector
  const priorityChips = panelEl.querySelectorAll("[data-priority]");
  priorityChips.forEach((chip) => {
    chip.addEventListener("click", async () => {
      const targetPriority = chip.dataset.priority;
      try {
        await taskStore.updateTask(taskId, { priority: targetPriority });
      } catch (err) {
        showToast({ message: err.message || "Failed to update priority.", type: "error" });
      }
    });
  });

  // 7. List Selector Dropdown
  const listSelect = panelEl.querySelector("#detail-list-select");
  if (listSelect) {
    listSelect.addEventListener("change", async () => {
      const targetListId = listSelect.value;
      try {
        await taskStore.updateTask(taskId, { listId: targetListId });
        showToast({ message: "Task moved to list.", type: "info" });
      } catch (err) {
        showToast({ message: err.message || "Failed to move task.", type: "error" });
      }
    });
  }

  // 8. Notes Textarea (Continuous Multi-character Editing with 500ms Debounce)
  const notesInput = panelEl.querySelector("#detail-notes-input");
  if (notesInput) {
    const autoGrowNotes = () => {
      notesInput.style.height = "auto";
      notesInput.style.height = `${Math.max(notesInput.scrollHeight, 80)}px`;
    };
    autoGrowNotes();

    notesInput.addEventListener("input", () => {
      autoGrowNotes();
      const val = notesInput.value;
      taskStore.debouncedUpdateTask(taskId, { notes: val }, 500);
    });

    notesInput.addEventListener("blur", () => {
      const val = notesInput.value;
      taskStore.updateTask(taskId, { notes: val });
    });
  }

  // 9. Delete Button (With Confirmation Modal)
  const deleteBtn = panelEl.querySelector("#detail-delete-task-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      const { selectedTask } = taskStore.getState();
      const title = selectedTask?.title || "this task";

      showConfirmModal({
        title: "Delete task?",
        message: `Are you sure you want to permanently delete "${title}"?`,
        confirmText: "Delete",
        isDestructive: true,
        onConfirm: async () => {
          try {
            await taskStore.deleteTask(taskId);
            showToast({ message: "Task deleted.", type: "info" });
          } catch (err) {
            showToast({ message: err.message || "Failed to delete task.", type: "error" });
          }
        },
      });
    });
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
