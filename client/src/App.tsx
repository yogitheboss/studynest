import "./App.css";

import { BrowserRouter } from "react-router-dom";

import { ThemeProvider } from "@/components/theme-provider";
import { AppRoutes } from "@/routes/AppRoutes";

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
