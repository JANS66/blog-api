import api from "./axios";

export const getMe = async () => {
  const response = await api.get("/users/me");
  return response.data;
};
