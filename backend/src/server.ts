import http from "http";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { createApp } from "./app";
import { initSocket } from "./socket";

async function main() {
  await connectDB();
  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
