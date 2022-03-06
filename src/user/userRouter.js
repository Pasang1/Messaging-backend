const express = require("express");
const {
  getAllUser,
  createUser,
  deleteAllUser,
  loginUser,
  verifyUser,
  logoutUser,
} = require("./userController");
const router = express.Router();

router.route("/verify").post(verifyUser);
router.route("/login").post(loginUser);
router.route("/logout").delete(logoutUser);
router.route("/").get(getAllUser).post(createUser).delete(deleteAllUser);

module.exports = router;
