import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes/AppRoutes";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import { Toaster } from "sonner";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppRoutes />
        <Toaster richColors position="top-center" closeButton />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
