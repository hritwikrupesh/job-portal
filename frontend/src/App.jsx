// src/App.jsx
import React, { useContext, useEffect, useState } from "react";
import "./App.css";
import { Context } from "./main";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import { Toaster } from "react-hot-toast";
import axios from "axios";
import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";
import Home from "./components/Home/Home";
import Jobs from "./components/Job/Jobs";
import JobDetails from "./components/Job/JobDetails";
import Application from "./components/Application/Application";
import MyApplications from "./components/Application/MyApplications";
import PostJob from "./components/Job/PostJob";
import NotFound from "./components/NotFound/NotFound";
import MyJobs from "./components/Job/MyJobs";

const App = () => {
  const { isAuthorized, setIsAuthorized, setUser } = useContext(Context);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        // IMPORTANT: main.jsx should set axios.defaults.baseURL = `${BACKEND}/api/v1`
        const response = await axios.get("/user/getuser", {
          withCredentials: true,
        });

        if (cancelled) return;

        // server should return { user: {...} } on success
        setUser(response?.data?.user ?? null);
        setIsAuthorized(true);
      } catch (error) {
        console.warn("No active session or failed to fetch user:", error?.message);
        if (!cancelled) {
          setUser(null);
          setIsAuthorized(false);
        }
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    };

    fetchUser();

    return () => {
      cancelled = true;
    };
    // run once on mount
  }, [setUser, setIsAuthorized]);

  // while we check auth, show nothing (or a simple loader) to avoid flicker
  if (loadingUser) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />
        <Route path="/job/getall" element={<Jobs />} />
        <Route path="/job/:id" element={<JobDetails />} />
        <Route path="/application/:id" element={<Application />} />
        <Route path="/applications/me" element={<MyApplications />} />
        <Route path="/job/post" element={<PostJob />} />
        <Route path="/job/me" element={<MyJobs />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <Toaster />
    </BrowserRouter>
  );
};

export default App;

