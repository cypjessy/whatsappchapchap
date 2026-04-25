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
  initialStock: string;
  lowStockAlert: string;
}

interface ShippingMethod {
  id: string;
  name: string;
  price: string;
  enabled: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  details: string;
  enabled: boolean;
}

interface ProductImage {
  id: number;
  url: string;
  isMain: boolean;
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
          size: { label: "Size (US)", options: ["6", "7", "8", "9", "10", "11", "12", "13"], icon: "fa-ruler" },
          color: { label: "Color", options: ["Black", "White", "Red", "Blue", "Green", "Yellow", "Multi"], icon: "fa-palette" },
          gender: { label: "Gender", options: ["Men", "Women", "Unisex", "Kids"], icon: "fa-venus-mars" },
          material: { label: "Material", options: ["Leather", "Canvas", "Mesh", "Synthetic", "Suede"], icon: "fa-layer-group" }
        }
      },
      boots: {
        name: "Boots",
        specs: {
          brand: { label: "Brand", options: ["Timberland", "Dr. Martens", "Caterpillar", "Red Wing"], icon: "fa-shoe-prints" },
          size: { label: "Size", options: ["6", "7", "8", "9", "10", "11", "12"], icon: "fa-ruler" },
          color: { label: "Color", options: ["Brown", "Black", "Tan", "Gray"], icon: "fa-palette" },
          gender: { label: "Gender", options: ["Men", "Women", "Unisex"], icon: "fa-venus-mars" },
          heel_height: { label: "Heel Height", options: ["Flat", "Low (1-2\")", "Mid (2-3\")", "High (3\"+)"], icon: "fa-arrows-alt-v" }
        }
      },
      sandals: {
        name: "Sandals/Slippers",
        specs: {
          brand: { label: "Brand", options: ["Birkenstock", "Crocs", "Havaianas", "Nike"], icon: "fa-shoe-prints" },
          size: { label: "Size", options: ["5", "6", "7", "8", "9", "10", "11", "12"], icon: "fa-ruler" },
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
          size: { label: "Size", options: ["XS", "S", "M", "L", "XL", "XXL", "3XL"], icon: "fa-ruler" },
          color: { label: "Color", options: ["Black", "White", "Gray", "Navy", "Red", "Blue", "Green", "Yellow", "Pink"], icon: "fa-palette" },
          gender: { label: "Gender", options: ["Men", "Women", "Unisex"], icon: "fa-venus-mars" },
          material: { label: "Material", options: ["Cotton", "Polyester", "Linen", "Silk", "Wool"], icon: "fa-layer-group" },
          style: { label: "Style", options: ["Casual", "Formal", "Sport", "Vintage"], icon: "fa-tshirt" }
        }
      },
      trousers: {
        name: "Trousers/Jeans",
        specs: {
          size: { label: "Size", options: ["28", "30", "32", "34", "36", "38", "40", "42"], icon: "fa-ruler" },
          color: { label: "Color", options: ["Blue", "Black", "Gray", "Khaki", "White"], icon: "fa-palette" },
          gender: { label: "Gender", options: ["Men", "Women"], icon: "fa-venus-mars" },
          fit: { label: "Fit", options: ["Slim", "Regular", "Relaxed", "Skinny", "Bootcut"], icon: "fa-arrows-alt-h" }
        }
      },
      dresses: {
        name: "Dresses",
        specs: {
          size: { label: "Size", options: ["XS", "S", "M", "L", "XL", "XXL"], icon: "fa-ruler" },
          color: { label: "Color", options: ["Black", "Red", "Blue", "White", "Pink", "Floral", "Green"], icon: "fa-palette" },
          style: { label: "Style", options: ["Casual", "Evening", "Cocktail", "Maxi", "Midi"], icon: "fa-female" },
          occasion: { label: "Occasion", options: ["Party", "Wedding", "Office", "Casual", "Beach"], icon: "fa-glass-cheers" }
        }
      },
      jackets: {
        name: "Jackets/Coats",
        specs: {
          size: { label: "Size", options: ["XS", "S", "M", "L", "XL", "XXL", "3XL"], icon: "fa-ruler" },
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
    initialStock: "",
    lowStockAlert: "",
  });
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [customSubcategories, setCustomSubcategories] = useState<Record<string, { name: string; specs: Record<string, { label: string; options: string[]; icon: string }> }>>({});
  const [showCustomSubcategory, setShowCustomSubcategory] = useState(false);
  const [customSubcategoryInput, setCustomSubcategoryInput] = useState("");
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, StringSet>>({});
  const [customSpecOptions, setCustomSpecOptions] = useState<Record<string, string[]>>({});
  const [variants, setVariants] = useState<Variant[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; type: string; message: string }[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([
    { id: "standard", name: "Standard Delivery", price: "500", enabled: true },
    { id: "express", name: "Express Delivery", price: "1000", enabled: true },
    { id: "pickup", name: "Store Pickup", price: "0", enabled: true },
  ]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: "mpesa", name: "M-Pesa", details: "Enter your M-Pesa number for payment instructions", enabled: true },
    { id: "cod", name: "Cash on Delivery", details: "Pay when you receive", enabled: true },
    { id: "bank", name: "Bank Transfer", details: "Bank: Example Bank\nAccount: 1234567890", enabled: true },
  ]);
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
    setFormData({ name: "", description: "", price: "", initialStock: "", lowStockAlert: "" });
    setProductImages([]);
    setSelectedImage(null);
    setCustomInputKey(null);
    setCustomInputValue("");
    setCustomSubcategories({});
  };

  const addCustomSubcategory = () => {
    if (!selectedCategory || !customSubcategoryInput.trim()) return;
    const key = customSubcategoryInput.trim().toLowerCase().replace(/\s+/g, "_");
    
    // Get default specs from the first subcategory of the parent category
    const subcategories = categoryData[selectedCategory]?.subcategories || {};
    const firstSubcategoryKey = Object.keys(subcategories)[0];
    const firstSubcategory = subcategories[firstSubcategoryKey];
    const parentCategorySpecs = firstSubcategory?.specs || {};
    
    // Use parent category's specs as default for custom subcategory
    const defaultSpecs: Record<string, { label: string; options: string[]; icon: string }> = {};
    Object.keys(parentCategorySpecs).forEach(specKey => {
      defaultSpecs[specKey] = {
        ...parentCategorySpecs[specKey],
        options: [...parentCategorySpecs[specKey].options]
      };
    });
    
    setCustomSubcategories(prev => ({ 
      ...prev, 
      [key]: { 
        name: customSubcategoryInput.trim(),
        specs: defaultSpecs
      } 
    }));
    setSelectedSubcategory(key);
    setCustomSubcategoryInput("");
    setShowCustomSubcategory(false);
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
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newImages: ProductImage[] = [];
    
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        showToast("error", "Image must be less than 5MB");
        return;
      }
      
      const id = Date.now() + Math.random();
      const reader = new FileReader();
      reader.onload = () => {
        setProductImages(prev => [...prev, {
          id,
          url: reader.result as string,
          isMain: prev.length === 0 && newImages.length === 0
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: number) => {
    setProductImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (filtered.length > 0 && !filtered.some(img => img.isMain)) {
        filtered[0].isMain = true;
      }
      return filtered;
    });
  };

  const setMainImage = (id: number) => {
    setProductImages(prev => prev.map(img => ({
      ...img,
      isMain: img.id === id
    })));
  };

  const uploadAllImages = async (): Promise<string[]> => {
    if (productImages.length === 0 || !user) return [];
    
    setUploadingImage(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const img of productImages) {
        if (img.url.startsWith('data:')) {
          const base64Response = await fetch(img.url);
          const blob = await base64Response.blob();
          const file = new File([blob], `image_${img.id}.jpg`, { type: 'image/jpeg' });
          
          const result = await bunnyStorage.uploadFile(user, file, "products");
          if (result.success && result.url) {
            uploadedUrls.push(result.url);
          }
        } else {
          uploadedUrls.push(img.url);
        }
      }
      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading images:", error);
      showToast("error", "Failed to upload images");
      return [];
    } finally {
      setUploadingImage(false);
    }
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
    setCustomSubcategories({});
  };

  const selectSubcategory = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
    setSelectedSpecs({});
    setVariants([]);
  };

  const getCurrentSpecs = () => {
    if (!selectedCategory || !selectedSubcategory) return {};
    
    // Check if it's a custom subcategory
    if (customSubcategories[selectedSubcategory]) {
      return customSubcategories[selectedSubcategory].specs || {};
    }
    
    // Otherwise get from predefined category data
    return categoryData[selectedCategory]?.subcategories?.[selectedSubcategory]?.specs || {};
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

    const hasStock = formData.initialStock && parseInt(formData.initialStock) > 0;
    if (!hasStock) {
      showToast("error", "Please enter initial stock quantity");
      return;
    }

    setSaving(true);
    
    try {
      let imageUrl: string | undefined;
      let images: string[] = [];
      
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
      const stock = totalStock > 0 ? totalStock : parseInt(formData.initialStock) || 0;
      const minPrice = variantsWithPrice.length > 0 && variantsWithPrice.some(v => v.price > 0)
        ? Math.min(...variantsWithPrice.filter(v => v.price > 0).map(v => v.price))
        : parseFloat(formData.price) || 0;
      
      if (productImages.length > 0) {
        images = await uploadAllImages();
        if (images.length > 0) {
          imageUrl = images[0];
        }
      }

      const filters: Record<string, string[]> = {};
      Object.entries(selectedSpecs).forEach(([key, set]) => {
        filters[key] = Array.from(set);
      });

      const productToSave = await productService.createProduct(user, {
        name: formData.name,
        description: formData.description || undefined,
        category: selectedCategory,
        price: minPrice,
        stock: stock,
        image: imageUrl,
        status: "active" as const,
      });

      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      await productService.updateProduct(user, productToSave.id, {
        orderLink: `${baseUrl}/order?tenant=tenant_${user.uid}&product=${productToSave.id}`,
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="px-4 md:px-8 py-4 md:py-6 border-b border-slate-200 bg-gradient-to-r from-green-50 to-purple-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-2xl font-extrabold flex items-center gap-2 md:gap-3">
                <i className="fas fa-plus-circle text-green-500"></i>
                <span className="md:hidden">Add Product</span>
                <span className="hidden md:inline">Add New Product</span>
              </h2>
              <button onClick={onClose} className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-100 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center text-lg md:text-xl text-slate-500">
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto p-4 md:p-8 flex-1" style={{ maxHeight: "calc(90vh - 140px)" }}>
            
            {/* SECTION 1: Basic Information */}
            <div className="mb-6 md:mb-8 pb-6 border-b border-slate-200">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500 mb-4 md:mb-5">
                <i className="fas fa-info-circle"></i>
                Basic Info
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block font-semibold text-sm mb-2 text-slate-700">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange}
                    className="w-full px-3 md:px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 bg-slate-50"
                    placeholder="e.g., iPhone 15 Pro Max"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block font-semibold text-sm mb-2 text-slate-700">
                    Description
                  </label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 md:px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 bg-slate-50 resize-none"
                    placeholder="Describe your product..."
                  />
                </div>
              </div>
            </div>

            {/* SECTION 1.5: Pricing & Shipping */}
            <div className="mb-6 md:mb-8 pb-6 border-b border-slate-200">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500 mb-4 md:mb-5">
                <i className="fas fa-dollar-sign"></i>
                Pricing & Stock
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block font-semibold text-sm mb-2 text-slate-700">
                    Price (KES) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    name="price" 
                    value={formData.price} 
                    onChange={handleInputChange}
                    className="w-full px-3 md:px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 bg-slate-50"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-sm mb-2 text-slate-700">
                    Initial Stock <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    name="initialStock" 
                    value={formData.initialStock || ""} 
                    onChange={handleInputChange}
                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 bg-slate-50"
                    placeholder="e.g., 100"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-sm mb-2 text-slate-700">
                    Low Stock Alert (notify when stock falls below)
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

            {/* SECTION 1.6: Shipping Methods */}
            <div className="mb-8 pb-6 border-b border-slate-200">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500 mb-5">
                <i className="fas fa-shipping-fast"></i>
                Shipping Methods
              </div>
              <div className="space-y-4">
                {shippingMethods.map((method) => (
                  <div key={method.id} className="flex items-center gap-4 p-4 border-2 border-slate-200 rounded-xl">
                    <input
                      type="checkbox"
                      checked={method.enabled}
                      onChange={(e) => {
                        const updated = shippingMethods.map(m => 
                          m.id === method.id ? { ...m, enabled: e.target.checked } : m
                        );
                        setShippingMethods(updated);
                      }}
                      className="w-5 h-5 text-green-500 rounded focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{method.name}</div>
                      {method.id !== "pickup" && (
                        <input
                          type="number"
                          value={method.price}
                          onChange={(e) => {
                            const updated = shippingMethods.map(m =>
                              m.id === method.id ? { ...m, price: e.target.value } : m
                            );
                            setShippingMethods(updated);
                          }}
                          disabled={!method.enabled}
                          className="mt-2 px-3 py-2 border-2 border-slate-200 rounded-lg text-sm w-32"
                          placeholder="Price (KES)"
                        />
                      )}
                      {method.id === "pickup" && (
                        <div className="text-xs text-green-500 mt-1">Free - Customer picks up from store</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 1.7: Payment Methods */}
            <div className="mb-8 pb-6 border-b border-slate-200">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500 mb-5">
                <i className="fas fa-credit-card"></i>
                Payment Methods
              </div>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="p-4 border-2 border-slate-200 rounded-xl">
                    <div className="flex items-center gap-4 mb-3">
                      <input
                        type="checkbox"
                        checked={method.enabled}
                        onChange={(e) => {
                          const updated = paymentMethods.map(m =>
                            m.id === method.id ? { ...m, enabled: e.target.checked } : m
                          );
                          setPaymentMethods(updated);
                        }}
                        className="w-5 h-5 text-green-500 rounded focus:ring-green-500"
                      />
                      <div className="font-semibold text-sm">{method.name}</div>
                    </div>
                    {method.enabled && (
                      <textarea
                        value={method.details}
                        onChange={(e) => {
                          const updated = paymentMethods.map(m =>
                            m.id === method.id ? { ...m, details: e.target.value } : m
                          );
                          setPaymentMethods(updated);
                        }}
                        rows={method.id === "bank" ? 3 : 2}
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm"
                        placeholder={method.id === "mpesa" ? "Enter M-Pesa instructions..." : method.id === "bank" ? "Bank: Example Bank\nAccount: 1234567890" : "COD instructions..."}
                      />
                    )}
                  </div>
                ))}
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
                    {Object.entries(customSubcategories).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => selectSubcategory(key)}
                        className={`px-5 py-2.5 border-2 border-slate-200 rounded-full bg-white cursor-pointer font-semibold text-sm transition-all ${selectedSubcategory === key ? "bg-gradient-to-r from-green-500 to-teal-600 text-white border-green-500 shadow-lg" : "hover:border-green-500 hover:text-green-500"}`}
                      >
                        {value.name}
                      </button>
                    ))}
                    <button
                      onClick={() => setShowCustomSubcategory(true)}
                      className="px-5 py-2.5 border-2 border-dashed border-green-500 rounded-full bg-white cursor-pointer font-semibold text-sm text-green-500 hover:bg-green-50 transition-all flex items-center gap-2"
                    >
                      <i className="fas fa-plus"></i> Add Custom
                    </button>
                  </div>
                  
                  {showCustomSubcategory && (
                    <div className="mt-4 flex gap-2">
                      <input
                        type="text"
                        value={customSubcategoryInput}
                        onChange={(e) => setCustomSubcategoryInput(e.target.value)}
                        placeholder="Enter custom subcategory name"
                        className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500"
                        onKeyPress={(e) => e.key === "Enter" && addCustomSubcategory()}
                      />
                      <button
                        onClick={addCustomSubcategory}
                        className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-semibold text-sm"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => { setShowCustomSubcategory(false); setCustomSubcategoryInput(""); }}
                        className="px-4 py-2.5 border-2 border-slate-200 rounded-xl font-semibold text-sm hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
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
                Product Images <span className="text-slate-400 font-normal normal-case">(select multiple)</span>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mb-4">
                {productImages.map((img) => (
                  <div key={img.id} className={`relative rounded-xl overflow-hidden border-2 ${img.isMain ? "border-green-500" : "border-slate-200"}`}>
                    <img src={img.url} alt="Product" className="w-full h-24 object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex justify-between">
                      <button 
                        onClick={() => setMainImage(img.id)}
                        className={`text-xs px-2 py-1 rounded ${img.isMain ? "bg-green-500 text-white" : "bg-white/20 text-white hover:bg-white/30"}`}
                      >
                        {img.isMain ? "✓ Main" : "Set Main"}
                      </button>
                      <button 
                        onClick={() => removeImage(img.id)}
                        className="text-white hover:text-red-400"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    </div>
                    {img.isMain && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                        Main
                      </div>
                    )}
                  </div>
                ))}
                
                <label className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all flex flex-col items-center justify-center h-24">
                  <i className="fas fa-plus text-slate-400 text-xl mb-1"></i>
                  <span className="text-xs text-slate-500">Add More</span>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>
              
              <p className="text-xs text-slate-500">
                Click on an image to set it as the main product image. You can add multiple images to show different variants or angles.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 md:px-8 py-4 md:py-5 border-t border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-end gap-2 md:gap-4">
            <button 
              onClick={onClose}
              className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-white text-slate-700 border-2 border-slate-200 rounded-xl font-bold text-sm hover:border-green-500 hover:text-green-500 transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              <i className="fas fa-times"></i>
              Cancel
            </button>
            <button 
              onClick={saveProduct}
              disabled={saving}
              className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="md:hidden">Saving...</span>
                  <span className="hidden md:inline">Saving...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  <span className="md:hidden">Save</span>
                  <span className="hidden md:inline">Save Product</span>
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