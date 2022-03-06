const User = require("./User");
const jwt = require("jsonwebtoken");
const asyncWrapper = require("../middlewares/asyncWrapper");
const {
  successResponse,
  createdResponse,
  badRequestResponse,
  unauthorizedResponse,
} = require("../responses");

const getAllUser = asyncWrapper(async (req, res) => {
  console.log("data");
  const users = await User.find({});
  successResponse(res, users);
});

const createUser = asyncWrapper(async (req, res) => {
  const user = await User.create(req.body);
  createdResponse(res, "created");
});

const deleteAllUser = asyncWrapper(async (req, res) => {
  const users = await User.deleteMany({});
  successResponse(res, users);
});

const loginUser = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return badRequestResponse(res, { general: "Please provide all details" });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return unauthorizedResponse(res, { general: "Invalid credentials" });
  }
  const isSamePassword = await user.comparePassword(password);
  if (!isSamePassword) {
    return unauthorizedResponse(res, { general: "Invalid credentials" });
  }
  res.cookie("sessionToken", user.createAccessToken(), {
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });
  successResponse(res, "authenticated");
});

const logoutUser = asyncWrapper(async (req, res) => {
  res.clearCookie("sessionToken", {
    sameSite: "none",
    secure: true,
  });
  successResponse(res, "loggedOut");
});

const verifyUser = asyncWrapper(async (req, res) => {
  if (!req.cookies.sessionToken) {
    return successResponse(res, "unauthorized");
  }
  try {
    const decoded = jwt.verify(
      req.cookies.sessionToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    const { userId } = decoded;
    const user = await User.findById(userId);
    if (!user) {
      return successResponse(res, "unauthorized");
    }
    successResponse(res, "verified");
  } catch (error) {
    return successResponse(res, "unauthorized");
  }
});

module.exports = {
  getAllUser,
  createUser,
  deleteAllUser,
  loginUser,
  logoutUser,
  verifyUser,
};
