import api from "./axios";

export const getTags = async (params = {}) => {
  const response = await api.get("/tags", { params });
  return response.data;
};
