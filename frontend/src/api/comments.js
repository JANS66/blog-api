import api from "./axios";

export const getCommentsByPost = async (postId, params = {}) => {
  const response = await api.get(`/posts/${postId}/comments`, { params });
  return response.data;
};
