import { Server } from "socket.io";
import http from "http";
import { env } from "../config/env";

export let io: Server;

export function initSocket(server: http.Server) {
  io = new Server(server, {
    cors: { origin: env.CORS_ORIGIN, credentials: true }
  });

  io.on("connection", (socket) => {
    socket.on("joinTenant", (tenantId: string) => {
      socket.join(`tenant:${tenantId}`);
    });
  });

  console.log("Socket.io initialized");
}
