import { createSlice } from "@reduxjs/toolkit";

type ThemeMode = "light" | "dark";

const getInitialMode = (): ThemeMode => {
  const stored = localStorage.getItem("theme-mode");
  return stored === "dark" ? "dark" : "light";
};

const initialMode = getInitialMode();
document.documentElement.setAttribute("data-theme", initialMode);

const themeSlice = createSlice({
  name: "theme",
  initialState: { mode: initialMode as ThemeMode },
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
      localStorage.setItem("theme-mode", state.mode);
      document.documentElement.setAttribute("data-theme", state.mode);
    },
  },
});

export const { toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
