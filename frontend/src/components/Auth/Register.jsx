// src/components/Auth/Register.jsx
import React, { useContext, useState } from "react";
import { FaRegUser } from "react-icons/fa";
import { MdOutlineMailOutline } from "react-icons/md";
import { RiLock2Fill } from "react-icons/ri";
import { FaPencilAlt } from "react-icons/fa";
import { FaPhoneFlip } from "react-icons/fa6";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "../../main";

const Register = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const { isAuthorized, setIsAuthorized, setUser } = useContext(Context);
  const navigate = useNavigate();

  if (isAuthorized) {
    return <Navigate to={"/"} replace />;
  }

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !email || !phone || !password || !role) {
      toast.error("Please fill all fields and select a role.");
      return;
    }

    setLoading(true);
    try {
      // IMPORTANT: main.jsx should set axios.defaults.baseURL = `${BACKEND}/api/v1`
      const { data } = await axios.post(
        "/user/register",
        { name, phone, email, role, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true, // keep if backend uses cookies/sessions
        }
      );

      toast.success(data?.message || "Registered successfully");

      // reset form
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setRole("");

      // set auth state (if your backend returns user info, save it)
      setIsAuthorized?.(true);
      if (data?.user) setUser?.(data.user);

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Register error:", error);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Registration failed. Try again.";
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
          <h3>Create a new account</h3>
        </div>

        <form onSubmit={handleRegister}>
          <div className="inputTag">
            <label>Register As</label>
            <div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                aria-label="Register role"
                required
              >
                <option value="">Select Role</option>
                <option value="Employer">Employer</option>
                <option value="Job Seeker">Job Seeker</option>
              </select>
              <FaRegUser />
            </div>
          </div>

          <div className="inputTag">
            <label>Name</label>
            <div>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                aria-label="Name"
              />
              <FaPencilAlt />
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
            <label>Phone Number</label>
            <div>
              <input
                type="tel"
                placeholder="Enter your phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                aria-label="Phone"
              />
              <FaPhoneFlip />
            </div>
          </div>

          <div className="inputTag">
            <label>Password</label>
            <div>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="Password"
              />
              <RiLock2Fill />
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>

          <Link to={"/login"} style={{ marginLeft: 12 }}>
            Login Now
          </Link>
        </form>
      </div>

      <div className="banner">
        <img src="/register.png" alt="register" />
      </div>
    </section>
  );
};

export default Register;

