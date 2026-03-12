import axios from "axios";

const baseURL = import.meta.env.DEV
  ? "http://127.0.0.1:8000"
  : import.meta.env.VITE_API_BASE_URL || "https://habitflow-z76y.onrender.com";

const API = axios.create({
  baseURL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("habitflow_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;