import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Connected to server:", socket.id);

  // Join a channel
  console.log("Joining channel: test-channel");
  socket.emit("join_channel", "test-channel");

  // Send a message
  console.log("Sending message...");
  socket.emit("send_message", {
    channelId: "test-channel",
    content: "Hello from test script",
    userId: "test-user",
  });
});

socket.on("message", (data) => {
  console.log("Received message:", data);
  if (data.content === "Hello from test script") {
    console.log("Verification successful!");
    socket.disconnect();
    process.exit(0);
  }
});

socket.on("connect_error", (err) => {
  console.error("Connection error:", err);
  process.exit(1);
});

// Timeout
setTimeout(() => {
  console.error("Timeout waiting for message");
  process.exit(1);
}, 5000);
