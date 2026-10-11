import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import userModel from "../model/user.model.js";

export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // console.log(req.body, "ggoewoarj")
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            })
        }

        const checkExisting = await userModel.findOne({ email: email })
        if (checkExisting) {
            return res.status(400).json({
                message: "User already exists"
            })
        }
        const hashPassword = await bcrypt.hash(password, 10)
        const data = await userModel.create({
            name,
            email,
            password: hashPassword
        })

        return res.status(200).json({
            message: "User registered successfully",
        })
    } catch (error) {
        console.log(error)
    }
}

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        const user = await userModel.findOne({
            email: email.trim().toLowerCase(),
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                name: user.name,
                email: user.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "365d",
            }
        );

        res.cookie("pdfmindtoken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production"
                    ? "none"
                    : "lax",
            maxAge: 365 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};