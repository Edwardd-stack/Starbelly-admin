import { Request, Response } from "express";
import { T } from "../libs/types/common";
import { ExtendedRequest } from "../libs/types/member";
import Errors, { HttpCode } from "../libs/Errors";
import OrderService from "../models/Order.service";
import { OrderStatus } from "../libs/enums/order.enum";
import { OrderInquiry, OrderUpdateInput } from "../libs/types/order";

const orderService = new OrderService();
const orderController: T = {};

const sendError = (res: Response, err: unknown) => {
  if (err instanceof Errors) res.status(err.code).json(err);
  else res.status(Errors.standard.code).json(Errors.standard);
};

// Create order
orderController.createOrder = async (req: ExtendedRequest, res: Response) => {
  try {
    const result = await orderService.createOrder(req.member, req.body);
    res.status(HttpCode.CREATED).json(result);
  } catch (err) {
    console.log("Error, createOrder:", err);
    sendError(res, err);
  }
};

// My orders
orderController.getMyOrders = async (req: ExtendedRequest, res: Response) => {
  try {
    const { page, limit, orderStatus } = req.query;
    const inquiry: OrderInquiry = {
      page: Math.max(Number(page) || 1, 1),
      limit: Math.min(Math.max(Number(limit) || 5, 1), 50),
      orderStatus: Object.values(OrderStatus).includes(orderStatus as OrderStatus)
        ? (orderStatus as OrderStatus)
        : OrderStatus.PAUSE,
    };
    const result = await orderService.getMyOrders(req.member, inquiry);
    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, getMyOrders:", err);
    sendError(res, err);
  }
};

// Cancel order (PAUSE -> DELETE)
orderController.cancelOrder = async (req: ExtendedRequest, res: Response) => {
  try {
    const input: OrderUpdateInput = req.body;
    const result = await orderService.cancelOrder(req.member, input);
    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, cancelOrder:", err);
    sendError(res, err);
  }
};

/** SSR (admin / oshxona) **/

// Finish order (PROCESS -> FINISH, ball beriladi)
orderController.finishOrder = async (req: Request, res: Response) => {
  try {
    const result = await orderService.finishOrder(String(req.params.id));
    res.status(HttpCode.OK).json({ data: result });
  } catch (err) {
    console.log("Error, finishOrder:", err);
    sendError(res, err);
  }
};

export default orderController;
