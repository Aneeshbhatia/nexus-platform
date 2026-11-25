import api from "./api";

export const leaveService = {
  applyLeave: async (data) => {
    const res = await api.post("/leaves", data);
    return res.data;
  },

  getLeaves: async (params = {}) => {
    const res = await api.get("/leaves", { params });
    return res.data;
  },

  getLeaveById: async (id) => {
    const res = await api.get(`/leaves/${id}`);
    return res.data;
  },

  updateLeaveStatus: async (id, status, actionComment = "") => {
    const res = await api.put(`/leaves/${id}/status`, {
      status,
      actionComment,
    });
    return res.data;
  },

  deleteLeave: async (id) => {
    const res = await api.delete(`/leaves/${id}`);
    return res.data;
  },
};

export default leaveService;
