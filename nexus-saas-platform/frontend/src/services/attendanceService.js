import api from "./api";

export const attendanceService = {
  checkIn: async (employeeId) => {
    const res = await api.post("/attendance/check-in", { employeeId });
    return res.data;
  },

  checkOut: async (employeeId) => {
    const res = await api.post("/attendance/check-out", { employeeId });
    return res.data;
  },

  getTodayStatus: async () => {
    const res = await api.get("/attendance/today/status");
    return res.data;
  },

  getAttendance: async (params = {}) => {
    const res = await api.get("/attendance", { params });
    return res.data;
  },

  getEmployeeAttendance: async (employeeId) => {
    const res = await api.get(`/attendance/${employeeId}`);
    return res.data;
  },
};

export default attendanceService;
