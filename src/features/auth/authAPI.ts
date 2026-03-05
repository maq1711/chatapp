import axios from "axios"

const API_URL = "http://localhost:5000/api/auth"

export const loginUserAPI = async (data: {
  email: string
  password: string
}) => {

  const response = await axios.post(`${API_URL}/login`, data)

  return response.data
}