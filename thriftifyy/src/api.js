import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000", //     Use the same port as backend
});

export default api;
