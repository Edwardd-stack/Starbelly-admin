import LikeModel from "../schema/Like.model";
import { LikeInput } from "../libs/types/like";
import { isDuplicateKeyError } from "../libs/utils/mongo";

class LikeService {
  private readonly likeModel;

  constructor() {
    this.likeModel = LikeModel;
  }

  public async checkLikeExistence(input: Omit<LikeInput, "likeGroup">): Promise<boolean> {
    const exist = await this.likeModel
      .exists({ memberId: input.memberId, likeRefId: input.likeRefId })
      .exec();
    return Boolean(exist);
  }

  /**
   * Like'ni almashtiradi: yo'q bo'lsa qo'shadi (+1), bor bo'lsa olib tashlaydi (-1).
   * Natija: o'zgarish miqdori.
   */
  public async toggleLike(input: LikeInput): Promise<1 | -1> {
    try {
      await this.likeModel.create(input);
      return 1;
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
      await this.likeModel
        .deleteOne({ memberId: input.memberId, likeRefId: input.likeRefId })
        .exec();
      return -1;
    }
  }
}

export default LikeService;
