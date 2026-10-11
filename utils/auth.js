import jwt from "jsonwebtoken";
import userModel from "../model/user.model.js";

const auth = async (req, res, next) => {
  try {
    let token = req.cookies.pdfmindtoken;


     // If cookie isn't available, check Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;

      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.log(error)
    return res.status(401).json({
      message: "Invalid or expired token",
      error
    });
  }
};

export default auth;