import React from "react";
import { createRoot } from "react-dom/client";
import Home from "./Home.jsx";
import MotionPage from "./MotionPage.jsx";

const isMotion = location.pathname === "/motion" || location.pathname.startsWith("/motion/");
createRoot(document.getElementById("root")).render(isMotion ? <MotionPage /> : <Home />);
