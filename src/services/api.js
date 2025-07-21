import axios from "axios";

const Api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

console.log("Base URL:", import.meta.env.VITE_API_URL); // Check here

export default Api;
