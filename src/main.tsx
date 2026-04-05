import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import SplashScreen from "./components/SplashScreen.tsx";
import "./index.css";

const Root = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <SplashScreen show={showSplash} />
      {!showSplash && <App />}
    </>
  );
};

createRoot(document.getElementById("root")!).render(<Root />);
