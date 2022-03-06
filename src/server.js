require("dotenv").config();
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { parse } = require("cookie");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

// get routers
const userRouter = require("./user/userRouter");

// get middlewares
const errorHandler = require("./middlewares/errorHandler");
const connectDb = require("./db/connectDb");
const {
  getUsers,
  socketGetUsers,
  socketGetMessageThread,
  socketCreateMessage,
  socketMarkMessageRead,
  socketUserDisconnected,
  socketUserConnected,
} = require("./socket/socketFunction");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// middlewares
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/user", userRouter);
app.use(errorHandler);

io.use((socket, next) => {
  const headerCookie = socket.handshake.headers.cookie;
  if (!headerCookie) {
    return next(new Error("No token found"));
  }
  try {
    const cookies = parse(headerCookie);
    if (!cookies.sessionToken) {
      return next(new Error("Invalid token"));
    }
    const decoded = jwt.verify(
      cookies.sessionToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    if (decoded.sessionId) {
      socket.sessionId = decoded.sessionId;
      socket.userId = decoded.userId;
    } else {
      return next(new Error("Invalid token"));
    }
  } catch (error) {
    return next(new Error("Invalid token"));
  }
  next();
});

io.on("connection", (socket) => {
  socketUserConnected(socket, io);

  socketGetUsers(socket, io);
  socket.on("get message thread", async (receiverId) => {
    await socketGetMessageThread(socket, receiverId, io);
  });

  socket.on("create message", async ({ messageBody, receiverId }) => {
    await socketCreateMessage(socket, messageBody, receiverId, io);
  });

  socket.on("message read", async (message) => {
    await socketMarkMessageRead(socket, message, io);
  });

  socket.on("disconnect", async () => {
    await socketUserDisconnected(socket, io);
  });
});

const startServer = async () => {
  await connectDb();
  httpServer.listen(3000, () => console.log("listening to request"));
};

startServer();
