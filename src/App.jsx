import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes/AppRoutes";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import { ToastProvider } from "./context/ToastContext";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
