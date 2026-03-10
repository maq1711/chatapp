import { useAppDispatch, useAppSelector, toggleTheme } from "../../redux";

export default function ThemeToggle() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.theme.mode);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        width: "100%",
        padding: "10px 16px",
      }}
    >
      <button
        type="button"
        onClick={() => dispatch(toggleTheme())}
        aria-label={`Switch to ${mode === "light" ? "dark" : "light"} theme`}
        style={{
          padding: "8px 14px",
          borderRadius: "8px",
          border: "1px solid var(--color-primary)",
          background: "var(--color-bacground-secondary)",
          color: "var(--color-text)",
          cursor: "pointer",
          fontFamily: "inherit",
          fontWeight: 500,
        }}
      >
        {mode === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
    </div>
  );
}