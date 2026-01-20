// src/components/Application/Application.jsx
import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
// keep your existing Context import (adjust path only if your project exports Context elsewhere)
import { Context } from "../../main";

const Application = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);

  const { isAuthorized, user } = useContext(Context);
  const navigate = useNavigate();
  const { id } = useParams(); // job id
  const fileRef = useRef();

  // safe redirect: if not authorized or role is Employer, send to home
  useEffect(() => {
    if (!isAuthorized || (user && user.role === "Employer")) {
      navigate("/");
    }
  }, [isAuthorized, user, navigate]);

  // file input validation
  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setResume(null);
      return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    const maxSize = 5 * 1024 * 1024; // 5 MB

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, JPG, or PNG files are allowed!");
      e.target.value = "";
      setResume(null);
      return;
    }

    if (file.size > maxSize) {
      toast.error("File size must be under 5MB!");
      e.target.value = "";
      setResume(null);
      return;
    }

    setResume(file);
  };

  const handleApplication = async (e) => {
    e.preventDefault();

    if (!resume) {
      toast.error("Please upload your resume!");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("address", address);
      formData.append("coverLetter", coverLetter);
      // ensure the backend multer field name is "resume"
      formData.append("resume", resume);
      if (id) formData.append("jobId", id);

      // Debug logs (remove in production)
      console.group("Application submit - formData preview");
      for (const pair of formData.entries()) {
        // note: file entry will print File object
        console.log(pair[0], pair[1]);
      }
      console.groupEnd();

      // IMPORTANT: axios.defaults.baseURL should be set in main.jsx to `${BACKEND}/api/v1`
      // so component-level endpoints remain like "/application/post"
      const { data } = await axios.post("/application/post", formData, {
        // do NOT set Content-Type header manually for FormData
        withCredentials: true, // keep if your backend uses cookies; otherwise this is harmless
      });

      // reset form on success
      setName("");
      setEmail("");
      setCoverLetter("");
      setPhone("");
      setAddress("");
      setResume(null);
      if (fileRef.current) fileRef.current.value = "";

      toast.success(data?.message || "Application submitted successfully!");
      // navigate to jobs list (adjust route as your app expects)
      navigate("/job/getall");
    } catch (error) {
      console.error("Application submit error:", error);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit application.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="application">
      <div className="container">
        <h3>Application Form</h3>

        <form onSubmit={handleApplication}>
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="tel"
            placeholder="Your Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Your Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />

          <textarea
            placeholder="Cover Letter..."
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
          />

          <div style={{ marginTop: "8px" }}>
            <label
              style={{ textAlign: "start", display: "block", fontSize: "18px" }}
            >
              Select Resume (PDF, JPG, PNG)
            </label>
            <input
              ref={fileRef}
              type="file"
              name="resume"
              accept=".pdf, .jpg, .jpeg, .png"
              onChange={handleFileChange}
              style={{ width: "100%" }}
            />
            {resume && (
              <div style={{ marginTop: 8 }}>
                <small>Selected file: {resume.name}</small>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} style={{ marginTop: "12px" }}>
            {loading ? "Sending..." : "Send Application"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Application;

