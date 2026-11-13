import { Request, Response } from "express";
import { T } from "../libs/types/common";
import AnalyticsService from "../models/Analytics.service";

const analyticsService = new AnalyticsService();
const analyticsController: T = {};

const RANGES = [7, 30, 90];

// Analytics page
analyticsController.getAnalyticsPage = async (req: Request, res: Response) => {
  try {
    const days = RANGES.includes(Number(req.query.days)) ? Number(req.query.days) : 30;
    const dashboard = await analyticsService.getDashboard(days);
    res.render("analytics", { dashboard, ranges: RANGES });
  } catch (err) {
    console.log("Error, getAnalyticsPage:", err);
    res.redirect("/admin/login");
  }
};

export default analyticsController;
