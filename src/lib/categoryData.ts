// Hardcoded category data with subcategories and spec fields
export interface SpecField {
  key: string;
  label: string;
  icon?: string;
  options: string[];
  multiple?: boolean;
}

export interface Subcategory {
  key: string;
  name: string;
  specs: Record<string, SpecField>;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: Record<string, Subcategory>;
}

const categoryData: Record<string, Category> = {
  clothing: {
    id: "clothing",
    name: "Clothing",
    icon: "👕",
    subcategories: {
      dresses: {
        key: "dresses",
        name: "Dresses",
        specs: {
          size: {
            key: "size",
            label: "Size",
            icon: "fa-ruler",
            options: ["XS", "S", "M", "L", "XL", "XXL"],
            multiple: false,
          },
          color: {
            key: "color",
            label: "Color",
            icon: "fa-palette",
            options: ["Black", "White", "Red", "Blue", "Green", "Pink", "Purple", "Yellow"],
            multiple: false,
          },
          material: {
            key: "material",
            label: "Material",
            icon: "fa-tshirt",
            options: ["Cotton", "Silk", "Polyester", "Linen", "Wool", "Satin", "Chiffon"],
            multiple: false,
          },
          style: {
            key: "style",
            label: "Style",
            icon: "fa-star",
            options: ["Casual", "Formal", "Evening", "Maxi", "Mini", "Midi", "A-line", "Bodycon"],
            multiple: false,
          },
        },
      },
      tops: {
        key: "tops",
        name: "Tops",
        specs: {
          size: {
            key: "size",
            label: "Size",
            icon: "fa-ruler",
            options: ["XS", "S", "M", "L", "XL", "XXL"],
            multiple: false,
          },
          color: {
            key: "color",
            label: "Color",
            icon: "fa-palette",
            options: ["Black", "White", "Red", "Blue", "Green", "Pink", "Grey", "Navy"],
            multiple: false,
          },
          sleeveLength: {
            key: "sleeveLength",
            label: "Sleeve Length",
            icon: "fa-hand-paper",
            options: ["Sleeveless", "Short Sleeve", "Half Sleeve", "Long Sleeve"],
            multiple: false,
          },
          neckline: {
            key: "neckline",
            label: "Neckline",
            icon: "fa-user",
            options: ["Round Neck", "V-Neck", "Turtle Neck", "Off Shoulder", "Halter", "Square Neck"],
            multiple: false,
          },
        },
      },
      bottoms: {
        key: "bottoms",
        name: "Bottoms",
        specs: {
          size: {
            key: "size",
            label: "Size",
            icon: "fa-ruler",
            options: ["XS", "S", "M", "L", "XL", "XXL"],
            multiple: false,
          },
          color: {
            key: "color",
            label: "Color",
            icon: "fa-palette",
            options: ["Black", "White", "Blue", "Grey", "Khaki", "Brown"],
            multiple: false,
          },
          type: {
            key: "type",
            label: "Type",
            icon: "fa-tshirt",
            options: ["Jeans", "Trousers", "Skirt", "Shorts", "Leggings", "Joggers"],
            multiple: false,
          },
        },
      },
    },
  },
  electronics: {
    id: "electronics",
    name: "Electronics",
    icon: "📱",
    subcategories: {
      smartphones: {
        key: "smartphones",
        name: "Smartphones",
        specs: {
          brand: {
            key: "brand",
            label: "Brand",
            icon: "fa-mobile-alt",
            options: ["Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Huawei", "Oppo", "Vivo"],
            multiple: false,
          },
          storage: {
            key: "storage",
            label: "Storage",
            icon: "fa-hdd",
            options: ["64GB", "128GB", "256GB", "512GB", "1TB"],
            multiple: false,
          },
          ram: {
            key: "ram",
            label: "RAM",
            icon: "fa-memory",
            options: ["4GB", "6GB", "8GB", "12GB", "16GB"],
            multiple: false,
          },
          color: {
            key: "color",
            label: "Color",
            icon: "fa-palette",
            options: ["Black", "White", "Blue", "Green", "Purple", "Gold", "Silver"],
            multiple: false,
          },
        },
      },
      laptops: {
        key: "laptops",
        name: "Laptops",
        specs: {
          brand: {
            key: "brand",
            label: "Brand",
            icon: "fa-laptop",
            options: ["Apple", "Dell", "HP", "Lenovo", "ASUS", "Acer", "MSI"],
            multiple: false,
          },
          processor: {
            key: "processor",
            label: "Processor",
            icon: "fa-microchip",
            options: ["Intel i5", "Intel i7", "Intel i9", "AMD Ryzen 5", "AMD Ryzen 7", "AMD Ryzen 9", "Apple M1", "Apple M2", "Apple M3"],
            multiple: false,
          },
          ram: {
            key: "ram",
            label: "RAM",
            icon: "fa-memory",
            options: ["8GB", "16GB", "32GB", "64GB"],
            multiple: false,
          },
          storage: {
            key: "storage",
            label: "Storage",
            icon: "fa-hdd",
            options: ["256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"],
            multiple: false,
          },
          screenSize: {
            key: "screenSize",
            label: "Screen Size",
            icon: "fa-desktop",
            options: ["13 inch", "14 inch", "15 inch", "16 inch", "17 inch"],
            multiple: false,
          },
        },
      },
      accessories: {
        key: "accessories",
        name: "Accessories",
        specs: {
          type: {
            key: "type",
            label: "Type",
            icon: "fa-headphones",
            options: ["Headphones", "Earbuds", "Charger", "Cable", "Case", "Screen Protector", "Power Bank"],
            multiple: false,
          },
          compatibility: {
            key: "compatibility",
            label: "Compatibility",
            icon: "fa-check-circle",
            options: ["iPhone", "Samsung", "Universal", "Android", "Apple"],
            multiple: true,
          },
          color: {
            key: "color",
            label: "Color",
            icon: "fa-palette",
            options: ["Black", "White", "Blue", "Red", "Pink", "Green"],
            multiple: false,
          },
        },
      },
    },
  },
  footwear: {
    id: "footwear",
    name: "Footwear",
    icon: "👟",
    subcategories: {
      sneakers: {
        key: "sneakers",
        name: "Sneakers",
        specs: {
          size: {
            key: "size",
            label: "Size",
            icon: "fa-ruler",
            options: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
            multiple: false,
          },
          color: {
            key: "color",
            label: "Color",
            icon: "fa-palette",
            options: ["Black", "White", "Red", "Blue", "Green", "Grey", "Pink"],
            multiple: false,
          },
          brand: {
            key: "brand",
            label: "Brand",
            icon: "fa-shoe-prints",
            options: ["Nike", "Adidas", "Puma", "Reebok", "New Balance", "Converse", "Vans"],
            multiple: false,
          },
          type: {
            key: "type",
            label: "Type",
            icon: "fa-running",
            options: ["Running", "Casual", "Basketball", "Training", "Walking"],
            multiple: false,
          },
        },
      },
      formal: {
        key: "formal",
        name: "Formal Shoes",
        specs: {
          size: {
            key: "size",
            label: "Size",
            icon: "fa-ruler",
            options: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
            multiple: false,
          },
          color: {
            key: "color",
            label: "Color",
            icon: "fa-palette",
            options: ["Black", "Brown", "Tan", "White", "Navy"],
            multiple: false,
          },
          material: {
            key: "material",
            label: "Material",
            icon: "fa-shoe-prints",
            options: ["Leather", "Suede", "Synthetic", "Patent Leather"],
            multiple: false,
          },
        },
      },
      sandals: {
        key: "sandals",
        name: "Sandals",
        specs: {
          size: {
            key: "size",
            label: "Size",
            icon: "fa-ruler",
            options: ["36", "37", "38", "39", "40", "41", "42", "43", "44"],
            multiple: false,
          },
          color: {
            key: "color",
            label: "Color",
            icon: "fa-palette",
            options: ["Black", "Brown", "White", "Tan", "Pink", "Gold", "Silver"],
            multiple: false,
          },
          type: {
            key: "type",
            label: "Type",
            icon: "fa-umbrella-beach",
            options: ["Slides", "Flip Flops", "Sport Sandals", "Wedge", "Heeled"],
            multiple: false,
          },
        },
      },
    },
  },
  furniture: {
    id: "furniture",
    name: "Furniture",
    icon: "🛋️",
    subcategories: {
      tables: {
        key: "tables",
        name: "Tables",
        specs: {
          type: {
            key: "type",
            label: "Type",
            icon: "fa-table",
            options: ["Dining Table", "Coffee Table", "Desk", "Side Table", "Console Table"],
            multiple: false,
          },
          material: {
            key: "material",
            label: "Material",
            icon: "fa-tree",
            options: ["Wood", "Metal", "Glass", "Marble", "Plastic"],
            multiple: false,
          },
          color: {
            key: "color",
            label: "Color",
            icon: "fa-palette",
            options: ["Black", "White", "Brown", "Natural Wood", "Grey"],
            multiple: false,
          },
          size: {
            key: "size",
            label: "Size",
            icon: "fa-ruler-combined",
            options: ["Small", "Medium", "Large", "Extra Large"],
            multiple: false,
          },
        },
      },
      chairs: {
        key: "chairs",
        name: "Chairs",
        specs: {
          type: {
            key: "type",
            label: "Type",
            icon: "fa-chair",
            options: ["Dining Chair", "Office Chair", "Accent Chair", "Recliner", "Bar Stool"],
            multiple: false,
          },
          material: {
            key: "material",
            label: "Material",
            icon: "fa-tree",
            options: ["Wood", "Metal", "Leather", "Fabric", "Plastic"],
            multiple: false,
          },
          color: {
            key: "color",
            label: "Color",
            icon: "fa-palette",
            options: ["Black", "White", "Brown", "Grey", "Blue", "Red"],
            multiple: false,
          },
        },
      },
      storage: {
        key: "storage",
        name: "Storage",
        specs: {
          type: {
            key: "type",
            label: "Type",
            icon: "fa-archive",
            options: ["Wardrobe", "Bookshelf", "Cabinet", "Drawer Unit", "Shelf"],
            multiple: false,
          },
          material: {
            key: "material",
            label: "Material",
            icon: "fa-tree",
            options: ["Wood", "Metal", "Plastic", "MDF"],
            multiple: false,
          },
          size: {
            key: "size",
            label: "Size",
            icon: "fa-ruler-combined",
            options: ["Small", "Medium", "Large", "Extra Large"],
            multiple: false,
          },
        },
      },
    },
  },
  beauty: {
    id: "beauty",
    name: "Beauty & Care",
    icon: "💄",
    subcategories: {
      skincare: {
        key: "skincare",
        name: "Skincare",
        specs: {
          type: {
            key: "type",
            label: "Type",
            icon: "fa-pump-soap",
            options: ["Moisturizer", "Cleanser", "Serum", "Toner", "Sunscreen", "Mask", "Exfoliator"],
            multiple: false,
          },
          skinType: {
            key: "skinType",
            label: "Skin Type",
            icon: "fa-user",
            options: ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
            multiple: true,
          },
          brand: {
            key: "brand",
            label: "Brand",
            icon: "fa-star",
            options: ["CeraVe", "The Ordinary", "Neutrogena", "L'Oreal", "La Roche-Posay", "Clinique"],
            multiple: false,
          },
          size: {
            key: "size",
            label: "Size",
            icon: "fa-flask",
            options: ["30ml", "50ml", "100ml", "150ml", "200ml", "250ml", "500ml"],
            multiple: false,
          },
        },
      },
      makeup: {
        key: "makeup",
        name: "Makeup",
        specs: {
          type: {
            key: "type",
            label: "Type",
            icon: "fa-magic",
            options: ["Foundation", "Lipstick", "Eyeshadow", "Mascara", "Blush", "Concealer", "Primer"],
            multiple: false,
          },
          shade: {
            key: "shade",
            label: "Shade",
            icon: "fa-palette",
            options: ["Fair", "Light", "Medium", "Tan", "Deep", "Dark"],
            multiple: false,
          },
          finish: {
            key: "finish",
            label: "Finish",
            icon: "fa-star",
            options: ["Matte", "Dewy", "Satin", "Glossy", "Shimmer"],
            multiple: false,
          },
          brand: {
            key: "brand",
            label: "Brand",
            icon: "fa-crown",
            options: ["MAC", "NARS", "Fenty Beauty", "Urban Decay", "Maybelline", "NYX"],
            multiple: false,
          },
        },
      },
      haircare: {
        key: "haircare",
        name: "Hair Care",
        specs: {
          type: {
            key: "type",
            label: "Type",
            icon: "fa-spray-can",
            options: ["Shampoo", "Conditioner", "Hair Oil", "Hair Mask", "Styling Product", "Hair Spray"],
            multiple: false,
          },
          hairType: {
            key: "hairType",
            label: "Hair Type",
            icon: "fa-user",
            options: ["Straight", "Wavy", "Curly", "Coily", "All Types"],
            multiple: true,
          },
          brand: {
            key: "brand",
            label: "Brand",
            icon: "fa-star",
            options: ["Olaplex", "Moroccanoil", "Redken", "Kerastase", "Pantene", "Herbal Essences"],
            multiple: false,
          },
        },
      },
    },
  },
  other: {
    id: "other",
    name: "Other",
    icon: "📦",
    subcategories: {
      general: {
        key: "general",
        name: "General",
        specs: {
          type: {
            key: "type",
            label: "Type",
            icon: "fa-box",
            options: ["New", "Used", "Refurbished"],
            multiple: false,
          },
          condition: {
            key: "condition",
            label: "Condition",
            icon: "fa-check-circle",
            options: ["Brand New", "Like New", "Good", "Fair", "Poor"],
            multiple: false,
          },
          brand: {
            key: "brand",
            label: "Brand",
            icon: "fa-tag",
            options: [],
            multiple: false,
          },
          color: {
            key: "color",
            label: "Color",
            icon: "fa-palette",
            options: ["Black", "White", "Red", "Blue", "Green", "Yellow", "Pink", "Purple", "Orange", "Grey", "Brown"],
            multiple: false,
          },
        },
      },
    },
  },
};

export default categoryData;
