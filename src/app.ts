import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import router from "./router";
import routerAdmin from "./router-admin";
import { uploadErrorHandler } from "./libs/utils/uploader";
import morgan from "morgan";
import { MORGAN_FORMAT } from "./libs/config";

// TCP2
import session from "express-session";
import ConnectMongoDB from "connect-mongodb-session";
import { T } from "./libs/types/common";

const MongoDBStore = ConnectMongoDB(session);
const store = new MongoDBStore({
  uri: String(process.env.MONGO_URL),
  collection: "sessions",
});

/** 1-ENTRANCE **/
const app = express();
app.set("trust proxy", 1); // Render/Vercel proksisi ortida secure cookie uchun
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("./uploads"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    credentials: true, // cookie (accessToken) yuborilishi uchun
    origin: (process.env.CLIENT_URL ?? "http://localhost:5000").split(","),
  }),
);
app.use(cookieParser());
if (process.env.NODE_ENV !== "test") app.use(morgan(MORGAN_FORMAT)); // Log mehanizm

/** 2-SESSIONS integration **/
export const sessionMiddleware = session({
  secret: String(process.env.SESSION_SECRET),
  cookie: {
    maxAge: 1000 * 3600 * 6, // 6h
  },
  store: store,
  resave: true,
  saveUninitialized: true, // login bo'lmasdan ishlatgan userlarni ham saqlaydi
});
app.use(sessionMiddleware);
// global variable
app.use(function (req, res, next) {
  const sessionInstance = req.session as T;
  res.locals.member = sessionInstance.member;
  next();
});

/** 3-VIEWS **/
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

/** 4-ROUTERS **/
app.use("/admin", routerAdmin); // BSSR: EJS
app.use("/", router); // SPA: REACT // Middleware Design Pattern
app.use(uploadErrorHandler); // multer: noto'g'ri fayl / hajm -> 400

export default app;
