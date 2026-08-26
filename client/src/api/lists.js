import { apiClient } from "./client.js";

export const listsApi = {
  getLists: async () => {
    return apiClient("/api/lists", {
      method: "GET",
    });
  },

  createList: async ({ name }) => {
    return apiClient("/api/lists", {
      method: "POST",
      body: { name },
    });
  },

  updateList: async (id, { name }) => {
    return apiClient(`/api/lists/${id}`, {
      method: "PATCH",
      body: { name },
    });
  },

  deleteList: async (id) => {
    return apiClient(`/api/lists/${id}`, {
      method: "DELETE",
    });
  },
};
