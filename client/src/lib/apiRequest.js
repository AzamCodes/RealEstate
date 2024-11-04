import axios from "axios";

const apiRequest = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true,
});

export default apiRequest;
