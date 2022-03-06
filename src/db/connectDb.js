const mongoose = require("mongoose");

const connectDb = async () => {
  await mongoose.connect(process.env.REMOTE_MONGO_URL);
};

module.exports = connectDb;
