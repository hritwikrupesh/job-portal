// src/components/Auth/Login.jsx
import React, { useContext, useState } from "react";
import { MdOutlineMailOutline } from "react-icons/md";
import { RiLock2Fill } from "react-icons/ri";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FaRegUser } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "../../main";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const { isAuthorized, setIsAuthorized } = useContext(Context);
  const navigate = useNavigate();

  // If already authorized, redirect to home
  if (isAuthorized) {
    return <Navigate to={"/"} replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password || !role) {
      toast.error("Please fill email, password and select a role.");
      return;
    }

    setLoading(true);
    try {
      // IMPORTANT: main.jsx should set axios.defaults.baseURL = `${BACKEND}/api/v1`
      const { data } = await axios.post(
        "/user/login",
        { email, password, role },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true, // keep if backend uses cookies/sessions
        }
      );

      toast.success(data?.message || "Logged in successfully");
      // reset fields
      setEmail("");
      setPassword("");
      setRole("");

      // set auth state in Context and navigate
      setIsAuthorized?.(true);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to login. Try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="authPage">
      <div className="container">
        <div className="header">
          <img src="/careerconnect-black.png" alt="logo" />
          <h3>Login to your account</h3>
        </div>

        <form onSubmit={handleLogin}>
          <div className="inputTag">
            <label>Login As</label>
            <div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                aria-label="Login role"
                required
              >
                <option value="">Select Role</option>
                <option value="Job Seeker">Job Seeker</option>
                <option value="Employer">Employer</option>
              </select>
              <FaRegUser />
            </div>
          </div>

          <div className="inputTag">
            <label>Email Address</label>
            <div>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email"
              />
              <MdOutlineMailOutline />
            </div>
          </div>

          <div className="inputTag">
            <label>Password</label>
            <div>
              <input
                type="password"
                placeholder="Enter your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="Password"
              />
              <RiLock2Fill />
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <Link to={"/register"} style={{ marginLeft: 12 }}>
            Register Now
          </Link>
        </form>
      </div>

      <div className="banner">
        <img src="/login.png" alt="login" />
      </div>
    </section>
  );
};

export default Login;

