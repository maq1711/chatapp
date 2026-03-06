import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { loginUserAPI, registerUserAPI } from "./authAPI"

interface AuthState {
  user: any
  token: string | null
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  loading: false,
  error: null,
}

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (data: { email: string; password: string }) => {
    const response = await loginUserAPI(data)
    return response
  }
)

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (data: { email: string; password: string }) => {
    const response = await registerUserAPI(data)
    return response
  }
)

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {

    logout: (state) => {
      state.user = null
      state.token = null
      localStorage.removeItem("token")
    }

  },

  extraReducers: (builder) => {

    builder.addCase(loginUser.pending, (state) => {
      state.loading = true
    })

    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false
      state.user = action.payload.user
      state.token = action.payload.token

      localStorage.setItem("token", action.payload.token)
    })

    builder.addCase(loginUser.rejected, (state) => {
      state.loading = false
      state.error = "Login Failed"
    })

    builder.addCase(registerUser.pending, (state) => {
      state.loading = true
    })

    builder.addCase(registerUser.fulfilled, (state) => {
      state.loading = false
    })

    builder.addCase(registerUser.rejected, (state) => {
      state.loading = false
      state.error = "Register Failed"
    })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer