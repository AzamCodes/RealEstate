import prisma from "../lib/prisma.js";
import bcyrpt from "bcrypt";

export const getUsers = async (req, res) => {
  //   console.log("Checking endpoint");
  try {
    const users = await prisma.user.findMany();
    res.status(201).json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get User!" });
  }
};
export const getUser = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    // Check if user is found
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    return res.status(200).json(user); // Use 200 for a successful GET request
  } catch (err) {
    console.error(err); // Log the error for debugging
    return res.status(500).json({ message: "Failed to get user!" });
  }
};

export const updateUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;
  const { password, avatar, ...inputs } = req.body;

  // Check if the user is authorized
  if (id !== tokenUserId) {
    return res.status(403).json({ message: "Not Authorized!" });
  }

  let updatedPassword = null;

  try {
    if (password) {
      updatedPassword = await bcyrpt.hash(password, 10);
    }
    const updatedUser = await prisma.user.update({
      where: {
        id,
      },
      data: {
        ...inputs,
        ...(updatedPassword && { password: updatedPassword }),
        ...(avatar && { avatar }),
      },
    });

    // Send the updated user response
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err); // Log the error for debugging
    return res.status(500).json({ message: "Failed to update User!" });
  }
};

export const deleteUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  // Check if the user is authorized
  if (id !== tokenUserId) {
    return res.status(403).json({ message: "Not Authorized!" });
  }
  try {
    await prisma.user.delete({
      where: { id },
    });
    return res.status(200).json({ message: "User deleted Sucessfully." });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Failed to delete User!" });
  }
};

export const savePost = async (req, res) => {
  const postId = req.body.postId; // Get the postId from the request body
  const tokenUserId = req.userId; // Assuming userId is set by your authentication middleware

  try {
    // Check if the post is already saved by the user
    const existingSavedPost = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: tokenUserId,
          postId,
        },
      },
    });

    if (existingSavedPost) {
      // Post is already saved; remove it
      await prisma.savedPost.delete({
        where: {
          id: existingSavedPost.id, // Delete the existing saved post
        },
      });
      return res
        .status(200)
        .json({ message: "Post removed from saved list", isSaved: false });
    } else {
      // Post is not saved; save it
      await prisma.savedPost.create({
        data: {
          userId: tokenUserId, // Save the post for the user
          postId,
        },
      });
      return res.status(200).json({ message: "Post saved", isSaved: true });
    }
  } catch (err) {
    console.error("Error:", err); // Log the error
    return res
      .status(500)
      .json({ message: "Failed to save or unsave the post!" });
  }
};

export const profilePosts = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const userPosts = await prisma.post.findMany({
      where: { userId: tokenUserId },
    });
    const saved = await prisma.savedPost.findMany({
      where: { userId: tokenUserId },
      include: {
        post: true,
      },
    });

    const savedPosts = saved.map((item) => item.post);
    return res.status(200).json({ userPosts, savedPosts });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Failed to get profile posts!" });
  }
};

export const getNotificationNumber = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const number = await prisma.chat.count({
      where: {
        userIDs: {
          hasSome: [tokenUserId],
        },
        NOT: {
          seenBy: {
            hasSome: [tokenUserId],
          },
        },
      },
    });
    res.status(200).json(number);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get profile posts!" });
  }
};
