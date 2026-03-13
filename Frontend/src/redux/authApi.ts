import { baseApi } from "./baseApi";

// --- Types matching backend DTOs ---
export interface User {
  id: number;
  fullName: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  createdAt?: string;
  isOnline?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  profilePicture?: string;
  bio?: string;
}

export interface AuthResponse {
  id: number;
  fullName: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  token: string;
  tokenExpiry: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  profilePicture?: string;
  bio?: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET profile (protected)
    getMe: build.query<User, void>({
      query: () => ({ url: "auth/profile" }),
      providesTags: ["Auth", "User"],
    }),

    // POST login
    login: build.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: "auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    // POST register
    register: build.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({
        url: "auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    // POST logout (protected)
    logout: build.mutation<void, void>({
      query: () => ({
        url: "auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    // PUT update profile (protected)
    updateUser: build.mutation<User, UpdateUserRequest>({
      query: (body) => ({
        url: "auth/profile",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Auth", "User"],
    }),
  }),
});

// --- Exported hooks ---
export const {
  useGetMeQuery,
  useLazyGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useUpdateUserMutation,
} = authApi;
