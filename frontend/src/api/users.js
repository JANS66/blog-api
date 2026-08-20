import api from "./axios";

export const getMe = async () => {
  const response = await api.get("/users/me");
  return response.data;
};

export const updateMe = async (formData) => {
  const response = await api.patch("/users/me", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
