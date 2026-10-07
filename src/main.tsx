import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import { AuthProvider, RequireAuth } from "./auth/AuthContext";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { ProblemPage } from "./pages/ProblemPage";
import { NotFound } from "./pages/NotFound";
import "./styles.css";

// HashRouter: works on any static host without rewrite rules. Everything except /login requires a signed-in user.
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/problem/:slug" element={<RequireAuth><ProblemPage /></RequireAuth>} />
          <Route path="*" element={<RequireAuth><NotFound /></RequireAuth>} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  </React.StrictMode>,
);
