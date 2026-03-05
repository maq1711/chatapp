import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { loginUserAPI } from "./authAPI"

interface AuthState {
  user: any
  token: string | null
  loading: boolean
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  loading: false,
}

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (data: { email: string; password: string }) => {
    const response = await loginUserAPI(data)
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
    },
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
    })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer