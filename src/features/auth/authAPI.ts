import axios from "axios"

const API_URL = import.meta.env.VITE_BASE_URL

export const loginUserAPI = async (data: {
  email: string
  password: string
}) => {

  const response = await axios.post(`${API_URL}/authenticate`, data)

  return response.data
}

export const registerUserAPI = async (data: {
  email: string
  password: string
}) => {

  const response = await axios.post(`${API_URL}/register`, data)

  return response.data
}