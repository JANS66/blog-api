import api from "./axios.js";

export const registerUser = async (data) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};
