import api from "./axios";

export const getPosts = async (params = {}) => {
  // params can include : { page, limit, category, tag, search }
  const response = await api.get("/posts", { params });
  return response.data; // { posts, pagination: { totalPosts, page, limit, totalPages } }
};

export const getPostBySlug = async (slug) => {
  const response = await api.get(`/posts/${slug}`);
  return response.data; // returns { post: { ... } }
};

export const createPost = async (formData) => {
  const response = await api.post("/posts", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
