import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Context } from "../../main";

/**
 * Jobs Component
 * --------------------
 * Displays all available jobs fetched from the backend API.
 * Uses axios defaults set in main.jsx, which already defines the baseURL.
 */

const Jobs = () => {
  const [jobs, setJobs] = useState([]); // store fetched jobs
  const { isAuthorized } = useContext(Context);
  const navigateTo = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        // Include '/api/v1' here since baseURL is just the origin
        const res = await axios.get("\/job/getall", {
          withCredentials: true, // include cookies if needed for auth
        });
        setJobs(res.data);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      }
    };

    fetchJobs();
  }, []);

  // redirect unauthorized users
  useEffect(() => {
    if (!isAuthorized) {
      navigateTo("/");
    }
  }, [isAuthorized, navigateTo]);

  return (
    <section className="jobs page">
      <div className="container">
        <h1>ALL AVAILABLE JOBS</h1>

        {/* handle no jobs found */}
        {!jobs.jobs || jobs.jobs.length === 0 ? (
          <p>No jobs found at the moment.</p>
        ) : (
          <div className="banner">
            {jobs.jobs.map((job) => (
              <div className="card" key={job._id}>
                <p><strong>Title:</strong> {job.title}</p>
                <p><strong>Category:</strong> {job.category}</p>
                <p><strong>Country:</strong> {job.country}</p>
                <Link to={`/job/${job._id}`}>View Job Details</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Jobs;

