import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",

  // Allow longer OCR processing time
  timeout: 300000,
});

export default api;
