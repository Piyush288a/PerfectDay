import { listsApi } from "../api/lists.js";

class ListStore {
  constructor() {
    this.state = {
      lists: [],
      loading: false,
      error: null,
    };
    this.listeners = new Set();
  }

  getState() {
    return { ...this.state };
  }

  getDefaultList() {
    return this.state.lists.find((l) => l.isDefault === true) || null;
  }

  getListById(id) {
    return this.state.lists.find((l) => l.id === id) || null;
  }

  async fetchLists() {
    this.state.loading = true;
    this.notify();
    try {
      const lists = await listsApi.getLists();
      this.state.lists = Array.isArray(lists) ? lists : [];
      this.state.error = null;
    } catch (err) {
      this.state.error = err.message || "Failed to fetch lists";
      console.error("ListStore fetchLists error:", err);
    } finally {
      this.state.loading = false;
      this.notify();
    }
  }

  async createList(name) {
    const list = await listsApi.createList({ name });
    await this.fetchLists(); // Reconcile with server
    return list;
  }

  async updateList(id, name) {
    const updated = await listsApi.updateList(id, { name });
    await this.fetchLists(); // Reconcile with server
    return updated;
  }

  async deleteList(id) {
    const result = await listsApi.deleteList(id);
    await this.fetchLists(); // Reconcile with server
    return result;
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
        console.error("ListStore subscriber error:", err);
      }
    });
  }
}

export const listStore = new ListStore();
