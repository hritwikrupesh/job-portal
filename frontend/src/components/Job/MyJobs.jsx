// src/components/Job/MyJobs.jsx
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaCheck } from "react-icons/fa6";
import { RxCross2 } from "react-icons/rx";
import { Context } from "../../main";
import { useNavigate } from "react-router-dom";

const MyJobs = () => {
  const [myJobs, setMyJobs] = useState([]);
  const [editingMode, setEditingMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingJobId, setSavingJobId] = useState(null);
  const { isAuthorized, user } = useContext(Context);

  const navigate = useNavigate();

  // Redirect if not authorized or not employer
  useEffect(() => {
    if (isAuthorized === false) {
      navigate("/");
    } else if (isAuthorized === true && user && user.role !== "Employer") {
      navigate("/");
    }
  }, [isAuthorized, user, navigate]);

  // Fetching all jobs
  useEffect(() => {
    let cancelled = false;
    const fetchJobs = async () => {
      setLoading(true);
      try {
        // IMPORTANT: main.jsx should set axios.defaults.baseURL = `${BACKEND}/api/v1`
        const { data } = await axios.get("/job/getmyjobs", {
          withCredentials: true,
        });
        if (!cancelled) setMyJobs(data?.myJobs ?? []);
      } catch (error) {
        console.error("Fetch my jobs error:", error);
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch jobs.";
        toast.error(msg);
        if (!cancelled) setMyJobs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchJobs();
    return () => {
      cancelled = true;
    };
  }, []);

  // Enable editing mode for a job
  const handleEnableEdit = (jobId) => {
    setEditingMode(jobId);
  };

  // Disable editing mode
  const handleDisableEdit = () => {
    setEditingMode(null);
  };

  // Update job (sends updated job object to server)
  const handleUpdateJob = async (jobId) => {
    const updatedJob = myJobs.find((job) => job._id === jobId);
    if (!updatedJob) {
      toast.error("Job not found.");
      return;
    }

    setSavingJobId(jobId);
    try {
      const res = await axios.put(`/job/update/${jobId}`, updatedJob, {
        withCredentials: true,
      });
      toast.success(res?.data?.message || "Job updated.");
      setEditingMode(null);
    } catch (error) {
      console.error("Update job error:", error);
      const msg =
        error?.response?.data?.message || error?.message || "Update failed.";
      toast.error(msg);
    } finally {
      setSavingJobId(null);
    }
  };

  // Delete job with confirmation
  const handleDeleteJob = async (jobId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this job? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      const res = await axios.delete(`/job/delete/${jobId}`, {
        withCredentials: true,
      });
      toast.success(res?.data?.message || "Job deleted.");
      setMyJobs((prevJobs) => prevJobs.filter((job) => job._id !== jobId));
    } catch (error) {
      console.error("Delete job error:", error);
      const msg =
        error?.response?.data?.message || error?.message || "Delete failed.";
      toast.error(msg);
    }
  };

  // Update local state for an input field
  const handleInputChange = (jobId, field, value) => {
    setMyJobs((prevJobs) =>
      prevJobs.map((job) =>
        job._id === jobId ? { ...job, [field]: value } : job
      )
    );
  };

  return (
    <div className="myJobs page">
      <div className="container">
        <h1>Your Posted Jobs</h1>

        {loading ? (
          <p>Loading your jobs...</p>
        ) : myJobs.length > 0 ? (
          <div className="banner">
            {myJobs.map((element) => (
              <div className="card" key={element._id}>
                <div className="content">
                  <div className="short_fields">
                    <div>
                      <span>Title:</span>
                      <input
                        type="text"
                        disabled={editingMode !== element._id}
                        value={element.title ?? ""}
                        onChange={(e) =>
                          handleInputChange(element._id, "title", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <span>Country:</span>
                      <input
                        type="text"
                        disabled={editingMode !== element._id}
                        value={element.country ?? ""}
                        onChange={(e) =>
                          handleInputChange(
                            element._id,
                            "country",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div>
                      <span>City:</span>
                      <input
                        type="text"
                        disabled={editingMode !== element._id}
                        value={element.city ?? ""}
                        onChange={(e) =>
                          handleInputChange(element._id, "city", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <span>Category:</span>
                      <select
                        value={element.category ?? ""}
                        onChange={(e) =>
                          handleInputChange(
                            element._id,
                            "category",
                            e.target.value
                          )
                        }
                        disabled={editingMode !== element._id}
                      >
                        <option value="Graphics & Design">
                          Graphics & Design
                        </option>
                        <option value="Mobile App Development">
                          Mobile App Development
                        </option>
                        <option value="Frontend Web Development">
                          Frontend Web Development
                        </option>
                        <option value="MERN Stack Development">
                          MERN STACK Development
                        </option>
                        <option value="Account & Finance">Account & Finance</option>
                        <option value="Artificial Intelligence">
                          Artificial Intelligence
                        </option>
                        <option value="Video Animation">Video Animation</option>
                        <option value="MEAN Stack Development">
                          MEAN STACK Development
                        </option>
                        <option value="MEVN Stack Development">
                          MEVN STACK Development
                        </option>
                        <option value="Data Entry Operator">
                          Data Entry Operator
                        </option>
                      </select>
                    </div>

                    <div>
                      <span>
                        Salary:{" "}
                        {element.fixedSalary ? (
                          <input
                            type="number"
                            disabled={editingMode !== element._id}
                            value={element.fixedSalary ?? ""}
                            onChange={(e) =>
                              handleInputChange(
                                element._id,
                                "fixedSalary",
                                e.target.value
                              )
                            }
                          />
                        ) : (
                          <div>
                            <input
                              type="number"
                              disabled={editingMode !== element._id}
                              value={element.salaryFrom ?? ""}
                              onChange={(e) =>
                                handleInputChange(
                                  element._id,
                                  "salaryFrom",
                                  e.target.value
                                )
                              }
                            />
                            <input
                              type="number"
                              disabled={editingMode !== element._id}
                              value={element.salaryTo ?? ""}
                              onChange={(e) =>
                                handleInputChange(
                                  element._id,
                                  "salaryTo",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        )}
                      </span>
                    </div>

                    <div>
                      <span>Expired:</span>
                      <select
                        value={String(element.expired ?? false)}
                        onChange={(e) =>
                          handleInputChange(
                            element._id,
                            "expired",
                            e.target.value === "true"
                          )
                        }
                        disabled={editingMode !== element._id}
                      >
                        <option value="true">TRUE</option>
                        <option value="false">FALSE</option>
                      </select>
                    </div>
                  </div>

                  <div className="long_field">
                    <div>
                      <span>Description:</span>
                      <textarea
                        rows={5}
                        value={element.description ?? ""}
                        disabled={editingMode !== element._id}
                        onChange={(e) =>
                          handleInputChange(
                            element._id,
                            "description",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div>
                      <span>Location: </span>
                      <textarea
                        rows={5}
                        value={element.location ?? ""}
                        disabled={editingMode !== element._id}
                        onChange={(e) =>
                          handleInputChange(
                            element._id,
                            "location",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="button_wrapper">
                  <div className="edit_btn_wrapper">
                    {editingMode === element._id ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleUpdateJob(element._id);
                          }}
                          className="check_btn"
                          disabled={savingJobId === element._id}
                          title="Save changes"
                        >
                          <FaCheck />
                        </button>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleDisableEdit();
                          }}
                          className="cross_btn"
                          title="Cancel"
                        >
                          <RxCross2 />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleEnableEdit(element._id);
                        }}
                        className="edit_btn"
                        title="Edit job"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteJob(element._id);
                    }}
                    className="delete_btn"
                    title="Delete job"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>You've not posted any job or you may have deleted all of your jobs!</p>
        )}
      </div>
    </div>
  );
};

export default MyJobs;

