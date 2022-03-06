const User = require("../user/User");
const Message = require("../message/Message");
const mongoose = require("mongoose");

const getActiveUsers = (io) => {
  const activeUsers = [];
  io.of("/").sockets.forEach((s) => {
    if (!activeUsers.includes(s.userId)) {
      activeUsers.push(s.userId);
    }
  });
  return activeUsers;
};

const verifyUsers = async (socket, senderId, receiverId) => {
  if (!senderId || !receiverId) {
    return false;
  }
  if (
    !mongoose.Types.ObjectId.isValid(senderId) ||
    !mongoose.Types.ObjectId.isValid(receiverId)
  ) {
    return false;
  }
  const sender = await User.findOne({ _id: senderId });
  const reciever = await User.findOne({ _id: receiverId });
  if (!sender || !reciever) {
    return false;
  }
  return true;
};

const socketGetUsers = async (socket, io) => {
  const activeUsers = getActiveUsers(io);
  const users = await User.find({ _id: { $ne: socket.userId } }).select(
    "-password -__v"
  );
  const promises = users.map(async (user) => {
    const messages = await Message.find()
      .getMessageThread(socket.userId, user._id)
      .sort({
        createdAt: 1,
      })
      .select("-__v");
    return {
      ...user._doc,
      unread: messages.filter(
        (message) =>
          !message.isRead && message.receiverId.toString() === socket.userId
      ).length,
      lastMessage: messages.pop(),
      isActive: activeUsers.includes(user._id.toString()),
    };
  });
  const newUsers = await Promise.all(promises);
  socket.emit("users", newUsers);
};

const socketGetMessageThread = async (socket, receiverId, io) => {
  try {
    const senderId = socket.userId;
    const usersVerifed = await verifyUsers(socket, senderId, receiverId);
    if (!usersVerifed) {
      return socket.emit("users not matched", "Invalid sender or reciever id");
    }
    await Message.updateMany(
      { isRead: false, receiverId: senderId },
      { isRead: true },
      {
        upsert: false,
      }
    ).getMessageThread(senderId, receiverId);
    const messages = await Message.find().getMessageThread(
      senderId,
      receiverId
    );
    const newMessages = messages.map((message) => ({
      ...message._doc,
      sentOrReceived:
        message.senderId.toString() === senderId ? "sent" : "received",
    }));

    const activeUsers = getActiveUsers(io);
    const receiver = await User.findById(receiverId);
    socket.emit("set message thread", {
      messages: newMessages,
      receiver: {
        ...receiver._doc,
        isActive: activeUsers.includes(receiver._id.toString()),
      },
    });
  } catch (error) {
    console.log(error);
    socket.emit("general error", "Something went wrong");
  }
};

const socketCreateMessage = async (socket, messageBody, receiverId, io) => {
  try {
    const senderId = socket.userId;
    const usersVerifed = await verifyUsers(socket, senderId, receiverId);
    if (!usersVerifed) {
      return socket.emit("users not matched", "Invalid sender or reciever id");
    }
    const message = await Message.create({ messageBody, senderId, receiverId });
    const sentMessage = { ...message._doc, sentOrReceived: "sent" };
    const receivedMessage = { ...message._doc, sentOrReceived: "received" };
    socket.emit("message sent", sentMessage);
    io.of("/").sockets.forEach((s) => {
      if (s.id !== socket.id) {
        if (s.userId === senderId) {
          socket.to(s.id).emit("message sent", sentMessage);
        } else if (s.userId === receiverId) {
          socket.to(s.id).emit("message received", receivedMessage);
        }
      }
    });
  } catch (error) {}
};

const socketMarkMessageRead = async (socket, message, io) => {
  const newMessage = await Message.findById({ _id: message._id });
  if (!newMessage) return;
  if (!newMessage.isRead) {
    newMessage.isRead = true;
    await newMessage.save();
    io.of("/").sockets.forEach((s) => {
      if (s.id !== socket.id) {
        if (s.userId === message.receiverId) {
          socket.to(s.id).emit("message read", message.senderId);
        }
      }
    });
  }
};

const socketUserConnected = async (socket, io) => {
  let userCount = 0;
  io.of("/").sockets.forEach((s) => {
    if (socket.userId === s.userId) {
      userCount++;
    }
  });
  if (userCount === 1) {
    socket.broadcast.emit("user online", socket.userId);
  }
};

const socketUserDisconnected = async (socket, io) => {
  let userCount = 0;
  io.of("/").sockets.forEach((s) => {
    if (socket.userId === s.userId) {
      userCount++;
    }
  });
  if (userCount === 0) {
    socket.broadcast.emit("user offline", socket.userId);
  }
};

module.exports = {
  socketGetUsers,
  socketGetMessageThread,
  socketCreateMessage,
  socketMarkMessageRead,
  socketUserConnected,
  socketUserDisconnected,
};
