import bcrypt from "bcrypt";
dotenv.config();
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import dotenv from "dotenv";
export const register = async (req, res) => {
  console.log(req.body);
  const { username, email, password } = req.body;
  try {
    // Hash the Password
    const hashPass = await bcrypt.hash(password, 10);
    console.log(hashPass);

    // Create a new User and save to db
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashPass,
      },
    });

    res.status(201).json({ message: "User created successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to create user!" });
  }
};
export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    // check if user exists
    const user = await prisma.user.findUnique({
      where: { username },
    });
    if (!user) return res.status(401).json({ message: "Invalid Credentials" });
    // check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid Credentials!" });

    // generate cookie token and send to the user
    const age = 1000 * 60 * 60 * 24 * 7;
    const token = jwt.sign(
      {
        id: user.id,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: age,
      }
    );

    const { password: userPass, ...userInfo } = user;

    res
      .cookie("token", token, {
        httpOnly: true,
        // secure:true,
        maxAge: age,
      })
      .status(200)
      .json(userInfo);
    // res.setHeader("Set-Cookie", "test=" + "myValue").json("success");
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to login" });
  }
};
export const logout = (req, res) => {
  res.clearCookie("token").status(200).json({ message: "Logout Successful" });
};
