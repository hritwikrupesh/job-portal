// backend/controllers/userController.js
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { sendCookieToken } from "../utils/jwtToken.js";

// ==================== REGISTER ====================
export const register = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !phone || !password || !role) {
    return next(new ErrorHandler("Please fill the full form!", 400));
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return next(new ErrorHandler("Email already registered!", 400));
  }

  const user = await User.create({ name, email, phone, password, role });

  // ✅ Send secure cookie + JSON response
  return sendCookieToken(user, 201, res, "User Registered Successfully!");
});

// ==================== LOGIN ====================
export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return next(new ErrorHandler("Please provide email, password and role!", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid Email or Password!", 400));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email or Password!", 400));
  }

  if (user.role !== role) {
    return next(new ErrorHandler(`User with provided email and ${role} not found!`, 404));
  }

  // ✅ Send secure cookie on successful login
  return sendCookieToken(user, 200, res, "User Logged In Successfully!");
});

// ==================== LOGOUT ====================
export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
      sameSite: "none",
      secure: process.env.NODE_ENV === "production",
    })
    .json({
      success: true,
      message: "Logged Out Successfully!",
    });
});

// ==================== GET USER ====================
export const getUser = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});
