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
