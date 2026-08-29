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

  setView(view) {
    if (this.state.currentView === view) return;
    this.state.currentView = view;
    this.fetchTasks();
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
      this.state.selectedTask = task;
    } catch (err) {
      console.error("TaskStore selectTask error:", err);
      this.state.selectedTaskId = null;
      this.state.selectedTask = null;
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
      query.due = "upcoming";
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
          if (matching) this.state.selectedTask = { ...matching };
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
    if (taskIndex === -1) return;

    const originalTask = { ...this.state.tasks[taskIndex] };
    const nextCompleted = !originalTask.isCompleted;

    // Optimistic update
    const updatedLocal = {
      ...originalTask,
      isCompleted: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : null,
    };

    this.state.tasks[taskIndex] = updatedLocal;
    if (this.state.selectedTaskId === id) {
      this.state.selectedTask = { ...updatedLocal };
    }
    this.notify();

    try {
      const updated = await tasksApi.updateTask(id, { isCompleted: nextCompleted });
      this.state.tasks[taskIndex] = updated;
      if (this.state.selectedTaskId === id) {
        this.state.selectedTask = { ...updated };
      }
      listStore.fetchLists(); // Reconcile sidebar task counts
      this.notify();
      return updated;
    } catch (err) {
      // Rollback on failure
      this.state.tasks[taskIndex] = originalTask;
      if (this.state.selectedTaskId === id) {
        this.state.selectedTask = { ...originalTask };
      }
      this.notify();
      throw err;
    }
  }

  async togglePriority(id) {
    const taskIndex = this.state.tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) return;

    const originalTask = { ...this.state.tasks[taskIndex] };
    const nextPriority = originalTask.priority === "HIGH" ? "NONE" : "HIGH";

    // Optimistic update
    const updatedLocal = {
      ...originalTask,
      priority: nextPriority,
    };

    this.state.tasks[taskIndex] = updatedLocal;
    if (this.state.selectedTaskId === id) {
      this.state.selectedTask = { ...updatedLocal };
    }
    this.notify();

    try {
      const updated = await tasksApi.updateTask(id, { priority: nextPriority });
      this.state.tasks[taskIndex] = updated;
      if (this.state.selectedTaskId === id) {
        this.state.selectedTask = { ...updated };
      }
      this.notify();
      return updated;
    } catch (err) {
      // Rollback on failure
      this.state.tasks[taskIndex] = originalTask;
      if (this.state.selectedTaskId === id) {
        this.state.selectedTask = { ...originalTask };
      }
      this.notify();
      throw err;
    }
  }

  async updateTask(id, data) {
    const taskIndex = this.state.tasks.findIndex((t) => t.id === id);
    if (taskIndex !== -1) {
      this.state.tasks[taskIndex] = {
        ...this.state.tasks[taskIndex],
        ...data,
      };
      if (this.state.selectedTaskId === id) {
        this.state.selectedTask = { ...this.state.tasks[taskIndex] };
      }
      this.notify();
    }

    const updated = await tasksApi.updateTask(id, data);
    if (taskIndex !== -1) {
      this.state.tasks[taskIndex] = updated;
    }
    if (this.state.selectedTaskId === id) {
      this.state.selectedTask = { ...updated };
    }
    this.notify();
    listStore.fetchLists(); // Reconcile list counts
    return updated;
  }

  debouncedUpdateTask(id, data, delay = 500) {
    const taskIndex = this.state.tasks.findIndex((t) => t.id === id);
    if (taskIndex !== -1) {
      this.state.tasks[taskIndex] = {
        ...this.state.tasks[taskIndex],
        ...data,
      };
      if (this.state.selectedTaskId === id) {
        this.state.selectedTask = { ...this.state.tasks[taskIndex] };
      }
      this.notify();
    }

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
            if (idx !== -1) {
              this.state.tasks[idx] = updated;
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
