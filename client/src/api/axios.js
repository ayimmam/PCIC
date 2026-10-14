import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL || "https://pcic-hpw7.vercel.app/api",
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("pcic_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !["/auth/login", "/auth/signup"].includes(error.config?.url)) {
      sessionStorage.removeItem("pcic_token");
      sessionStorage.removeItem("pcic_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
