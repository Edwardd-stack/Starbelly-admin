import dotenv from "dotenv";
dotenv.config();
import http from "http";
import mongoose from "mongoose";
import app, { sessionMiddleware } from "./app";
import { initSocket } from "./libs/socket";
import ReservationService from "./models/Reservation.service";
import { restoreSeedImages } from "./libs/utils/seedImages";

mongoose
  .connect(process.env.MONGO_URL as string, {})
  .then(() => {
    // TCP1
    console.log("MongoDB connection succeed");
    restoreSeedImages();
    new ReservationService()
      .ensureDefaultTables()
      .catch((err) => console.log("ERROR, ensureDefaultTables:", err));

    // HTTP + WebSocket bitta portda
    const server = http.createServer(app);
    initSocket(server, sessionMiddleware);

    const PORT = process.env.PORT ?? 3003;
    server.listen(PORT, function () {
      console.info(`The server is running successfully on port: ${PORT}`);
      console.info(`Admin project on http://localhost:${PORT}/admin \n`);
    });
  })
  .catch((err) => console.log("ERROR on connection MongoDB", err));
