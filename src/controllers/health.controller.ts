import { Request, Response } from "express";
import mongoose from "mongoose";
import { T } from "../libs/types/common";

const healthController: T = {};

// Uptime monitor (UptimeRobot) uchun: server tirikmi va bazaga ulanganmi
healthController.check = (req: Request, res: Response) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? "ok" : "db_disconnected",
    uptime: Math.round(process.uptime()),
  });
};

export default healthController;
