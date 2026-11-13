import { shapeIntoMongooseObjectId } from "../libs/config";
import Errors, { HttpCode, Message } from "../libs/Errors";
import {
  Product,
  ProductInput,
  ProductUpdateInput,
  PRODUCT_UPDATABLE_FIELDS,
} from "../libs/types/product";
import { pickFields } from "../libs/utils/sanitize";
import ProductModel from "../schema/Product.model";

class ProductService {
  private readonly productModel;

  constructor() {
    this.productModel = ProductModel;
  }

  /** SPA **/

  /** SSR **/

  public async getAllProducts(): Promise<Product[]> {
    const result = await this.productModel.find().exec();
    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    return result;
  }

  public async createNewProduct(input: ProductInput): Promise<Product> {
    // views / likes har doim 0 dan boshlanadi — mijoz yubora olmaydi
    const data = pickFields(input, [
      ...PRODUCT_UPDATABLE_FIELDS,
      "productImages",
    ] as const);

    try {
      return await this.productModel.create(data);
    } catch (err) {
      console.log("Error, model:createNewProduct:", err);
      throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);
    }
  }

  public async updateChosenProduct(
    id: string,
    input: ProductUpdateInput,
  ): Promise<Product> {
    const data = pickFields(input, PRODUCT_UPDATABLE_FIELDS);
    if (Object.keys(data).length === 0)
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_INPUT);

    id = shapeIntoMongooseObjectId(id); // string to => ObjectId
    const result = await this.productModel
      // runValidators: update'da ham enum/required tekshiriladi
      .findOneAndUpdate({ _id: id }, data, { new: true, runValidators: true })
      .exec();
    if (!result) throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);

    return result;
  }
}

export default ProductService;
