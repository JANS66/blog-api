import api from "./axios";

export const getMe = async () => {
  try {
    const response = await api.get("/users/me");
    return response.data;
  } catch (error) {
    // If 401 Unauthenticated, treat safely as null state instead of throwing
    if (error.response?.status === 401) {
      return { user: null };
    }
    throw error; // Re throw 500s or network failures
  }
};

export const updateMe = async (formData) => {
  const response = await api.patch("/users/me", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getUserByUsername = async (
  username,
  page = 1,
  limit = 10,
  status = "PUBLISHED",
) => {
  const response = await api.get(`/users/${username}`, {
    params: { page, limit, status },
  });
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};
