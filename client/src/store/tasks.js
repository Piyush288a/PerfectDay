import { tasksApi } from "../api/tasks.js";
import { listStore } from "./lists.js";

class TaskStore {
  constructor() {
    this.state = {
      currentView: "my-day", // "my-day" | "important" | "planned" | "all-tasks" | UUID listId
      tasks: [],
      loading: false,
      error: null,
    };
    this.activeRequestId = 0;
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
    this.state.tasks[taskIndex] = {
      ...originalTask,
      isCompleted: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : null,
    };
    this.notify();

    try {
      const updated = await tasksApi.updateTask(id, { isCompleted: nextCompleted });
      this.state.tasks[taskIndex] = updated;
      listStore.fetchLists(); // Reconcile sidebar task counts
      this.notify();
      return updated;
    } catch (err) {
      // Rollback on failure
      this.state.tasks[taskIndex] = originalTask;
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
    this.state.tasks[taskIndex] = {
      ...originalTask,
      priority: nextPriority,
    };
    this.notify();

    try {
      const updated = await tasksApi.updateTask(id, { priority: nextPriority });
      this.state.tasks[taskIndex] = updated;
      this.notify();
      return updated;
    } catch (err) {
      // Rollback on failure
      this.state.tasks[taskIndex] = originalTask;
      this.notify();
      throw err;
    }
  }

  async updateTask(id, data) {
    const updated = await tasksApi.updateTask(id, data);
    await this.fetchTasks();
    listStore.fetchLists();
    return updated;
  }

  async deleteTask(id) {
    const taskIndex = this.state.tasks.findIndex((t) => t.id === id);
    const originalTasks = [...this.state.tasks];

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
