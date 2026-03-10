import { useAppDispatch, useAppSelector, toggleTheme } from "../redux";
import "./ThemeToggle.css";

export default function ThemeToggle() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.theme.mode);

  return (
    <div className="theme-toggle-wrapper">
      <button
        type="button"
        className="theme-toggle-btn"
        onClick={() => dispatch(toggleTheme())}
        aria-label={`Switch to ${mode === "light" ? "dark" : "light"} theme`}
      >
        <span className="theme-icon">{mode === "light" ? "🌙" : "☀️"}</span>
        <span className="theme-text">{mode === "light" ? "Dark Mode" : "Light Mode"}</span>
      </button>
    </div>
  );
}
