// controllers/applicationController.js
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import cloudinary from "cloudinary";
import fs from "fs";
import util from "util";

const stat = util.promisify(fs.stat);

// Ensure Cloudinary v2 config (server.js should already configure it, but set again to be safe)
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});

/**
 * POST /api/v1/application/post
 * Handles file (express-fileupload) upload, sends to Cloudinary, saves application to DB.
 */
export const postApplication = catchAsyncErrors(async (req, res, next) => {
  try {
    const { role } = req.user;
    if (role === "Employer") {
      return next(
        new ErrorHandler("Employer not allowed to access this resource.", 400)
      );
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return next(new ErrorHandler("Resume File Required!", 400));
    }

    const { resume } = req.files;
    const allowedFormats = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedFormats.includes(resume.mimetype)) {
      return next(
        new ErrorHandler(
          "Invalid file type. Please upload PNG, JPEG, WEBP, or PDF file",
          400
        )
      );
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (resume.size > MAX_SIZE) {
      // cleanup temp if present
      try {
        if (resume.tempFilePath && fs.existsSync(resume.tempFilePath)) {
          fs.unlinkSync(resume.tempFilePath);
        }
      } catch (err) {
        console.warn("Error cleaning temp file after size check:", err.message);
      }
      return next(new ErrorHandler("File size must be under 5MB", 400));
    }

    // Debug: log the tempFilePath and check existence
    console.log("DEBUG: resume.tempFilePath =", resume.tempFilePath);
    if (resume.tempFilePath) {
      try {
        await stat(resume.tempFilePath);
        console.log("DEBUG: temp file exists and is readable");
      } catch (err) {
        console.warn("DEBUG: temp file not accessible:", err.message);
      }
    } else {
      console.warn(
        "Temp file path missing. Ensure express-fileupload is configured with useTempFiles: true"
      );
    }

    // Try upload to Cloudinary: path first, then fallback to stream from buffer
    let cloudinaryResponse = null;
    let uploadError = null;

    const tryUploadByPath = async (filePath) => {
      try {
        console.log("Attempting Cloudinary.upload using tempFilePath:", filePath);
        return await cloudinary.v2.uploader.upload(filePath, {
          folder: "resumes",
          resource_type: "auto",
        });
      } catch (err) {
        throw err;
      }
    };

    const tryUploadByStream = (fileBuffer) =>
      new Promise((resolve, reject) => {
        console.log("Attempting Cloudinary.upload_stream fallback using buffer");
        const stream = cloudinary.v2.uploader.upload_stream(
          { folder: "resumes", resource_type: "auto" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(fileBuffer);
      });

    // 1) attempt by path
    if (resume.tempFilePath && fs.existsSync(resume.tempFilePath)) {
      try {
        cloudinaryResponse = await tryUploadByPath(resume.tempFilePath);
      } catch (err) {
        uploadError = err;
        console.error("Cloudinary.upload (path) error:", err);
      }
    } else {
      console.warn("No tempFilePath or not found on disk; will try buffer upload fallback");
    }

    // 2) fallback to buffer/stream
    if (!cloudinaryResponse) {
      try {
        if (resume.data && resume.data.length > 0) {
          cloudinaryResponse = await tryUploadByStream(resume.data);
        } else if (resume.tempFilePath) {
          const fileBuffer = fs.readFileSync(resume.tempFilePath);
          cloudinaryResponse = await tryUploadByStream(fileBuffer);
        } else {
          throw new Error("No file data available for buffer upload fallback");
        }
      } catch (err) {
        console.error("Cloudinary.upload_stream fallback error:", err);
        uploadError = uploadError || err;
      }
    }

    if (!cloudinaryResponse) {
      console.error("Both Cloudinary upload attempts failed. Last error:", uploadError);
      // cleanup temp
      try {
        if (resume.tempFilePath && fs.existsSync(resume.tempFilePath)) {
          fs.unlinkSync(resume.tempFilePath);
        }
      } catch (cleanupErr) {
        console.warn("Cleanup error after upload failures:", cleanupErr.message);
      }
      return next(
        new ErrorHandler(
          "Failed to upload Resume to Cloudinary. Check server logs for upload error details.",
          500
        )
      );
    }

    // Remove temp file after success (best-effort)
    try {
      if (resume.tempFilePath && fs.existsSync(resume.tempFilePath)) {
        fs.unlinkSync(resume.tempFilePath);
      }
    } catch (err) {
      console.warn("Failed to remove temp file:", err.message);
    }

    // Validate job and other fields
    const { name, email, coverLetter, phone, address, jobId } = req.body;

    if (!jobId) {
      return next(new ErrorHandler("Job not found!", 404));
    }
    const jobDetails = await Job.findById(jobId);
    if (!jobDetails) {
      return next(new ErrorHandler("Job not found!", 404));
    }

    const applicantID = {
      user: req.user._id,
      role: "Job Seeker",
    };

    const employerID = {
      user: jobDetails.postedBy,
      role: "Employer",
    };

    if (!name || !email || !coverLetter || !phone || !address) {
      return next(new ErrorHandler("Please fill all fields.", 400));
    }

    const application = await Application.create({
      name,
      email,
      coverLetter,
      phone,
      address,
      applicantID,
      employerID,
      resume: {
        public_id: cloudinaryResponse.public_id,
        url: cloudinaryResponse.secure_url,
      },
      job: jobId,
      appliedAt: Date.now(),
    });

    return res.status(200).json({
      success: true,
      message: "Application Submitted!",
      application,
    });
  } catch (err) {
    console.error("postApplication final catch error:", err);
    // cleanup
    try {
      if (req.files && req.files.resume && req.files.resume.tempFilePath) {
        if (fs.existsSync(req.files.resume.tempFilePath)) {
          fs.unlinkSync(req.files.resume.tempFilePath);
        }
      }
    } catch (cleanupErr) {
      console.warn("Cleanup after final catch failed:", cleanupErr.message);
    }
    return next(new ErrorHandler("Failed to upload Resume to Cloudinary", 500));
  }
});

/**
 * GET /api/v1/application/employer/getall
 * Fetch all applications for employer (by employerID.user)
 */
export const employerGetAllApplications = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "Job Seeker") {
      return next(
        new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
      );
    }
    const { _id } = req.user;
    const applications = await Application.find({ "employerID.user": _id });
    res.status(200).json({
      success: true,
      applications,
    });
  }
);

/**
 * GET /api/v1/application/jobseeker/getall
 * Fetch all applications for the jobseeker (by applicantID.user)
 */
export const jobseekerGetAllApplications = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "Employer") {
      return next(
        new ErrorHandler("Employer not allowed to access this resource.", 400)
      );
    }
    const { _id } = req.user;
    const applications = await Application.find({ "applicantID.user": _id });
    res.status(200).json({
      success: true,
      applications,
    });
  }
);

/**
 * DELETE /api/v1/application/delete/:id
 * Delete an application (jobseeker)
 */
export const jobseekerDeleteApplication = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "Employer") {
      return next(
        new ErrorHandler("Employer not allowed to access this resource.", 400)
      );
    }
    const { id } = req.params;
    const application = await Application.findById(id);
    if (!application) {
      return next(new ErrorHandler("Application not found!", 404));
    }

    // Optionally delete Cloudinary file if public_id exists
    try {
      if (application.resume && application.resume.public_id) {
        await cloudinary.v2.uploader.destroy(application.resume.public_id);
      }
    } catch (err) {
      console.warn("Failed to delete Cloudinary asset during application delete:", err.message);
    }

    await application.deleteOne();
    res.status(200).json({
      success: true,
      message: "Application Deleted!",
    });
  }
);
