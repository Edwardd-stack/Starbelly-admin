export interface AnalyticsSummary {
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
  newMembers: number;
  reservationCount: number;
}

export interface DailyRevenue {
  date: string; // YYYY-MM-DD (KST)
  revenue: number;
  orderCount: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
}

export interface HourlyLoad {
  hour: number; // 0-23 (KST)
  orderCount: number;
}

export interface AnalyticsDashboard {
  days: number;
  summary: AnalyticsSummary;
  daily: DailyRevenue[];
  topProducts: TopProduct[];
  hourly: HourlyLoad[];
}
