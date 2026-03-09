import { useAppDispatch , useAppSelector , toggleTheme } from "../../redux";

export default function ThemeToggle() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.theme.mode);

  return (
    <button
      type="button"
      onClick={() => dispatch(toggleTheme())}
      aria-label={`Switch to ${mode === "light" ? "dark" : "light"} theme`}
      style={{
        padding: "8px 12px",
        borderRadius: "8px",
        border: "1px solid var(--color-primary)",
        background: "var(--color-bacground-secondary)",
        color: "var(--color-text)",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {mode === "light" ? "Dark" : "Light"}
    </button>
  );
}
