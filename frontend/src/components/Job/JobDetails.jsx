// src/components/Job/JobDetails.jsx
import React, { useContext, useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Context } from "../../main";

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthorized, user } = useContext(Context);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Redirect to login if not authorized (run inside effect)
    if (isAuthorized === false) {
      navigate("/login");
      return;
    }

    let cancelled = false;
    const fetchJob = async () => {
      setLoading(true);
      try {
        // IMPORTANT: main.jsx should set axios.defaults.baseURL = `${BACKEND}/api/v1`
        const res = await axios.get(`/job/${id}`, {
          withCredentials: true, // keep if backend needs cookies; otherwise remove
        });

        if (!cancelled) {
          setJob(res?.data?.job ?? null);
        }
      } catch (error) {
        console.error("Failed to fetch job:", error);
        // If server returns 404, navigate to notfound. Otherwise show a toast or set notFound.
        const status = error?.response?.status;
        if (status === 404) {
          setNotFound(true);
          navigate("/notfound");
        } else {
          // for other errors, navigate to notfound as a safe fallback or show message
          navigate("/notfound");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchJob();

    return () => {
      cancelled = true;
    };
  }, [id, isAuthorized, navigate]);

  if (loading) {
    return (
      <section className="jobDetail page">
        <div className="container">
          <h3>Loading job details...</h3>
        </div>
      </section>
    );
  }

  if (!job || notFound) {
    return (
      <section className="jobDetail page">
        <div className="container">
          <h3>Job not found</h3>
        </div>
      </section>
    );
  }

  return (
    <section className="jobDetail page">
      <div className="container">
        <h3>Job Details</h3>
        <div className="banner">
          <p>
            Title: <span>{job.title ?? "—"}</span>
          </p>
          <p>
            Category: <span>{job.category ?? "—"}</span>
          </p>
          <p>
            Country: <span>{job.country ?? "—"}</span>
          </p>
          <p>
            City: <span>{job.city ?? "—"}</span>
          </p>
          <p>
            Location: <span>{job.location ?? "—"}</span>
          </p>
          <p>
            Description: <span>{job.description ?? "—"}</span>
          </p>
          <p>
            Job Posted On: <span>{job.jobPostedOn ?? "—"}</span>
          </p>
          <p>
            Salary:{" "}
            {job?.fixedSalary ? (
              <span>{job.fixedSalary}</span>
            ) : (
              <span>
                {job?.salaryFrom ?? "—"} - {job?.salaryTo ?? "—"}
              </span>
            )}
          </p>

          {user && user.role === "Employer" ? null : (
            <Link to={`/application/${job._id}`}>Apply Now</Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default JobDetails;

