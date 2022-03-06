const mongoose = require("mongoose");
const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    messageBody: {
      type: String,
      required: [true, "Please provide message"],
    },
    senderId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide sender id"],
    },
    receiverId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide receiver id"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

MessageSchema.query.getMessageThread = function (senderId, receiverId) {
  return this.where({
    $and: [
      { $or: [{ senderId }, { receiverId: senderId }] },
      { $or: [{ receiverId }, { senderId: receiverId }] },
    ],
  });
};

module.exports = mongoose.model("Message", MessageSchema);
