import ViewModel from "../schema/View.model";
import { ViewInput } from "../libs/types/view";
import { isDuplicateKeyError } from "../libs/utils/mongo";

class ViewService {
  private readonly viewModel;

  constructor() {
    this.viewModel = ViewModel;
  }

  /**
   * Birinchi ko'rish bo'lsa true qaytaradi.
   * "Avval tekshir, keyin yoz" o'rniga unique index ishlatiladi —
   * bir vaqtda kelgan ikki so'rov ikki marta sanalmaydi.
   */
  public async insertMemberView(input: ViewInput): Promise<boolean> {
    try {
      await this.viewModel.create(input);
      return true;
    } catch (err) {
      if (isDuplicateKeyError(err)) return false;
      throw err;
    }
  }
}

export default ViewService;
