import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import { AuthProvider, RequireAuth } from "./auth/AuthContext";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { ProblemPage } from "./pages/ProblemPage";
import { NotFound } from "./pages/NotFound";
import "./styles.css";

// HashRouter: works on any static host without rewrite rules.
// Access model: the problem list (/) needs the sign-in; a specific problem page (/problem/:slug) is open to anyone who has
// its link (shared after the video). Problem pages contain no link back to the list or to other problems.
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/problem/:slug" element={<ProblemPage />} />
          <Route path="*" element={<RequireAuth><NotFound /></RequireAuth>} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  </React.StrictMode>,
);
