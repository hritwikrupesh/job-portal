// src/components/Application/MyApplications.jsx
import React, { useContext, useEffect, useState } from "react";
import { Context } from "../../main";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import ResumeModal from "./ResumeModal";

const MyApplications = () => {
  const { user, isAuthorized } = useContext(Context);
  const [applications, setApplications] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [resumeImageUrl, setResumeImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Redirect if not authorized (run inside effect to avoid redirect during render)
  useEffect(() => {
    if (isAuthorized === false) {
      navigate("/");
    }
  }, [isAuthorized, navigate]);

  // Fetch applications (employer vs jobseeker)
  useEffect(() => {
    let cancelled = false;

    const fetchApplications = async () => {
      if (!isAuthorized) return;
      setLoading(true);

      try {
        let res;
        if (user && user.role === "Employer") {
          // note: baseURL should be set in main.jsx to `${BACKEND}/api/v1`
          res = await axios.get("/application/employer/getall", {
            withCredentials: true,
          });
        } else {
          res = await axios.get("/application/jobseeker/getall", {
            withCredentials: true,
          });
        }

        if (!cancelled) {
          setApplications(res?.data?.applications ?? []);
        }
      } catch (error) {
        console.error("Failed to fetch applications:", error);
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch applications.";
        toast.error(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchApplications();

    return () => {
      cancelled = true;
    };
  }, [isAuthorized, user]);

  const deleteApplication = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?"))
      return;

    try {
      const res = await axios.delete(`/application/delete/${id}`, {
        withCredentials: true,
      });

      toast.success(res?.data?.message || "Application deleted.");
      setApplications((prev) =>
        prev.filter((application) => application._id !== id)
      );
    } catch (error) {
      console.error("Delete application error:", error);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete application.";
      toast.error(msg);
    }
  };

  const openModal = (imageUrl) => {
    if (!imageUrl) {
      toast.error("No resume available to preview.");
      return;
    }
    setResumeImageUrl(imageUrl);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setResumeImageUrl("");
  };

  return (
    <section className="my_applications page">
      <div className="container">
        <center>
          <h1>
            {user && user.role === "Job Seeker"
              ? "My Applications"
              : "Applications From Job Seekers"}
          </h1>
        </center>

        {loading ? (
          <center>
            <h4>Loading applications...</h4>
          </center>
        ) : applications.length <= 0 ? (
          <center>
            <h4>No Applications Found</h4>
          </center>
        ) : user && user.role === "Job Seeker" ? (
          applications.map((element) => (
            <JobSeekerCard
              element={element}
              key={element._id}
              deleteApplication={deleteApplication}
              openModal={openModal}
            />
          ))
        ) : (
          applications.map((element) => (
            <EmployerCard
              element={element}
              key={element._id}
              openModal={openModal}
            />
          ))
        )}
      </div>

      {modalOpen && <ResumeModal imageUrl={resumeImageUrl} onClose={closeModal} />}
    </section>
  );
};

export default MyApplications;

// ---------- Cards ----------
const JobSeekerCard = ({ element, deleteApplication, openModal }) => {
  const resumeUrl = element?.resume?.url ?? "";

  return (
    <div className="job_seeker_card" style={{ marginBottom: 12 }}>
      <div className="detail">
        <p>
          <span>Name:</span> {element.name}
        </p>
        <p>
          <span>Email:</span> {element.email}
        </p>
        <p>
          <span>Phone:</span> {element.phone}
        </p>
        <p>
          <span>Address:</span> {element.address}
        </p>
        <p>
          <span>CoverLetter:</span> {element.coverLetter}
        </p>
      </div>

      <div className="resume">
        {resumeUrl ? (
          <img
            src={resumeUrl}
            alt="resume preview"
            onClick={() => openModal(resumeUrl)}
            style={{ cursor: "pointer", maxWidth: 160, maxHeight: 200 }}
          />
        ) : (
          <div style={{ minWidth: 160, minHeight: 120 }}>
            <small>No resume uploaded</small>
          </div>
        )}
      </div>

      <div className="btn_area">
        <button onClick={() => deleteApplication(element._id)}>
          Delete Application
        </button>
      </div>
    </div>
  );
};

const EmployerCard = ({ element, openModal }) => {
  const resumeUrl = element?.resume?.url ?? "";

  return (
    <div className="job_seeker_card" style={{ marginBottom: 12 }}>
      <div className="detail">
        <p>
          <span>Name:</span> {element.name}
        </p>
        <p>
          <span>Email:</span> {element.email}
        </p>
        <p>
          <span>Phone:</span> {element.phone}
        </p>
        <p>
          <span>Address:</span> {element.address}
        </p>
        <p>
          <span>CoverLetter:</span> {element.coverLetter}
        </p>
      </div>

      <div className="resume">
        {resumeUrl ? (
          <img
            src={resumeUrl}
            alt="resume preview"
            onClick={() => openModal(resumeUrl)}
            style={{ cursor: "pointer", maxWidth: 160, maxHeight: 200 }}
          />
        ) : (
          <div style={{ minWidth: 160, minHeight: 120 }}>
            <small>No resume uploaded</small>
          </div>
        )}
      </div>
    </div>
  );
};

