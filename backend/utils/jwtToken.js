// backend/utils/jwtToken.js
import jwt from "jsonwebtoken";

/**
 * Create JWT token for a user
 */
export const createToken = (userId) => {
  const secret = process.env.JWT_SECRET_KEY || "change_this_secret";
  const expiresIn = process.env.JWT_EXPIRE || "7d";
  return jwt.sign({ id: userId }, secret, { expiresIn });
};

/**
 * Send token in JSON (for internal usage)
 */
export const sendToken = (user, statusCode, res, message = null) => {
  const token = createToken(user._id ? user._id : user.id);
  const userSafe = user._doc ? { ...user._doc } : { ...user };
  if (userSafe.password) delete userSafe.password;

  const payload = { success: true, token, user: userSafe };
  if (message) payload.message = message;

  return res.status(statusCode).json(payload);
};

/**
 * Send token in a secure HTTP-only cookie (for production login/register)
 */
export const sendCookieToken = (user, statusCode, res, message = null) => {
  const token = createToken(user._id ? user._id : user.id);

  const maxAge = parseInt(process.env.COOKIE_EXPIRE || "7", 10) * 24 * 60 * 60 * 1000;

  const cookieOptions = {
    httpOnly: true,
    path: "/",
    sameSite: "none",       // required for cross-site cookies (Netlify → Railway)
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    expires: new Date(Date.now() + maxAge),
    maxAge,
  };

  const userSafe = user._doc ? { ...user._doc } : { ...user };
  if (userSafe.password) delete userSafe.password;

  const payload = { success: true, user: userSafe, token };
  if (message) payload.message = message;

  return res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json(payload);
};
