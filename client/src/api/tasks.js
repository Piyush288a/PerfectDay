import { apiClient } from "./client.js";

export const tasksApi = {
  getTasks: async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.listId) params.append("listId", filters.listId);
    if (typeof filters.isCompleted === "boolean") params.append("isCompleted", String(filters.isCompleted));
    if (filters.priority) params.append("priority", filters.priority);
    if (typeof filters.myDay === "boolean") params.append("myDay", String(filters.myDay));
    if (filters.due) params.append("due", filters.due);
    if (filters.search) params.append("search", filters.search);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

    const queryString = params.toString();
    const endpoint = queryString ? `/api/tasks?${queryString}` : "/api/tasks";

    return apiClient(endpoint, {
      method: "GET",
    });
  },

  getTask: async (id) => {
    return apiClient(`/api/tasks/${id}`, {
      method: "GET",
    });
  },

  createTask: async (data) => {
    return apiClient("/api/tasks", {
      method: "POST",
      body: data,
    });
  },

  updateTask: async (id, data) => {
    return apiClient(`/api/tasks/${id}`, {
      method: "PATCH",
      body: data,
    });
  },

  deleteTask: async (id) => {
    return apiClient(`/api/tasks/${id}`, {
      method: "DELETE",
    });
  },
};
