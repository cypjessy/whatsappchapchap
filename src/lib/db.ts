import { db } from "./firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  deleteDoc,
  addDoc
} from "firebase/firestore";
import { User } from "firebase/auth";

export interface Tenant {
  id: string;
  userId: string;
  name: string;
  email: string;
  businessName: string;
  phone?: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  evolutionServerUrl?: string;
  evolutionInstanceId?: string;
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  evolutionUUID?: string;
  whatsappInstanceId?: string;
  whatsappConnectionStatus?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  categoryId?: string;
  categoryName?: string;
  subcategory?: string;
  orderLink?: string;
  filters?: Record<string, string[]>;
  stock?: number;
  image?: string;
  shippingFee?: number;
  weight?: number;
  lowStockAlert?: number;
  // Additional fields
  salePrice?: number;
  costPrice?: number;
  sku?: string;
  barcode?: string;
  brand?: string;
  condition?: string;
  taxEnabled?: boolean;
  taxRate?: number;
  weightUnit?: string;
  status?: string;
  variants?: Variant[];
  createdAt: any;
  updatedAt: any;
}

export interface Variant {
  id: number;
  specs: Record<string, string>;
  sku: string;
  price: number;
  stock: number;
}

// Category and Subcategory definitions with their filters and options
export const categorySubcategories: Record<string, Record<string, { name: string; specs: Record<string, { label: string; options: string[]; icon: string }> }>> = {
  electronics: {
    phones: { name: 'Phones', specs: { brand: { label: 'Brand', options: ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Tecno', 'Infinix'], icon: 'fa-mobile-alt' }, storage: { label: 'Storage', options: ['64GB', '128GB', '256GB', '512GB', '1TB'], icon: 'fa-hdd' }, ram: { label: 'RAM', options: ['4GB', '6GB', '8GB', '12GB', '16GB'], icon: 'fa-memory' }, color: { label: 'Color', options: ['Black', 'White', 'Blue', 'Red', 'Gold', 'Silver', 'Green'], icon: 'fa-palette' }, condition: { label: 'Condition', options: ['New', 'Used', 'Refurbished'], icon: 'fa-check-circle' } } },
    laptops: { name: 'Laptops', specs: { brand: { label: 'Brand', options: ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer'], icon: 'fa-laptop' }, processor: { label: 'Processor', options: ['Intel i3', 'Intel i5', 'Intel i7', 'Intel i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'M1', 'M2', 'M3'], icon: 'fa-microchip' }, ram: { label: 'RAM', options: ['8GB', '16GB', '32GB', '64GB'], icon: 'fa-memory' }, storage: { label: 'Storage', options: ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD'], icon: 'fa-hdd' }, screen_size: { label: 'Screen', options: ['13"', '14"', '15.6"', '16"', '17.3"'], icon: 'fa-expand' }, color: { label: 'Color', options: ['Silver', 'Gray', 'Black', 'Gold', 'Blue'], icon: 'fa-palette' } } },
    tablets: { name: 'Tablets', specs: { brand: { label: 'Brand', options: ['Apple', 'Samsung', 'Lenovo', 'Huawei'], icon: 'fa-tablet-alt' }, screen_size: { label: 'Screen', options: ['7"', '8"', '10"', '11"', '12.9"'], icon: 'fa-expand' }, storage: { label: 'Storage', options: ['32GB', '64GB', '128GB', '256GB'], icon: 'fa-hdd' }, ram: { label: 'RAM', options: ['2GB', '4GB', '6GB', '8GB'], icon: 'fa-memory' }, color: { label: 'Color', options: ['Black', 'Silver', 'Gold', 'Blue'], icon: 'fa-palette' } } },
    tvs: { name: 'TVs', specs: { brand: { label: 'Brand', options: ['Samsung', 'LG', 'Sony', 'Hisense', 'Philips'], icon: 'fa-tv' }, screen_size: { label: 'Screen', options: ['32"', '40"', '43"', '50"', '55"', '65"', '75"'], icon: 'fa-expand' }, resolution: { label: 'Resolution', options: ['HD', 'Full HD', '4K', '8K'], icon: 'fa-eye' }, smart_tv: { label: 'Smart TV', options: ['Yes', 'No'], icon: 'fa-wifi' }, color: { label: 'Color', options: ['Black', 'Silver', 'Gray'], icon: 'fa-palette' } } },
    earphones: { name: 'Earphones/Headphones', specs: { brand: { label: 'Brand', options: ['Apple', 'Samsung', 'Sony', 'JBL', 'Bose', 'Audio-Technica'], icon: 'fa-headphones' }, type: { label: 'Type', options: ['In-ear', 'Over-ear', 'On-ear', 'Earbuds'], icon: 'fa-headphones-alt' }, color: { label: 'Color', options: ['Black', 'White', 'Blue', 'Red', 'Gold'], icon: 'fa-palette' }, noise_cancelling: { label: 'Noise Cancelling', options: ['Yes', 'No'], icon: 'fa-volume-mute' } } },
    cameras: { name: 'Cameras', specs: { brand: { label: 'Brand', options: ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic'], icon: 'fa-camera' }, megapixels: { label: 'Megapixels', options: ['12MP', '20MP', '24MP', '30MP', '45MP', '50MP'], icon: 'fa-camera-retro' }, type: { label: 'Type', options: ['DSLR', 'Mirrorless', 'Point & Shoot', 'Action Camera'], icon: 'fa-video' }, color: { label: 'Color', options: ['Black', 'Silver', 'White'], icon: 'fa-palette' } } }
  },
  footwear: {
    shoes: { name: 'Shoes/Sneakers', specs: { brand: { label: 'Brand', options: ['Nike', 'Adidas', 'Puma', 'New Balance', 'Converse', 'Vans', 'Reebok'], icon: 'fa-shoe-prints' }, sizes: { label: 'Size', options: ['6', '7', '8', '9', '10', '11', '12'], icon: 'fa-ruler' }, color: { label: 'Color', options: ['Black', 'White', 'Red', 'Blue', 'Gray', 'Brown', 'Green', 'Pink'], icon: 'fa-palette' }, gender: { label: 'Gender', options: ['Men', 'Women', 'Unisex', 'Kids'], icon: 'fa-venus-mars' }, material: { label: 'Material', options: ['Leather', 'Synthetic', 'Canvas', 'Mesh', 'Suede'], icon: 'fa-layer-group' } } },
    boots: { name: 'Boots', specs: { brand: { label: 'Brand', options: ['Timberland', 'Dr. Martens', 'Caterpillar', 'Columbia'], icon: 'fa-shoe-prints' }, sizes: { label: 'Size', options: ['6', '7', '8', '9', '10', '11', '12'], icon: 'fa-ruler' }, color: { label: 'Color', options: ['Brown', 'Black', 'Tan', 'Gray', 'Red'], icon: 'fa-palette' }, gender: { label: 'Gender', options: ['Men', 'Women', 'Unisex'], icon: 'fa-venus-mars' }, material: { label: 'Material', options: ['Leather', 'Suede', 'Rubber', 'Synthetic'], icon: 'fa-layer-group' } } },
    sandals: { name: 'Sandals/Slippers', specs: { brand: { label: 'Brand', options: ['Crocs', 'Fitflop', 'Birkenstock', 'Havaianas'], icon: 'fa-shoe-prints' }, sizes: { label: 'Size', options: ['6', '7', '8', '9', '10', '11'], icon: 'fa-ruler' }, color: { label: 'Color', options: ['Black', 'Brown', 'Navy', 'Beige', 'Pink'], icon: 'fa-palette' }, gender: { label: 'Gender', options: ['Men', 'Women', 'Unisex'], icon: 'fa-venus-mars' }, material: { label: 'Material', options: ['Rubber', 'Leather', 'Fabric', 'Cork'], icon: 'fa-layer-group' } } }
  },
  clothing: {
    tops: { name: 'Tops/T-shirts', specs: { brand: { label: 'Brand', options: ['Adidas', 'Nike', 'Puma', 'H&M', 'Zara', 'Uniqlo'], icon: 'fa-tshirt' }, sizes: { label: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'], icon: 'fa-ruler' }, color: { label: 'Color', options: ['Black', 'White', 'Gray', 'Navy', 'Red', 'Blue', 'Green', 'Pink', 'Yellow'], icon: 'fa-palette' }, gender: { label: 'Gender', options: ['Men', 'Women', 'Unisex'], icon: 'fa-venus-mars' }, material: { label: 'Material', options: ['Cotton', 'Polyester', 'Linen', 'Silk', 'Wool', 'Blend'], icon: 'fa-layer-group' }, style: { label: 'Style', options: ['Casual', 'Formal', 'Sport', 'Vintage', 'Graphic'], icon: 'fa-tshirt' } } },
    trousers: { name: 'Trousers/Jeans', specs: { brand: { label: 'Brand', options: ['Levi\'s', 'Wrangler', 'Gap', 'Zara', 'H&M'], icon: 'fa-tshirt' }, sizes: { label: 'Size', options: ['28', '30', '32', '34', '36', '38', '40'], icon: 'fa-ruler' }, color: { label: 'Color', options: ['Blue', 'Black', 'Gray', 'Khaki', 'White', 'Navy'], icon: 'fa-palette' }, gender: { label: 'Gender', options: ['Men', 'Women', 'Unisex'], icon: 'fa-venus-mars' }, fit: { label: 'Fit', options: ['Slim', 'Regular', 'Relaxed', 'Skinny', 'Bootcut'], icon: 'fa-arrows-alt-h' }, material: { label: 'Material', options: ['Denim', 'Cotton', 'Polyester', 'Chino', 'Corduroy'], icon: 'fa-layer-group' } } },
    dresses: { name: 'Dresses', specs: { brand: { label: 'Brand', options: ['Zara', 'H&M', 'Mango', 'ASOS', 'Reiss'], icon: 'fa-tshirt' }, sizes: { label: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], icon: 'fa-ruler' }, color: { label: 'Color', options: ['Black', 'White', 'Red', 'Blue', 'Pink', 'Green', 'Navy', 'Beige'], icon: 'fa-palette' }, material: { label: 'Material', options: ['Cotton', 'Silk', 'Polyester', 'Linen', 'Chiffon'], icon: 'fa-layer-group' }, style: { label: 'Style', options: ['Casual', 'Evening', 'Cocktail', 'Maxi', 'Mini', 'Midi'], icon: 'fa-tshirt' }, occasion: { label: 'Occasion', options: ['Daily', 'Party', 'Wedding', 'Work', 'Beach'], icon: 'fa-calendar' } } },
    jackets: { name: 'Jackets/Coats', specs: { brand: { label: 'Brand', options: ['Zara', 'H&M', 'Uniqlo', 'North Face', 'Columbia'], icon: 'fa-tshirt' }, sizes: { label: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], icon: 'fa-ruler' }, color: { label: 'Color', options: ['Black', 'Gray', 'Navy', 'Brown', 'Beige', 'Olive'], icon: 'fa-palette' }, gender: { label: 'Gender', options: ['Men', 'Women', 'Unisex'], icon: 'fa-venus-mars' }, material: { label: 'Material', options: ['Leather', 'Denim', 'Wool', 'Polyester', 'Cotton', 'Fleece'], icon: 'fa-layer-group' }, style: { label: 'Style', options: ['Bomber', 'Parka', 'Blazer', 'Windbreaker', 'Denim Jacket'], icon: 'fa-tshirt' } } }
  },
  beauty: {
    skincare: { name: 'Skincare', specs: { brand: { label: 'Brand', options: ['CeraVe', 'Neutrogena', 'The Ordinary', 'La Roche-Posay', 'Simple', 'Olay'], icon: 'fa-pump-soap' }, skin_type: { label: 'Skin Type', options: ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'], icon: 'fa-hand-sparkles' }, volume_ml: { label: 'Volume', options: ['30ml', '50ml', '100ml', '150ml', '200ml'], icon: 'fa-flask' }, ingredients: { label: 'Ingredients', options: ['Vitamin C', 'Retinol', 'Hyaluronic Acid', 'Niacinamide', 'AHA/BHA', 'Squalane'], icon: 'fa-flask' } } },
    makeup: { name: 'Makeup', specs: { brand: { label: 'Brand', options: ['Maybelline', 'L\'Oréal', 'MAC', 'Revlon', 'Charlotte Tilbury'], icon: 'fa-magic' }, type: { label: 'Type', options: ['Foundation', 'Lipstick', 'Mascara', 'Eyeliner', 'Blush', 'Concealer'], icon: 'fa-lips' }, shade: { label: 'Shade', options: ['Fair', 'Light', 'Medium', 'Tan', 'Deep', 'Dark'], icon: 'fa-palette' } } },
    haircare: { name: 'Hair Products', specs: { brand: { label: 'Brand', options: ['Pantene', 'Head & Shoulders', 'L\'Oréal', 'Tresemme', 'Schwarzkopf'], icon: 'fa-pump-soap' }, hair_type: { label: 'Hair Type', options: ['Normal', 'Oily', 'Dry', 'Color-treated', 'Curly', 'Straight'], icon: 'fa-wave-square' }, volume_ml: { label: 'Volume', options: ['100ml', '200ml', '250ml', '300ml', '400ml', '500ml'], icon: 'fa-flask' }, type: { label: 'Type', options: ['Shampoo', 'Conditioner', 'Hair Mask', 'Hair Oil', 'Serum'], icon: 'fa-bottle' } } },
    perfumes: { name: 'Perfumes', specs: { brand: { label: 'Brand', options: ['Chanel', 'Dior', 'Gucci', 'Versace', 'Calvin Klein', 'Davidoff'], icon: 'fa-spray-can' }, gender: { label: 'Gender', options: ['Men', 'Women', 'Unisex'], icon: 'fa-venus-mars' }, volume_ml: { label: 'Volume', options: ['30ml', '50ml', '75ml', '100ml', '150ml'], icon: 'fa-flask' }, scent_type: { label: 'Scent Type', options: ['Floral', 'Woody', 'Fresh', 'Spicy', 'Fruity', 'Oriental'], icon: 'fa-wind' } } }
  },
  furniture: {
    sofas: { name: 'Sofas/Chairs', specs: { material: { label: 'Material', options: ['Leather', 'Fabric', 'Velvet', 'Microfiber', 'Suede'], icon: 'fa-couch' }, color: { label: 'Color', options: ['Gray', 'Beige', 'Brown', 'Black', 'White', 'Navy', 'Green'], icon: 'fa-palette' }, seating: { label: 'Seating', options: ['1 Seater', '2 Seater', '3 Seater', '4 Seater', 'L-Shape', 'U-Shape'], icon: 'fa-users' }, brand: { label: 'Brand', options: ['IKEA', 'Ashley', 'Wayfair', 'West Elm', 'Pottery Barn'], icon: 'fa-couch' } } },
    beds: { name: 'Beds', specs: { size: { label: 'Size', options: ['Single', 'Double', 'Queen', 'King', 'Super King'], icon: 'fa-bed' }, material: { label: 'Material', options: ['Wood', 'Metal', 'Upholstered', 'Leather', 'MDF'], icon: 'fa-tree' }, color: { label: 'Color', options: ['White', 'Brown', 'Black', 'Gray', 'Oak', 'Walnut'], icon: 'fa-palette' }, brand: { label: 'Brand', options: ['IKEA', 'Ashley', 'Wayfair', 'Sleep Number'], icon: 'fa-bed' } } },
    tables: { name: 'Tables/Desks', specs: { material: { label: 'Material', options: ['Wood', 'Glass', 'Metal', 'MDF', 'Marble'], icon: 'fa-table' }, color: { label: 'Color', options: ['White', 'Black', 'Brown', 'Gray', 'Oak'], icon: 'fa-palette' }, dimensions: { label: 'Dimensions', options: ['Small', 'Medium', 'Large', 'XL'], icon: 'fa-ruler-combined' }, brand: { label: 'Brand', options: ['IKEA', 'Wayfair', 'Amazon Basics'], icon: 'fa-table' } } },
    storage: { name: 'Wardrobes/Shelves', specs: { material: { label: 'Material', options: ['Wood', 'MDF', 'Metal', 'Glass'], icon: 'fa-archive' }, color: { label: 'Color', options: ['White', 'Brown', 'Black', 'Gray', 'Oak'], icon: 'fa-palette' }, doors: { label: 'Doors', options: ['1 Door', '2 Door', '3 Door', '4 Door', 'Sliding'], icon: 'fa-door-open' }, brand: { label: 'Brand', options: ['IKEA', 'Wayfair', 'ClosetMaid'], icon: 'fa-archive' } } }
  },
  food: {
    fresh: { name: 'Fresh Produce', specs: { weight_kg: { label: 'Weight', options: ['0.5kg', '1kg', '2kg', '5kg', '10kg'], icon: 'fa-weight' }, unit: { label: 'Unit', options: ['per kg', 'per piece', 'per bunch', 'per pack'], icon: 'fa-balance-scale' }, organic: { label: 'Organic', options: ['Organic', 'Conventional'], icon: 'fa-leaf' }, origin: { label: 'Origin', options: ['Local', 'Imported', 'Kenyan', 'Tanzanian', 'South African'], icon: 'fa-globe-africa' } } },
    packaged: { name: 'Packaged Food', specs: { brand: { label: 'Brand', options: ['Nestlé', 'Unilever', 'Kellogg\'s', 'Heinz', 'Cadbury'], icon: 'fa-box' }, weight_g: { label: 'Weight', options: ['50g', '100g', '200g', '250g', '500g', '1kg'], icon: 'fa-weight' }, dietary: { label: 'Dietary', options: ['Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Sugar-Free', 'Organic'], icon: 'fa-utensils' }, expiry_date: { label: 'Shelf Life', options: ['3 Months', '6 Months', '1 Year', '2 Years'], icon: 'fa-calendar' } } },
    beverages: { name: 'Beverages', specs: { brand: { label: 'Brand', options: ['Coca-Cola', 'Pepsi', 'Red Bull', 'Monster', 'Fanta'], icon: 'fa-glass-cheers' }, volume_ml: { label: 'Volume', options: ['250ml', '330ml', '500ml', '1L', '1.5L', '2L'], icon: 'fa-wine-bottle' }, type: { label: 'Type', options: ['Soft Drink', 'Energy Drink', 'Juice', 'Water', 'Coffee', 'Tea'], icon: 'fa-mug-hot' }, flavor: { label: 'Flavor', options: ['Original', 'Cola', 'Orange', 'Lemon', 'Grape', 'Mixed Berry'], icon: 'fa-ice-cream' }, sugar_free: { label: 'Sugar', options: ['Regular', 'Sugar-Free', 'Diet', 'Zero'], icon: 'fa-tint' } } }
  },
  sports: {
    equipment: { name: 'Equipment', specs: { brand: { label: 'Brand', options: ['Nike', 'Adidas', 'Under Armour', 'Puma', 'Reebok'], icon: 'fa-dumbbell' }, color: { label: 'Color', options: ['Black', 'White', 'Blue', 'Red', 'Green', 'Gray'], icon: 'fa-palette' }, material: { label: 'Material', options: ['Steel', 'Rubber', 'Plastic', 'Carbon Fiber', 'Aluminum'], icon: 'fa-layer-group' }, type: { label: 'Type', options: ['Dumbbells', 'Kettlebells', 'Resistance Bands', 'Barbells', 'Plates'], icon: 'fa-dumbbell' } } },
    supplements: { name: 'Supplements', specs: { brand: { label: 'Brand', options: ['Optimum Nutrition', 'BSN', 'MuscleTech', 'MyProtein', 'Cellucor'], icon: 'fa-capsules' }, flavor: { label: 'Flavor', options: ['Chocolate', 'Vanilla', 'Strawberry', 'Banana', 'Unflavored', 'Cookies & Cream'], icon: 'fa-ice-cream' }, type: { label: 'Type', options: ['Whey Protein', 'Creatine', 'BCAA', 'Pre-Workout', 'Mass Gainer', 'Casein'], icon: 'fa-bolt' }, servings: { label: 'Servings', options: ['30 servings', '60 servings', '90 servings', '120 servings'], icon: 'fa-pills' } } }
  },
  toys: {
    toys: { name: 'Toys', specs: { age_range: { label: 'Age', options: ['0-2 years', '3-5 years', '6-8 years', '9-12 years', '13+ years'], icon: 'fa-baby' }, brand: { label: 'Brand', options: ['LEGO', 'Mattel', 'Hasbro', 'Playmobil', 'Bandai'], icon: 'fa-puzzle-piece' }, material: { label: 'Material', options: ['Plastic', 'Wood', 'Fabric', 'Metal', 'Rubber'], icon: 'fa-shapes' }, safety_certified: { label: 'Safety', options: ['ASTM Certified', 'EN71', 'ISO Certified', 'BPA Free'], icon: 'fa-shield-alt' } } },
    baby: { name: 'Baby Products', specs: { age_range: { label: 'Age', options: ['Newborn', '0-3 months', '3-6 months', '6-12 months', '1-2 years', '2-3 years'], icon: 'fa-baby' }, brand: { label: 'Brand', options: ['Pampers', 'Huggies', 'Johnson\'s', 'Gerber', 'Burt\'s Bees'], icon: 'fa-baby-carriage' }, size: { label: 'Size', options: ['Newborn', 'Small', 'Medium', 'Large', 'XL', 'XXL'], icon: 'fa-ruler' }, material: { label: 'Material', options: ['Cotton', 'Bamboo', 'Silicone', 'Plastic'], icon: 'fa-layer-group' } } }
  },
  automotive: {
    parts: { name: 'Car Parts', specs: { brand: { label: 'Brand', options: ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Hyundai', 'Generic'], icon: 'fa-car' }, compatibility: { label: 'Car Model', options: ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Hyundai', 'Kia', 'VW', 'Ford'], icon: 'fa-car-side' }, condition: { label: 'Condition', options: ['New', 'Used', 'Refurbished'], icon: 'fa-check-circle' }, material: { label: 'Material', options: ['OEM', 'Aftermarket', 'Genuine'], icon: 'fa-cogs' } } },
    accessories: { name: 'Car Accessories', specs: { brand: { label: 'Brand', options: ['Baseus', 'Anker', 'Xiaomi', 'Samsung'], icon: 'fa-car' }, compatibility: { label: 'Type', options: ['Phone Mount', 'Charger', 'Dash Cam', 'Seat Cover', 'Floor Mat', 'Steering Cover'], icon: 'fa-box' }, color: { label: 'Color', options: ['Black', 'Gray', 'Beige', 'Brown'], icon: 'fa-palette' }, material: { label: 'Material', options: ['Leather', 'Silicone', 'Plastic', 'Metal'], icon: 'fa-layer-group' } } }
  }
};

export const universalFilters = ["brand", "condition"];

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  tags?: string[];
  totalSpent?: number;
  orderCount?: number;
  segment?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Order {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  products: { productId: string; name: string; quantity: number; price: number }[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Message {
  id: string;
  tenantId: string;
  conversationId: string;
  sender: "customer" | "business";
  text: string;
  status: "sent" | "delivered" | "read";
  createdAt: any;
}

export interface Conversation {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  lastMessage?: string;
  lastMessageTime?: any;
  unreadCount: number;
  status: "active" | "archived";
  createdAt: any;
  updatedAt: any;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  products: string[]; // product IDs they supply
  paymentTerms?: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface ShippingMethod {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  cost: number;
  estimatedDays: number;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Shipment {
  id: string;
  tenantId: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  shippingAddress?: string;
  shippingMethod: string;
  trackingNumber?: string;
  status: "pending" | "shipped" | "delivered" | "returned";
  shippedAt?: any;
  deliveredAt?: any;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface InventoryLog {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  reason: string;
  reference?: string; // order ID, supplier ID, etc.
  createdAt: any;
}

export interface Review {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  orderId: string;
  productId?: string;
  productName?: string;
  rating: number; // 1-5
  comment?: string;
  response?: string;
  responseAt?: any;
  isPublic: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: "broadcast" | "promotional" | "followup" | "automated" | "promo" | "sequence";
  segment: "all" | "vip" | "frequent" | "new" | "inactive" | "custom";
  message: string;
  scheduledAt?: any;
  sentAt?: any;
  status: "draft" | "scheduled" | "sending" | "running" | "completed" | "cancelled" | "paused";
  recipientCount: number;
  deliveredCount: number;
  responseCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface Expense {
  id: string;
  tenantId: string;
  category: "supplies" | "shipping" | "marketing" | "utilities" | "other";
  description: string;
  amount: number;
  date: any;
  reference?: string;
  createdAt: any;
}

export interface ProductCategory {
  id: string;
  tenantId: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  isDefault: boolean; // true for default categories
  createdAt: any;
  updatedAt: any;
}

const getTenantId = (user: User): string => `tenant_${user.uid}`;

export const tenantService = {
  async createTenant(user: User, businessName: string): Promise<Tenant> {
    const tenantId = getTenantId(user);
    const tenantData: Tenant = {
      id: tenantId,
      userId: user.uid,
      name: user.displayName || user.email?.split("@")[0] || "User",
      email: user.email || "",
      businessName,
      plan: "free",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(doc(db, "tenants", tenantId), tenantData);
    return tenantData;
  },

  async getTenant(user: User): Promise<Tenant | null> {
    const tenantId = getTenantId(user);
    const snap = await getDoc(doc(db, "tenants", tenantId));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Tenant : null;
  },

  async updateTenant(user: User, data: Partial<Tenant>): Promise<void> {
    const tenantId = getTenantId(user);
    await setDoc(doc(db, "tenants", tenantId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },
};

export const productService = {
  async createProduct(user: User, product: Omit<Product, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Product> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "products"));
    
    const cleanProduct = Object.fromEntries(
      Object.entries(product).filter(([_, value]) => value !== undefined && value !== "" && value !== null)
    );
    
    const productData = {
      ...cleanProduct,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as Product;
    
    await setDoc(docRef, productData);
    return productData;
  },

  async getProducts(user: User): Promise<Product[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "products"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
  },

  async updateProduct(user: User, productId: string, data: Partial<Product>): Promise<void> {
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined && value !== "" && value !== null)
    );
    await setDoc(doc(db, "products", productId), { ...cleanData, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteProduct(user: User, productId: string): Promise<void> {
    await deleteDoc(doc(db, "products", productId));
  },
};

export const customerService = {
  async createCustomer(user: User, customer: Omit<Customer, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Customer> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "customers"));
    const customerData: Customer = {
      ...customer,
      id: docRef.id,
      tenantId,
      totalSpent: 0,
      orderCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(docRef, customerData);
    return customerData;
  },

  async getCustomers(user: User): Promise<Customer[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "customers"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[];
  },

  async updateCustomer(user: User, customerId: string, data: Partial<Customer>): Promise<void> {
    await setDoc(doc(db, "customers", customerId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteCustomer(user: User, customerId: string): Promise<void> {
    await deleteDoc(doc(db, "customers", customerId));
  },
};

export const orderService = {
  async createOrder(user: User, order: Omit<Order, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Order> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "orders"));
    
    const cleanOrder = Object.fromEntries(
      Object.entries(order).filter(([_, value]) => value !== undefined && value !== "" && value !== null)
    );
    
    const orderData = {
      ...cleanOrder,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as Order;
    
    await setDoc(docRef, orderData);
    return orderData;
  },

  async getOrders(user: User, status?: string): Promise<Order[]> {
    const tenantId = getTenantId(user);
    let q;
    if (status && status !== "all") {
      q = query(collection(db, "orders"), where("tenantId", "==", tenantId), where("status", "==", status), orderBy("createdAt", "desc"));
    } else {
      q = query(collection(db, "orders"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    }
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
  },

  async getOrderById(user: User, orderId: string): Promise<Order | null> {
    const snap = await getDoc(doc(db, "orders", orderId));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Order : null;
  },

  async updateOrder(user: User, orderId: string, data: Partial<Order>): Promise<void> {
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined && value !== "" && value !== null)
    );
    await setDoc(doc(db, "orders", orderId), { ...cleanData, updatedAt: serverTimestamp() }, { merge: true });
  },

  async getOrderCounts(user: User): Promise<{all: number, pending: number, processing: number, completed: number, cancelled: number}> {
    const tenantId = getTenantId(user);
    const allQ = query(collection(db, "orders"), where("tenantId", "==", tenantId));
    const pendingQ = query(collection(db, "orders"), where("tenantId", "==", tenantId), where("status", "==", "pending"));
    const processingQ = query(collection(db, "orders"), where("tenantId", "==", tenantId), where("status", "==", "processing"));
    const completedQ = query(collection(db, "orders"), where("tenantId", "==", tenantId), where("status", "==", "delivered"));
    const cancelledQ = query(collection(db, "orders"), where("tenantId", "==", tenantId), where("status", "==", "cancelled"));
    
    const [allSnap, pendingSnap, processingSnap, completedSnap, cancelledSnap] = await Promise.all([
      getDocs(allQ),
      getDocs(pendingQ),
      getDocs(processingQ),
      getDocs(completedQ),
      getDocs(cancelledQ)
    ]);
    
    return {
      all: allSnap.size,
      pending: pendingSnap.size,
      processing: processingSnap.size,
      completed: completedSnap.size,
      cancelled: cancelledSnap.size
    };
  },

  async getOrdersByCustomerId(user: User, customerId: string): Promise<Order[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "orders"), where("tenantId", "==", tenantId), where("customerId", "==", customerId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
  }
};

export const messageService = {
  async createConversation(user: User, customerId: string, customerName: string, customerPhone: string): Promise<Conversation> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "conversations"));
    const conversationData: Conversation = {
      id: docRef.id,
      tenantId,
      customerId,
      customerName,
      customerPhone,
      unreadCount: 0,
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, conversationData);
    return conversationData;
  },

  async getConversations(user: User): Promise<Conversation[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "conversations"), where("tenantId", "==", tenantId), where("status", "==", "active"), orderBy("lastMessageTime", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Conversation[];
  },

  async updateConversation(user: User, conversationId: string, data: Partial<Conversation>): Promise<void> {
    await setDoc(doc(db, "conversations", conversationId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async getOrCreateConversation(user: User, customerId: string, customerName: string, customerPhone: string): Promise<Conversation> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "conversations"), where("tenantId", "==", tenantId), where("customerId", "==", customerId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as Conversation;
    }
    return await messageService.createConversation(user, customerId, customerName, customerPhone);
  },

  async sendMessage(user: User, conversationId: string, text: string, sender: "customer" | "business"): Promise<Message> {
    const tenantId = getTenantId(user);
    const docRef = await addDoc(collection(db, "messages"), {
      tenantId,
      conversationId,
      sender,
      text,
      status: "sent",
      createdAt: serverTimestamp(),
    });
    
    await messageService.updateConversation(user, conversationId, {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      unreadCount: sender === "customer" ? 1 : 0,
    });

    return {
      id: docRef.id,
      tenantId,
      conversationId,
      sender,
      text,
      status: "sent",
      createdAt: serverTimestamp(),
    };
  },

  async getMessages(user: User, conversationId: string): Promise<Message[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "messages"), where("tenantId", "==", tenantId), where("conversationId", "==", conversationId), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
  },

  async markAsRead(user: User, conversationId: string): Promise<void> {
    await messageService.updateConversation(user, conversationId, { unreadCount: 0 });
  },

  async archiveConversation(user: User, conversationId: string): Promise<void> {
    await messageService.updateConversation(user, conversationId, { status: "archived" });
  },
};

export interface AITemplate {
  id: string;
  tenantId: string;
  name: string;
  trigger: string;
  category: string;
  response: string;
  usage: number;
  success: number;
  createdAt: any;
  updatedAt: any;
}

export interface AutomationRule {
  id: string;
  tenantId: string;
  name: string;
  trigger: string;
  action: string;
  type: "Auto" | "Smart" | "Trigger";
  status: "active" | "paused";
  createdAt: any;
  updatedAt: any;
}

export interface AISettings {
  id: string;
  tenantId: string;
  autoReply: boolean;
  learnFromConversations: boolean;
  escalateToHuman: boolean;
  responseTone: string;
  maxResponseLength: number;
  updatedAt: any;
}

export const aiService = {
  async createTemplate(user: User, template: Omit<AITemplate, "id" | "tenantId" | "createdAt" | "updatedAt" | "usage" | "success">): Promise<AITemplate> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "ai_templates"));
    const templateData: AITemplate = {
      ...template,
      id: docRef.id,
      tenantId,
      usage: 0,
      success: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, templateData);
    return templateData;
  },

  async getTemplates(user: User): Promise<AITemplate[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "ai_templates"), where("tenantId", "==", tenantId), orderBy("usage", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AITemplate[];
  },

  async updateTemplate(user: User, templateId: string, data: Partial<AITemplate>): Promise<void> {
    await setDoc(doc(db, "ai_templates", templateId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteTemplate(user: User, templateId: string): Promise<void> {
    await deleteDoc(doc(db, "ai_templates", templateId));
  },

  async createAutomationRule(user: User, rule: Omit<AutomationRule, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<AutomationRule> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "automation_rules"));
    const ruleData: AutomationRule = {
      ...rule,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, ruleData);
    return ruleData;
  },

  async getAutomationRules(user: User): Promise<AutomationRule[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "automation_rules"), where("tenantId", "==", tenantId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AutomationRule[];
  },

  async updateAutomationRule(user: User, ruleId: string, data: Partial<AutomationRule>): Promise<void> {
    await setDoc(doc(db, "automation_rules", ruleId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteAutomationRule(user: User, ruleId: string): Promise<void> {
    await deleteDoc(doc(db, "automation_rules", ruleId));
  },

  async getOrCreateSettings(user: User): Promise<AISettings> {
    const tenantId = getTenantId(user);
    const snap = await getDoc(doc(db, "ai_settings", tenantId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as AISettings;
    }
    const defaultSettings: AISettings = {
      id: tenantId,
      tenantId,
      autoReply: true,
      learnFromConversations: true,
      escalateToHuman: false,
      responseTone: "Friendly & Professional",
      maxResponseLength: 150,
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, "ai_settings", tenantId), defaultSettings);
    return defaultSettings;
  },

  async updateSettings(user: User, data: Partial<AISettings>): Promise<void> {
    const tenantId = getTenantId(user);
    await setDoc(doc(db, "ai_settings", tenantId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },
};

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: number;
  conversionRate: number;
  aiResponseRate: number;
  topProducts: { productId: string; name: string; sold: number; revenue: number; price: number }[];
  categoryBreakdown: { category: string; value: number; count: number }[];
  dailyStats: { date: string; orders: number; revenue: number; customers: number; conversion: number; ai: number }[];
}

export interface TenantSettings {
  id: string;
  tenantId: string;
  businessName: string;
  businessDescription: string;
  businessCategory: string;
  businessAddress: string;
  businessRegNumber: string;
  currency: string;
  taxRate: number;
  whatsAppNumber: string;
  welcomeMessage: string;
  autoAcceptOrders: boolean;
  inventoryTracking: boolean;
  autoReply: boolean;
  smartOrderDetection: boolean;
  orderConfirmations: boolean;
  whatsappInstanceId?: string;
  whatsappConnectionStatus?: string;
  notifications: {
    newOrders: { push: boolean; email: boolean; sms: boolean; wa: boolean };
    lowStock: { push: boolean; email: boolean; sms: boolean; wa: boolean };
    newMessages: { push: boolean; email: boolean; sms: boolean; wa: boolean };
    dailySummary: { push: boolean; email: boolean; sms: boolean; wa: boolean };
    securityAlerts: { push: boolean; email: boolean; sms: boolean; wa: boolean };
  };
  updatedAt: any;
}

export const analyticsService = {
  async getAnalyticsData(user: User, period: string = "week"): Promise<AnalyticsData> {
    const tenantId = getTenantId(user);
    
    const [ordersSnap, productsSnap, customersSnap, conversationsSnap] = await Promise.all([
      getDocs(query(collection(db, "orders"), where("tenantId", "==", tenantId))),
      getDocs(query(collection(db, "products"), where("tenantId", "==", tenantId))),
      getDocs(query(collection(db, "customers"), where("tenantId", "==", tenantId))),
      getDocs(query(collection(db, "conversations"), where("tenantId", "==", tenantId))),
    ]);

    const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[];
    const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
    const customers = customersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Customer[];

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = orders.length;
    const totalCustomers = customers.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;
    
    const productSales: Record<string, { name: string; sold: number; revenue: number; price: number }> = {};
    orders.forEach(order => {
      order.products?.forEach(p => {
        if (!productSales[p.productId]) {
          productSales[p.productId] = { name: p.name, sold: 0, revenue: 0, price: p.price };
        }
        productSales[p.productId].sold += p.quantity;
        productSales[p.productId].revenue += p.price * p.quantity;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ productId: id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const categoryBreakdown: Record<string, { count: number; value: number }> = {};
    products.forEach(p => {
      const cat = p.category || "Uncategorized";
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { count: 0, value: 0 };
      }
      categoryBreakdown[cat].count += 1;
      categoryBreakdown[cat].value += p.price;
    });

    const categoryResult = Object.entries(categoryBreakdown)
      .map(([category, data]) => ({ category, ...data, value: Math.round((data.value / products.length) * 100) || 0 }))
      .sort((a, b) => b.value - a.value);

    const dailyStats = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const dayOrders = orders.filter(o => {
        const oDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date();
        return oDate.toDateString() === date.toDateString();
      });
      return {
        date: dateStr,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        customers: dayOrders.length,
        conversion: Math.round((dayOrders.length / (dayOrders.length || 1)) * 100),
        ai: 94,
      };
    });

    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      avgOrderValue,
      conversionRate,
      aiResponseRate: 94.2,
      topProducts,
      categoryBreakdown: categoryResult,
      dailyStats,
    };
  },
};

export const settingsService = {
  async getSettings(user: User): Promise<TenantSettings> {
    const tenantId = getTenantId(user);
    const snap = await getDoc(doc(db, "settings", tenantId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as TenantSettings;
    }
    const defaultSettings: TenantSettings = {
      id: tenantId,
      tenantId,
      businessName: "Chap Chap Store",
      businessDescription: "Premium quality products delivered fast via WhatsApp.",
      businessCategory: "Retail & E-commerce",
      businessAddress: "123 Kimathi Street, Nairobi CBD, Kenya",
      businessRegNumber: "BN/2024/123456",
      currency: "KES (Kenyan Shilling)",
      taxRate: 16,
      whatsAppNumber: "+254 712 345 678",
      welcomeMessage: `Hello! 👋 Welcome to {{business_name}}. 

I'm your AI assistant. I can help you:
• Browse our products
• Place an order
• Track your delivery
• Answer your questions

How can I assist you today?`,
      autoAcceptOrders: true,
      inventoryTracking: true,
      autoReply: true,
      smartOrderDetection: true,
      orderConfirmations: true,
      whatsappInstanceId: "",
      whatsappConnectionStatus: "disconnected",
      notifications: {
        newOrders: { push: true, email: true, sms: false, wa: true },
        lowStock: { push: true, email: true, sms: false, wa: false },
        newMessages: { push: true, email: false, sms: false, wa: true },
        dailySummary: { push: false, email: true, sms: false, wa: false },
        securityAlerts: { push: true, email: true, sms: true, wa: false },
      },
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, "settings", tenantId), defaultSettings);
    return defaultSettings;
  },

  async updateSettings(user: User, data: Partial<TenantSettings>): Promise<void> {
    const tenantId = getTenantId(user);
    await setDoc(doc(db, "settings", tenantId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },
};

export const supplierService = {
  async createSupplier(user: User, supplier: Omit<Supplier, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Supplier> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "suppliers"));
    const supplierData: Supplier = {
      ...supplier,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, supplierData);
    return supplierData;
  },

  async getSuppliers(user: User): Promise<Supplier[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "suppliers"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Supplier[];
  },

  async updateSupplier(user: User, supplierId: string, data: Partial<Supplier>): Promise<void> {
    await setDoc(doc(db, "suppliers", supplierId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteSupplier(user: User, supplierId: string): Promise<void> {
    await deleteDoc(doc(db, "suppliers", supplierId));
  },
};

export const shippingService = {
  async createShippingMethod(user: User, method: Omit<ShippingMethod, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<ShippingMethod> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "shippingMethods"));
    const methodData: ShippingMethod = {
      ...method,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, methodData);
    return methodData;
  },

  async getShippingMethods(user: User): Promise<ShippingMethod[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "shippingMethods"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ShippingMethod[];
  },

  async updateShippingMethod(user: User, methodId: string, data: Partial<ShippingMethod>): Promise<void> {
    await setDoc(doc(db, "shippingMethods", methodId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteShippingMethod(user: User, methodId: string): Promise<void> {
    await deleteDoc(doc(db, "shippingMethods", methodId));
  },

  async createShipment(user: User, shipment: Omit<Shipment, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Shipment> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "shipments"));
    const shipmentData: Shipment = {
      ...shipment,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, shipmentData);
    return shipmentData;
  },

  async getShipments(user: User): Promise<Shipment[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "shipments"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Shipment[];
  },

  async updateShipment(user: User, shipmentId: string, data: Partial<Shipment>): Promise<void> {
    await setDoc(doc(db, "shipments", shipmentId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },
};

export const inventoryService = {
  async logInventoryChange(user: User, log: Omit<InventoryLog, "id" | "tenantId" | "createdAt">): Promise<InventoryLog> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "inventoryLogs"));
    const logData: InventoryLog = {
      ...log,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
    };
    await setDoc(docRef, logData);
    return logData;
  },

  async getInventoryLogs(user: User, productId?: string): Promise<InventoryLog[]> {
    const tenantId = getTenantId(user);
    let q;
    if (productId) {
      q = query(collection(db, "inventoryLogs"), where("tenantId", "==", tenantId), where("productId", "==", productId), orderBy("createdAt", "desc"));
    } else {
      q = query(collection(db, "inventoryLogs"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    }
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InventoryLog[];
  },
};

export const reviewService = {
  async createReview(user: User, review: Omit<Review, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Review> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "reviews"));
    const reviewData: Review = {
      ...review,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, reviewData);
    return reviewData;
  },

  async getReviews(user: User): Promise<Review[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "reviews"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
  },

  async updateReview(user: User, reviewId: string, data: Partial<Review>): Promise<void> {
    await setDoc(doc(db, "reviews", reviewId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteReview(user: User, reviewId: string): Promise<void> {
    await deleteDoc(doc(db, "reviews", reviewId));
  },
};

export const campaignService = {
  async createCampaign(user: User, campaign: Omit<Campaign, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Campaign> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "campaigns"));
    const campaignData: Campaign = {
      ...campaign,
      id: docRef.id,
      tenantId,
      recipientCount: 0,
      deliveredCount: 0,
      responseCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, campaignData);
    return campaignData;
  },

  async getCampaigns(user: User): Promise<Campaign[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "campaigns"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Campaign[];
  },

  async updateCampaign(user: User, campaignId: string, data: Partial<Campaign>): Promise<void> {
    await setDoc(doc(db, "campaigns", campaignId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteCampaign(user: User, campaignId: string): Promise<void> {
    await deleteDoc(doc(db, "campaigns", campaignId));
  },
};

export const expenseService = {
  async createExpense(user: User, expense: Omit<Expense, "id" | "tenantId" | "createdAt">): Promise<Expense> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "expenses"));
    const expenseData: Expense = {
      ...expense,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
    };
    await setDoc(docRef, expenseData);
    return expenseData;
  },

  async getExpenses(user: User, startDate?: Date, endDate?: Date): Promise<Expense[]> {
    const tenantId = getTenantId(user);
    let q = query(collection(db, "expenses"), where("tenantId", "==", tenantId), orderBy("date", "desc"));
    
    if (startDate && endDate) {
      // Note: Firestore doesn't support date range queries with orderBy on different fields easily
      // This is a simplified version
    }
    
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
  },

  async updateExpense(user: User, expenseId: string, data: Partial<Expense>): Promise<void> {
    await setDoc(doc(db, "expenses", expenseId), data, { merge: true });
  },

  async deleteExpense(user: User, expenseId: string): Promise<void> {
    await deleteDoc(doc(db, "expenses", expenseId));
  },
};

export const categoryService = {
  async createCategory(user: User, category: Omit<ProductCategory, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<ProductCategory> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "productCategories"));
    const categoryData: ProductCategory = {
      ...category,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, categoryData);
    return categoryData;
  },

  async getCategories(user: User): Promise<ProductCategory[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "productCategories"), where("tenantId", "==", tenantId), orderBy("name", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProductCategory[];
  },

  async updateCategory(user: User, categoryId: string, data: Partial<ProductCategory>): Promise<void> {
    await setDoc(doc(db, "productCategories", categoryId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteCategory(user: User, categoryId: string): Promise<void> {
    await deleteDoc(doc(db, "productCategories", categoryId));
  },
};

// Default categories that will be used if user hasn't created custom ones
export const defaultProductCategories = [
  { id: "footwear", name: "Footwear", icon: "👟", color: "#ec4899", description: "Shoes, Sandals, Boots" },
  { id: "clothing", name: "Clothing", icon: "👕", color: "#3b82f6", description: "T-shirts, Dresses, Jackets" },
  { id: "electronics", name: "Electronics", icon: "📱", color: "#8b5cf6", description: "Phones, Laptops, Gadgets" },
  { id: "furniture", name: "Furniture", icon: "🛋️", color: "#f59e0b", description: "Tables, Chairs, Storage" },
  { id: "beauty", name: "Beauty & Care", icon: "💄", color: "#ec4899", description: "Skincare, Makeup, Personal" },
  { id: "other", name: "Other", icon: "📦", color: "#64748b", description: "General products" },
];
