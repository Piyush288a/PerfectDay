import { tasksApi } from "../api/tasks.js";
import { listStore } from "./lists.js";

class TaskStore {
  constructor() {
    this.state = {
      currentView: "my-day", // "my-day" | "important" | "planned" | "all-tasks" | UUID listId
      tasks: [],
      selectedTaskId: null,
      selectedTask: null,
      loading: false,
      error: null,
    };
    this.activeRequestId = 0;
    this.saveTimers = new Map();
    this.activeSaveVersion = new Map();
    this.listeners = new Set();
  }

  getState() {
    return { ...this.state };
  }

  reset() {
    // Cancel all active debounce timers
    this.saveTimers.forEach((timer) => clearTimeout(timer));
    this.saveTimers.clear();
    this.activeSaveVersion.clear();
    this.activeRequestId++; // Invalidate any pending API responses

    this.state = {
      currentView: "my-day",
      tasks: [],
      selectedTaskId: null,
      selectedTask: null,
      loading: false,
      error: null,
    };
    this.notify();
  }

  setView(view) {
    if (this.state.currentView === view) return;
    this.state.currentView = view;
    this.fetchTasks();
  }

  _taskMatchesCurrentView(task) {
    if (!task) return false;
    const view = this.state.currentView;
    if (view === "my-day") {
      return Boolean(task.myDayOn);
    }
    if (view === "important") {
      return task.priority === "HIGH";
    }
    if (view === "planned") {
      return Boolean(task.dueDate) || Boolean(task.myDayOn);
    }
    if (view === "all-tasks") {
      return true;
    }
    // Custom List ID
    return task.listId === view;
  }

  async selectTask(id) {
    if (!id) {
      this.closeDetail();
      return;
    }

    this.state.selectedTaskId = id;

    // First use task already available locally in store
    const localTask = this.state.tasks.find((t) => t.id === id);
    if (localTask) {
      this.state.selectedTask = { ...localTask };
      this.notify();
      return;
    }

    // Only fetch if missing from local state
    try {
      const task = await tasksApi.getTask(id);
      if (this.state.selectedTaskId === id) {
        this.state.selectedTask = task;
      }
    } catch (err) {
      console.error("TaskStore selectTask error:", err);
      if (this.state.selectedTaskId === id) {
        this.state.selectedTaskId = null;
        this.state.selectedTask = null;
      }
    } finally {
      this.notify();
    }
  }

  closeDetail() {
    if (!this.state.selectedTaskId && !this.state.selectedTask) return;
    this.state.selectedTaskId = null;
    this.state.selectedTask = null;
    this.notify();
  }

  async fetchTasks() {
    const requestId = ++this.activeRequestId;
    this.state.loading = true;
    this.notify();

    const view = this.state.currentView;
    const query = {};

    if (view === "my-day") {
      query.myDay = true;
      query.sortBy = "order";
      query.sortOrder = "asc";
    } else if (view === "important") {
      query.priority = "HIGH";
      query.sortBy = "createdAt";
      query.sortOrder = "desc";
    } else if (view === "planned") {
      query.due = "planned";
      query.sortBy = "dueDate";
      query.sortOrder = "asc";
    } else if (view === "all-tasks") {
      query.sortBy = "createdAt";
      query.sortOrder = "desc";
    } else {
      // Custom List ID
      query.listId = view;
      query.sortBy = "order";
      query.sortOrder = "asc";
    }

    try {
      const tasks = await tasksApi.getTasks(query);
      if (this.activeRequestId === requestId) {
        this.state.tasks = Array.isArray(tasks) ? tasks : [];
        // Keep selectedTask synchronized if opened
        if (this.state.selectedTaskId) {
          const matching = this.state.tasks.find((t) => t.id === this.state.selectedTaskId);
          if (matching) {
            this.state.selectedTask = { ...matching };
          }
        }
        this.state.error = null;
      }
    } catch (err) {
      if (this.activeRequestId === requestId) {
        this.state.error = err.message || "Failed to load tasks";
        console.error("TaskStore fetchTasks error:", err);
      }
    } finally {
      if (this.activeRequestId === requestId) {
        this.state.loading = false;
        this.notify();
      }
    }
  }

  async createTask(data) {
    const created = await tasksApi.createTask(data);
    await this.fetchTasks();
    listStore.fetchLists(); // Reconcile sidebar counters with server
    return created;
  }

  async toggleComplete(id) {
    const taskIndex = this.state.tasks.findIndex((t) => t.id === id);
    const originalTask = taskIndex !== -1 ? { ...this.state.tasks[taskIndex] } : this.state.selectedTask ? { ...this.state.selectedTask } : null;
    if (!originalTask) return;

    const nextCompleted = !originalTask.isCompleted;

    // Optimistic update
    const updatedLocal = {
      ...originalTask,
      isCompleted: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : null,
    };

    if (taskIndex !== -1) {
      this.state.tasks[taskIndex] = updatedLocal;
    }
    if (this.state.selectedTaskId === id) {
      this.state.selectedTask = { ...updatedLocal };
    }
    this.notify();

    try {
      const updated = await tasksApi.updateTask(id, { isCompleted: nextCompleted });
      if (taskIndex !== -1) {
        this.state.tasks[taskIndex] = updated;
      }
      if (this.state.selectedTaskId === id) {
        this.state.selectedTask = { ...updated };
      }
      listStore.fetchLists(); // Reconcile sidebar task counts
      this.notify();
      return updated;
    } catch (err) {
      // Rollback on failure
      if (taskIndex !== -1) {
        this.state.tasks[taskIndex] = originalTask;
      }
      if (this.state.selectedTaskId === id) {
        this.state.selectedTask = { ...originalTask };
      }
      this.notify();
      throw err;
    }
  }

  async togglePriority(id) {
    const taskIndex = this.state.tasks.findIndex((t) => t.id === id);
    const originalTask = taskIndex !== -1 ? { ...this.state.tasks[taskIndex] } : this.state.selectedTask ? { ...this.state.selectedTask } : null;
    if (!originalTask) return;

    const nextPriority = originalTask.priority === "HIGH" ? "NONE" : "HIGH";

    // Optimistic update
    const updatedLocal = {
      ...originalTask,
      priority: nextPriority,
    };

    if (taskIndex !== -1) {
      if (!this._taskMatchesCurrentView(updatedLocal)) {
        this.state.tasks.splice(taskIndex, 1);
      } else {
        this.state.tasks[taskIndex] = updatedLocal;
      }
    }
    if (this.state.selectedTaskId === id) {
      this.state.selectedTask = { ...updatedLocal };
    }
    this.notify();

    try {
      const updated = await tasksApi.updateTask(id, { priority: nextPriority });
      const currentIdx = this.state.tasks.findIndex((t) => t.id === id);
      if (this._taskMatchesCurrentView(updated)) {
        if (currentIdx !== -1) {
          this.state.tasks[currentIdx] = updated;
        } else {
          this.state.tasks.push(updated);
        }
      } else if (currentIdx !== -1) {
        this.state.tasks.splice(currentIdx, 1);
      }
      if (this.state.selectedTaskId === id) {
        this.state.selectedTask = { ...updated };
      }
      this.notify();
      return updated;
    } catch (err) {
      // Rollback on failure
      if (taskIndex !== -1) {
        this.state.tasks[taskIndex] = originalTask;
      }
      if (this.state.selectedTaskId === id) {
        this.state.selectedTask = { ...originalTask };
      }
      this.notify();
      throw err;
    }
  }

  async updateTask(id, data) {
    const taskIndex = this.state.tasks.findIndex((t) => t.id === id);
    const originalTask = taskIndex !== -1 ? { ...this.state.tasks[taskIndex] } : this.state.selectedTask ? { ...this.state.selectedTask } : null;

    if (originalTask) {
      const updatedLocal = { ...originalTask, ...data };
      if (taskIndex !== -1) {
        if (!this._taskMatchesCurrentView(updatedLocal)) {
          this.state.tasks.splice(taskIndex, 1);
        } else {
          this.state.tasks[taskIndex] = updatedLocal;
        }
      }
      if (this.state.selectedTaskId === id) {
        this.state.selectedTask = { ...updatedLocal };
      }
      this.notify();
    }

    try {
      const updated = await tasksApi.updateTask(id, data);
      const currentIdx = this.state.tasks.findIndex((t) => t.id === id);
      if (this._taskMatchesCurrentView(updated)) {
        if (currentIdx !== -1) {
          this.state.tasks[currentIdx] = updated;
        } else {
          this.state.tasks.push(updated);
        }
      } else if (currentIdx !== -1) {
        this.state.tasks.splice(currentIdx, 1);
      }

      if (this.state.selectedTaskId === id) {
        this.state.selectedTask = { ...updated };
      }
      this.notify();
      listStore.fetchLists(); // Reconcile list counts
      return updated;
    } catch (err) {
      // Rollback on failure
      if (originalTask) {
        if (taskIndex !== -1) {
          const idx = this.state.tasks.findIndex((t) => t.id === id);
          if (idx !== -1) {
            this.state.tasks[idx] = originalTask;
          } else {
            this.state.tasks.splice(taskIndex, 0, originalTask);
          }
        }
        if (this.state.selectedTaskId === id) {
          this.state.selectedTask = { ...originalTask };
        }
        this.notify();
      }
      throw err;
    }
  }

  debouncedUpdateTask(id, data, delay = 500) {
    const taskIndex = this.state.tasks.findIndex((t) => t.id === id);
    if (taskIndex !== -1) {
      const updatedLocal = { ...this.state.tasks[taskIndex], ...data };
      if (!this._taskMatchesCurrentView(updatedLocal)) {
        this.state.tasks.splice(taskIndex, 1);
      } else {
        this.state.tasks[taskIndex] = updatedLocal;
      }
    }
    if (this.state.selectedTaskId === id) {
      this.state.selectedTask = {
        ...(this.state.selectedTask || {}),
        ...data,
      };
    }
    // Update store state quietly for debounced text without forcing destructive DOM re-renders

    const currentVersion = (this.activeSaveVersion.get(id) || 0) + 1;
    this.activeSaveVersion.set(id, currentVersion);

    if (this.saveTimers.has(id)) {
      clearTimeout(this.saveTimers.get(id));
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        this.saveTimers.delete(id);
        try {
          const updated = await tasksApi.updateTask(id, data);
          // Check if a newer debounced update was dispatched
          if (this.activeSaveVersion.get(id) === currentVersion) {
            const idx = this.state.tasks.findIndex((t) => t.id === id);
            if (this._taskMatchesCurrentView(updated)) {
              if (idx !== -1) {
                this.state.tasks[idx] = updated;
              } else {
                this.state.tasks.push(updated);
              }
            } else if (idx !== -1) {
              this.state.tasks.splice(idx, 1);
            }
            if (this.state.selectedTaskId === id) {
              this.state.selectedTask = { ...updated };
            }
            this.notify();
          }
          resolve(updated);
        } catch (err) {
          console.error("Debounced save error:", err);
          reject(err);
        }
      }, delay);

      this.saveTimers.set(id, timer);
    });
  }

  async deleteTask(id) {
    const taskIndex = this.state.tasks.findIndex((t) => t.id === id);
    const originalTasks = [...this.state.tasks];

    if (this.state.selectedTaskId === id) {
      this.closeDetail();
    }

    if (taskIndex !== -1) {
      // Optimistic delete
      this.state.tasks.splice(taskIndex, 1);
      this.notify();
    }

    try {
      await tasksApi.deleteTask(id);
      listStore.fetchLists(); // Reconcile counters
    } catch (err) {
      // Rollback on failure
      this.state.tasks = originalTasks;
      this.notify();
      throw err;
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.error("TaskStore subscriber error:", err);
      }
    });
  }
}

export const taskStore = new TaskStore();
