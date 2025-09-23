import { Axios } from "../lib/axios";

export const getCurrentUser = async () => {
  const response = await Axios.get("/users/me");
  return response.data;
};

export const logoutUser = async () => {
  await Axios.post("/users/logout");
};
