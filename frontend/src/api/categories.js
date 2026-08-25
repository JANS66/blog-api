import api from "./axios";

export const getCategories = async (params = {}) => {
  const response = await api.get("/categories", { params });
  return response.data;
};
