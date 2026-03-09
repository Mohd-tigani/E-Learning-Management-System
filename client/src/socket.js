// src/socket.js
import { io } from "socket.io-client";

//connect to backened
export const socket = io("http://localhost:3000", { 
  autoConnect: true,            // reconnect automatically
  reconnectionAttempts: Infinity // reconnet attempts
});
