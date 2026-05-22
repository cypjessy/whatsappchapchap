// ─── Types ───────────────────────────────────────────────────────────────────

export interface SpecField {
  label: string;
  options: string[];
  icon: string;
  multiple?: boolean;
}

export interface Subcategory {
  name: string;
  icon: string;
  specs: Record<string, SpecField>;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  subcategories: Record<string, Subcategory>;
}

// ─── FULL DATA ─────────────────────────────────────────────────────────────

const categoryData: Record<string, Category> = {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. ELECTRONICS & MOBILE
  // ═══════════════════════════════════════════════════════════════════════════
  electronics: {
    id: "electronics",
    name: "Electronics & Mobile",
    icon: "📱",
    description: "Phones, laptops, TVs, audio, and tech accessories",
    subcategories: {
      smartphones: {
        name: "Smartphones",
        icon: "fa-mobile-alt",
        specs: {
          brand: { label: "Brand", options: ["Samsung", "Apple", "Xiaomi", "Oppo", "Realme", "Infinix", "Tecno", "Itel", "Nokia", "Huawei"], icon: "fa-tag" },
          storage: { label: "Storage", options: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"], icon: "fa-hdd" },
          ram: { label: "RAM", options: ["2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB"], icon: "fa-memory" },
          condition: { label: "Condition", options: ["Brand New", "Open Box", "Refurbished", "Used - Like New"], icon: "fa-star" },
          network: { label: "Network", options: ["4G", "5G", "4G & 5G"], icon: "fa-signal" },
          screen_size: { label: "Screen Size", options: ['5.5"', '6.1"', '6.3"', '6.5"', '6.7"', '6.9"'], icon: "fa-expand" },
          color: { label: "Color", options: ["Black", "White", "Blue", "Red", "Gold", "Silver", "Green", "Purple"], icon: "fa-palette" },
          battery: { label: "Battery", options: ["3000-4000mAh", "4000-5000mAh", "5000mAh+"], icon: "fa-battery-full" },
        }
      },
      laptops_computers: {
        name: "Laptops & Computers",
        icon: "fa-laptop",
        specs: {
          brand: { label: "Brand", options: ["HP", "Dell", "Lenovo", "Apple", "Asus", "Acer", "Microsoft", "Huawei", "Toshiba"], icon: "fa-tag" },
          processor: { label: "Processor", options: ["Intel Core i3", "Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7", "Apple M1", "Apple M2", "Apple M3"], icon: "fa-microchip" },
          ram: { label: "RAM", options: ["4GB", "8GB", "16GB", "32GB", "64GB"], icon: "fa-memory" },
          storage_type: { label: "Storage Type", options: ["SSD", "HDD", "SSD + HDD"], icon: "fa-hdd" },
          storage_size: { label: "Storage Size", options: ["256GB", "512GB", "1TB", "2TB"], icon: "fa-database" },
          screen_size: { label: "Screen", options: ['13"', '14"', '15.6"', '16"', '17"'], icon: "fa-expand" },
          os: { label: "OS", options: ["Windows 11", "Windows 10", "macOS", "Linux", "Chrome OS"], icon: "fa-desktop" },
          condition: { label: "Condition", options: ["Brand New", "Open Box", "Refurbished", "Used"], icon: "fa-star" },
          purpose: { label: "Purpose", options: ["Business", "Gaming", "Student", "Programming", "Design", "General Use"], icon: "fa-briefcase" },
        }
      },
      tvs_audio: {
        name: "TVs & Audio",
        icon: "fa-tv",
        specs: {
          brand: { label: "Brand", options: ["Samsung", "LG", "Sony", "TCL", "Hisense", "Philips", "Skyworth", "Vitron", "Synix"], icon: "fa-tag" },
          screen_size: { label: "Screen Size", options: ['24"', '32"', '43"', '50"', '55"', '65"', '75"', '85"'], icon: "fa-expand" },
          resolution: { label: "Resolution", options: ["HD Ready", "Full HD", "4K Ultra HD", "8K"], icon: "fa-film" },
          type: { label: "TV Type", options: ["LED", "OLED", "QLED", "Smart TV", "Android TV"], icon: "fa-tv" },
          condition: { label: "Condition", options: ["Brand New", "Open Box"], icon: "fa-star" },
          audio_type: { label: "Audio Type", options: ["Soundbar", "Home Theater", "Bluetooth Speaker", "Subwoofer"], icon: "fa-music" },
        }
      },
      accessories: {
        name: "Phone & Laptop Accessories",
        icon: "fa-headphones",
        specs: {
          type: { label: "Accessory Type", options: ["Phone Case", "Screen Protector", "Charger", "Power Bank", "Earphones", "Headphones", "Cable", "Adapter", "Pop Socket", "Phone Stand", "Laptop Bag", "Mouse", "Keyboard", "Webcam", "USB Hub"], icon: "fa-plug" },
          brand: { label: "Brand", options: ["Samsung", "Apple", "Anker", "Oraimo", "Sony", "JBL", "Logitech", "Generic"], icon: "fa-tag" },
          connectivity: { label: "Connectivity", options: ["Wired", "Wireless", "Bluetooth", "USB-C", "Lightning", "Micro USB"], icon: "fa-wifi" },
          color: { label: "Color", options: ["Black", "White", "Blue", "Red", "Transparent"], icon: "fa-palette" },
        }
      },
      cameras: {
        name: "Cameras & Photography",
        icon: "fa-camera",
        specs: {
          brand: { label: "Brand", options: ["Canon", "Nikon", "Sony", "Fujifilm", "GoPro", "DJI"], icon: "fa-tag" },
          type: { label: "Camera Type", options: ["DSLR", "Mirrorless", "Point & Shoot", "Action Camera", "Drone", "Security Camera"], icon: "fa-camera-retro" },
          condition: { label: "Condition", options: ["Brand New", "Used"], icon: "fa-star" },
        }
      },
      gaming: {
        name: "Gaming",
        icon: "fa-gamepad",
        specs: {
          platform: { label: "Platform", options: ["PlayStation 5", "PlayStation 4", "Xbox Series X", "Xbox One", "Nintendo Switch", "PC"], icon: "fa-gamepad" },
          type: { label: "Type", options: ["Console", "Game", "Controller", "Headset", "Keyboard", "Mouse", "Chair"], icon: "fa-puzzle-piece" },
          genre: { label: "Genre", options: ["Action", "Sports", "Racing", "Fighting", "Adventure", "Shooter"], icon: "fa-fist-raised" },
          condition: { label: "Condition", options: ["Brand New", "Used"], icon: "fa-star" },
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. FASHION & CLOTHING
  // ═══════════════════════════════════════════════════════════════════════════
  fashion: {
    id: "fashion",
    name: "Fashion & Clothing",
    icon: "👕",
    description: "Men's, women's, and kids' clothing, shoes, and accessories",
    subcategories: {
      mens_clothing: {
        name: "Men's Clothing",
        icon: "fa-male",
        specs: {
          type: { label: "Type", options: ["T-Shirt", "Shirt", "Polo", "Vest", "Hoodie", "Sweater", "Jacket", "Blazer", "Suit", "Jeans", "Chinos", "Shorts", "Track Pants", "Cargo Pants"], icon: "fa-tshirt" },
          size: { label: "Size", options: ["XS", "S", "M", "L", "XL", "XXL", "3XL"], icon: "fa-ruler" },
          color: { label: "Color", options: ["Black", "White", "Navy", "Grey", "Blue", "Red", "Green", "Beige", "Brown", "Maroon", "Khaki"], icon: "fa-palette" },
          material: { label: "Material", options: ["Cotton", "Polyester", "Linen", "Denim", "Wool", "Silk", "Fleece", "Chiffon"], icon: "fa-layer-group" },
          fit: { label: "Fit", options: ["Slim Fit", "Regular Fit", "Relaxed Fit", "Oversized", "Skinny"], icon: "fa-arrows-alt-h" },
          occasion: { label: "Occasion", options: ["Casual", "Formal", "Business", "Sports", "Party", "Traditional"], icon: "fa-glass-cheers" },
          brand: { label: "Brand", options: ["Nike", "Adidas", "Puma", "Levi's", "Tommy Hilfiger", "Lacoste", "Gucci", "Versace", "Generic"], icon: "fa-tag" },
        }
      },
      womens_clothing: {
        name: "Women's Clothing",
        icon: "fa-female",
        specs: {
          type: { label: "Type", options: ["Dress", "Top", "Blouse", "T-Shirt", "Tank Top", "Skirt", "Jeans", "Leggings", "Trousers", "Shorts", "Jumpsuit", "Romper", "Sweater", "Cardigan", "Jacket", "Coat", "Saree", "Kitenge"], icon: "fa-female" },
          size: { label: "Size", options: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"], icon: "fa-ruler" },
          color: { label: "Color", options: ["Black", "White", "Red", "Blue", "Pink", "Purple", "Green", "Yellow", "Orange", "Nude", "Floral", "Multicolor"], icon: "fa-palette" },
          material: { label: "Material", options: ["Cotton", "Polyester", "Silk", "Chiffon", "Lace", "Denim", "Linen", "Velvet", "Satin"], icon: "fa-layer-group" },
          style: { label: "Style", options: ["Casual", "Formal", "Evening", "Party", "Office", "Bohemian", "Vintage", "Streetwear", "Traditional"], icon: "fa-gem" },
          length: { label: "Length", options: ["Mini", "Midi", "Maxi", "Knee Length", "Ankle Length"], icon: "fa-arrows-alt-v" },
          occasion: { label: "Occasion", options: ["Daily Wear", "Work", "Wedding", "Party", "Church", "Date Night"], icon: "fa-glass-cheers" },
        }
      },
      kids_clothing: {
        name: "Kids' Clothing",
        icon: "fa-child",
        specs: {
          type: { label: "Type", options: ["T-Shirt", "Shirt", "Dress", "Shorts", "Trousers", "Skirt", "Onesie", "School Uniform", "Pyjamas", "Sweater"], icon: "fa-tshirt" },
          age_group: { label: "Age", options: ["0-1 Year", "1-3 Years", "3-5 Years", "5-8 Years", "8-12 Years", "12-16 Years"], icon: "fa-baby" },
          size: { label: "Size", options: ["0-3M", "3-6M", "6-12M", "1-2Y", "2-3Y", "3-4Y", "4-5Y", "6-7Y", "8-9Y", "10-12Y", "13-14Y"], icon: "fa-ruler" },
          gender: { label: "Gender", options: ["Boys", "Girls", "Unisex"], icon: "fa-venus-mars" },
          color: { label: "Color", options: ["Blue", "Pink", "Red", "Yellow", "Green", "White", "Black", "Purple", "Multicolor"], icon: "fa-palette" },
          occasion: { label: "Occasion", options: ["School", "Casual", "Party", "Traditional", "Sports"], icon: "fa-graduation-cap" },
        }
      },
      shoes: {
        name: "Shoes & Footwear",
        icon: "fa-shoe-prints",
        specs: {
          type: { label: "Type", options: ["Sneakers", "Running Shoes", "Formal Shoes", "Boots", "Sandals", "Slippers", "High Heels", "Flats", "Loafers", "Espadrilles"], icon: "fa-shoe-prints" },
          brand: { label: "Brand", options: ["Nike", "Adidas", "Puma", "New Balance", "Converse", "Vans", "Timberland", "Dr. Martens", "Crocs", "Bata", "Sketchers"], icon: "fa-tag" },
          size: { label: "Size (EU)", options: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"], icon: "fa-ruler" },
          gender: { label: "Gender", options: ["Men", "Women", "Kids", "Unisex"], icon: "fa-venus-mars" },
          color: { label: "Color", options: ["Black", "White", "Brown", "Grey", "Blue", "Red", "Beige"], icon: "fa-palette" },
          material: { label: "Material", options: ["Leather", "Canvas", "Mesh", "Synthetic", "Suede", "Rubber"], icon: "fa-layer-group" },
          occasion: { label: "Occasion", options: ["Casual", "Sports", "Formal", "Outdoor", "Beach"], icon: "fa-glass-cheers" },
        }
      },
      bags_wallets: {
        name: "Bags & Wallets",
        icon: "fa-shopping-bag",
        specs: {
          type: { label: "Type", options: ["Handbag", "Tote Bag", "Backpack", "Crossbody", "Clutch", "Shoulder Bag", "Wallet", "Purse", "Laptop Bag", "Travel Bag", "School Bag"], icon: "fa-shopping-bag" },
          brand: { label: "Brand", options: ["Michael Kors", "Coach", "Gucci", "Louis Vuitton", "Generic", "Local Brand"], icon: "fa-tag" },
          material: { label: "Material", options: ["Leather", "PU Leather", "Canvas", "Nylon", "Straw", "Denim"], icon: "fa-layer-group" },
          color: { label: "Color", options: ["Black", "Brown", "Beige", "White", "Red", "Blue", "Pink"], icon: "fa-palette" },
          gender: { label: "Gender", options: ["Women", "Men", "Unisex"], icon: "fa-venus-mars" },
          size: { label: "Size", options: ["Small", "Medium", "Large", "Extra Large"], icon: "fa-expand" },
        }
      },
      jewelry_watches: {
        name: "Jewelry & Watches",
        icon: "fa-gem",
        specs: {
          type: { label: "Type", options: ["Necklace", "Earrings", "Bracelet", "Ring", "Anklet", "Watch", "Pendant", "Chain", "Cufflinks"], icon: "fa-gem" },
          material: { label: "Material", options: ["Gold", "Silver", "Rose Gold", "Platinum", "Stainless Steel", "Brass", "Beads", "Leather"], icon: "fa-layer-group" },
          gender: { label: "Gender", options: ["Women", "Men", "Unisex"], icon: "fa-venus-mars" },
          style: { label: "Style", options: ["Classic", "Trendy", "Bohemian", "Minimalist", "Luxury", "Traditional"], icon: "fa-star" },
          occasion: { label: "Occasion", options: ["Daily", "Wedding", "Party", "Gift", "Formal"], icon: "fa-glass-cheers" },
        }
      },
      traditional_wear: {
        name: "Traditional & African Wear",
        icon: "fa-hat-cowboy",
        specs: {
          type: { label: "Type", options: ["Kitenge", "Kikoy", "Maasai Shuka", "Dashiki", "Ankara", "Kente", "Boubou", "Gomesi", "Kanzu"], icon: "fa-tshirt" },
          gender: { label: "Gender", options: ["Men", "Women", "Unisex"], icon: "fa-venus-mars" },
          occasion: { label: "Occasion", options: ["Wedding", "Church", "Cultural Event", "Daily", "Party"], icon: "fa-glass-cheers" },
          color: { label: "Color", options: ["Multicolor", "Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Black", "White"], icon: "fa-palette" },
          fabric: { label: "Fabric", options: ["Cotton", "Silk", "Polyester", "Wax Print", "Kitenge Fabric"], icon: "fa-layer-group" },
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. BEAUTY & PERSONAL CARE
  // ═══════════════════════════════════════════════════════════════════════════
  beauty: {
    id: "beauty",
    name: "Beauty & Personal Care",
    icon: "💄",
    description: "Skincare, makeup, hair products, fragrances, and grooming",
    subcategories: {
      skincare: {
        name: "Skincare",
        icon: "fa-spa",
        specs: {
          brand: { label: "Brand", options: ["Nivea", "Neutrogena", "CeraVe", "The Ordinary", "La Roche-Posay", "Olay", "Ponds", "Garnier", "Dove", "Nivea Men", "Vaseline", "Coconut Oil"], icon: "fa-tag" },
          skin_type: { label: "Skin Type", options: ["Normal", "Dry", "Oily", "Combination", "Sensitive", "Acne-Prone"], icon: "fa-hand-sparkles" },
          concern: { label: "Concern", options: ["Acne", "Dark Spots", "Anti-Aging", "Hydration", "Brightening", "Sun Protection", "Pores", "Dark Circles"], icon: "fa-exclamation-circle" },
          product_type: { label: "Product Type", options: ["Cleanser", "Moisturizer", "Serum", "Sunscreen", "Toner", "Face Mask", "Exfoliator", "Eye Cream", "Lip Balm"], icon: "fa-pump-soap" },
          volume: { label: "Size", options: ["30ml", "50ml", "100ml", "200ml", "400ml"], icon: "fa-flask" },
          gender: { label: "Gender", options: ["Women", "Men", "Unisex"], icon: "fa-venus-mars" },
        }
      },
      makeup: {
        name: "Makeup",
        icon: "fa-magic",
        specs: {
          brand: { label: "Brand", options: ["MAC", "Maybelline", "L'Oreal", "NARS", "Fenty", "Revlon", "Black Opal", "Zaron", "House of Tara"], icon: "fa-tag" },
          product_type: { label: "Product", options: ["Foundation", "Concealer", "Powder", "Lipstick", "Lip Gloss", "Mascara", "Eyeshadow", "Eyeliner", "Blush", "Highlighter", "Primer", "Setting Spray"], icon: "fa-lips" },
          shade_range: { label: "Shade", options: ["Fair", "Light", "Medium", "Tan", "Deep", "Dark", "Ebony"], icon: "fa-palette" },
          finish: { label: "Finish", options: ["Matte", "Glossy", "Satin", "Dewy", "Shimmer", "Natural"], icon: "fa-star" },
          skin_type: { label: "Skin Type", options: ["All", "Oily", "Dry", "Combination", "Sensitive"], icon: "fa-hand-sparkles" },
        }
      },
      haircare: {
        name: "Hair Care",
        icon: "fa-air-freshener",
        specs: {
          brand: { label: "Brand", options: ["Dark & Lovely", "Motions", "ORS", "African Pride", "Cantu", "Shea Moisture", "Mielle", "As I Am", "Kinky-Curly"], icon: "fa-tag" },
          hair_type: { label: "Hair Type", options: ["Natural/4C", "Relaxed", "Braids/Locs", "Weaves/Wigs", "Curly", "Straight"], icon: "fa-wind" },
          product_type: { label: "Product", options: ["Shampoo", "Conditioner", "Hair Oil", "Leave-In", "Edge Control", "Hair Food", "Relaxer", "Hair Dye", "Wig", "Braiding Hair"], icon: "fa-pump-soap" },
          concern: { label: "Concern", options: ["Growth", "Moisture", "Breakage", "Dandruff", "Dry Scalp", "Thinning", "Color Protection"], icon: "fa-exclamation-circle" },
          gender: { label: "Gender", options: ["Women", "Men", "Kids"], icon: "fa-venus-mars" },
        }
      },
      fragrances: {
        name: "Fragrances",
        icon: "fa-spray-can",
        specs: {
          brand: { label: "Brand", options: ["Chanel", "Dior", "Gucci", "Versace", "Armani", "Paco Rabanne", "Calvin Klein", "Davidoff", "Local/Generic"], icon: "fa-tag" },
          gender: { label: "Gender", options: ["Men", "Women", "Unisex"], icon: "fa-venus-mars" },
          type: { label: "Type", options: ["Eau de Parfum", "Eau de Toilette", "Body Spray", "Perfume Oil", "Attar/Oud"], icon: "fa-spray-can" },
          scent_family: { label: "Scent", options: ["Floral", "Woody", "Oriental", "Fresh", "Citrus", "Fruity", "Musky", "Oud"], icon: "fa-leaf" },
          volume: { label: "Volume", options: ["30ml", "50ml", "100ml", "150ml"], icon: "fa-flask" },
          occasion: { label: "Occasion", options: ["Daily", "Evening", "Special", "Work", "Gift"], icon: "fa-glass-cheers" },
        }
      },
      mens_grooming: {
        name: "Men's Grooming",
        icon: "fa-cut",
        specs: {
          product_type: { label: "Product", options: ["Beard Oil", "Beard Balm", "Shaving Cream", "Aftershave", "Razor", "Trimmer", "Face Wash", "Moisturizer", "Deodorant"], icon: "fa-cut" },
          brand: { label: "Brand", options: ["Nivea Men", "Gillette", "Beardo", "The Man Company", "Generic"], icon: "fa-tag" },
          concern: { label: "Concern", options: ["Beard Growth", "Ingrown Hairs", "Razor Bumps", "Dry Skin", "Acne"], icon: "fa-exclamation-circle" },
          skin_type: { label: "Skin Type", options: ["Normal", "Oily", "Dry", "Sensitive"], icon: "fa-hand-sparkles" },
        }
      },
      feminine_hygiene: {
        name: "Feminine Hygiene",
        icon: "fa-female",
        specs: {
          product_type: { label: "Product", options: ["Sanitary Pads", "Tampons", "Menstrual Cup", "Panty Liner", "Intimate Wash", "Intimate Wipes"], icon: "fa-pump-soap" },
          brand: { label: "Brand", options: ["Always", "Kotex", "Softcare", "Whisper", "L. Organic", "Generic"], icon: "fa-tag" },
          flow: { label: "Flow", options: ["Light", "Regular", "Heavy", "Overnight", "Maternity"], icon: "fa-tint" },
          pack_size: { label: "Pack Size", options: ["10 pcs", "16 pcs", "20 pcs", "30 pcs", "50 pcs"], icon: "fa-box" },
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. HOME & LIVING
  // ═══════════════════════════════════════════════════════════════════════════
  home: {
    id: "home",
    name: "Home & Living",
    icon: "🏠",
    description: "Furniture, kitchen, decor, bedding, and appliances",
    subcategories: {
      furniture: {
        name: "Furniture",
        icon: "fa-couch",
        specs: {
          type: { label: "Type", options: ["Sofa", "Chair", "Table", "Bed", "Wardrobe", "Bookshelf", "TV Stand", "Dining Set", "Office Desk", "Coffee Table", "Ottoman"], icon: "fa-couch" },
          material: { label: "Material", options: ["Wood", "Metal", "Leather", "Fabric", "Velvet", "Rattan", "Glass", "MDF"], icon: "fa-tree" },
          color: { label: "Color", options: ["Brown", "Black", "White", "Grey", "Beige", "Blue", "Green", "Walnut", "Mahogany"], icon: "fa-palette" },
          room: { label: "Room", options: ["Living Room", "Bedroom", "Dining Room", "Office", "Outdoor"], icon: "fa-home" },
          condition: { label: "Condition", options: ["Brand New", "Used"], icon: "fa-star" },
          size: { label: "Size", options: ["Small", "Medium", "Large", "2-Seater", "3-Seater", "L-Shape"], icon: "fa-expand" },
        }
      },
      kitchen: {
        name: "Kitchen & Dining",
        icon: "fa-utensils",
        specs: {
          type: { label: "Type", options: ["Cookware", "Dinnerware", "Utensils", "Appliance", "Storage", "Bakeware", "Cutlery", "Glassware"], icon: "fa-utensils" },
          material: { label: "Material", options: ["Stainless Steel", "Non-Stick", "Ceramic", "Glass", "Plastic", "Wood", "Cast Iron", "Copper"], icon: "fa-layer-group" },
          brand: { label: "Brand", options: ["Ramtons", "Mika", "Armco", "Sayona", "Philips", "Generic"], icon: "fa-tag" },
          color: { label: "Color", options: ["Silver", "Black", "Red", "White", "Blue", "Green"], icon: "fa-palette" },
          appliance_type: { label: "Appliance", options: ["Blender", "Microwave", "Kettle", "Rice Cooker", "Pressure Cooker", "Toaster", "Mixer", "Fridge", "Dispenser"], icon: "fa-plug" },
        }
      },
      bedding: {
        name: "Bedding & Linens",
        icon: "fa-bed",
        specs: {
          type: { label: "Type", options: ["Bed Sheet", "Duvet", "Comforter", "Pillow", "Pillow Case", "Blanket", "Mattress Protector", "Bed Cover"], icon: "fa-bed" },
          size: { label: "Bed Size", options: ["Single", "Double", "Queen", "King", "Super King", "4x6", "5x6", "6x6"], icon: "fa-ruler" },
          material: { label: "Material", options: ["Cotton", "Polyester", "Satin", "Silk", "Linen", "Microfiber", "Egyptian Cotton"], icon: "fa-layer-group" },
          color: { label: "Color", options: ["White", "Cream", "Grey", "Blue", "Pink", "Purple", "Brown", "Multicolor"], icon: "fa-palette" },
          thread_count: { label: "Thread Count", options: ["200", "400", "600", "800", "1000+"], icon: "fa-list-ol" },
        }
      },
      home_decor: {
        name: "Home Decor",
        icon: "fa-paint-roller",
        specs: {
          type: { label: "Type", options: ["Wall Art", "Mirror", "Vase", "Candle", "Rug", "Curtain", "Cushion", "Clock", "Plant", "Lamp", "Photo Frame"], icon: "fa-paint-roller" },
          style: { label: "Style", options: ["Modern", "Traditional", "Bohemian", "Minimalist", "Rustic", "African", "Contemporary"], icon: "fa-star" },
          room: { label: "Room", options: ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Office", "Outdoor"], icon: "fa-home" },
          color: { label: "Color", options: ["Gold", "Black", "White", "Earth Tones", "Blue", "Green", "Multicolor"], icon: "fa-palette" },
          material: { label: "Material", options: ["Wood", "Metal", "Ceramic", "Glass", "Fabric", "Wicker", "Concrete"], icon: "fa-layer-group" },
        }
      },
      cleaning: {
        name: "Cleaning Supplies",
        icon: "fa-broom",
        specs: {
          type: { label: "Type", options: ["Detergent", "Disinfectant", "Floor Cleaner", "Toilet Cleaner", "Glass Cleaner", "Air Freshener", "Bleach", "Soap", "Sponge", "Mop"], icon: "fa-broom" },
          brand: { label: "Brand", options: ["Omo", "Ariel", "Persil", "Harpic", "Dettol", "Jik", "Sunlight", "Generic"], icon: "fa-tag" },
          scent: { label: "Scent", options: ["Lemon", "Lavender", "Floral", "Ocean", "Pine", "Unscented"], icon: "fa-leaf" },
          form: { label: "Form", options: ["Liquid", "Powder", "Tablet", "Spray", "Gel"], icon: "fa-flask" },
          size: { label: "Size", options: ["500ml", "1L", "2L", "3L", "5L", "1kg", "2kg", "5kg"], icon: "fa-weight" },
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. FOOD & GROCERIES
  // ═══════════════════════════════════════════════════════════════════════════
  food: {
    id: "food",
    name: "Food & Groceries",
    icon: "🍎",
    description: "Fresh produce, packaged food, beverages, and cooking essentials",
    subcategories: {
      fresh_produce: {
        name: "Fresh Produce",
        icon: "fa-carrot",
        specs: {
          type: { label: "Type", options: ["Vegetables", "Fruits", "Herbs", "Spices", "Eggs", "Dairy"], icon: "fa-carrot" },
          origin: { label: "Origin", options: ["Local", "Imported", "Organic Farm"], icon: "fa-map-marker-alt" },
          organic: { label: "Organic", options: ["Organic", "Conventional", "Pesticide-Free"], icon: "fa-leaf" },
          unit: { label: "Unit", options: ["per kg", "per piece", "per bunch", "per crate", "per dozen"], icon: "fa-balance-scale" },
          freshness: { label: "Freshness", options: ["Harvested Today", "1-2 Days", "3-5 Days"], icon: "fa-clock" },
        }
      },
      packaged_food: {
        name: "Packaged Food",
        icon: "fa-box",
        specs: {
          type: { label: "Type", options: ["Snacks", "Cereals", "Pasta", "Rice", "Flour", "Sugar", "Oil", "Canned", "Biscuits", "Noodles"], icon: "fa-box" },
          brand: { label: "Brand", options: ["Indomie", "Nescafe", "Blue Band", "Royco", "Ajab", "Kabras", "Kensalt", "Fresh Fri", "Coca-Cola"], icon: "fa-tag" },
          dietary: { label: "Dietary", options: ["Vegan", "Halal", "Gluten-Free", "Sugar-Free", "Low Sodium", "None"], icon: "fa-utensils" },
          weight: { label: "Weight", options: ["100g", "250g", "500g", "1kg", "2kg", "5kg", "10kg"], icon: "fa-weight" },
          shelf_life: { label: "Shelf Life", options: ["1-3 Months", "3-6 Months", "6-12 Months", "1 Year+"], icon: "fa-calendar" },
        }
      },
      beverages: {
        name: "Beverages",
        icon: "fa-glass-whiskey",
        specs: {
          type: { label: "Type", options: ["Soda", "Juice", "Water", "Energy Drink", "Tea", "Coffee", "Milk", "Yogurt Drink", "Beer", "Wine"], icon: "fa-glass-whiskey" },
          brand: { label: "Brand", options: ["Coca-Cola", "Pepsi", "Red Bull", "Nescafe", "Kericho Gold", "Brookside", "Keringet", "Tusker", "Savanna"], icon: "fa-tag" },
          volume: { label: "Volume", options: ["250ml", "330ml", "500ml", "1L", "1.5L", "2L", "5L"], icon: "fa-flask" },
          packaging: { label: "Packaging", options: ["Bottle", "Can", "Carton", "Tetra Pack", "Glass"], icon: "fa-box" },
          temperature: { label: "Serve", options: ["Chilled", "Room Temperature", "Hot"], icon: "fa-thermometer-half" },
        }
      },
      cooking_essentials: {
        name: "Cooking Essentials",
        icon: "fa-fire",
        specs: {
          type: { label: "Type", options: ["Cooking Oil", "Flour", "Sugar", "Salt", "Spices", "Sauce", "Vinegar", "Baking Powder", "Yeast"], icon: "fa-fire" },
          brand: { label: "Brand", options: ["Fresh Fri", "Rina", "Ajab", "Kabras", "Kensalt", "Chapa Mandashi", "Royco"], icon: "fa-tag" },
          weight: { label: "Weight", options: ["250g", "500g", "1kg", "2kg", "5kg", "10L", "20L"], icon: "fa-weight" },
          dietary: { label: "Dietary", options: ["Vegetable Oil", "Olive Oil", "Coconut Oil", "Sunflower Oil", "Corn Oil"], icon: "fa-seedling" },
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. BABY, KIDS & MATERNITY
  // ═══════════════════════════════════════════════════════════════════════════
  baby: {
    id: "baby",
    name: "Baby, Kids & Maternity",
    icon: "🍼",
    description: "Baby care, toys, maternity products, and kids essentials",
    subcategories: {
      baby_care: {
        name: "Baby Care",
        icon: "fa-baby",
        specs: {
          type: { label: "Type", options: ["Diapers", "Wipes", "Lotion", "Shampoo", "Oil", "Powder", "Rash Cream", "Nail Clippers", "Thermometer", "Nasal Aspirator"], icon: "fa-baby" },
          brand: { label: "Brand", options: ["Pampers", "Huggies", "Molfix", "Johnson's", "Vaseline Baby", "Zoe", "Softcare"], icon: "fa-tag" },
          age: { label: "Age", options: ["Newborn", "0-6 Months", "6-12 Months", "1-2 Years", "2-3 Years"], icon: "fa-baby-carriage" },
          size: { label: "Diaper Size", options: ["Size 1", "Size 2", "Size 3", "Size 4", "Size 5", "Size 6", "Pants"], icon: "fa-ruler" },
          pack_size: { label: "Pack", options: ["Small (10-20)", "Medium (30-50)", "Large (60-100)", "Jumbo (100+)"], icon: "fa-box" },
        }
      },
      baby_feeding: {
        name: "Feeding & Nursing",
        icon: "fa-utensil-spoon",
        specs: {
          type: { label: "Type", options: ["Formula", "Bottle", "Nipple", "Breast Pump", "Nursing Pillow", "Bibs", "Sippy Cup", "Sterilizer", "Food Processor"], icon: "fa-utensil-spoon" },
          brand: { label: "Brand", options: ["Nan", "SMA", "Aptamil", "Nuk", "Philips Avent", "Medela", "Tommee Tippee"], icon: "fa-tag" },
          age: { label: "Age", options: ["0-6 Months", "6-12 Months", "1-2 Years", "2+ Years"], icon: "fa-baby-carriage" },
          formula_stage: { label: "Stage", options: ["Stage 1 (0-6m)", "Stage 2 (6-12m)", "Stage 3 (1-3y)", "Stage 4 (3y+)"], icon: "fa-layer-group" },
        }
      },
      baby_gear: {
        name: "Baby Gear & Furniture",
        icon: "fa-crib",
        specs: {
          type: { label: "Type", options: ["Stroller", "Car Seat", "Crib", "High Chair", "Baby Carrier", "Playpen", "Bouncer", "Swing", "Walker"], icon: "fa-crib" },
          brand: { label: "Brand", options: ["Graco", "Chicco", "Joie", "Generic", "Local Brand"], icon: "fa-tag" },
          condition: { label: "Condition", options: ["Brand New", "Used - Good", "Used - Like New"], icon: "fa-star" },
          age: { label: "Age", options: ["0-6 Months", "6-12 Months", "1-2 Years", "2-4 Years"], icon: "fa-baby-carriage" },
        }
      },
      toys: {
        name: "Toys & Games",
        icon: "fa-puzzle-piece",
        specs: {
          type: { label: "Type", options: ["Educational", "Building Blocks", "Dolls", "Action Figures", "Remote Control", "Puzzle", "Board Game", "Outdoor", "Plush", "Art & Craft"], icon: "fa-puzzle-piece" },
          age: { label: "Age", options: ["0-1 Year", "1-3 Years", "3-5 Years", "5-8 Years", "8-12 Years", "12+ Years"], icon: "fa-baby" },
          brand: { label: "Brand", options: ["Lego", "Mattel", "Hasbro", "Fisher-Price", "Hot Wheels", "Generic"], icon: "fa-tag" },
          material: { label: "Material", options: ["Plastic", "Wood", "Fabric", "Metal", "Foam"], icon: "fa-layer-group" },
          gender: { label: "Gender", options: ["Boys", "Girls", "Unisex"], icon: "fa-venus-mars" },
        }
      },
      maternity: {
        name: "Maternity",
        icon: "fa-female",
        specs: {
          type: { label: "Type", options: ["Maternity Wear", "Nursing Bra", "Pregnancy Pillow", "Stretch Mark Cream", "Belly Band", "Maternity Belt"], icon: "fa-female" },
          size: { label: "Size", options: ["S", "M", "L", "XL", "XXL", "Maternity S", "Maternity M", "Maternity L"], icon: "fa-ruler" },
          trimester: { label: "Trimester", options: ["1st", "2nd", "3rd", "Postpartum"], icon: "fa-calendar" },
          color: { label: "Color", options: ["Black", "White", "Nude", "Pink", "Blue", "Grey"], icon: "fa-palette" },
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. SPORTS, FITNESS & OUTDOOR
  // ═══════════════════════════════════════════════════════════════════════════
  sports: {
    id: "sports",
    name: "Sports, Fitness & Outdoor",
    icon: "🏋️",
    description: "Exercise equipment, sportswear, outdoor gear, and supplements",
    subcategories: {
      fitness_equipment: {
        name: "Fitness Equipment",
        icon: "fa-dumbbell",
        specs: {
          type: { label: "Type", options: ["Dumbbell", "Kettlebell", "Treadmill", "Exercise Bike", "Yoga Mat", "Resistance Band", "Skipping Rope", "Pull-Up Bar", "Bench", "Weights"], icon: "fa-dumbbell" },
          brand: { label: "Brand", options: ["Nike", "Adidas", "Under Armour", "Reebok", "Generic", "Local Brand"], icon: "fa-tag" },
          weight_range: { label: "Weight", options: ["1-5kg", "5-10kg", "10-20kg", "20kg+"], icon: "fa-weight-hanging" },
          condition: { label: "Condition", options: ["Brand New", "Used"], icon: "fa-star" },
          home_gym: { label: "Home Gym", options: ["Yes", "No"], icon: "fa-home" },
        }
      },
      sportswear: {
        name: "Sportswear",
        icon: "fa-running",
        specs: {
          type: { label: "Type", options: ["Leggings", "Sports Bra", "Shorts", "T-Shirt", "Tank Top", "Jacket", "Tracksuit", "Socks", "Gloves"], icon: "fa-tshirt" },
          brand: { label: "Brand", options: ["Nike", "Adidas", "Puma", "Under Armour", "Gymshark", "Lululemon", "Generic"], icon: "fa-tag" },
          size: { label: "Size", options: ["XS", "S", "M", "L", "XL", "XXL"], icon: "fa-ruler" },
          gender: { label: "Gender", options: ["Men", "Women", "Unisex"], icon: "fa-venus-mars" },
          activity: { label: "Activity", options: ["Gym", "Running", "Yoga", "Swimming", "Cycling", "Football", "Basketball"], icon: "fa-running" },
          material: { label: "Material", options: ["Polyester", "Nylon", "Spandex", "Cotton Blend", "Moisture-Wicking"], icon: "fa-layer-group" },
        }
      },
      outdoor: {
        name: "Outdoor & Camping",
        icon: "fa-campground",
        specs: {
          type: { label: "Type", options: ["Tent", "Sleeping Bag", "Camping Chair", "Cooler Box", "Hiking Backpack", "Torch", "Solar Lamp", "Fishing Gear"], icon: "fa-campground" },
          capacity: { label: "Capacity", options: ["1 Person", "2 Person", "4 Person", "6 Person", "8+ Person"], icon: "fa-users" },
          condition: { label: "Condition", options: ["Brand New", "Used"], icon: "fa-star" },
          waterproof: { label: "Waterproof", options: ["Yes", "No", "Water-Resistant"], icon: "fa-tint" },
        }
      },
      supplements: {
        name: "Supplements & Nutrition",
        icon: "fa-capsules",
        specs: {
          type: { label: "Type", options: ["Whey Protein", "Mass Gainer", "Creatine", "BCAA", "Pre-Workout", "Vitamins", "Weight Loss", "Energy"], icon: "fa-capsules" },
          brand: { label: "Brand", options: ["Optimum Nutrition", "BSN", "MuscleTech", "Dymatize", "USN", "Generic"], icon: "fa-tag" },
          flavor: { label: "Flavor", options: ["Chocolate", "Vanilla", "Strawberry", "Cookies & Cream", "Banana", "Unflavored"], icon: "fa-ice-cream" },
          weight: { label: "Weight", options: ["500g", "1kg", "2kg", "2.27kg", "5kg", "4.5kg"], icon: "fa-weight" },
          dietary: { label: "Dietary", options: ["Whey", "Vegan", "Keto", "Sugar-Free", "Gluten-Free"], icon: "fa-leaf" },
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. AUTOMOTIVE & TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  automotive: {
    id: "automotive",
    name: "Automotive & Tools",
    icon: "🚗",
    description: "Car accessories, tools, spare parts, and car care",
    subcategories: {
      car_accessories: {
        name: "Car Accessories",
        icon: "fa-car",
        specs: {
          type: { label: "Type", options: ["Phone Holder", "Car Charger", "Dash Cam", "Seat Cover", "Floor Mat", "Organizer", "Air Freshener", "Sun Shade", "Steering Cover", "Gap Filler"], icon: "fa-car" },
          brand: { label: "Brand", options: ["Baseus", "Anker", "Oraimo", "Generic"], icon: "fa-tag" },
          car_type: { label: "Car Type", options: ["Sedan", "SUV", "Hatchback", "Pickup", "Matatu", "Motorcycle"], icon: "fa-car-side" },
          color: { label: "Color", options: ["Black", "Beige", "Grey", "Red", "Blue", "Universal"], icon: "fa-palette" },
        }
      },
      car_electronics: {
        name: "Car Electronics",
        icon: "fa-bolt",
        specs: {
          type: { label: "Type", options: ["Car Stereo", "Speaker", "Amplifier", "Alarm", "Tracker", "Reverse Camera", "Head Unit", "Subwoofer"], icon: "fa-bolt" },
          brand: { label: "Brand", options: ["Pioneer", "Sony", "JVC", "Kenwood", "Generic"], icon: "fa-tag" },
          car_type: { label: "Car Type", options: ["Toyota", "Nissan", "Subaru", "Mazda", "Honda", "Mercedes", "BMW", "VW", "Universal"], icon: "fa-car-side" },
        }
      },
      tools: {
        name: "Tools & Hardware",
        icon: "fa-tools",
        specs: {
          type: { label: "Type", options: ["Power Tool", "Hand Tool", "Garden Tool", "Measuring Tool", "Safety Gear", "Tool Box", "Generator", "Pressure Washer"], icon: "fa-tools" },
          brand: { label: "Brand", options: ["Bosch", "Makita", "Stanley", "DeWalt", "Black & Decker", "Generic"], icon: "fa-tag" },
          power_source: { label: "Power", options: ["Electric", "Battery", "Manual", "Petrol"], icon: "fa-plug" },
          condition: { label: "Condition", options: ["Brand New", "Used"], icon: "fa-star" },
        }
      },
      car_care: {
        name: "Car Care & Maintenance",
        icon: "fa-oil-can",
        specs: {
          type: { label: "Type", options: ["Engine Oil", "Brake Fluid", "Coolant", "Car Polish", "Wax", "Tire Shine", "Air Filter", "Oil Filter", "Wiper Blade"], icon: "fa-oil-can" },
          brand: { label: "Brand", options: ["Shell", "Total", "Castrol", "Mobil", "Toyota Genuine", "Generic"], icon: "fa-tag" },
          vehicle: { label: "Vehicle", options: ["Petrol", "Diesel", "Hybrid", "Motorcycle"], icon: "fa-gas-pump" },
          volume: { label: "Volume", options: ["1L", "4L", "5L", "20L"], icon: "fa-flask" },
        }
      }
    }
  }
};

// ─── EXPORT ─────────────────────────────────────────────────────────────────

export default categoryData;