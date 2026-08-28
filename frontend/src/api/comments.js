import api from "./axios";

export const getCommentsByPost = async (postId, params = {}) => {
  const response = await api.get(`/posts/${postId}/comments`, { params });
  return response.data;
};

export const createComment = async ({ postId, content, parentId }) => {
  const response = await api.post(`/posts/${postId}/comments`, {
    content,
    parentId,
  });
  return response.data;
};

export const deleteComment = async (commentId) => {
  const response = await api.delete(`/comments/${commentId}`);
  return response.data;
};
