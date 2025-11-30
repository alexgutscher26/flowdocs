import { io } from "socket.io-client";
import { WebSocketEvent } from "../types/chat";

const WORKSPACE_ID = "test-workspace";
const USER_A = "user-a";
const USER_B = "user-b";

/**
 * Creates a socket connection for the specified user.
 */
const createSocket = (userId: string) => {
  return io("http://localhost:3000", {
    path: "/api/socket",
    query: {
      workspaceId: WORKSPACE_ID,
      userId,
    },
    transports: ["websocket"],
  });
};

/**
 * Tests the presence of User B from User A's perspective.
 *
 * This function establishes a WebSocket connection for User A and listens for a USER_ONLINE event indicating that User B has come online.
 * It resolves when the expected event is received or rejects if a timeout occurs after 5 seconds.
 * After the test, it disconnects both sockets and exits the process.
 */
async function testPresence() {
  console.log("Starting presence test...");

  // Connect User A
  const socketA = createSocket(USER_A);

  await new Promise<void>((resolve) => {
    socketA.on("connect", () => {
      console.log(`User A connected: ${socketA.id}`);
      resolve();
    });
  });

  // Listen for User B coming online
  const presencePromise = new Promise<void>((resolve, reject) => {
    socketA.on(WebSocketEvent.USER_ONLINE, (data) => {
      console.log("User A received USER_ONLINE event:", data);
      if (data.userId === USER_B && data.status === "online") {
        console.log("Verification SUCCESS: User A saw User B come online");
        resolve();
      } else {
        console.log("Received unexpected data:", data);
      }
    });

    // Timeout
    setTimeout(() => {
      reject(new Error("Timeout waiting for USER_ONLINE event"));
    }, 5000);
  });

  // Connect User B
  console.log("Connecting User B...");
  const socketB = createSocket(USER_B);

  socketB.on("connect", () => {
    console.log(`User B connected: ${socketB.id}`);
  });

  try {
    await presencePromise;
  } catch (error) {
    console.error("Verification FAILED:", error);
    process.exit(1);
  } finally {
    socketA.disconnect();
    socketB.disconnect();
    process.exit(0);
  }
}

testPresence();
