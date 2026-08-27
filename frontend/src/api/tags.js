import api from "./axios";

export const getTags = async (params = {}) => {
  const response = await api.get("/tags", { params });
  return response.data;
};

export const deleteTag = async (id) => {
  const response = await api.delete(`/tags/${id}`);
  return response.data;
};
