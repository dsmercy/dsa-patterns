import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { ProblemPage } from "./pages/ProblemPage";
import { NotFound } from "./pages/NotFound";
import "./styles.css";

// HashRouter: works on any static host without rewrite rules.
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/problem/:slug" element={<ProblemPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
