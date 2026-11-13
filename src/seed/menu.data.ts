import { ProductCollection, ProductSize } from "../libs/enums/product.enum";

/** Demo menyu (narxlar KRW). image — seed/images/<image>.webp */
export interface SeedProduct {
  productName: string;
  productCollection: ProductCollection;
  productPrice: number;
  productLeftCount: number;
  productSize?: ProductSize;
  productVolume?: number;
  productDesc: string;
  image: string;
}

export const MENU: SeedProduct[] = [
  // MAIN_DISH
  { productName: "Smoky Burger", productCollection: ProductCollection.MAIN_DISH, productPrice: 14500, productLeftCount: 50, productSize: ProductSize.NORMAL, productDesc: "Beef patty, smoked cheddar, caramelized onion and house sauce.", image: "smoky-burger" },
  { productName: "Teriyaki Chicken Bowl", productCollection: ProductCollection.MAIN_DISH, productPrice: 13500, productLeftCount: 40, productSize: ProductSize.NORMAL, productDesc: "Teriyaki chicken, rice, corn, cherry tomatoes, red cabbage and quail eggs.", image: "menu-8" },
  { productName: "Shrimp Noodle Bowl", productCollection: ProductCollection.MAIN_DISH, productPrice: 14500, productLeftCount: 35, productSize: ProductSize.NORMAL, productDesc: "Rice noodles, shrimp, mushrooms, tomatoes, nori and fresh coriander.", image: "menu-11" },
  { productName: "Salmon Sushi Set", productCollection: ProductCollection.MAIN_DISH, productPrice: 22000, productLeftCount: 25, productSize: ProductSize.SET, productDesc: "Salmon nigiri and maki with pickled ginger and wasabi.", image: "salmon-sushi" },
  { productName: "Creamy Pasta", productCollection: ProductCollection.MAIN_DISH, productPrice: 15000, productLeftCount: 35, productSize: ProductSize.NORMAL, productDesc: "Tagliatelle in parmesan cream sauce with mushrooms and bacon.", image: "creamy-pasta" },
  // SALAD
  { productName: "Salmon Poke Bowl", productCollection: ProductCollection.SALAD, productPrice: 15500, productLeftCount: 35, productSize: ProductSize.NORMAL, productDesc: "Fresh salmon, rice, edamame, cucumber, seaweed salad and sesame.", image: "menu-7" },
  { productName: "Veggie Bowl", productCollection: ProductCollection.SALAD, productPrice: 11000, productLeftCount: 40, productSize: ProductSize.NORMAL, productDesc: "Quinoa, avocado, roasted chickpeas, greens and tahini dressing.", image: "veggie-bowl" },
  // DRINK
  { productName: "Starbelly Americano", productCollection: ProductCollection.DRINK, productPrice: 4500, productLeftCount: 100, productVolume: 0.5, productDesc: "Our house blend, freshly brewed — hot or iced.", image: "menu-4" },
  { productName: "Rose Tonic", productCollection: ProductCollection.DRINK, productPrice: 6500, productLeftCount: 60, productVolume: 0.5, productDesc: "Berry and rose syrup, tonic water, cucumber and mint.", image: "menu-6" },
  { productName: "Mango Smoothie", productCollection: ProductCollection.DRINK, productPrice: 6500, productLeftCount: 60, productVolume: 0.5, productDesc: "Mango, carrot and orange blended to order.", image: "menu-10" },
  { productName: "Fresh Lemonade", productCollection: ProductCollection.DRINK, productPrice: 5500, productLeftCount: 80, productVolume: 0.5, productDesc: "Squeezed lemons, mint and a touch of honey.", image: "menu-14" },
  { productName: "Virgin Mojito", productCollection: ProductCollection.DRINK, productPrice: 6000, productLeftCount: 80, productVolume: 0.5, productDesc: "Lime, fresh mint, cane sugar and sparkling water.", image: "menu-15" },
];
