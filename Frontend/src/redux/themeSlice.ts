import { createSlice } from "@reduxjs/toolkit";

const THEME_KEY = "chatapp-theme";

export type ThemeMode = "light" | "dark";

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(THEME_KEY) as ThemeMode | null;
  if (stored === "light" || stored === "dark") return stored;
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

const initialMode = getInitialTheme();
if (typeof document !== "undefined") {
  document.documentElement.setAttribute("data-theme", initialMode);
}

const initialState: { mode: ThemeMode } = {
  mode: initialMode,
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action: { payload: ThemeMode }) => {
      state.mode = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem(THEME_KEY, action.payload);
        document.documentElement.setAttribute("data-theme", action.payload);
      }
    },
    toggleTheme: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        localStorage.setItem(THEME_KEY, state.mode);
        document.documentElement.setAttribute("data-theme", state.mode);
      }
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
