import React, { createContext, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import axios from "axios";

// ✅ Backend base URL setup
const BACKEND = import.meta.env.VITE_API_URL || "https://fsfinalproject-production.up.railway.app";

// ✅ Normalize and ensure it ends with /api/v1
let trimmed = BACKEND.replace(/\/+$/, ""); // remove trailing slash(es)
if (!/\/api\/v1$/i.test(trimmed)) trimmed = trimmed + "/api/v1";

console.log("SET AXIOS baseURL ->", trimmed); // Debug (can remove later)
axios.defaults.baseURL = trimmed;
axios.defaults.withCredentials = true; // send cookies cross-site (important for Railway + Netlify)

// ✅ Context for global auth
export const Context = createContext({
  isAuthorized: false,
});

const AppWrapper = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState({});

  return (
    <Context.Provider value={{ isAuthorized, setIsAuthorized, user, setUser }}>
      <App />
    </Context.Provider>
  );
};

// ✅ Render app
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);

