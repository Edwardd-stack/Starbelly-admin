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
  // STARTER
  { productName: "Tomato Bruschetta", productCollection: ProductCollection.STARTER, productPrice: 8500, productLeftCount: 40, productSize: ProductSize.NORMAL, productDesc: "Grilled sourdough, cherry tomatoes, basil and aged balsamic.", image: "bruschetta" },
  { productName: "Spicy Chicken Wings", productCollection: ProductCollection.STARTER, productPrice: 12000, productLeftCount: 35, productSize: ProductSize.NORMAL, productDesc: "Crispy wings glazed with gochujang honey sauce and sesame.", image: "chicken-wings" },
  { productName: "Crispy Spring Rolls", productCollection: ProductCollection.STARTER, productPrice: 9000, productLeftCount: 40, productSize: ProductSize.NORMAL, productDesc: "Vegetable spring rolls with sweet chili dip.", image: "spring-rolls" },
  // MAIN_DISH
  { productName: "Smoky Burger", productCollection: ProductCollection.MAIN_DISH, productPrice: 14500, productLeftCount: 50, productSize: ProductSize.NORMAL, productDesc: "Beef patty, smoked cheddar, caramelized onion and house sauce.", image: "smoky-burger" },
  { productName: "Double Cheese Burger", productCollection: ProductCollection.MAIN_DISH, productPrice: 16500, productLeftCount: 45, productSize: ProductSize.LARGE, productDesc: "Two beef patties, double cheddar, pickles and brioche bun.", image: "double-cheese-burger" },
  { productName: "Grilled Ribeye Steak", productCollection: ProductCollection.MAIN_DISH, productPrice: 32000, productLeftCount: 20, productSize: ProductSize.NORMAL, productDesc: "250g ribeye with rosemary butter, roasted potatoes and greens.", image: "grilled-steak" },
  { productName: "Margherita Pizza", productCollection: ProductCollection.MAIN_DISH, productPrice: 18000, productLeftCount: 30, productSize: ProductSize.LARGE, productDesc: "San Marzano tomato, fresh mozzarella, basil, wood-fired crust.", image: "margherita-pizza" },
  { productName: "Bibimbap Bowl", productCollection: ProductCollection.MAIN_DISH, productPrice: 13000, productLeftCount: 40, productSize: ProductSize.NORMAL, productDesc: "Rice, seasoned vegetables, beef bulgogi, egg and gochujang.", image: "bibimbap" },
  { productName: "Salmon Sushi Set", productCollection: ProductCollection.MAIN_DISH, productPrice: 22000, productLeftCount: 25, productSize: ProductSize.SET, productDesc: "12 pieces of salmon nigiri and maki with ginger and wasabi.", image: "salmon-sushi" },
  { productName: "Creamy Pasta", productCollection: ProductCollection.MAIN_DISH, productPrice: 15000, productLeftCount: 35, productSize: ProductSize.NORMAL, productDesc: "Tagliatelle in parmesan cream sauce with mushrooms and bacon.", image: "creamy-pasta" },
  // SALAD
  { productName: "Veggie Bowl", productCollection: ProductCollection.SALAD, productPrice: 11000, productLeftCount: 40, productSize: ProductSize.NORMAL, productDesc: "Quinoa, avocado, roasted chickpeas, greens and tahini dressing.", image: "veggie-bowl" },
  { productName: "Chicken Caesar Salad", productCollection: ProductCollection.SALAD, productPrice: 12500, productLeftCount: 35, productSize: ProductSize.NORMAL, productDesc: "Romaine, grilled chicken, parmesan, croutons and Caesar dressing.", image: "caesar-salad" },
  { productName: "Greek Salad", productCollection: ProductCollection.SALAD, productPrice: 10500, productLeftCount: 35, productSize: ProductSize.NORMAL, productDesc: "Tomato, cucumber, olives, red onion and feta with oregano.", image: "greek-salad" },
  // DESSERT
  { productName: "Chocolate Lava Cake", productCollection: ProductCollection.DESSERT, productPrice: 8000, productLeftCount: 30, productSize: ProductSize.SMALL, productDesc: "Warm chocolate cake with a molten centre and vanilla ice cream.", image: "chocolate-lava-cake" },
  { productName: "New York Cheesecake", productCollection: ProductCollection.DESSERT, productPrice: 7500, productLeftCount: 30, productSize: ProductSize.SMALL, productDesc: "Creamy baked cheesecake with berry compote.", image: "cheesecake" },
  { productName: "Classic Tiramisu", productCollection: ProductCollection.DESSERT, productPrice: 7500, productLeftCount: 30, productSize: ProductSize.SMALL, productDesc: "Espresso-soaked ladyfingers, mascarpone and cocoa.", image: "tiramisu" },
  // DRINK
  { productName: "Iced Latte", productCollection: ProductCollection.DRINK, productPrice: 5000, productLeftCount: 80, productVolume: 0.5, productDesc: "Double espresso over ice with fresh milk.", image: "iced-latte" },
  { productName: "Fresh Lemonade", productCollection: ProductCollection.DRINK, productPrice: 5500, productLeftCount: 80, productVolume: 0.5, productDesc: "Squeezed lemons, mint and sparkling water.", image: "fresh-lemonade" },
  { productName: "Mango Smoothie", productCollection: ProductCollection.DRINK, productPrice: 6500, productLeftCount: 60, productVolume: 0.5, productDesc: "Mango, banana and yogurt blended to order.", image: "mango-smoothie" },
];
