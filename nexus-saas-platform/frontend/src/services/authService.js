import api from "./api";

export const authService = {
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    if (response.data.token) {
      localStorage.setItem("nexus_ems_token", response.data.token);
      localStorage.setItem("nexus_ems_user", JSON.stringify(response.data.data));
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    if (response.data.token) {
      localStorage.setItem("nexus_ems_token", response.data.token);
      localStorage.setItem("nexus_ems_user", JSON.stringify(response.data.data));
    }
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put("/auth/me", data);
    if (response.data.data) {
      localStorage.setItem("nexus_ems_user", JSON.stringify(response.data.data));
    }
    return response.data;
  },

  getAllUsers: async () => {
    const response = await api.get("/auth/users");
    return response.data;
  },

  updateUserRole: async (userId, role, status) => {
    const response = await api.put(`/auth/users/${userId}/role`, { role, status });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("nexus_ems_token");
    localStorage.removeItem("nexus_ems_user");
  },

  getCurrentUser: () => {
    const saved = localStorage.getItem("nexus_ems_user");
    return saved ? JSON.parse(saved) : null;
  },

  getToken: () => {
    return localStorage.getItem("nexus_ems_token");
  },
};

export default authService;
