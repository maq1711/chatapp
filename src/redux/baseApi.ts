import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseApiController } from "./baseApiController";

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: baseApiController.baseUrl,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["User", "Auth"],
  endpoints: () => ({
    
  }),
});
