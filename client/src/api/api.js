import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("campusdesk_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("campusdesk_token");
      localStorage.removeItem("campusdesk_user");
      window.dispatchEvent(new Event("campusdesk:logout"));
    }
    return Promise.reject(error);
  }
);

export default api;
