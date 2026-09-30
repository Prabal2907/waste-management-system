import axios from "axios";

const api = axios.create({
  baseURL: "https://waste-management-system-858c.onrender.com",
  withCredentials: true,
});

export default api;