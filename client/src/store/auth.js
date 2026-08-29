import { authApi } from "../api/auth.js";
import { taskStore } from "./tasks.js";
import { listStore } from "./lists.js";

class AuthStore {
  constructor() {
    this.state = {
      status: "loading", // "loading" | "authenticated" | "unauthenticated"
      user: null,
    };
    this.listeners = new Set();
  }

  getState() {
    return { ...this.state };
  }

  setUser(user) {
    const prevUser = this.state.user;
    if (prevUser && user && prevUser.id !== user.id) {
      // Identity changed: completely reset task and list store state
      taskStore.reset();
      listStore.reset();
    }

    this.state = {
      status: "authenticated",
      user,
    };
    this.notify();
  }

  clearUser() {
    // Reset all user-specific state upon clearing session/logout
    taskStore.reset();
    listStore.reset();

    this.state = {
      status: "unauthenticated",
      user: null,
    };
    this.notify();
  }

  async checkSession() {
    try {
      const user = await authApi.getMe();
      if (user && user.id) {
        this.setUser(user);
        return user;
      }
      this.clearUser();
      return null;
    } catch {
      this.clearUser();
      return null;
    }
  }

  async logout() {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn("Logout request completed with warning:", err.message);
    } finally {
      this.clearUser();
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
        console.error("AuthStore subscriber error:", err);
      }
    });
  }
}

export const authStore = new AuthStore();
