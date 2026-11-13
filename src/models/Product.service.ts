import { shapeIntoMongooseObjectId } from "../libs/config";
import Errors, { HttpCode, Message } from "../libs/Errors";
import {
  Product,
  ProductDetail,
  ProductInput,
  ProductInquiry,
  ProductList,
  ProductUpdateInput,
  PRODUCT_UPDATABLE_FIELDS,
} from "../libs/types/product";
import { T } from "../libs/types/common";
import { TokenMember } from "../libs/types/member";
import { ProductStatus } from "../libs/enums/product.enum";
import { ViewGroup } from "../libs/enums/view.enum";
import { LikeGroup } from "../libs/enums/like.enum";
import { LikeResult } from "../libs/types/like";
import ViewService from "./View.service";
import LikeService from "./Like.service";
import { escapeRegex } from "../libs/utils/mongo";
import { pickFields } from "../libs/utils/sanitize";
import ProductModel from "../schema/Product.model";

class ProductService {
  private readonly productModel;
  private readonly viewService;
  private readonly likeService;

  constructor() {
    this.productModel = ProductModel;
    this.viewService = new ViewService();
    this.likeService = new LikeService();
  }

  /** SPA **/

  // Menyu: saralash, kategoriya, qidiruv, sahifalash
  public async getProducts(inquiry: ProductInquiry): Promise<ProductList> {
    const match: T = { productStatus: ProductStatus.PROCESS };
    if (inquiry.productCollection) match.productCollection = inquiry.productCollection;
    if (inquiry.search)
      match.productName = { $regex: escapeRegex(inquiry.search), $options: "i" };

    // Narx — arzonidan qimmatiga, qolganlari — kattasidan kichigiga
    const sort: T =
      inquiry.order === "productPrice"
        ? { productPrice: 1, _id: 1 }
        : { [inquiry.order]: -1, _id: -1 };

    const [result] = await this.productModel
      .aggregate([
        { $match: match },
        {
          $facet: {
            list: [
              { $sort: sort },
              { $skip: (inquiry.page - 1) * inquiry.limit },
              { $limit: inquiry.limit },
            ],
            total: [{ $count: "count" }],
          },
        },
      ])
      .exec();

    return { list: result?.list ?? [], total: result?.total?.[0]?.count ?? 0 };
  }

  // Bitta mahsulot: kirgan a'zo uchun ko'rish +1 (faqat birinchi marta) va meLiked
  public async getProduct(member: TokenMember | undefined, id: string): Promise<ProductDetail> {
    const productId = shapeIntoMongooseObjectId(id);
    const exists = await this.productModel
      .exists({ _id: productId, productStatus: ProductStatus.PROCESS })
      .exec();
    if (!exists) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    let meLiked = false;
    if (member) {
      const memberId = shapeIntoMongooseObjectId(member._id);
      const isFirstView = await this.viewService.insertMemberView({
        viewGroup: ViewGroup.PRODUCT,
        memberId,
        viewRefId: productId,
      });
      if (isFirstView)
        await this.productModel.updateOne({ _id: productId }, { $inc: { productViews: 1 } }).exec();

      meLiked = await this.likeService.checkLikeExistence({ memberId, likeRefId: productId });
    }

    const product = await this.productModel.findById(productId).lean<Product>().exec();
    if (!product) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    return { ...product, meLiked };
  }

  // Like / unlike
  public async likeProduct(member: TokenMember, id: string): Promise<LikeResult> {
    const productId = shapeIntoMongooseObjectId(id);
    const exists = await this.productModel
      .exists({ _id: productId, productStatus: ProductStatus.PROCESS })
      .exec();
    if (!exists) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    const change = await this.likeService.toggleLike({
      likeGroup: LikeGroup.PRODUCT,
      memberId: shapeIntoMongooseObjectId(member._id),
      likeRefId: productId,
    });

    // $inc — atomik: parallel like'lar bir-birini o'chirib yubormaydi
    const updated = await this.productModel
      .findByIdAndUpdate(productId, { $inc: { productLikes: change } }, { new: true })
      .lean<Product>()
      .exec();

    return { productLikes: updated?.productLikes ?? 0, meLiked: change === 1 };
  }

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
