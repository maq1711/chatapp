import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import ThemeToggle from "./theme/ThemeToggle";
import { store } from "./redux";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ThemeToggle />
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}

export default App;