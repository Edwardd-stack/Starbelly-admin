import { inspect } from "util";

export enum HttpCode {
  OK = 200,
  CREATED = 201,
  NOT_MODIFIED = 304,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

export enum Message {
  SOMETHING_WENT_WRONG = "Something went wrong!",
  NO_DATA_FOUND = "No data is found!",
  CREATE_FAILED = "Create is failed!",
  UPDATE_FAILED = "Update is failed!",
  INVALID_INPUT = "Invalid input data!",
  PRODUCT_UNAVAILABLE = "Some products are not available!",
  INVALID_STATUS_CHANGE = "This status change is not allowed!",
  PAYMENT_AMOUNT_MISMATCH = "Payment amount does not match the order!",
  PAYMENT_FAILED = "Payment confirmation failed!",
  ALREADY_RESERVED = "This table is already reserved for that time!",
  INVALID_RESERVATION_TIME = "Reservation time is not available!",
  TABLE_TOO_SMALL = "This table does not have enough seats!",
  INVALID_IMAGE_FILE = "Only JPG, PNG, WEBP or GIF images are allowed!",
  FILE_TOO_LARGE = "Image is too large, maximum size is 5MB!",
  TOO_MANY_FILES = "Too many files uploaded!",

  USED_NICK_PHONE = "You are inserting already used nick or phone!",
  NO_MEMBER_NICK = "No member with that member nick!",
  BLOCKED_USER = "You have been blocked, contact the admin!",
  WRONG_PASSWORD = "Wrong password, please try again!",
  NOT_AUTHENTICATED = "You are not authenticated, Please login first!",
  TOKEN_CREATION_FAILED = "Token creation error!",
}

class Errors extends Error {
  public code: HttpCode;
  public message: Message;

  static standard = {
    code: HttpCode.INTERNAL_SERVER_ERROR,
    message: Message.SOMETHING_WENT_WRONG,
  };

  constructor(statusCode: HttpCode, statusMessage: Message) {
    super();
    this.code = statusCode;
    this.message = statusMessage;
  }

  // Kutilgan xatolar (400, 401, 409 ...) logda bitta qator bo'lib chiqadi, stack trace'siz
  [inspect.custom]() {
    return `Errors(${this.code}): ${this.message}`;
  }
}

export default Errors;
