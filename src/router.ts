import express from "express";
const router = express.Router();
import memberController from "./controllers/member.controller";
import makeUploader from "./libs/utils/uploader";
import productController from "./controllers/product.controller";
import orderController from "./controllers/order.controller";
import paymentController from "./controllers/payment.controller";
import reservationController from "./controllers/reservation.controller";
import healthController from "./controllers/health.controller";

/** Health (uptime monitor) **/
router.get("/health", healthController.check);

/** Member **/
router.get("/member/restaurant", memberController.getRestaurant);
router.post("/member/signup", memberController.signup);
router.post("/member/login", memberController.login);
router.post("/member/logout", memberController.verifyAuth, memberController.logout);
router.get("/member/detail", memberController.verifyAuth, memberController.getMemberDetail);
router.post(
  "/member/update",
  memberController.verifyAuth,
  makeUploader("members").single("memberImage"),
  memberController.updateMember,
);
router.get("/member/top-users", memberController.getTopUsers);
router.get("/member/points", memberController.verifyAuth, memberController.getPointHistory);

/** Product **/
router.get("/product/all", productController.getProducts);
router.get("/product/:id", memberController.retrieveAuth, productController.getProduct);
router.post("/product/:id/like", memberController.verifyAuth, productController.likeProduct);

/** Order **/
router.post("/order/create", memberController.verifyAuth, orderController.createOrder);
router.get("/order/all", memberController.verifyAuth, orderController.getMyOrders);
router.post("/order/cancel", memberController.verifyAuth, orderController.cancelOrder);

/** Payment (Toss) **/
router.post("/payment/confirm", memberController.verifyAuth, paymentController.confirmPayment);
router.post("/payment/webhook", paymentController.webhook);

/** Reservation **/
router.get("/reservation/availability", reservationController.getAvailability);
router.post(
  "/reservation/create",
  memberController.verifyAuth,
  reservationController.createReservation,
);
router.get("/reservation/my", memberController.verifyAuth, reservationController.getMyReservations);
router.post(
  "/reservation/cancel",
  memberController.verifyAuth,
  reservationController.cancelMyReservation,
);

export default router;
