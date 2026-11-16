import path from "path";
import multer from "multer";
import { v4 } from "uuid";
import { NextFunction, Request, Response } from "express";
import Errors, { HttpCode, Message } from "../Errors";

/** MULTER IMAGE UPLOADER **/
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

// Faqat rasm: mimetype VA kengaytma ikkalasi ham ro'yxatda bo'lishi shart
const ALLOWED_IMAGES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
};

function getTargetImageStorage(address: string) {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, `./uploads/${address}`);
    },
    filename: function (req, file, cb) {
      const extension = path.parse(file.originalname).ext.toLowerCase();
      const random_name = v4() + extension;
      cb(null, random_name);
    },
  });
}

const imageFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  const extension = path.parse(file.originalname).ext.toLowerCase();
  const allowedExt = ALLOWED_IMAGES[file.mimetype];
  if (allowedExt && allowedExt.includes(extension)) cb(null, true);
  else cb(new Errors(HttpCode.BAD_REQUEST, Message.INVALID_IMAGE_FILE));
};

const makeUploader = (address: string) => {
  const storage = getTargetImageStorage(address);
  return multer({
    storage: storage,
    fileFilter: imageFilter,
    limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  });
};

export default makeUploader;

/** Upload xatolarini 500 o'rniga tushunarli 400 qilib qaytaradi (app.ts'da router'lardan keyin) **/
export const uploadErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let error: Errors | null = null;
  if (err instanceof Errors) error = err;
  else if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? Message.FILE_TOO_LARGE
        : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE"
          ? Message.TOO_MANY_FILES
          : Message.INVALID_INPUT;
    error = new Errors(HttpCode.BAD_REQUEST, message);
  }
  if (!error) return next(err);

  console.log("Error, upload:", error);
  // Admin (EJS) formalari: alert + orqaga; SPA: JSON
  if (req.originalUrl.startsWith("/admin")) {
    res
      .status(error.code)
      .send(`<script> alert("${error.message}"); window.history.back() </script>`);
  } else {
    res.status(error.code).json(error);
  }
};
