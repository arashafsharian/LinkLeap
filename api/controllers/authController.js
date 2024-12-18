import { User, validateSignup, validateLogin } from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const signToken = (_id) => {
  return jwt.sign({ _id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, age, gender, genderPreference } = req.body;
    const { error } = validateSignup(req.body);
    if (error)
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });

    let user = await User.findOne({ email });
    if (user)
      return res
        .status(400)
        .json({ success: false, message: "User already registered." });

    user = new User({
      name,
      email,
      password,
      age,
      gender,
      genderPreference,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    await user.save();

    const token = signToken(user._id);

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        genderPreference: user.genderPreference,
      },
    });
  } catch (error) {
    console.log("Error in signup controller: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { error } = validateLogin(req.body);
    if (error)
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = signToken(user._id);

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log("Error in login controller: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
export const logout = async (req, res) => {
  res.clearCookie("jwt");
  res.status(200).json({ success: true, message: "Logged out successfully." });
};

export const currentUser = async (req, res) => {
  res.send({
    success: true,
    user: req.user,
  });
};
