import { Request, Response } from "express";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { T } from "../libs/types/common";
import ProductService from "../models/Product.service";
import { ProductInput, ProductInquiry, ProductOrder, PRODUCT_ORDERS } from "../libs/types/product";
import { AdminRequest, ExtendedRequest } from "../libs/types/member";
import { ProductCollection } from "../libs/enums/product.enum";

const productService = new ProductService();

const productController: T = {};

/** SPA **/

const sendError = (res: Response, err: unknown) => {
  if (err instanceof Errors) res.status(err.code).json(err);
  else res.status(Errors.standard.code).json(Errors.standard);
};

// get Products (menyu)
productController.getProducts = async (req: Request, res: Response) => {
  try {
    const { page, limit, order, productCollection, search } = req.query;

    const inquiry: ProductInquiry = {
      order: PRODUCT_ORDERS.includes(order as ProductOrder)
        ? (order as ProductOrder)
        : "createdAt",
      page: Math.max(Number(page) || 1, 1),
      limit: Math.min(Math.max(Number(limit) || 8, 1), 50),
    };
    if (Object.values(ProductCollection).includes(productCollection as ProductCollection))
      inquiry.productCollection = productCollection as ProductCollection;
    if (typeof search === "string" && search.trim()) inquiry.search = search.trim().slice(0, 50);

    const result = await productService.getProducts(inquiry);
    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, getProducts:", err);
    sendError(res, err);
  }
};

// get Product (tafsilot)
productController.getProduct = async (req: ExtendedRequest, res: Response) => {
  try {
    const result = await productService.getProduct(req.member, String(req.params.id));
    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, getProduct:", err);
    sendError(res, err);
  }
};

// like Product
productController.likeProduct = async (req: ExtendedRequest, res: Response) => {
  try {
    const result = await productService.likeProduct(req.member, String(req.params.id));
    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, likeProduct:", err);
    sendError(res, err);
  }
};

/** SSR **/

// get AllProducts
productController.getAllProducts = async (req: Request, res: Response) => {
  try {
    console.log("getAllProducts");
    const data = await productService.getAllProducts();

    res.render("products", { products: data }); // direct / local variable ejs ga uzatadi
  } catch (err) {
    console.log("Error, getAllProducts:", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

// create NewProduct
productController.createNewProduct = async (
  req: AdminRequest,
  res: Response,
) => {
  try {
    console.log("createNewProduct");
    console.log(req.body);
    if (!req.files?.length)
      throw new Errors(HttpCode.INTERNAL_SERVER_ERROR, Message.CREATE_FAILED);

    const data: ProductInput = req.body;
    data.productImages = req.files?.map((ele) => {
      return ele.path.replace(/\\/g, "/");
    });

    await productService.createNewProduct(data);

    res.send(
      `<script> alert("Sucessful creation!"); window.location.replace('/admin/product/all') </script>`,
    );
  } catch (err) {
    console.log("Error, createNewProduct:", err);
    const message =
      err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
    res.send(
      `<script> alert("${message}"); window.location.replace('/admin/product/all') </script>`,
    );
  }
};

// update ChosenProduct
productController.updateChosenProduct = async (req: Request, res: Response) => {
  try {
    console.log("updateChosenProduct");
    const id = req.params.id;

    const result = await productService.updateChosenProduct(id, req.body);

    res.status(HttpCode.OK).json({ data: result });
  } catch (err) {
    console.log("Error, updateChosenProduct:", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

export default productController;
