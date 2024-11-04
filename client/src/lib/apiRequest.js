import axios from "axios";

const apiRequest = axios.create({
  baseURL: "https://realestate-680h.onrender.com/api",
  withCredentials: true,
});

export default apiRequest;
