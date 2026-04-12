"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { productService } from "@/lib/db";
import { bunnyStorage } from "@/lib/storage";

type StringSet = Set<string>;

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  shippingFee: string;
  weight: string;
  lowStockAlert: string;
}

interface Variant {
  id: number;
  specs: Record<string, string>;
  sku: string;
  price: string;
  stock: string;
}

interface SpecOptions {
  label: string;
  options: string[];
  icon: string;
}

interface CategorySubData {
  name: string;
  specs: Record<string, SpecOptions>;
}

interface CategoryData {
  subcategories: Record<string, CategorySubData>;
}

const categoryData: Record<string, CategoryData> = {
  electronics: {
    subcategories: {
      phones: {
        name: "Phones",
        specs: {
          brand: { label: "Brand", options: ["Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Huawei"], icon: "fa-mobile-alt" },
          storage: { label: "Storage", options: ["64GB", "128GB", "256GB", "512GB", "1TB"], icon: "fa-hdd" },
          ram: { label: "RAM", options: ["4GB", "6GB", "8GB", "12GB", "16GB"], icon: "fa-memory" },
          color: { label: "Color", options: ["Black", "White", "Blue", "Red", "Gold", "Silver", "Purple", "Green"], icon: "fa-palette" },
          condition: { label: "Condition", options: ["New", "Used - Like New", "Used - Good", "Refurbished"], icon: "fa-star" },
          network: { label: "Network", options: ["4G", "5G", "4G & 5G"], icon: "fa-signal" }
        }
      },
      laptops: {
        name: "Laptops",
        specs: {
          brand: { label: "Brand", options: ["Apple", "Dell", "HP", "Lenovo", "Asus", "Acer", "Microsoft"], icon: "fa-laptop" },
          processor: { label: "Processor", options: ["Intel i3", "Intel i5", "Intel i7", "Intel i9", "AMD Ryzen 5", "AMD Ryzen 7", "M1", "M2", "M3"], icon: "fa-microchip" },
          ram: { label: "RAM", options: ["4GB", "8GB", "16GB", "32GB", "64GB"], icon: "fa-memory" },
          storage: { label: "Storage", options: ["256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"], icon: "fa-hdd" },
          screen_size: { label: "Screen Size", options: ['13"', '14"', '15.6"', '16"', '17"'], icon: "fa-expand" },
          color: { label: "Color", options: ["Silver", "Space Gray", "Black", "White", "Blue"], icon: "fa-palette" },
          condition: { label: "Condition", options: ["New", "Used - Like New", "Used - Good", "Refurbished"], icon: "fa-star" },
          os: { label: "Operating System", options: ["Windows 11", "macOS", "Linux", "Chrome OS"], icon: "fa-desktop" }
        }
      },
      tablets: {
        name: "Tablets",
        specs: {
          brand: { label: "Brand", options: ["Apple", "Samsung", "Lenovo", "Microsoft", "Huawei"], icon: "fa-tablet-alt" },
          screen_size: { label: "Screen Size", options: ['7"', '8"', '10.1"', '11"', '12.9"'], icon: "fa-expand" },
          storage: { label: "Storage", options: ["64GB", "128GB", "256GB", "512GB", "1TB"], icon: "fa-hdd" },
          ram: { label: "RAM", options: ["4GB", "6GB", "8GB", "12GB", "16GB"], icon: "fa-memory" },
          color: { label: "Color", options: ["Silver", "Space Gray", "Gold", "Rose Gold", "Black"], icon: "fa-palette" },
          network: { label: "Network", options: ["WiFi Only", "WiFi + Cellular"], icon: "fa-wifi" }
        }
      },
      tvs: {
        name: "TVs",
        specs: {
          brand: { label: "Brand", options: ["Samsung", "LG", "Sony", "TCL", "Hisense", "Philips"], icon: "fa-tv" },
          screen_size: { label: "Screen Size", options: ['32"', '43"', '50"', '55"', '65"', '75"', '85"'], icon: "fa-expand" },
          resolution: { label: "Resolution", options: ["Full HD", "4K Ultra HD", "8K"], icon: "fa-film" },
          smart_tv: { label: "Smart TV", options: ["Android TV", "webOS", "Tizen", "Roku", "Fire TV"], icon: "fa-brain" },
          condition: { label: "Condition", options: ["New", "Open Box", "Refurbished"], icon: "fa-star" }
        }
      },
      earphones: {
        name: "Earphones/Headphones",
        specs: {
          brand: { label: "Brand", options: ["Apple", "Samsung", "Sony", "Bose", "JBL", "Beats", "Sennheiser"], icon: "fa-headphones" },
          type: { label: "Type", options: ["Wired", "Wireless", "True Wireless"], icon: "fa-bluetooth-b" },
          color: { label: "Color", options: ["Black", "White", "Blue", "Red", "Silver", "Gold"], icon: "fa-palette" },
          noise_cancelling: { label: "Noise Cancelling", options: ["Active ANC", "Passive", "None"], icon: "fa-volume-mute" }
        }
      },
      cameras: {
        name: "Cameras",
        specs: {
          brand: { label: "Brand", options: ["Canon", "Nikon", "Sony", "Fujifilm", "Panasonic"], icon: "fa-camera" },
          type: { label: "Type", options: ["DSLR", "Mirrorless", "Point & Shoot", "Action Camera"], icon: "fa-camera-retro" },
          megapixels: { label: "Megapixels", options: ["12MP", "20MP", "24MP", "45MP", "50MP+"], icon: "fa-image" },
          color: { label: "Color", options: ["Black", "Silver", "White"], icon: "fa-palette" }
        }
      }
    }
  },
  footwear: {
    subcategories: {
      shoes: {
        name: "Shoes/Sneakers",
        specs: {
          brand: { label: "Brand", options: ["Nike", "Adidas", "Puma", "New Balance", "Converse", "Vans", "Reebok"], icon: "fa-shoe-prints" },
          sizes: { label: "Size (US)", options: ["6", "7", "8", "9", "10", "11", "12", "13"], icon: "fa-ruler" },
          color: { label: "Color", options: ["Black", "White", "Red", "Blue", "Green", "Yellow", "Multi"], icon: "fa-palette" },
          gender: { label: "Gender", options: ["Men", "Women", "Unisex", "Kids"], icon: "fa-venus-mars" },
          material: { label: "Material", options: ["Leather", "Canvas", "Mesh", "Synthetic", "Suede"], icon: "fa-layer-group" }
        }
      },
      boots: {
        name: "Boots",
        specs: {
          brand: { label: "Brand", options: ["Timberland", "Dr. Martens", "Caterpillar", "Red Wing"], icon: "fa-shoe-prints" },
          sizes: { label: "Size", options: ["6", "7", "8", "9", "10", "11", "12"], icon: "fa-ruler" },
          color: { label: "Color", options: ["Brown", "Black", "Tan", "Gray"], icon: "fa-palette" },
          gender: { label: "Gender", options: ["Men", "Women", "Unisex"], icon: "fa-venus-mars" },
          heel_height: { label: "Heel Height", options: ["Flat", "Low (1-2\")", "Mid (2-3\")", "High (3\"+)"], icon: "fa-arrows-alt-v" }
        }
      },
      sandals: {
        name: "Sandals/Slippers",
        specs: {
          brand: { label: "Brand", options: ["Birkenstock", "Crocs", "Havaianas", "Nike"], icon: "fa-shoe-prints" },
          sizes: { label: "Size", options: ["5", "6", "7", "8", "9", "10", "11", "12"], icon: "fa-ruler" },
          color: { label: "Color", options: ["Black", "Brown", "White", "Blue", "Pink"], icon: "fa-palette" },
          gender: { label: "Gender", options: ["Men", "Women", "Kids"], icon: "fa-venus-mars" }
        }
      }
    }
  },
  clothing: {
    subcategories: {
      tops: {
        name: "Tops/T-shirts",
        specs: {
          sizes: { label: "Size", options: ["XS", "S", "M", "L", "XL", "XXL", "3XL"], icon: "fa-ruler" },
          color: { label: "Color", options: ["Black", "White", "Gray", "Navy", "Red", "Blue", "Green", "Yellow", "Pink"], icon: "fa-palette" },
          gender: { label: "Gender", options: ["Men", "Women", "Unisex"], icon: "fa-venus-mars" },
          material: { label: "Material", options: ["Cotton", "Polyester", "Linen", "Silk", "Wool"], icon: "fa-layer-group" },
          style: { label: "Style", options: ["Casual", "Formal", "Sport", "Vintage"], icon: "fa-tshirt" }
        }
      },
      trousers: {
        name: "Trousers/Jeans",
        specs: {
          sizes: { label: "Size", options: ["28", "30", "32", "34", "36", "38", "40", "42"], icon: "fa-ruler" },
          color: { label: "Color", options: ["Blue", "Black", "Gray", "Khaki", "White"], icon: "fa-palette" },
          gender: { label: "Gender", options: ["Men", "Women"], icon: "fa-venus-mars" },
          fit: { label: "Fit", options: ["Slim", "Regular", "Relaxed", "Skinny", "Bootcut"], icon: "fa-arrows-alt-h" }
        }
      },
      dresses: {
        name: "Dresses",
        specs: {
          sizes: { label: "Size", options: ["XS", "S", "M", "L", "XL", "XXL"], icon: "fa-ruler" },
          color: { label: "Color", options: ["Black", "Red", "Blue", "White", "Pink", "Floral", "Green"], icon: "fa-palette" },
          style: { label: "Style", options: ["Casual", "Evening", "Cocktail", "Maxi", "Midi"], icon: "fa-female" },
          occasion: { label: "Occasion", options: ["Party", "Wedding", "Office", "Casual", "Beach"], icon: "fa-glass-cheers" }
        }
      },
      jackets: {
        name: "Jackets/Coats",
        specs: {
          sizes: { label: "Size", options: ["XS", "S", "M", "L", "XL", "XXL", "3XL"], icon: "fa-ruler" },
          color: { label: "Color", options: ["Black", "Brown", "Navy", "Gray", "Beige", "Olive"], icon: "fa-palette" },
          gender: { label: "Gender", options: ["Men", "Women", "Unisex"], icon: "fa-venus-mars" },
          material: { label: "Material", options: ["Leather", "Denim", "Wool", "Polyester", "Down"], icon: "fa-layer-group" }
        }
      }
    }
  },
  beauty: {
    subcategories: {
      skincare: {
        name: "Skincare",
        specs: {
          brand: { label: "Brand", options: ["Neutrogena", "CeraVe", "The Ordinary", "La Roche-Posay", "Olay"], icon: "fa-pump-soap" },
          skin_type: { label: "Skin Type", options: ["Normal", "Dry", "Oily", "Combination", "Sensitive"], icon: "fa-hand-sparkles" },
          volume: { label: "Volume", options: ["30ml", "50ml", "100ml", "200ml"], icon: "fa-flask" }
        }
      },
      makeup: {
        name: "Makeup",
        specs: {
          brand: { label: "Brand", options: ["MAC", "Maybelline", "L'Oreal", "NARS", "Fenty"], icon: "fa-magic" },
          type: { label: "Type", options: ["Foundation", "Lipstick", "Mascara", "Eyeshadow", "Blush"], icon: "fa-lips" },
          shade: { label: "Shade", options: ["Fair", "Light", "Medium", "Tan", "Deep", "Dark"], icon: "fa-palette" }
        }
      },
      hair: {
        name: "Hair Products",
        specs: {
          brand: { label: "Brand", options: ["Tresemme", "Pantene", "Dove", "L'Oreal", "Shea Moisture"], icon: "fa-air-freshener" },
          hair_type: { label: "Hair Type", options: ["Straight", "Wavy", "Curly", "Coily"], icon: "fa-wind" },
          type: { label: "Product Type", options: ["Shampoo", "Conditioner", "Hair Oil", "Styling"], icon: "fa-pump-soap" }
        }
      },
      perfumes: {
        name: "Perfumes",
        specs: {
          brand: { label: "Brand", options: ["Chanel", "Dior", "Gucci", "Versace", "Armani"], icon: "fa-spray-can" },
          gender: { label: "Gender", options: ["Men", "Women", "Unisex"], icon: "fa-venus-mars" },
          volume: { label: "Volume", options: ["30ml", "50ml", "100ml", "150ml"], icon: "fa-flask" },
          scent_type: { label: "Scent Type", options: ["Floral", "Woody", "Oriental", "Fresh", "Citrus"], icon: "fa-leaf" }
        }
      }
    }
  },
  furniture: {
    subcategories: {
      sofas: {
        name: "Sofas/Chairs",
        specs: {
          material: { label: "Material", options: ["Leather", "Fabric", "Velvet", "Linen"], icon: "fa-couch" },
          color: { label: "Color", options: ["Gray", "Beige", "Brown", "Black", "Blue", "Green"], icon: "fa-palette" },
          seating: { label: "Seating Capacity", options: ["1 Seater", "2 Seater", "3 Seater", "L-Shape", "Sectional"], icon: "fa-users" }
        }
      },
      beds: {
        name: "Beds",
        specs: {
          size: { label: "Size", options: ["Single", "Double", "Queen", "King", "Super King"], icon: "fa-bed" },
          material: { label: "Material", options: ["Wood", "Metal", "Upholstered", "Leather"], icon: "fa-tree" },
          color: { label: "Color", options: ["White", "Brown", "Black", "Gray", "Beige"], icon: "fa-palette" }
        }
      },
      tables: {
        name: "Tables/Desks",
        specs: {
          material: { label: "Material", options: ["Wood", "Glass", "Metal", "Marble"], icon: "fa-table" },
          color: { label: "Color", options: ["Brown", "Black", "White", "Gray", "Natural"], icon: "fa-palette" }
        }
      }
    }
  },
  food: {
    subcategories: {
      fresh: {
        name: "Fresh Produce",
        specs: {
          weight: { label: "Weight", options: ["500g", "1kg", "2kg", "5kg"], icon: "fa-weight" },
          unit: { label: "Unit", options: ["per kg", "per piece", "per bunch", "per box"], icon: "fa-balance-scale" },
          organic: { label: "Organic", options: ["Organic", "Conventional"], icon: "fa-leaf" }
        }
      },
      packaged: {
        name: "Packaged Food",
        specs: {
          brand: { label: "Brand", options: ["Nestle", "Unilever", "Kellogg's", "Cadbury"], icon: "fa-box" },
          weight: { label: "Weight", options: ["100g", "250g", "500g", "1kg"], icon: "fa-weight" },
          dietary: { label: "Dietary", options: ["Vegan", "Halal", "Kosher", "Gluten-Free", "None"], icon: "fa-utensils" }
        }
      },
      beverages: {
        name: "Beverages",
        specs: {
          brand: { label: "Brand", options: ["Coca-Cola", "Pepsi", "Red Bull", "Nescafe"], icon: "fa-wine-bottle" },
          volume: { label: "Volume", options: ["250ml", "330ml", "500ml", "1L", "2L"], icon: "fa-flask" },
          type: { label: "Type", options: ["Soda", "Juice", "Water", "Energy", "Coffee"], icon: "fa-glass-whiskey" }
        }
      }
    }
  },
  sports: {
    subcategories: {
      equipment: {
        name: "Equipment",
        specs: {
          brand: { label: "Brand", options: ["Nike", "Adidas", "Under Armour", "Puma"], icon: "fa-dumbbell" },
          color: { label: "Color", options: ["Black", "Blue", "Red", "Green", "Yellow"], icon: "fa-palette" }
        }
      },
      supplements: {
        name: "Supplements",
        specs: {
          brand: { label: "Brand", options: ["Optimum Nutrition", "BSN", "MuscleTech", "Dymatize"], icon: "fa-capsules" },
          flavor: { label: "Flavor", options: ["Chocolate", "Vanilla", "Strawberry", "Cookies & Cream"], icon: "fa-ice-cream" },
          type: { label: "Type", options: ["Whey Protein", "Creatine", "BCAA", "Pre-Workout"], icon: "fa-bolt" }
        }
      }
    }
  },
  toys: {
    subcategories: {
      toys: {
        name: "Toys",
        specs: {
          age_range: { label: "Age Range", options: ["0-2 years", "3-5 years", "6-8 years", "9-12 years", "13+ years"], icon: "fa-baby" },
          brand: { label: "Brand", options: ["LEGO", "Mattel", "Hasbro", "Fisher-Price"], icon: "fa-puzzle-piece" },
          material: { label: "Material", options: ["Plastic", "Wood", "Fabric", "Metal"], icon: "fa-shapes" }
        }
      },
      baby: {
        name: "Baby Products",
        specs: {
          age_range: { label: "Age Range", options: ["Newborn", "0-6 months", "6-12 months", "1-2 years"], icon: "fa-baby" },
          brand: { label: "Brand", options: ["Pampers", "Huggies", "Johnson's", "Aveeno"], icon: "fa-baby-carriage" },
          size: { label: "Size", options: ["Newborn", "Small", "Medium", "Large", "X-Large"], icon: "fa-ruler" }
        }
      }
    }
  }
};

const categoryIcons: Record<string, string> = {
  electronics: "📱",
  footwear: "👟",
  clothing: "👕",
  beauty: "💄",
  furniture: "🛋️",
  food: "🍎",
  sports: "🏋️",
  toys: "🧸",
};

export default function AddProductModal({ isOpen, onClose, onSuccess }: AddProductModalProps) {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    price: "",
    shippingFee: "",
    weight: "",
    lowStockAlert: "",
  });
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, StringSet>>({});
  const [customSpecOptions, setCustomSpecOptions] = useState<Record<string, string[]>>({});
  const [variants, setVariants] = useState<Variant[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; type: string; message: string }[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customInputKey, setCustomInputKey] = useState<string | null>(null);
  const [customInputValue, setCustomInputValue] = useState("");

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedSpecs({});
    setCustomSpecOptions({});
    setVariants([]);
    setFormData({ name: "", description: "", price: "", shippingFee: "", weight: "", lowStockAlert: "" });
    setImagePreview("");
    setSelectedImage(null);
    setCustomInputKey(null);
    setCustomInputValue("");
  };

  const showToast = (type: string, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Image must be less than 5MB");
      return;
    }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadImageFile = async () => {
    if (!selectedImage || !user) return null;
    setUploadingImage(true);
    try {
      const result = await bunnyStorage.uploadFile(user, selectedImage, "products");
      if (result.success && result.url) {
        return result.url;
      }
      showToast("error", "Failed to upload image");
      return null;
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast("error", "Failed to upload image");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setSelectedSpecs({});
    setVariants([]);
  };

  const selectSubcategory = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
    setSelectedSpecs({});
    setVariants([]);
  };

  const getCurrentSpecs = () => {
    if (!selectedCategory || !selectedSubcategory) return {};
    return categoryData[selectedCategory]?.subcategories[selectedSubcategory]?.specs || {};
  };

  const toggleSpec = (specKey: string, option: string) => {
    const newSpecs = { ...selectedSpecs };
    if (!newSpecs[specKey]) {
      newSpecs[specKey] = new Set<string>();
    }
    
    if (newSpecs[specKey].has(option)) {
      newSpecs[specKey].delete(option);
      if (newSpecs[specKey].size === 0) {
        delete newSpecs[specKey];
      }
    } else {
      newSpecs[specKey].add(option);
    }
    
    setSelectedSpecs(newSpecs);
    generateVariants(newSpecs);
  };

  const addCustomOption = (specKey: string) => {
    setCustomInputKey(specKey);
    setCustomInputValue("");
  };

  const saveCustomOption = () => {
    if (!customInputKey || !customInputValue.trim()) return;
    
    const value = customInputValue.trim();
    const newCustomOptions = { ...customSpecOptions };
    
    if (!newCustomOptions[customInputKey]) {
      newCustomOptions[customInputKey] = [];
    }
    
    if (!newCustomOptions[customInputKey].includes(value)) {
      newCustomOptions[customInputKey].push(value);
    }
    
    setCustomSpecOptions(newCustomOptions);
    setCustomInputKey(null);
    setCustomInputValue("");
    
    setTimeout(() => toggleSpec(customInputKey, value), 50);
  };

  const cancelCustomOption = () => {
    setCustomInputKey(null);
    setCustomInputValue("");
  };

  const generateSKU = (specs: Record<string, string>): string => {
    const productName = formData.name || "PRODUCT";
    const base = productName.toUpperCase().replace(/\s+/g, "-").substring(0, 10);
    const specString = Object.values(specs).join("-").replace(/\s+/g, "").toUpperCase();
    return `${base}-${specString}`;
  };

  const generateVariants = (specs: Record<string, Set<string>>) => {
    const specEntries = Object.entries(specs).filter(([_, set]) => set.size > 0);
    
    if (specEntries.length === 0) {
      setVariants([]);
      return;
    }

    const combinations = specEntries.map(([_, set]) => Array.from(set)).reduce<string[][]>(
      (acc, curr) => acc.flatMap(a => curr.map(c => [...a, c])), 
      [[]]
    );

    if (combinations.length > 12) {
      setVariants([]);
      showToast("warning", `Too many combinations (${combinations.length}). Maximum 12 variants allowed. Please reduce selected options.`);
      return;
    }
    
    if (combinations.length === 0) {
      setVariants([]);
      return;
    }
    
    const newVariants: Variant[] = combinations.map((combo, index) => {
      const variantSpecs: Record<string, string> = {};
      specEntries.forEach(([key, _], idx) => {
        variantSpecs[key] = combo[idx];
      });
      
      return {
        id: index + 1,
        specs: variantSpecs,
        sku: generateSKU(variantSpecs),
        price: "",
        stock: "",
      };
    });
    
    setVariants(newVariants);
  };

  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const saveProduct = async () => {
    if (!user) return;
    
    if (!formData.name.trim()) {
      showToast("error", "Please enter product name");
      return;
    }
    
    if (!selectedCategory || !selectedSubcategory) {
      showToast("error", "Please select category and subcategory");
      return;
    }
    
    if (variants.length === 0) {
      showToast("error", "Please select at least one specification option");
      return;
    }

    const hasValidVariants = variants.some(v => v.price && parseFloat(v.price) > 0 && v.stock && parseInt(v.stock) > 0);
    if (!hasValidVariants) {
      showToast("error", "Please add price and stock for at least one variant");
      return;
    }

    const hasPrice = formData.price && parseFloat(formData.price) > 0;
    if (!hasPrice) {
      showToast("error", "Please enter a base price for the product");
      return;
    }

    setSaving(true);
    
    try {
      let imageUrl: string | undefined;
      if (selectedImage) {
        const uploaded = await uploadImageFile();
        if (uploaded) imageUrl = uploaded;
      }

      const filters: Record<string, string[]> = {};
      Object.entries(selectedSpecs).forEach(([key, set]) => {
        filters[key] = Array.from(set);
      });

      const allSpecs = getCurrentSpecs();
      const allOptionsFilters: Record<string, string[]> = {};
      Object.entries(allSpecs).forEach(([key, spec]) => {
        const defaultOptions: string[] = spec.options || [];
        const customOptions: string[] = customSpecOptions[key] || [];
        const allOptions: string[] = [...new Set([...defaultOptions, ...customOptions])];
        allOptionsFilters[key] = allOptions;
      });

      const variantsWithPrice = variants.map(v => ({
        ...v,
        price: parseFloat(v.price) || 0,
        stock: parseInt(v.stock) || 0,
      }));

      const totalStock = variantsWithPrice.reduce((sum, v) => sum + v.stock, 0);
      const minPrice = variantsWithPrice.length > 0 && variantsWithPrice.some(v => v.price > 0)
        ? Math.min(...variantsWithPrice.filter(v => v.price > 0).map(v => v.price))
        : parseFloat(formData.price) || 0;

      const newProduct = await productService.createProduct(user, {
        name: formData.name,
        description: formData.description || undefined,
        category: selectedCategory,
        categoryName: categoryData[selectedCategory]?.subcategories[selectedSubcategory!]?.name || selectedSubcategory,
        subcategory: selectedSubcategory,
        filters: allOptionsFilters,
        price: minPrice,
        stock: totalStock,
        shippingFee: parseFloat(formData.shippingFee) || 0,
        weight: parseFloat(formData.weight) || undefined,
        lowStockAlert: parseInt(formData.lowStockAlert) || 5,
        image: imageUrl,
        status: "active" as const,
        variants: variantsWithPrice,
      });

      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      await productService.updateProduct(user, newProduct.id, {
        orderLink: `${baseUrl}/order?tenant=${user.uid}&product=${newProduct.id}`,
      });

      showToast("success", `Product "${formData.name}" with ${variants.length} variants saved!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error saving product:", error);
      showToast("error", "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentSpecs = getCurrentSpecs();
  const customOptions = customSpecOptions[selectedSubcategory || ""] || [];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-green-50 to-purple-50">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold flex items-center gap-3">
                <i className="fas fa-plus-circle text-green-500"></i>
                Add New Product
              </h2>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center text-xl text-slate-500">
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto p-8 flex-1" style={{ maxHeight: "calc(90vh - 180px)" }}>
            
            {/* SECTION 1: Basic Information */}
            <div className="mb-8 pb-6 border-b border-slate-200">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500 mb-5">
                <i className="fas fa-info-circle"></i>
                Basic Information
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block font-semibold text-sm mb-2 text-slate-700">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange}
                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 bg-slate-50"
                    placeholder="e.g., iPhone 15 Pro Max"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-sm mb-2 text-slate-700">
                    Description
                  </label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 bg-slate-50 resize-none"
                    placeholder="Describe your product..."
                  />
                </div>
              </div>
            </div>

            {/* SECTION 1.5: Pricing & Shipping */}
            <div className="mb-8 pb-6 border-b border-slate-200">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500 mb-5">
                <i className="fas fa-dollar-sign"></i>
                Pricing & Shipping
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block font-semibold text-sm mb-2 text-slate-700">
                    Base Price (KES)
                  </label>
                  <input 
                    type="number" 
                    name="price" 
                    value={formData.price} 
                    onChange={handleInputChange}
                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 bg-slate-50"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-sm mb-2 text-slate-700">
                    Shipping Fee (KES)
                  </label>
                  <input 
                    type="number" 
                    name="shippingFee" 
                    value={formData.shippingFee || ""} 
                    onChange={handleInputChange}
                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 bg-slate-50"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-sm mb-2 text-slate-700">
                    Weight (kg)
                  </label>
                  <input 
                    type="number" 
                    name="weight" 
                    value={formData.weight || ""} 
                    onChange={handleInputChange}
                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 bg-slate-50"
                    placeholder="0.0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-sm mb-2 text-slate-700">
                    Low Stock Alert
                  </label>
                  <input 
                    type="number" 
                    name="lowStockAlert" 
                    value={formData.lowStockAlert || ""} 
                    onChange={handleInputChange}
                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 bg-slate-50"
                    placeholder="5"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Category Selection */}
            <div className="mb-8 pb-6 border-b border-slate-200">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500 mb-5">
                <i className="fas fa-tags"></i>
                Select Category
              </div>
              
              {/* Main Categories */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {Object.entries(categoryIcons).map(([key, icon]) => (
                  <button
                    key={key}
                    onClick={() => selectCategory(key)}
                    className={`p-4 border-2 border-slate-200 rounded-xl cursor-pointer text-center transition-all hover:border-green-500 hover:-translate-y-1 hover:shadow-lg ${selectedCategory === key ? "border-green-500 bg-gradient-to-br from-green-100 to-teal-100 shadow-md" : "bg-white"}`}
                  >
                    <div className={`text-3xl mb-2 ${selectedCategory === key ? "scale-110" : ""}`}>{icon}</div>
                    <div className="font-bold text-sm text-slate-700 capitalize">{key}</div>
                  </button>
                ))}
              </div>

              {/* Subcategories */}
              {selectedCategory && categoryData[selectedCategory] && (
                <div className="bg-slate-50 rounded-xl p-5 border-2 border-slate-200">
                  <div className="section-title mb-4">Select Subcategory</div>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(categoryData[selectedCategory].subcategories).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => selectSubcategory(key)}
                        className={`px-5 py-2.5 border-2 border-slate-200 rounded-full bg-white cursor-pointer font-semibold text-sm transition-all ${selectedSubcategory === key ? "bg-gradient-to-r from-green-500 to-teal-600 text-white border-green-500 shadow-lg" : "hover:border-green-500 hover:text-green-500"}`}
                      >
                        {value.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: Specifications Builder */}
            {selectedSubcategory && (
              <div className="mb-8 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500 mb-5">
                  <i className="fas fa-cogs"></i>
                  Configure Specifications <span className="font-normal normal-case">(Click buttons to select)</span>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {Object.entries(currentSpecs).map(([specKey, spec]) => (
                    <div key={specKey} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm">
                          <i className={`fas ${spec.icon}`}></i>
                        </div>
                        <div className="font-bold text-base">{spec.label}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {spec.options.map((option: string) => {
                          const isSelected = selectedSpecs[specKey]?.has(option);
                          return (
                            <button
                              key={option}
                              onClick={() => toggleSpec(specKey, option)}
                              className={`px-4 py-2 rounded-full border-2 font-semibold text-sm transition-all flex items-center gap-2 ${isSelected 
                                ? "bg-gradient-to-r from-green-500 to-teal-600 text-white border-green-500 shadow-md" 
                                : "bg-white border-slate-200 text-slate-700 hover:border-green-500 hover:text-green-500"}`}
                            >
                              {isSelected && <i className="fas fa-check text-xs"></i>}
                              {option}
                            </button>
                          );
                        })}
                        
                        {/* Custom Options */}
                        {(customSpecOptions[specKey] || []).map((option: string) => {
                          const isSelected = selectedSpecs[specKey]?.has(option);
                          return (
                            <button
                              key={option}
                              onClick={() => toggleSpec(specKey, option)}
                              className={`px-4 py-2 rounded-full border-2 font-semibold text-sm transition-all flex items-center gap-2 ${isSelected 
                                ? "bg-gradient-to-r from-green-500 to-teal-600 text-white border-green-500 shadow-md" 
                                : "bg-white border-slate-200 text-slate-700 hover:border-green-500 hover:text-green-500"}`}
                            >
                              {isSelected && <i className="fas fa-check text-xs"></i>}
                              {option}
                            </button>
                          );
                        })}
                        
                        {/* Add Custom Button */}
                        <button
                          onClick={() => addCustomOption(specKey)}
                          className="px-4 py-2 rounded-full border-2 border-dashed border-slate-300 bg-transparent cursor-pointer font-semibold text-sm text-slate-500 hover:border-green-500 hover:text-green-500 transition-all flex items-center gap-2"
                        >
                          <i className="fas fa-plus"></i>
                          Add Custom
                        </button>
                        
                        {/* Custom Input */}
                        {customInputKey === specKey && (
                          <div className="flex gap-2 items-center w-full">
                            <input
                              type="text"
                              value={customInputValue}
                              onChange={(e) => setCustomInputValue(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && saveCustomOption()}
                              placeholder="Enter value..."
                              className="px-3 py-2 border-2 border-green-500 rounded-full text-sm flex-1 outline-none"
                              autoFocus
                            />
                            <button
                              onClick={saveCustomOption}
                              className="px-3 py-2 bg-green-500 text-white rounded-full text-sm"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                            <button
                              onClick={cancelCustomOption}
                              className="px-3 py-2 bg-red-500 text-white rounded-full text-sm"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 4: Variants Preview */}
            {variants.length > 0 && (
              <div className="mb-8 pb-6 border-b border-slate-200">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                    <i className="fas fa-cubes text-green-500"></i>
                    Generated Variants
                  </div>
                  <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold">
                    {variants.length} variants
                  </span>
                </div>
                
                <div className="grid gap-4 max-h-80 overflow-y-auto">
                  {variants.map((variant, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-4 gap-4 items-center">
                      <div>
                        <div className="font-bold text-sm mb-1">Variant #{variant.id}</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(variant.specs).map(([key, value]) => (
                            <span key={key} className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-500">
                              {value}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">SKU</label>
                        <input 
                          type="text" 
                          value={variant.sku}
                          onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-green-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">Price (KES)</label>
                        <input 
                          type="number" 
                          value={variant.price}
                          onChange={(e) => updateVariant(idx, "price", e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-green-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">Stock</label>
                        <input 
                          type="number" 
                          value={variant.stock}
                          onChange={(e) => updateVariant(idx, "stock", e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-green-500 outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 5: Images */}
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500 mb-5">
                <i className="fas fa-images"></i>
                Product Images
              </div>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all"
              >
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); setImagePreview(""); setSelectedImage(null); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-4xl text-slate-400 mb-3">
                      <i className="fas fa-cloud-upload-alt"></i>
                    </div>
                    <div className="font-semibold text-slate-700 mb-1">Click to upload images</div>
                    <div className="text-sm text-slate-500">or drag and drop files here</div>
                  </>
                )}
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-3 bg-white text-slate-700 border-2 border-slate-200 rounded-xl font-bold text-sm hover:border-green-500 hover:text-green-500 transition-all flex items-center gap-2"
            >
              <i className="fas fa-times"></i>
              Cancel
            </button>
            <button 
              onClick={saveProduct}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  Save Product
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-[slideIn_0.3s_ease] ${toast.type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}
          >
            <i className={`fas ${toast.type === "error" ? "fa-exclamation-circle" : "fa-check-circle"}`}></i>
            {toast.message}
          </div>
        ))}
      </div>
    </>
  );
}