import api from "./axios";

export const getCategories = async (params = {}) => {
  const response = await api.get("/categories", { params });
  return response.data;
};

export const createCategory = async (categoryData) => {
  const response = await api.post("/categories", categoryData);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};

export const updateCategory = async ({ id, name }) => {
  const response = await api.patch(`/categories/${id}`, { name });
  return response.data;
};
