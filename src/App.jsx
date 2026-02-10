import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes/AppRoutes";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import { Toaster } from "sonner";
import { Loader2, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppRoutes />
        <Toaster
          position="top-center"
          theme="dark"
          closeButton
          className="vantra-toaster"
          toastOptions={{
            classNames: {
              toast: 'vantra-toast',
              title: 'vantra-toast-title',
              description: 'vantra-toast-description',
              actionButton: 'vantra-toast-action',
              cancelButton: 'vantra-toast-cancel',
            },
          }}
          icons={{
            loading: <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />,
            success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
            error: <AlertCircle className="w-5 h-5 text-red-500" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
            info: <Info className="w-5 h-5 text-blue-500" />,
          }}
        />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
