import { baseApi } from "./baseApi";

// --- Types (adjust to match your backend) ---
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // --- Query: get current user (Read) ---
    getMe: build.query<User, void>({
      query: () => ({ url: "auth/me" }),
      providesTags: ["Auth", "User"],
    }),

    // --- Mutations ---
    login: build.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: "auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    register: build.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({
        url: "auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    logout: build.mutation<void, void>({
      query: () => ({
        url: "auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    updateUser: build.mutation<User, UpdateUserRequest>({
      query: (body) => ({
        url: "auth/me",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    deleteAccount: build.mutation<void, void>({
      query: () => ({
        url: "auth/me",
        method: "DELETE",
      }),
      invalidatesTags: ["Auth", "User"],
    }),
  }),
});

// --- Exported hooks (query & mutation) ---
export const {
  useGetMeQuery,
  useLazyGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useUpdateUserMutation,
  useDeleteAccountMutation,
} = authApi;
