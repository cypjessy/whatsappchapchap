// ─── Types ───────────────────────────────────────────────────────────────────

export interface SpecField {
  label: string;
  options: string[];
  icon: string;
  multiple?: boolean;
  allowCustom?: boolean;  // Allow sellers to add custom values
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

// ─── FULL EXPANDED DATA ─────────────────────────────────────────────────────────────

const categoryData: Record<string, Category> = {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. ELECTRONICS & MOBILE (EXPANDED)
  // ═══════════════════════════════════════════════════════════════════════════
  electronics: {
    id: "electronics",
    name: "Electronics & Mobile",
    icon: "📱",
    description: "Phones, laptops, TVs, audio, tech accessories, wearables, and components",
    subcategories: {
      smartphones: {
        name: "Smartphones",
        icon: "fa-mobile-alt",
        specs: {
          brand: { label: "Brand", options: ["Samsung", "Apple", "Xiaomi", "Oppo", "Realme", "Infinix", "Tecno", "Itel", "Nokia", "Huawei", "Google Pixel", "OnePlus", "Vivo", "Motorola", "Other"], icon: "fa-tag", allowCustom: true },
          storage: { label: "Storage", options: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"], icon: "fa-hdd" },
          ram: { label: "RAM", options: ["2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB"], icon: "fa-memory" },
          condition: { label: "Condition", options: ["Brand New", "Open Box", "Refurbished", "Used - Like New", "Used - Good", "Used - Fair", "For Parts"], icon: "fa-star" },
          network: { label: "Network", options: ["4G", "5G", "4G & 5G", "3G"], icon: "fa-signal" },
          screen_size: { label: "Screen Size", options: ['5.5"', '6.1"', '6.3"', '6.5"', '6.7"', '6.9"', '7"'], icon: "fa-expand" },
          color: { label: "Color", options: ["Black", "White", "Blue", "Red", "Gold", "Silver", "Green", "Purple", "Yellow", "Orange", "Pink", "Rose Gold"], icon: "fa-palette", allowCustom: true },
          battery: { label: "Battery", options: ["Under 3000mAh", "3000-4000mAh", "4000-5000mAh", "5000mAh+", "6000mAh+"], icon: "fa-battery-full" },
          dual_sim: { label: "Dual SIM", options: ["Yes", "No", "Hybrid Slot"], icon: "fa-sim-card" },
          warranty: { label: "Warranty", options: ["None", "30 Days", "3 Months", "6 Months", "1 Year", "2 Years"], icon: "fa-file-contract" },
        }
      },
      laptops_computers: {
        name: "Laptops & Computers",
        icon: "fa-laptop",
        specs: {
          brand: { label: "Brand", options: ["HP", "Dell", "Lenovo", "Apple", "Asus", "Acer", "Microsoft", "Huawei", "Toshiba", "MSI", "Razer", "Samsung", "Other"], icon: "fa-tag", allowCustom: true },
          processor: { label: "Processor", options: ["Intel Core i3", "Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7", "AMD Ryzen 9", "Apple M1", "Apple M2", "Apple M3", "Intel Celeron", "Intel Pentium"], icon: "fa-microchip" },
          processor_gen: { label: "Processor Generation", options: ["11th Gen", "12th Gen", "13th Gen", "14th Gen", "AMD 5000", "AMD 7000", "Not Applicable"], icon: "fa-microchip" },
          ram: { label: "RAM", options: ["4GB", "8GB", "16GB", "32GB", "64GB", "128GB"], icon: "fa-memory" },
          storage_type: { label: "Storage Type", options: ["SSD", "HDD", "SSD + HDD", "NVMe SSD", "eMMC"], icon: "fa-hdd" },
          storage_size: { label: "Storage Size", options: ["64GB", "128GB", "256GB", "512GB", "1TB", "2TB", "4TB"], icon: "fa-database" },
          screen_size: { label: "Screen Size", options: ['11"', '12"', '13"', '14"', '15.6"', '16"', '17"', '18"'], icon: "fa-expand" },
          screen_resolution: { label: "Resolution", options: ["HD (1366x768)", "Full HD (1920x1080)", "2K (2560x1440)", "4K (3840x2160)", "Retina"], icon: "fa-tv" },
          os: { label: "Operating System", options: ["Windows 11 Pro", "Windows 11 Home", "Windows 10 Pro", "Windows 10 Home", "macOS Ventura", "macOS Sonoma", "Linux Ubuntu", "Linux Mint", "Chrome OS", "No OS"], icon: "fa-desktop" },
          condition: { label: "Condition", options: ["Brand New", "Open Box", "Refurbished", "Used - Like New", "Used - Good", "Used - Fair"], icon: "fa-star" },
          purpose: { label: "Purpose", options: ["Business", "Gaming", "Student", "Programming", "Design", "General Use", "Content Creation", "Engineering"], icon: "fa-briefcase" },
          graphics: { label: "Graphics Card", options: ["Integrated", "NVIDIA GTX 1650", "NVIDIA RTX 3050", "NVIDIA RTX 3060", "NVIDIA RTX 4050", "NVIDIA RTX 4060", "AMD Radeon", "Intel Iris Xe", "Apple M-series"], icon: "fa-microchip" },
          touchscreen: { label: "Touchscreen", options: ["Yes", "No"], icon: "fa-hand-pointer" },
          convertible: { label: "2-in-1 Convertible", options: ["Yes", "No"], icon: "fa-sync" },
        }
      },
      tablets: {
        name: "Tablets & iPads",
        icon: "fa-tablet-alt",
        specs: {
          brand: { label: "Brand", options: ["Apple iPad", "Samsung Galaxy Tab", "Huawei MatePad", "Lenovo Tab", "Amazon Fire", "Xiaomi Pad", "Microsoft Surface", "Other"], icon: "fa-tag", allowCustom: true },
          storage: { label: "Storage", options: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"], icon: "fa-hdd" },
          ram: { label: "RAM", options: ["2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB"], icon: "fa-memory" },
          screen_size: { label: "Screen Size", options: ["7\"", "8\"", "9.7\"", "10.1\"", "10.5\"", "11\"", "12.9\"", "14.6\""], icon: "fa-expand" },
          connectivity: { label: "Connectivity", options: ["Wi-Fi Only", "Wi-Fi + Cellular", "5G Ready"], icon: "fa-wifi" },
          pen_support: { label: "Stylus Support", options: ["Yes (Apple Pencil)", "Yes (S Pen)", "Yes (Other)", "No"], icon: "fa-pen-fancy" },
          keyboard_support: { label: "Keyboard Support", options: ["Yes", "No"], icon: "fa-keyboard" },
          condition: { label: "Condition", options: ["Brand New", "Refurbished", "Used"], icon: "fa-star" },
        }
      },
      smartwatches: {
        name: "Smart Watches & Wearables",
        icon: "fa-clock",
        specs: {
          brand: { label: "Brand", options: ["Apple Watch", "Samsung Galaxy Watch", "Garmin", "Fitbit", "Xiaomi", "Amazfit", "Huawei", "Google Pixel Watch", "Other"], icon: "fa-tag", allowCustom: true },
          model: { label: "Model", options: ["Series 8", "Series 9", "Ultra", "Watch 5", "Watch 6", "Versa", "Sense", "Band", "Other"], icon: "fa-clock", allowCustom: true },
          connectivity: { label: "Connectivity", options: ["GPS Only", "GPS + Cellular", "Bluetooth Only"], icon: "fa-wifi" },
          battery_life: { label: "Battery Life", options: ["1 Day", "2 Days", "3-5 Days", "1 Week", "2 Weeks+"], icon: "fa-battery-full" },
          health_features: { label: "Health Features", options: ["Heart Rate", "ECG", "Blood Oxygen", "Temperature", "Sleep Tracking", "GPS", "All", "Basic Only"], icon: "fa-heartbeat", multiple: true },
          condition: { label: "Condition", options: ["Brand New", "Open Box", "Used"], icon: "fa-star" },
          color: { label: "Color", options: ["Black", "Silver", "Gold", "Blue", "Green", "Pink", "Starlight", "Midnight"], icon: "fa-palette" },
        }
      },
      home_entertainment: {
        name: "Home Entertainment",
        icon: "fa-tv",
        specs: {
          type: { label: "Type", options: ["Smart TV", "LED TV", "4K Ultra HD TV", "Android TV", "Home Theater System", "Soundbar", "DVD & Blu-ray Player", "Projector"], icon: "fa-tv" },
          brand: { label: "Brand", options: ["Samsung", "LG", "Sony", "Hisense", "TCL", "Sayona", "Vitron", "Skyworth", "Hifiman", "Generic"], icon: "fa-tag", allowCustom: true },
          screen_size: { label: "Screen Size", options: ['24"', '32"', '40"', '43"', '50"', '55"', '65"', '75"', '85"'], icon: "fa-expand" },
          features: { label: "Features", options: ["Smart (WiFi)", "4K Resolution", "Bluetooth", "HDMI ARC", "Dolby Atmos", "Curved Screen"], icon: "fa-star", multiple: true },
          condition: { label: "Condition", options: ["Brand New", "Refurbished", "Used"], icon: "fa-star" },
        }
      },
      household_appliances: {
        name: "Household Appliances",
        icon: "fa-plug",
        specs: {
          type: { label: "Type", options: ["Refrigerator", "Freezer", "Microwave Oven", "Washing Machine", "Electric Kettle", "Blender & Juicer", "Cooker/Oven", "Air Conditioner", "Water Dispenser"], icon: "fa-plug" },
          brand: { label: "Brand", options: ["Ramtons", "Mika", "Samsung", "LG", "Armco", "Von Hotpoint", "Bruhm", "Sayona", "Generic"], icon: "fa-tag", allowCustom: true },
          capacity: { label: "Capacity", options: ["Small/Compact", "Medium", "Large", "Double Door", "Side-by-Side", "1.7L (Kettle)", "20L (Microwave)"], icon: "fa-database" },
          condition: { label: "Condition", options: ["Brand New", "Refurbished", "Used"], icon: "fa-star" },
        }
      },
      mobile_accessories: {
        name: "Mobile Accessories",
        icon: "fa-charging-station",
        specs: {
          type: { label: "Type", options: ["Power Bank", "Charging Cable", "Wall Adapter", "Car Charger", "Phone Case", "Screen Protector", "Memory Card", "USB Flash Drive"], icon: "fa-plug" },
          brand: { label: "Brand", options: ["Oraimo", "Anker", "Xiaomi", "Samsung", "Apple", "Generic", "Baseus"], icon: "fa-tag", allowCustom: true },
          capacity: { label: "Capacity (if Power Bank)", options: ["5000mAh", "10000mAh", "20000mAh", "30000mAh", "40000mAh+"], icon: "fa-battery-full" },
          cable_type: { label: "Cable Connector", options: ["USB-C", "Lightning (iPhone)", "Micro-USB", "3-in-1 Cable"], icon: "fa-link" },
        }
      },
      audio_equipment: {
        name: "Audio & Speakers",
        icon: "fa-volume-up",
        specs: {
          type: { label: "Type", options: ["Subwoofer", "Bluetooth Speaker", "Home Theater", "Wireless Earbuds", "Headset/Headphones", "Soundbar", "PA System"], icon: "fa-music" },
          brand: { label: "Brand", options: ["Sayona", "Ampex", "Sony", "JBL", "Samsung", "Oraimo", "Vitron", "Tagwood", "Generic"], icon: "fa-tag", allowCustom: true },
          connectivity: { label: "Connectivity", options: ["Bluetooth", "Wired/AUX", "Optical", "USB/SD Card", "FM Radio"], icon: "fa-wifi", multiple: true },
          power: { label: "Power Output", options: ["5W-20W", "30W-100W", "150W-500W", "1000W+"], icon: "fa-bolt" },
        }
      },
      gaming_smart_home: {
        name: "Gaming & Smart Home",
        icon: "fa-gamepad",
        specs: {
          type: { label: "Type", options: ["Gaming Controller", "Gaming Headset", "Security Camera (CCTV)", "Smart Bulb", "Smart Plug", "Video Doorbell", "Gaming Console"], icon: "fa-gamepad" },
          brand: { label: "Brand", options: ["Sony (PS)", "Microsoft (Xbox)", "Nintendo", "Hikvision (CCTV)", "Dahua", "TP-Link", "Generic"], icon: "fa-tag", allowCustom: true },
          features: { label: "Features", options: ["Wireless", "Night Vision", "Motion Detection", "App Controlled", "RGB Lighting"], icon: "fa-star", multiple: true },
        }
      },
      tvs_audio: {
        name: "TVs & Audio",
        icon: "fa-tv",
        specs: {
          brand: { label: "Brand", options: ["Samsung", "LG", "Sony", "TCL", "Hisense", "Philips", "Skyworth", "Vitron", "Synix", "Panasonic", "Sharp", "Other"], icon: "fa-tag", allowCustom: true },
          screen_size: { label: "Screen Size", options: ['24"', '32"', '40"', '43"', '50"', '55"', '58"', '65"', '70"', '75"', '85"', '98"'], icon: "fa-expand" },
          resolution: { label: "Resolution", options: ["HD Ready (1366x768)", "Full HD (1920x1080)", "4K Ultra HD (3840x2160)", "8K (7680x4320)", "OLED"], icon: "fa-film" },
          display_tech: { label: "Display Technology", options: ["LED", "OLED", "QLED", "Neo QLED", "Mini-LED", "Plasma"], icon: "fa-tv" },
          smart_tv: { label: "Smart TV", options: ["Yes (WebOS)", "Yes (Tizen)", "Yes (Android TV)", "Yes (Google TV)", "Yes (Roku TV)", "Yes (Fire TV)", "No"], icon: "fa-microchip" },
          refresh_rate: { label: "Refresh Rate", options: ["60Hz", "120Hz", "240Hz"], icon: "fa-sync" },
          hdr: { label: "HDR Support", options: ["HDR10", "HDR10+", "Dolby Vision", "HLG", "None"], icon: "fa-sun", multiple: true },
          audio_type: { label: "Audio Type", options: ["Soundbar", "Home Theater", "Bluetooth Speaker", "Subwoofer", "Amplifier", "Receiver", "Soundbase"], icon: "fa-music" },
          audio_brand: { label: "Audio Brand", options: ["Sony", "JBL", "Bose", "Samsung", "LG", "Sonos", "Yamaha", "Polk", "Generic"], icon: "fa-tag" },
          power_output: { label: "Power Output", options: ["20W", "40W", "60W", "100W", "200W", "500W+"], icon: "fa-bolt" },
          condition: { label: "Condition", options: ["Brand New", "Open Box", "Refurbished", "Used"], icon: "fa-star" },
        }
      },
      computer_components: {
        name: "Computer Components",
        icon: "fa-microchip",
        specs: {
          component_type: { label: "Component Type", options: ["Processor (CPU)", "Graphics Card (GPU)", "Motherboard", "RAM", "Storage Drive", "Power Supply (PSU)", "Cooling Fan", "Case", "Network Card", "Sound Card"], icon: "fa-microchip" },
          brand: { label: "Brand", options: ["Intel", "AMD", "NVIDIA", "ASUS", "MSI", "Gigabyte", "Corsair", "Kingston", "Samsung", "WD", "Seagate", "Crucial", "EVGA"], icon: "fa-tag", allowCustom: true },
          compatible_socket: { label: "Compatible Socket", options: ["LGA1700", "LGA1200", "AM4", "AM5", "LGA2066", "TR4"], icon: "fa-plug" },
          capacity: { label: "Capacity/Size", options: ["4GB", "8GB", "16GB", "32GB", "256GB", "512GB", "1TB", "2TB", "4TB"], icon: "fa-database" },
          speed: { label: "Speed", options: ["2400MHz", "3200MHz", "3600MHz", "4000MHz", "5400RPM", "7200RPM", "PCIe 3.0", "PCIe 4.0", "PCIe 5.0"], icon: "fa-tachometer-alt" },
          condition: { label: "Condition", options: ["Brand New", "Open Box", "Used", "For Parts"], icon: "fa-star" },
        }
      },
      networking: {
        name: "Networking Equipment",
        icon: "fa-network-wired",
        specs: {
          type: { label: "Device Type", options: ["Router", "Switch", "Modem", "Access Point", "Range Extender", "Mesh System", "Network Card", "Cable", "Adapter"], icon: "fa-network-wired" },
          brand: { label: "Brand", options: ["TP-Link", "D-Link", "Cisco", "Netgear", "Ubiquiti", "Asus", "Tenda", "MikroTik", "Huawei"], icon: "fa-tag" },
          speed: { label: "Speed", options: ["150Mbps", "300Mbps", "600Mbps", "1200Mbps", "1800Mbps", "3000Mbps", "Gigabit", "10 Gigabit"], icon: "fa-tachometer-alt" },
          frequency: { label: "Frequency", options: ["2.4GHz", "5GHz", "6GHz", "Dual-Band", "Tri-Band"], icon: "fa-wifi" },
          ports: { label: "Ports", options: ["4 Ports", "8 Ports", "16 Ports", "24 Ports", "48 Ports"], icon: "fa-plug" },
          condition: { label: "Condition", options: ["Brand New", "Used", "Refurbished"], icon: "fa-star" },
        }
      },
      printers_scanners: {
        name: "Printers & Scanners",
        icon: "fa-print",
        specs: {
          type: { label: "Device Type", options: ["Printer", "Scanner", "All-in-One", "Fax Machine", "Label Printer", "3D Printer", "Photo Printer"], icon: "fa-print" },
          brand: { label: "Brand", options: ["HP", "Canon", "Epson", "Brother", "Xerox", "Samsung", "Kyocera", "Other"], icon: "fa-tag", allowCustom: true },
          technology: { label: "Print Technology", options: ["Inkjet", "Laser", "LED", "Thermal", "Dot Matrix", "3D Printing"], icon: "fa-microchip" },
          color: { label: "Color Capability", options: ["Black & White", "Color"], icon: "fa-palette" },
          connectivity: { label: "Connectivity", options: ["USB", "Wi-Fi", "Ethernet", "Bluetooth", "NFC", "AirPrint"], icon: "fa-plug", multiple: true },
          speed: { label: "Print Speed", options: ["Up to 10ppm", "10-20ppm", "20-30ppm", "30-40ppm", "40+ ppm"], icon: "fa-tachometer-alt" },
          condition: { label: "Condition", options: ["Brand New", "Refurbished", "Used", "For Parts"], icon: "fa-star" },
        }
      },
      accessories: {
        name: "Phone & Laptop Accessories",
        icon: "fa-headphones",
        specs: {
          type: { label: "Accessory Type", options: ["Phone Case", "Screen Protector", "Charger", "Power Bank", "Earphones", "Headphones", "Cable", "Adapter", "Pop Socket", "Phone Stand", "Laptop Bag", "Mouse", "Keyboard", "Webcam", "USB Hub", "Cooling Pad", "Laptop Stand", "Stylus Pen", "Cleaning Kit"], icon: "fa-plug" },
          brand: { label: "Brand", options: ["Samsung", "Apple", "Anker", "Oraimo", "Sony", "JBL", "Logitech", "Baseus", "Ugreen", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          connectivity: { label: "Connectivity", options: ["Wired", "Wireless", "Bluetooth", "2.4GHz", "USB-C", "Lightning", "Micro USB", "USB-A", "Thunderbolt"], icon: "fa-wifi" },
          color: { label: "Color", options: ["Black", "White", "Blue", "Red", "Green", "Purple", "Pink", "Transparent", "Clear", "Rose Gold"], icon: "fa-palette", allowCustom: true },
          compatibility: { label: "Compatibility", options: ["iPhone", "Samsung", "Android", "Mac", "Windows PC", "Universal", "iPad", "Tablet"], icon: "fa-check-circle", multiple: true },
          condition: { label: "Condition", options: ["Brand New", "Open Box", "Used"], icon: "fa-star" },
        }
      },
      cameras: {
        name: "Cameras & Photography",
        icon: "fa-camera",
        specs: {
          brand: { label: "Brand", options: ["Canon", "Nikon", "Sony", "Fujifilm", "GoPro", "DJI", "Panasonic", "Olympus", "Pentax", "Leica"], icon: "fa-tag", allowCustom: true },
          type: { label: "Camera Type", options: ["DSLR", "Mirrorless", "Point & Shoot", "Action Camera", "Drone", "Security Camera", "Film Camera", "Instant Camera", "360 Camera"], icon: "fa-camera-retro" },
          megapixels: { label: "Megapixels", options: ["12MP", "16MP", "20MP", "24MP", "30MP", "36MP", "45MP", "50MP+"], icon: "fa-chart-line" },
          lens_mount: { label: "Lens Mount", options: ["Canon EF", "Canon RF", "Nikon F", "Nikon Z", "Sony E", "Fujifilm X", "Micro 4/3", "Fixed Lens"], icon: "fa-circle" },
          video_recording: { label: "Video Recording", options: ["1080p", "4K", "6K", "8K", "No Video"], icon: "fa-video" },
          condition: { label: "Condition", options: ["Brand New", "Used - Like New", "Used - Good", "For Parts"], icon: "fa-star" },
          includes_lens: { label: "Includes Lens", options: ["Yes (Kit Lens)", "Yes (Specific Lens)", "No (Body Only)"], icon: "fa-camera" },
        }
      },
      gaming: {
        name: "Gaming",
        icon: "fa-gamepad",
        specs: {
          platform: { label: "Platform", options: ["PlayStation 5", "PlayStation 4", "PlayStation 3", "Xbox Series X/S", "Xbox One", "Xbox 360", "Nintendo Switch", "Nintendo 3DS", "PC", "Steam Deck", "Retro Console"], icon: "fa-gamepad" },
          type: { label: "Product Type", options: ["Console", "Game (Physical)", "Game (Digital Code)", "Controller", "Headset", "Gaming Keyboard", "Gaming Mouse", "Gaming Chair", "Monitor", "Streaming Gear", "VR Headset"], icon: "fa-puzzle-piece" },
          genre: { label: "Game Genre", options: ["Action", "Adventure", "Sports", "Racing", "Fighting", "Shooter", "RPG", "Strategy", "Simulation", "Horror", "Puzzle", "Family", "Party"], icon: "fa-fist-raised" },
          condition: { label: "Condition", options: ["Brand New", "Used - Like New", "Used - Good", "Disc Only", "Case & Disc"], icon: "fa-star" },
          multiplayer: { label: "Multiplayer", options: ["Single Player", "Local Multiplayer", "Online Multiplayer", "Co-op"], icon: "fa-users" },
          age_rating: { label: "Age Rating", options: ["Everyone (E)", "Everyone 10+ (E10+)", "Teen (T)", "Mature (M)", "Adults Only (AO)"], icon: "fa-child" },
        }
      },
      smart_home: {
        name: "Smart Home Devices",
        icon: "fa-home",
        specs: {
          type: { label: "Device Type", options: ["Smart Speaker", "Smart Display", "Smart Plug", "Smart Bulb", "Smart Switch", "Smart Thermostat", "Smart Lock", "Smart Camera", "Smart Sensor", "Smart Hub", "Robot Vacuum"], icon: "fa-microchip" },
          brand: { label: "Brand", options: ["Amazon Echo", "Google Nest", "Apple HomePod", "Xiaomi", "Philips Hue", "TP-Link Kasa", "Ring", "Arlo", "Eufy", "Other"], icon: "fa-tag", allowCustom: true },
          voice_assistant: { label: "Voice Assistant", options: ["Alexa", "Google Assistant", "Siri", "None", "Multiple"], icon: "fa-microphone-alt" },
          connectivity: { label: "Connectivity", options: ["Wi-Fi", "Bluetooth", "Zigbee", "Z-Wave", "Thread", "Matter"], icon: "fa-wifi", multiple: true },
          condition: { label: "Condition", options: ["Brand New", "Open Box", "Used"], icon: "fa-star" },
        }
      },
      drones: {
        name: "Drones & Accessories",
        icon: "fa-helicopter",
        specs: {
          brand: { label: "Brand", options: ["DJI", "Autel", "Parrot", "Holy Stone", "Potensic", "Ryze Tech", "Other"], icon: "fa-tag", allowCustom: true },
          type: { label: "Drone Type", options: ["Camera Drone", "Racing Drone", "Toy Drone", "Professional Drone", "FPV Drone", "Mini Drone"], icon: "fa-helicopter" },
          camera_quality: { label: "Camera Quality", options: ["No Camera", "720p", "1080p", "4K", "6K", "8K"], icon: "fa-camera" },
          flight_time: { label: "Max Flight Time", options: ["<10 mins", "10-20 mins", "20-30 mins", "30-40 mins", "40+ mins"], icon: "fa-clock" },
          range: { label: "Max Range", options: ["<100m", "100-500m", "500m-1km", "1-5km", "5-10km", "10km+"], icon: "fa-chart-line" },
          condition: { label: "Condition", options: ["Brand New", "Used", "For Parts"], icon: "fa-star" },
          includes_battery: { label: "Includes Battery", options: ["Yes", "No", "Multiple Batteries"], icon: "fa-battery-full" },
        }
      },
      monitors: {
        name: "Monitors & Displays",
        icon: "fa-desktop",
        specs: {
          brand: { label: "Brand", options: ["Dell", "HP", "LG", "Samsung", "ASUS", "Acer", "BenQ", "MSI", "ViewSonic", "Lenovo", "Other"], icon: "fa-tag", allowCustom: true },
          screen_size: { label: "Screen Size", options: ['19"', '21.5"', '22"', '24"', '27"', '32"', '34"', '38"', '43"', '49"'], icon: "fa-expand" },
          resolution: { label: "Resolution", options: ["1366x768 (HD)", "1920x1080 (FHD)", "2560x1440 (QHD)", "3440x1440 (UWQHD)", "3840x2160 (4K)", "5120x2880 (5K)"], icon: "fa-tv" },
          refresh_rate: { label: "Refresh Rate", options: ["60Hz", "75Hz", "120Hz", "144Hz", "165Hz", "240Hz", "360Hz"], icon: "fa-sync" },
          panel_type: { label: "Panel Type", options: ["IPS", "TN", "VA", "OLED", "Mini-LED"], icon: "fa-layer-group" },
          aspect_ratio: { label: "Aspect Ratio", options: ["16:9", "16:10", "21:9 (Ultrawide)", "32:9 (Super Ultrawide)"], icon: "fa-arrows-alt-h" },
          condition: { label: "Condition", options: ["Brand New", "Refurbished", "Used"], icon: "fa-star" },
          curved: { label: "Curved", options: ["Yes", "No"], icon: "fa-moon" },
        }
      },
      batteries: {
        name: "Batteries & Power Banks",
        icon: "fa-battery-full",
        specs: {
          type: { label: "Battery Type", options: ["Power Bank", "Phone Battery", "Laptop Battery", "Camera Battery", "AA/AAA Batteries", "Rechargeable Batteries", "Battery Charger", "UPS Battery"], icon: "fa-battery-full" },
          capacity: { label: "Capacity", options: ["2000mAh", "5000mAh", "10000mAh", "20000mAh", "30000mAh", "50000mAh", "10000mAh+", "AA (2000mAh)", "AAA (800mAh)"], icon: "fa-bolt" },
          brand: { label: "Brand", options: ["Anker", "Xiaomi", "Samsung", "Oraimo", "Baseus", "Energizer", "Duracell", "Generic"], icon: "fa-tag", allowCustom: true },
          fast_charging: { label: "Fast Charging", options: ["Yes (PD)", "Yes (QC 3.0)", "Yes (QC 4.0)", "Yes (VOOC)", "Yes (SuperVOOC)", "No"], icon: "fa-bolt" },
          ports: { label: "Ports", options: ["1 USB", "2 USB", "3 USB", "4+ USB", "USB-C", "Lightning", "Wireless"], icon: "fa-plug", multiple: true },
          condition: { label: "Condition", options: ["Brand New", "Used"], icon: "fa-star" },
        }
      },
      cables_adapters: {
        name: "Cables & Adapters",
        icon: "fa-plug",
        specs: {
          cable_type: { label: "Cable Type", options: ["USB-C Cable", "Lightning Cable", "Micro USB", "HDMI Cable", "DisplayPort", "VGA Cable", "Ethernet Cable", "Audio Cable", "Power Cord", "Adapter/Dongle", "Hub/Dock"], icon: "fa-plug" },
          length: { label: "Length", options: ["0.5m", "1m", "1.5m", "2m", "3m", "5m", "10m", "15m+"], icon: "fa-ruler" },
          brand: { label: "Brand", options: ["Anker", "Belkin", "UGREEN", "Baseus", "AmazonBasics", "Generic", "Apple", "Samsung"], icon: "fa-tag", allowCustom: true },
          color: { label: "Color", options: ["Black", "White", "Silver", "Space Grey", "Red", "Blue"], icon: "fa-palette" },
          condition: { label: "Condition", options: ["Brand New", "Used"], icon: "fa-star" },
          braided: { label: "Braided", options: ["Yes", "No"], icon: "fa-layer-group" },
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. FASHION & CLOTHING (EXPANDED)
  // ═══════════════════════════════════════════════════════════════════════════
  fashion: {
    id: "fashion",
    name: "Fashion & Clothing",
    icon: "👕",
    description: "Men's, women's, kids' clothing, shoes, accessories, swimwear, and uniforms",
    subcategories: {
      mens_clothing: {
        name: "Men's Clothing",
        icon: "fa-male",
        specs: {
          type: { label: "Type", options: ["T-Shirt", "Shirt", "Polo", "Vest", "Hoodie", "Sweater", "Jacket", "Blazer", "Suit", "Jeans", "Chinos", "Shorts", "Track Pants", "Cargo Pants", "Joggers", "Swim Trunks", "Underwear", "Pyjamas", "Singlet"], icon: "fa-tshirt" },
          size: { label: "Size", options: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"], icon: "fa-ruler" },
          color: { label: "Color", options: ["Black", "White", "Navy", "Grey", "Blue", "Red", "Green", "Beige", "Brown", "Maroon", "Khaki", "Olive", "Purple", "Yellow", "Orange"], icon: "fa-palette", allowCustom: true },
          material: { label: "Material", options: ["Cotton", "Polyester", "Linen", "Denim", "Wool", "Silk", "Fleece", "Chiffon", "Nylon", "Spandex", "Cashmere", "Leather", "Corduroy"], icon: "fa-layer-group" },
          fit: { label: "Fit", options: ["Slim Fit", "Regular Fit", "Relaxed Fit", "Oversized", "Skinny", "Athletic Fit", "Tailored Fit"], icon: "fa-arrows-alt-h" },
          occasion: { label: "Occasion", options: ["Casual", "Formal", "Business", "Sports", "Party", "Traditional", "Beach", "Wedding", "Church", "Daily Wear"], icon: "fa-glass-cheers" },
          brand: { label: "Brand", options: ["Nike", "Adidas", "Puma", "Levi's", "Tommy Hilfiger", "Lacoste", "Gucci", "Versace", "Calvin Klein", "Under Armour", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          sleeve: { label: "Sleeve Length", options: ["Sleeveless", "Short Sleeve", "Long Sleeve", "3/4 Sleeve"], icon: "fa-hand-peace" },
          pattern: { label: "Pattern", options: ["Solid", "Striped", "Checked", "Printed", "Graphic", "Floral", "Camouflage", "Tie-Dye"], icon: "fa-shapes" },
          condition: { label: "Condition", options: ["Brand New", "New with Tags", "Like New", "Gently Used", "Used", "Vintage"], icon: "fa-star" },
        }
      },
      womens_clothing: {
        name: "Women's Clothing",
        icon: "fa-female",
        specs: {
          type: { label: "Type", options: ["Dress", "Top", "Blouse", "T-Shirt", "Tank Top", "Skirt", "Jeans", "Leggings", "Trousers", "Shorts", "Jumpsuit", "Romper", "Sweater", "Cardigan", "Jacket", "Coat", "Saree", "Kitenge", "Gown", "Maxi Dress", "Mini Dress", "Midi Dress", "Blazer", "Playsuit", "Bodysuit"], icon: "fa-female" },
          size: { label: "Size", options: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "Plus Size 1X", "Plus Size 2X", "Plus Size 3X"], icon: "fa-ruler" },
          color: { label: "Color", options: ["Black", "White", "Red", "Blue", "Pink", "Purple", "Green", "Yellow", "Orange", "Nude", "Beige", "Brown", "Grey", "Floral", "Multicolor", "Pastel", "Neon"], icon: "fa-palette", allowCustom: true },
          material: { label: "Material", options: ["Cotton", "Polyester", "Silk", "Chiffon", "Lace", "Denim", "Linen", "Velvet", "Satin", "Jersey", "Crepe", "Knit", "Wool", "Cashmere"], icon: "fa-layer-group" },
          style: { label: "Style", options: ["Casual", "Formal", "Evening", "Party", "Office", "Bohemian", "Vintage", "Streetwear", "Traditional", "Minimalist", "Gothic", "Preppy", "Sporty"], icon: "fa-gem" },
          length: { label: "Length", options: ["Mini", "Midi", "Maxi", "Knee Length", "Ankle Length", "Floor Length", "Above Knee", "Below Knee"], icon: "fa-arrows-alt-v" },
          occasion: { label: "Occasion", options: ["Daily Wear", "Work", "Wedding", "Party", "Church", "Date Night", "Vacation", "Formal Event", "Prom", "Graduation"], icon: "fa-glass-cheers" },
          neckline: { label: "Neckline", options: ["V-Neck", "Round Neck", "Crew Neck", "Turtle Neck", "Scoop Neck", "Off Shoulder", "One Shoulder", "Halter", "Sweetheart", "Square Neck"], icon: "fa-circle" },
          sleeve: { label: "Sleeve Length", options: ["Sleeveless", "Cap Sleeve", "Short Sleeve", "Elbow Length", "3/4 Sleeve", "Long Sleeve", "Puff Sleeve", "Bell Sleeve"], icon: "fa-hand-peace" },
          waist: { label: "Waist Style", options: ["High Waist", "Mid Waist", "Low Waist", "Elastic Waist", "Adjustable Waist"], icon: "fa-arrows-alt-v" },
          condition: { label: "Condition", options: ["Brand New", "New with Tags", "Like New", "Gently Used", "Used"], icon: "fa-star" },
        }
      },
      kids_clothing: {
        name: "Kids' Clothing",
        icon: "fa-child",
        specs: {
          type: { label: "Type", options: ["T-Shirt", "Shirt", "Dress", "Shorts", "Trousers", "Skirt", "Onesie", "School Uniform", "Pyjamas", "Sweater", "Hoodie", "Jacket", "Jeans", "Leggings", "Romper", "Bodysuit", "Swimsuit"], icon: "fa-tshirt" },
          age_group: { label: "Age Group", options: ["Newborn (0-3M)", "Infant (3-12M)", "Toddler (1-3Y)", "Preschool (3-5Y)", "Child (5-8Y)", "Preteen (8-12Y)", "Teen (12-16Y)"], icon: "fa-baby" },
          size: { label: "Size", options: ["NB", "0-3M", "3-6M", "6-9M", "9-12M", "12-18M", "18-24M", "2T", "3T", "4T", "5T", "6", "7", "8", "10", "12", "14", "16"], icon: "fa-ruler" },
          gender: { label: "Gender", options: ["Boys", "Girls", "Unisex"], icon: "fa-venus-mars" },
          color: { label: "Color", options: ["Blue", "Pink", "Red", "Yellow", "Green", "White", "Black", "Purple", "Orange", "Multicolor", "Pastel"], icon: "fa-palette", allowCustom: true },
          material: { label: "Material", options: ["Cotton", "Polyester", "Linen", "Denim", "Fleece", "Spandex", "Bamboo", "Organic Cotton"], icon: "fa-layer-group" },
          occasion: { label: "Occasion", options: ["School", "Casual", "Party", "Traditional", "Sports", "Beach", "Sleepwear", "Formal"], icon: "fa-graduation-cap" },
          condition: { label: "Condition", options: ["Brand New", "New with Tags", "Like New", "Gently Used"], icon: "fa-star" },
          season: { label: "Season", options: ["Summer", "Winter", "Spring", "Autumn", "All Season"], icon: "fa-sun" },
        }
      },
      formal_wear_premium: {
        name: "Formal & Professional Wear",
        icon: "fa-user-tie",
        specs: {
          type: { label: "Type", options: ["Three-Piece Suit", "Two-Piece Suit", "Tuxedo", "Blazer", "Official Shirt", "Official Trousers", "Evening Gown", "Silk Tie", "Leather Belt"], icon: "fa-user-tie" },
          brand: { label: "Brand", options: ["Wajose", "Blessed Hands", "Tiankara", "Gucci", "Armani", "Generic"], icon: "fa-tag", allowCustom: true },
          material: { label: "Material", options: ["Wool", "Silk", "Cotton Blend", "Polyester", "Linen", "Leather"], icon: "fa-layer-group" },
          color: { label: "Color", options: ["Black", "Navy Blue", "Charcoal", "Grey", "White", "Maroon", "Beige"], icon: "fa-palette" },
        }
      },
      african_print: {
        name: "African Print & Custom",
        icon: "fa-cut",
        specs: {
          type: { label: "Type", options: ["Ankara Dress", "Kitenge Shirt", "Tailored Gown", "Dashiki", "African Print Accessories", "Handmade Jewelry"], icon: "fa-cut" },
          material: { label: "Print Style", options: ["Ankara (Cotton)", "Kitenge", "Kente", "Laso", "Batik", "Silk African Print"], icon: "fa-layer-group" },
          occasion: { label: "Occasion", options: ["Wedding", "Traditional Ceremony", "Church", "Casual", "Gala/Event"], icon: "fa-glass-cheers" },
        }
      },
      thrift_bales: {
        name: "Thrift & Bales",
        icon: "fa-recycle",
        specs: {
          type: { label: "Category", options: ["Grade A Thrift", "Vintage Pieces", "Baby Onesies", "Mixed Bale", "Unopened Bale", "Clearance Items"], icon: "fa-recycle" },
          clothing_type: { label: "Clothing Type", options: ["T-Shirts", "Sweaters/Hoodies", "Jeans", "Jackets", "Dresses", "Mixed Clothes"], icon: "fa-tshirt" },
          condition: { label: "Condition", options: ["Grade A (Like New)", "Grade B", "Vintage", "Unopened (Bale)"], icon: "fa-star" },
        }
      },
      jewelry_accessories: {
        name: "Jewelry & Accessories",
        icon: "fa-gem",
        specs: {
          type: { label: "Type", options: ["Handmade Necklace", "Statement Earrings", "Bracelet", "Bangle", "Ring", "Tote Bag", "Clutch Bag", "Handbag"], icon: "fa-gem" },
          material: { label: "Material", options: ["Gold Plated", "Silver", "Beaded", "Handmade Fabric", "Leather", "Brass"], icon: "fa-layer-group" },
        }
      },
      shoes: {
        name: "Shoes & Footwear",
        icon: "fa-shoe-prints",
        specs: {
          type: { label: "Type", options: ["Sneakers", "Running Shoes", "Formal Shoes", "Boots", "Sandals", "Slippers", "High Heels", "Flats", "Loafers", "Espadrilles", "Sports Shoes", "Hiking Boots", "Rain Boots", "Crocs", "School Shoes", "Football Boots", "Cleats"], icon: "fa-shoe-prints" },
          brand: { label: "Brand", options: ["Nike", "Adidas", "Puma", "New Balance", "Converse", "Vans", "Timberland", "Dr. Martens", "Crocs", "Bata", "Sketchers", "Reebok", "Under Armour", "Clarks", "Generic"], icon: "fa-tag", allowCustom: true },
          size: { label: "Size (EU)", options: ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50"], icon: "fa-ruler" },
          size_us: { label: "Size (US)", options: ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "13", "14", "15"], icon: "fa-ruler" },
          gender: { label: "Gender", options: ["Men", "Women", "Kids", "Unisex"], icon: "fa-venus-mars" },
          color: { label: "Color", options: ["Black", "White", "Brown", "Grey", "Blue", "Red", "Beige", "Navy", "Green", "Multicolor", "Gold", "Silver"], icon: "fa-palette", allowCustom: true },
          material: { label: "Material", options: ["Leather", "Canvas", "Mesh", "Synthetic", "Suede", "Rubber", "Genuine Leather", "PU Leather", "Knit"], icon: "fa-layer-group" },
          occasion: { label: "Occasion", options: ["Casual", "Sports", "Formal", "Outdoor", "Beach", "School", "Work", "Hiking", "Running", "Walking"], icon: "fa-glass-cheers" },
          condition: { label: "Condition", options: ["Brand New", "New with Box", "Like New", "Gently Used", "Used", "For Parts"], icon: "fa-star" },
          width: { label: "Width", options: ["Narrow", "Medium (D/M)", "Wide (2E)", "Extra Wide (4E)"], icon: "fa-arrows-alt-h" },
        }
      },
      bags_wallets: {
        name: "Bags & Wallets",
        icon: "fa-shopping-bag",
        specs: {
          type: { label: "Type", options: ["Handbag", "Tote Bag", "Backpack", "Crossbody", "Clutch", "Shoulder Bag", "Wallet", "Purse", "Laptop Bag", "Travel Bag", "School Bag", "Duffel Bag", "Messenger Bag", "Briefcase", "Belt Bag", "Card Holder", "Coin Purse"], icon: "fa-shopping-bag" },
          brand: { label: "Brand", options: ["Michael Kors", "Coach", "Gucci", "Louis Vuitton", "Nike", "Adidas", "JanSport", "Herschel", "Generic", "Local Brand", "Other"], icon: "fa-tag", allowCustom: true },
          material: { label: "Material", options: ["Leather", "PU Leather", "Canvas", "Nylon", "Straw", "Denim", "Polyester", "Genuine Leather", "Synthetic", "Vegan Leather"], icon: "fa-layer-group" },
          color: { label: "Color", options: ["Black", "Brown", "Beige", "White", "Red", "Blue", "Pink", "Green", "Navy", "Tan", "Yellow", "Multicolor"], icon: "fa-palette", allowCustom: true },
          gender: { label: "Gender", options: ["Women", "Men", "Unisex"], icon: "fa-venus-mars" },
          size: { label: "Size", options: ["Small", "Medium", "Large", "Extra Large"], icon: "fa-expand" },
          compartments: { label: "Compartments", options: ["1", "2", "3", "4", "5+"], icon: "fa-layer-group" },
          laptop_compatible: { label: "Laptop Compatible", options: ["Yes (13\")", "Yes (15\")", "Yes (17\")", "No"], icon: "fa-laptop" },
          condition: { label: "Condition", options: ["Brand New", "New with Tags", "Like New", "Gently Used", "Used"], icon: "fa-star" },
          closure: { label: "Closure Type", options: ["Zipper", "Magnetic Snap", "Buckle", "Drawstring", "Velcro", "Button"], icon: "fa-lock" },
        }
      },
      jewelry_watches: {
        name: "Jewelry & Watches",
        icon: "fa-gem",
        specs: {
          type: { label: "Jewelry Type", options: ["Necklace", "Earrings", "Bracelet", "Ring", "Anklet", "Watch", "Pendant", "Chain", "Cufflinks", "Nose Ring", "Toe Ring", "Brooch", "Tie Clip", "Hair Jewelry"], icon: "fa-gem" },
          material: { label: "Material", options: ["Gold (10K)", "Gold (14K)", "Gold (18K)", "Gold (22K)", "Silver (925)", "Rose Gold", "Platinum", "Stainless Steel", "Brass", "Copper", "Beads", "Leather", "Wood", "Resin"], icon: "fa-layer-group" },
          gender: { label: "Gender", options: ["Women", "Men", "Unisex"], icon: "fa-venus-mars" },
          style: { label: "Style", options: ["Classic", "Trendy", "Bohemian", "Minimalist", "Luxury", "Traditional", "Modern", "Vintage", "Statement", "Delicate"], icon: "fa-star" },
          occasion: { label: "Occasion", options: ["Daily", "Wedding", "Party", "Gift", "Formal", "Engagement", "Anniversary", "Birthday"], icon: "fa-glass-cheers" },
          gemstone: { label: "Gemstone", options: ["Diamond", "Ruby", "Sapphire", "Emerald", "Pearl", "Opal", "Amethyst", "Topaz", "Cubic Zirconia", "None", "Other"], icon: "fa-gem", allowCustom: true },
          watch_type: { label: "Watch Type", options: ["Analog", "Digital", "Smartwatch", "Chronograph", "Automatic", "Quartz", "Diver", "Dress", "Sport", "Luxury"], icon: "fa-clock" },
          watch_brand: { label: "Watch Brand", options: ["Rolex", "Omega", "Casio", "Seiko", "Citizen", "Fossil", "G-Shock", "Apple Watch", "Samsung Galaxy Watch", "Timex", "Other"], icon: "fa-tag", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New", "New with Tags", "Like New", "Gently Used", "Used", "Vintage", "Recycled Gold"], icon: "fa-star" },
          plated: { label: "Plated/Filled", options: ["Solid", "Gold Plated", "Gold Filled", "Vermeil", "Stainless Steel"], icon: "fa-layer-group" },
        }
      },
      traditional_wear: {
        name: "Traditional & African Wear",
        icon: "fa-hat-cowboy",
        specs: {
          type: { label: "Type", options: ["Kitenge", "Kikoy", "Maasai Shuka", "Dashiki", "Ankara", "Kente", "Boubou", "Gomesi", "Kanzu", "Agbada", "Buba", "Iro", "Wrapper", "Headwrap (Gele)", "Kofia", "Fez Hat", "Beaded Jewelry", "Maasai Sandals"], icon: "fa-tshirt" },
          gender: { label: "Gender", options: ["Men", "Women", "Unisex", "Kids"], icon: "fa-venus-mars" },
          occasion: { label: "Occasion", options: ["Wedding", "Church", "Cultural Event", "Daily", "Party", "Funeral", "Graduation", "Festival"], icon: "fa-glass-cheers" },
          color: { label: "Color", options: ["Multicolor", "Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Black", "White", "Gold", "Brown", "Earth Tones"], icon: "fa-palette", allowCustom: true },
          fabric: { label: "Fabric", options: ["Cotton", "Silk", "Polyester", "Wax Print", "Kitenge Fabric", "Ankara Print", "Mudcloth", "Kente Cloth", "Lace", "Satin"], icon: "fa-layer-group" },
          size: { label: "Size", options: ["Free Size", "S", "M", "L", "XL", "XXL", "Custom Made", "6 Yards", "12 Yards"], icon: "fa-ruler" },
          condition: { label: "Condition", options: ["Brand New", "Handmade", "Custom Made", "Used"], icon: "fa-star" },
          region: { label: "Region/Tribe", options: ["Maasai", "Kikuyu", "Luo", "Luhya", "Kalenjin", "Kamba", "Swahili", "Yoruba", "Igbo", "Zulu", "Other"], icon: "fa-map-marker-alt", allowCustom: true },
        }
      },
      swimwear: {
        name: "Swimwear & Beachwear",
        icon: "fa-swimming-pool",
        specs: {
          type: { label: "Type", options: ["Bikini", "One-Piece Swimsuit", "Tankini", "Monokini", "Swim Trunks", "Board Shorts", "Swim Briefs", "Rash Guard", "Swim Dress", "Cover Up", "Kaftan", "Sarong"], icon: "fa-swimmer" },
          gender: { label: "Gender", options: ["Women", "Men", "Kids", "Unisex"], icon: "fa-venus-mars" },
          size: { label: "Size", options: ["XS", "S", "M", "L", "XL", "XXL", "Kids S", "Kids M", "Kids L"], icon: "fa-ruler" },
          color: { label: "Color", options: ["Black", "White", "Blue", "Red", "Green", "Pink", "Yellow", "Neon", "Floral", "Striped", "Tropical Print"], icon: "fa-palette", allowCustom: true },
          material: { label: "Material", options: ["Nylon/Spandex", "Polyester", "Neoprene", "Cotton", "Recycled Fabric"], icon: "fa-layer-group" },
          uv_protection: { label: "UV Protection", options: ["UPF 30+", "UPF 50+", "None"], icon: "fa-sun" },
          condition: { label: "Condition", options: ["Brand New", "New with Tags", "Like New", "Gently Used"], icon: "fa-star" },
        }
      },
      sleepwear: {
        name: "Sleepwear & Loungewear",
        icon: "fa-bed",
        specs: {
          type: { label: "Type", options: ["Pyjamas", "Nightgown", "Nightshirt", "Robes", "Bathrobe", "Loungewear Set", "Sleep Shirt", "Onesie", "Satin Pajamas", "Cotton Pajamas"], icon: "fa-bed" },
          gender: { label: "Gender", options: ["Women", "Men", "Kids", "Unisex"], icon: "fa-venus-mars" },
          size: { label: "Size", options: ["XS", "S", "M", "L", "XL", "XXL", "One Size"], icon: "fa-ruler" },
          material: { label: "Material", options: ["Cotton", "Satin", "Silk", "Flannel", "Modal", "Polyester", "Bamboo", "Jersey"], icon: "fa-layer-group" },
          color: { label: "Color", options: ["White", "Black", "Navy", "Pink", "Grey", "Patterned", "Striped", "Red"], icon: "fa-palette", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New", "New with Tags", "Like New"], icon: "fa-star" },
        }
      },
      intimates: {
        name: "Intimate Apparel",
        icon: "fa-heart",
        specs: {
          type: { label: "Type", options: ["Bra", "Panties", "Briefs", "Boxers", "Boxer Briefs", "Trunks", "Bralette", "Sports Bra", "Shapewear", "Corset", "Girdle", "Slip", "Camisole", "Teddy", "Thong", "G-String"], icon: "fa-heart" },
          gender: { label: "Gender", options: ["Women", "Men", "Unisex"], icon: "fa-venus-mars" },
          size: { label: "Size", options: ["XS", "S", "M", "L", "XL", "XXL", "Bra 32A", "Bra 32B", "Bra 32C", "Bra 32D", "Bra 34A", "Bra 34B", "Bra 34C", "Bra 34D", "Bra 36A", "Bra 36B", "Bra 36C", "Bra 36D", "Bra 38B", "Bra 38C", "Bra 38D", "Bra 40+"], icon: "fa-ruler" },
          material: { label: "Material", options: ["Cotton", "Lace", "Polyester", "Nylon", "Spandex", "Modal", "Bamboo", "Microfiber"], icon: "fa-layer-group" },
          color: { label: "Color", options: ["Black", "White", "Nude", "Beige", "Red", "Pink", "Blue", "Purple", "Multicolor"], icon: "fa-palette", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New", "New with Tags", "Like New"], icon: "fa-star" },
        }
      },
      socks_hosiery: {
        name: "Socks & Hosiery",
        icon: "fa-socks",
        specs: {
          type: { label: "Type", options: ["Ankle Socks", "Crew Socks", "Knee High Socks", "Over Knee Socks", "Compression Socks", "Pantyhose", "Tights", "Stockings", "Leggings (Hosiery)", "Toe Socks", "No Show Socks"], icon: "fa-socks" },
          gender: { label: "Gender", options: ["Men", "Women", "Kids", "Unisex"], icon: "fa-venus-mars" },
          size: { label: "Size", options: ["Small", "Medium", "Large", "X-Large", "One Size", "Kids Small", "Kids Medium", "Kids Large"], icon: "fa-ruler" },
          color: { label: "Color", options: ["Black", "White", "Navy", "Grey", "Brown", "Beige", "Multicolor", "Patterned", "Striped", "Polka Dot"], icon: "fa-palette", allowCustom: true },
          material: { label: "Material", options: ["Cotton", "Polyester", "Nylon", "Wool", "Spandex", "Bamboo", "Silk", "Merino Wool"], icon: "fa-layer-group" },
          condition: { label: "Condition", options: ["Brand New", "New with Tags", "Like New"], icon: "fa-star" },
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. BEAUTY & PERSONAL CARE (EXPANDED)
  // ═══════════════════════════════════════════════════════════════════════════
  beauty: {
    id: "beauty",
    name: "Beauty & Personal Care",
    icon: "💄",
    description: "Skincare, makeup, hair products, fragrances, grooming, and feminine care",
    subcategories: {
      skincare: {
        name: "Skincare",
        icon: "fa-spa",
        specs: {
          brand: { label: "Brand", options: ["Nivea", "Neutrogena", "CeraVe", "The Ordinary", "La Roche-Posay", "Olay", "Ponds", "Garnier", "Dove", "Nivea Men", "Vaseline", "Cetaphil", "Clinique", "Estée Lauder", "L'Oréal", "Coconut Oil", "Shea Butter", "Other"], icon: "fa-tag", allowCustom: true },
          skin_type: { label: "Skin Type", options: ["Normal", "Dry", "Oily", "Combination", "Sensitive", "Acne-Prone", "Mature", "Dehydrated"], icon: "fa-hand-sparkles" },
          concern: { label: "Concern", options: ["Acne", "Dark Spots", "Anti-Aging", "Hydration", "Brightening", "Sun Protection", "Pores", "Dark Circles", "Wrinkles", "Fine Lines", "Hyperpigmentation", "Eczema", "Rosacea", "Scars"], icon: "fa-exclamation-circle", multiple: true },
          product_type: { label: "Product Type", options: ["Cleanser", "Moisturizer", "Serum", "Sunscreen", "Toner", "Face Mask", "Exfoliator", "Eye Cream", "Lip Balm", "Facial Oil", "Essence", "Mist", "Spot Treatment", "Retinol", "Vitamin C", "Hyaluronic Acid", "Niacinamide"], icon: "fa-pump-soap" },
          volume: { label: "Size", options: ["15ml", "30ml", "50ml", "100ml", "150ml", "200ml", "400ml", "500ml", "1L"], icon: "fa-flask" },
          gender: { label: "Gender", options: ["Women", "Men", "Unisex"], icon: "fa-venus-mars" },
          spf: { label: "SPF", options: ["None", "SPF 15", "SPF 30", "SPF 50", "SPF 50+"], icon: "fa-sun" },
          vegan: { label: "Vegan", options: ["Yes", "No", "Not Specified"], icon: "fa-leaf" },
          cruelty_free: { label: "Cruelty Free", options: ["Yes", "No", "Not Specified"], icon: "fa-paw" },
          condition: { label: "Condition", options: ["Brand New", "New (Sealed)", "Used - Like New", "Used - Partially Used"], icon: "fa-star" },
        }
      },
      makeup: {
        name: "Makeup",
        icon: "fa-magic",
        specs: {
          brand: { label: "Brand", options: ["MAC", "Maybelline", "L'Oreal", "NARS", "Fenty", "Revlon", "Black Opal", "Zaron", "House of Tara", "NYX", "Urban Decay", "Too Faced", "Huda Beauty", "Anastasia Beverly Hills", "CoverGirl", "Other"], icon: "fa-tag", allowCustom: true },
          product_type: { label: "Product", options: ["Foundation", "Concealer", "Powder", "Lipstick", "Lip Gloss", "Lip Liner", "Mascara", "Eyeshadow", "Eyeliner", "Blush", "Highlighter", "Primer", "Setting Spray", "Contour", "Bronzer", "Brow Pencil", "Brow Gel", "Makeup Remover", "Makeup Brush", "Makeup Sponge"], icon: "fa-lips" },
          shade_range: { label: "Shade", options: ["Fair", "Light", "Medium Light", "Medium", "Tan", "Deep Tan", "Deep", "Dark", "Ebony", "Red", "Nude", "Pink", "Berry", "Brown", "Black", "Blue", "Green", "Purple"], icon: "fa-palette", allowCustom: true },
          finish: { label: "Finish", options: ["Matte", "Glossy", "Satin", "Dewy", "Shimmer", "Natural", "Radiant", "Cream", "Liquid", "Powder"], icon: "fa-star" },
          skin_type: { label: "Best For", options: ["All", "Oily", "Dry", "Combination", "Sensitive", "Mature"], icon: "fa-hand-sparkles" },
          coverage: { label: "Coverage", options: ["Sheer", "Light", "Medium", "Full", "Buildable"], icon: "fa-layer-group" },
          condition: { label: "Condition", options: ["Brand New", "New (Sealed)", "Swatched Only", "Used"], icon: "fa-star" },
        }
      },
      haircare: {
        name: "Hair Care",
        icon: "fa-air-freshener",
        specs: {
          brand: { label: "Brand", options: ["Dark & Lovely", "Motions", "ORS", "African Pride", "Cantu", "Shea Moisture", "Mielle", "As I Am", "Kinky-Curly", "Pantene", "Head & Shoulders", "TRESemmé", "Dove", "Olaplex", "Creme of Nature", "Other"], icon: "fa-tag", allowCustom: true },
          hair_type: { label: "Hair Type", options: ["Natural (Type 4)", "Natural (Type 3)", "Relaxed", "Braids/Locs", "Weaves/Wigs", "Curly", "Wavy", "Straight", "Color Treated", "Damaged", "Fine", "Thick", "Oily", "Dry"], icon: "fa-wind", multiple: true },
          product_type: { label: "Product", options: ["Shampoo", "Conditioner", "Deep Conditioner", "Leave-In", "Hair Oil", "Edge Control", "Hair Food", "Relaxer", "Hair Dye", "Wig", "Braiding Hair", "Hair Gel", "Hair Mousse", "Hair Spray", "Dry Shampoo", "Scalp Treatment", "Hair Mask"], icon: "fa-pump-soap" },
          concern: { label: "Concern", options: ["Growth", "Moisture", "Breakage", "Dandruff", "Dry Scalp", "Thinning", "Color Protection", "Heat Protection", "Frizz Control", "Volume", "Shine"], icon: "fa-exclamation-circle", multiple: true },
          gender: { label: "Gender", options: ["Women", "Men", "Kids"], icon: "fa-venus-mars" },
          size: { label: "Size", options: ["50ml", "100ml", "200ml", "355ml", "500ml", "750ml", "1L", "2L", "3.78L"], icon: "fa-flask" },
          condition: { label: "Condition", options: ["Brand New", "New (Sealed)", "Used"], icon: "fa-star" },
        }
      },
      fragrances: {
        name: "Fragrances",
        icon: "fa-spray-can",
        specs: {
          brand: { label: "Brand", options: ["Chanel", "Dior", "Gucci", "Versace", "Armani", "Paco Rabanne", "Calvin Klein", "Davidoff", "Carolina Herrera", "YSL", "Tom Ford", "Jean Paul Gaultier", "Hugo Boss", "Lancôme", "Local/Generic", "Other"], icon: "fa-tag", allowCustom: true },
          gender: { label: "Gender", options: ["Men", "Women", "Unisex"], icon: "fa-venus-mars" },
          type: { label: "Fragrance Type", options: ["Eau de Parfum", "Eau de Toilette", "Eau de Cologne", "Body Spray", "Perfume Oil", "Attar/Oud", "Mist", "Rollerball", "Travel Size", "Gift Set"], icon: "fa-spray-can" },
          scent_family: { label: "Scent Family", options: ["Floral", "Woody", "Oriental", "Fresh", "Citrus", "Fruity", "Musky", "Oud", "Aquatic", "Gourmand", "Spicy", "Green", "Powdery"], icon: "fa-leaf", multiple: true },
          volume: { label: "Volume", options: ["5ml", "10ml", "15ml", "30ml", "50ml", "100ml", "125ml", "150ml", "200ml"], icon: "fa-flask" },
          occasion: { label: "Occasion", options: ["Daily", "Evening", "Special Occasion", "Work", "Gift", "Summer", "Winter", "All Season"], icon: "fa-glass-cheers" },
          longevity: { label: "Longevity", options: ["1-2 hours", "2-4 hours", "4-6 hours", "6-8 hours", "8-12 hours", "12+ hours"], icon: "fa-clock" },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Used - Like New", "Used - Partially Used", "Tester"], icon: "fa-star" },
        }
      },
      mens_grooming: {
        name: "Men's Grooming",
        icon: "fa-cut",
        specs: {
          product_type: { label: "Product", options: ["Beard Oil", "Beard Balm", "Beard Wash", "Shaving Cream", "Shaving Soap", "Aftershave", "Razor", "Electric Shaver", "Trimmer", "Face Wash", "Moisturizer", "Deodorant", "Hair Clipper", "Nose Trimmer", "Beard Kit"], icon: "fa-cut" },
          brand: { label: "Brand", options: ["Nivea Men", "Gillette", "Beardo", "The Man Company", "Old Spice", "Dove Men", "L'Oreal Men", "Phillips", "Braun", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          concern: { label: "Concern", options: ["Beard Growth", "Ingrown Hairs", "Razor Bumps", "Dry Skin", "Acne", "Anti-Aging", "Sensitive Skin"], icon: "fa-exclamation-circle" },
          skin_type: { label: "Skin Type", options: ["Normal", "Oily", "Dry", "Sensitive", "Combination"], icon: "fa-hand-sparkles" },
          condition: { label: "Condition", options: ["Brand New", "New (Sealed)", "Used"], icon: "fa-star" },
          electric: { label: "Electric Device", options: ["Corded", "Cordless", "Rechargeable", "Battery Operated", "Wet/Dry"], icon: "fa-plug" },
        }
      },
      feminine_hygiene: {
        name: "Feminine Hygiene",
        icon: "fa-female",
        specs: {
          product_type: { label: "Product", options: ["Sanitary Pads", "Tampons", "Menstrual Cup", "Panty Liner", "Intimate Wash", "Intimate Wipes", "Period Panties", "Menstrual Disc", "Heating Pad", "Pain Relief"], icon: "fa-pump-soap" },
          brand: { label: "Brand", options: ["Always", "Kotex", "Softcare", "Whisper", "L. Organic", "DivaCup", "Saalt", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          flow: { label: "Flow", options: ["Light", "Regular", "Heavy", "Overnight", "Maternity", "Postpartum", "Extra Heavy"], icon: "fa-tint" },
          pack_size: { label: "Pack Size", options: ["10 pcs", "16 pcs", "20 pcs", "30 pcs", "32 pcs", "40 pcs", "50 pcs", "60 pcs", "80 pcs", "100 pcs"], icon: "fa-box" },
          organic: { label: "Organic/Cotton", options: ["Yes (100% Cotton)", "Yes (Organic)", "No (Synthetic)", "Mixed"], icon: "fa-leaf" },
          condition: { label: "Condition", options: ["Brand New", "New (Sealed)"], icon: "fa-star" },
        }
      },
      bath_body: {
        name: "Bath & Body",
        icon: "fa-bath",
        specs: {
          product_type: { label: "Product", options: ["Body Wash", "Body Lotion", "Body Butter", "Body Scrub", "Body Oil", "Bar Soap", "Hand Soap", "Hand Cream", "Foot Cream", "Shower Gel", "Bath Salts", "Bath Bombs", "Body Spray"], icon: "fa-bath" },
          brand: { label: "Brand", options: ["Dove", "Nivea", "Vaseline", "The Body Shop", "Bath & Body Works", "Jergens", "Aveeno", "Cetaphil", "Lush", "Generic"], icon: "fa-tag", allowCustom: true },
          skin_type: { label: "Skin Type", options: ["Normal", "Dry", "Oily", "Sensitive", "Combination", "All"], icon: "fa-hand-sparkles" },
          scent: { label: "Scent", options: ["Unscented", "Lavender", "Vanilla", "Coconut", "Rose", "Jasmine", "Citrus", "Cucumber", "Shea Butter", "Cocoa Butter", "Aloe", "Other"], icon: "fa-leaf", allowCustom: true },
          volume: { label: "Size", options: ["100ml", "200ml", "250ml", "400ml", "500ml", "750ml", "1L", "2L"], icon: "fa-flask" },
          condition: { label: "Condition", options: ["Brand New", "New (Sealed)", "Used"], icon: "fa-star" },
        }
      },
      deodorants: {
        name: "Deodorants & Antiperspirants",
        icon: "fa-smile",
        specs: {
          type: { label: "Type", options: ["Spray", "Roll-On", "Stick", "Cream", "Gel", "Crystal", "Wipes"], icon: "fa-spray-can" },
          brand: { label: "Brand", options: ["Nivea", "Rexona", "Dove", "Old Spice", "Axe", "Adidas", "Secret", "Arm & Hammer", "Generic"], icon: "fa-tag", allowCustom: true },
          gender: { label: "Gender", options: ["Men", "Women", "Unisex"], icon: "fa-venus-mars" },
          scent: { label: "Scent", options: ["Unscented", "Fresh", "Sport", "Powder", "Floral", "Citrus", "Ocean", "Musk", "Other"], icon: "fa-leaf", allowCustom: true },
          aluminum_free: { label: "Aluminum Free", options: ["Yes", "No"], icon: "fa-ban" },
          condition: { label: "Condition", options: ["Brand New", "New (Sealed)", "Used"], icon: "fa-star" },
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. HOME & LIVING (EXPANDED)
  // ═══════════════════════════════════════════════════════════════════════════
  home: {
    id: "home",
    name: "Home & Living",
    icon: "🏠",
    description: "Furniture, kitchen, decor, bedding, lighting, and appliances",
    subcategories: {
      furniture: {
        name: "Furniture",
        icon: "fa-couch",
        specs: {
          type: { label: "Type", options: ["L-Shaped Sofa", "Chesterfield Sofa", "3-Seater Sofa", "Accent Chair", "Recliner", "Velvet Ottoman", "6x6 King Bed", "4x6 Double Bed", "Bunk Bed", "Panel Bed", "4-Door Wardrobe", "Mahogany TV Stand", "Coffee Table", "Dressing Table", "Shoe Rack", "Chest of Drawers", "Dining Set (6-Seater)", "Wooden Bench"], icon: "fa-couch" },
          material: { label: "Material", options: ["Solid Wood (Mahogany)", "Solid Wood (Mvule)", "Velvet", "Leather", "Fabric", "MDF", "Plywood", "Metal"], icon: "fa-tree" },
          color: { label: "Color", options: ["Brown", "Grey", "Navy Blue", "Emerald Green", "Black", "White", "Beige"], icon: "fa-palette", allowCustom: true },
          room: { label: "Room", options: ["Living Room", "Bedroom", "Dining Room", "Office", "Kitchen", "Entryway"], icon: "fa-home" },
          condition: { label: "Condition", options: ["Brand New", "Custom Made", "Used"], icon: "fa-star" },
        }
      },
      office_furniture: {
        name: "Office Furniture",
        icon: "fa-briefcase",
        specs: {
          type: { label: "Type", options: ["Ergonomic Chair", "Executive Desk", "Workstation", "Filing Cabinet", "Conference Table", "Reception Desk"], icon: "fa-briefcase" },
          material: { label: "Material", options: ["Mesh", "Leather", "Metal", "Melamine", "Solid Wood"], icon: "fa-layer-group" },
        }
      },
      kitchen: {
        name: "Kitchen & Dining",
        icon: "fa-utensils",
        specs: {
          type: { label: "Type", options: ["Cookware", "Dinnerware", "Utensils", "Appliance", "Storage", "Bakeware", "Cutlery", "Glassware", "Cookbooks", "Kitchen Organization", "Food Storage", "Water Filters"], icon: "fa-utensils" },
          material: { label: "Material", options: ["Stainless Steel", "Non-Stick", "Ceramic", "Glass", "Plastic", "Wood", "Cast Iron", "Copper", "Aluminum", "Silicone", "Stoneware", "Porcelain", "Bamboo"], icon: "fa-layer-group" },
          brand: { label: "Brand", options: ["Ramtons", "Mika", "Armco", "Sayona", "Philips", "Cuisinart", "KitchenAid", "Hamilton Beach", "Instant Pot", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          color: { label: "Color", options: ["Silver", "Black", "Red", "White", "Blue", "Green", "Yellow", "Rose Gold", "Copper", "Teal", "Grey"], icon: "fa-palette", allowCustom: true },
          appliance_type: { label: "Appliance Type", options: ["Blender", "Microwave", "Kettle", "Rice Cooker", "Pressure Cooker", "Toaster", "Mixer", "Stand Mixer", "Food Processor", "Air Fryer", "Slow Cooker", "Electric Skillet", "Coffee Maker", "Espresso Machine", "Refrigerator", "Freezer", "Dishwasher", "Oven", "Stove", "Cooktop", "Range Hood"], icon: "fa-plug" },
          capacity: { label: "Capacity", options: ["1L", "2L", "3L", "4L", "5L", "6L", "10L", "15L", "20L", "30L", "50L+", "1-2 cups", "4-6 cups", "8-10 cups", "12+ cups"], icon: "fa-flask" },
          power: { label: "Wattage", options: ["500W", "800W", "1000W", "1200W", "1500W", "2000W", "2500W+"], icon: "fa-bolt" },
          condition: { label: "Condition", options: ["Brand New", "Open Box", "Refurbished", "Used"], icon: "fa-star" },
        }
      },
      bedding: {
        name: "Bedding & Linens",
        icon: "fa-bed",
        specs: {
          type: { label: "Type", options: ["Bed Sheet Set", "Flat Sheet", "Fitted Sheet", "Duvet", "Duvet Cover", "Comforter", "Pillow", "Pillowcase", "Blanket", "Mattress Protector", "Mattress Topper", "Bed Cover", "Quilt", "Throw Blanket", "Bed Skirt", "Weighted Blanket"], icon: "fa-bed" },
          size: { label: "Bed Size", options: ["Twin", "Twin XL", "Full", "Queen", "King", "California King", "Super King", "Crib", "Single (3x6)", "Single (4x6)", "Double (5x6)", "Queen (6x6)", "King (6x7)", "UK Single", "UK Double", "UK King"], icon: "fa-ruler" },
          material: { label: "Material", options: ["Cotton", "Polyester", "Satin", "Silk", "Linen", "Microfiber", "Egyptian Cotton", "Supima Cotton", "Bamboo", "Flannel", "Jersey", "Tencel", "Wool", "Down", "Down Alternative"], icon: "fa-layer-group" },
          color: { label: "Color", options: ["White", "Cream", "Grey", "Blue", "Pink", "Purple", "Brown", "Green", "Red", "Navy", "Black", "Multicolor", "Patterned", "Floral", "Striped"], icon: "fa-palette", allowCustom: true },
          thread_count: { label: "Thread Count", options: ["200", "400", "600", "800", "1000", "1200", "1500", "1800+"], icon: "fa-list-ol" },
          filling: { label: "Filling Material", options: ["Down", "Feather", "Down Alternative", "Polyester", "Memory Foam", "Latex", "Cotton", "Wool", "Silk", "Bamboo"], icon: "fa-layer-group" },
          firmness: { label: "Pillow Firmness", options: ["Soft", "Medium", "Firm", "Extra Firm", "Adjustable"], icon: "fa-hand-peace" },
          condition: { label: "Condition", options: ["Brand New", "New in Package", "Like New", "Gently Used"], icon: "fa-star" },
        }
      },
      home_decor: {
        name: "Home Decor",
        icon: "fa-paint-roller",
        specs: {
          type: { label: "Type", options: ["Wall Art", "Painting", "Poster", "Mirror", "Vase", "Candle", "Candle Holder", "Rug", "Curtain", "Cushion", "Clock", "Plant", "Artificial Plant", "Lamp", "Photo Frame", "Figurine", "Sculpture", "Shelf Decor", "Ornament", "Seasonal Decor", "Christmas Decor", "Easter Decor", "Eid Decor"], icon: "fa-paint-roller" },
          style: { label: "Style", options: ["Modern", "Traditional", "Bohemian", "Minimalist", "Rustic", "African", "Contemporary", "Industrial", "Scandinavian", "Mid-Century", "Farmhouse", "Coastal", "Glam", "Vintage", "Eclectic"], icon: "fa-star" },
          room: { label: "Room", options: ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Office", "Outdoor", "Hallway", "Dining Room", "Kids Room"], icon: "fa-home" },
          color: { label: "Color", options: ["Gold", "Black", "White", "Earth Tones", "Blue", "Green", "Red", "Yellow", "Silver", "Copper", "Rose Gold", "Neutral", "Multicolor"], icon: "fa-palette", allowCustom: true },
          material: { label: "Material", options: ["Wood", "Metal", "Ceramic", "Glass", "Fabric", "Wicker", "Concrete", "Resin", "Plastic", "Paper", "Canvas", "Marble", "Stone", "Clay"], icon: "fa-layer-group" },
          size: { label: "Size", options: ["Small (<12\")", "Medium (12-24\")", "Large (24-36\")", "Extra Large (>36\")", "Wall Art 8x10", "Wall Art 11x14", "Wall Art 16x20", "Wall Art 18x24", "Wall Art 24x36"], icon: "fa-expand" },
          condition: { label: "Condition", options: ["Brand New", "Handmade", "Vintage", "Used - Like New", "Used"], icon: "fa-star" },
        }
      },
      cleaning: {
        name: "Cleaning Supplies",
        icon: "fa-broom",
        specs: {
          type: { label: "Type", options: ["Laundry Detergent", "Fabric Softener", "Disinfectant", "Floor Cleaner", "Toilet Cleaner", "Glass Cleaner", "Air Freshener", "Bleach", "Soap", "Sponge", "Mop", "Broom", "Dustpan", "Brush", "Gloves", "Trash Bags", "Cleaning Cloth", "Scrubber", "Squeegee", "Vacuum Cleaner", "Steam Cleaner"], icon: "fa-broom" },
          brand: { label: "Brand", options: ["Omo", "Ariel", "Persil", "Harpic", "Dettol", "Jik", "Sunlight", "Mr. Muscle", "Vim", "Easy-Off", "Swiffer", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          scent: { label: "Scent", options: ["Lemon", "Lavender", "Floral", "Ocean", "Pine", "Unscented", "Fresh Linen", "Spring Breeze", "Citrus", "Eucalyptus", "Mint"], icon: "fa-leaf" },
          form: { label: "Form", options: ["Liquid", "Powder", "Tablet", "Spray", "Gel", "Pod", "Sheet", "Foam"], icon: "fa-flask" },
          size: { label: "Size", options: ["100ml", "250ml", "500ml", "750ml", "1L", "1.5L", "2L", "3L", "5L", "10L", "20L", "100g", "250g", "500g", "1kg", "2kg", "5kg", "10kg", "20kg", "50 loads", "100 loads"], icon: "fa-weight" },
          eco_friendly: { label: "Eco-Friendly", options: ["Yes", "No", "Biodegradable", "Plant-Based"], icon: "fa-leaf" },
          condition: { label: "Condition", options: ["Brand New", "New (Sealed)", "Used - Partial"], icon: "fa-star" },
        }
      },
      lighting: {
        name: "Lighting",
        icon: "fa-lightbulb",
        specs: {
          type: { label: "Type", options: ["Ceiling Light", "Chandelier", "Pendant Light", "Floor Lamp", "Table Lamp", "Desk Lamp", "Wall Sconce", "Track Lighting", "Outdoor Light", "Solar Light", "String Lights", "LED Strip", "Night Light", "Vanity Light", "Closet Light", "Under Cabinet Light"], icon: "fa-lightbulb" },
          style: { label: "Style", options: ["Modern", "Traditional", "Industrial", "Rustic", "Mid-Century", "Farmhouse", "Bohemian", "Minimalist", "Art Deco", "Vintage", "Contemporary"], icon: "fa-star" },
          bulb_type: { label: "Bulb Type", options: ["LED", "Incandescent", "CFL", "Halogen", "Smart Bulb", "RGB", "Filament LED"], icon: "fa-lightbulb" },
          color_temperature: { label: "Color Temperature", options: ["Warm White (2700K)", "Soft White (3000K)", "Neutral White (4000K)", "Cool White (5000K)", "Daylight (6500K)", "RGB Color Changing"], icon: "fa-sun" },
          brightness: { label: "Brightness (Lumens)", options: ["<500 lm", "500-800 lm", "800-1100 lm", "1100-1600 lm", "1600+ lm", "Dimmable", "Not Specified"], icon: "fa-sun" },
          material: { label: "Material", options: ["Metal", "Glass", "Wood", "Plastic", "Fabric", "Crystal", "Bamboo", "Concrete"], icon: "fa-layer-group" },
          color: { label: "Color", options: ["Black", "White", "Brass", "Gold", "Silver", "Copper", "Nickel", "Bronze", "Chrome", "Wood", "Clear Glass", "Frosted Glass"], icon: "fa-palette", allowCustom: true },
          smart_features: { label: "Smart Features", options: ["Wi-Fi", "Bluetooth", "Alexa Compatible", "Google Home Compatible", "App Controlled", "Voice Control", "None"], icon: "fa-microchip", multiple: true },
          condition: { label: "Condition", options: ["Brand New", "Open Box", "Used"], icon: "fa-star" },
        }
      },
      storage_organization: {
        name: "Storage & Organization",
        icon: "fa-boxes",
        specs: {
          type: { label: "Type", options: ["Storage Bin", "Storage Box", "Storage Basket", "Storage Bag", "Shelf", "Bookcase", "Cabinet", "Drawer Organizer", "Closet Organizer", "Shoe Rack", "Clothes Rack", "Hanger", "Garment Bag", "Under Bed Storage", "Over Door Organizer", "Kitchen Organizer", "Pantry Organizer", "Bathroom Organizer"], icon: "fa-boxes" },
          material: { label: "Material", options: ["Plastic", "Fabric", "Wood", "Metal", "Bamboo", "Wicker", "Rattan", "Cardboard", "Glass", "Acrylic"], icon: "fa-layer-group" },
          size: { label: "Size", options: ["Small (Shoe Box)", "Medium (12x12x12)", "Large (15x15x15)", "Extra Large (20x20x20)", "Small Shelf", "Medium Shelf", "Large Shelf"], icon: "fa-expand" },
          color: { label: "Color", options: ["Clear", "White", "Black", "Grey", "Beige", "Brown", "Blue", "Pink", "Multicolor"], icon: "fa-palette", allowCustom: true },
          stackable: { label: "Stackable", options: ["Yes", "No"], icon: "fa-layer-group" },
          condition: { label: "Condition", options: ["Brand New", "Like New", "Used"], icon: "fa-star" },
        }
      },
      curtains_blinds: {
        name: "Curtains & Blinds",
        icon: "fa-window-maximize",
        specs: {
          type: { label: "Type", options: ["Curtains", "Drapes", "Sheer Curtains", "Blackout Curtains", "Thermal Curtains", "Valance", "Blinds", "Vertical Blinds", "Horizontal Blinds", "Roller Blinds", "Roman Shades", "Venetian Blinds", "Shutters", "Curtain Rod", "Curtain Hooks", "Tiebacks"], icon: "fa-window-maximize" },
          material: { label: "Material", options: ["Polyester", "Cotton", "Linen", "Velvet", "Silk", "Blackout Fabric", "Bamboo", "Wood", "Aluminum", "Vinyl"], icon: "fa-layer-group" },
          color: { label: "Color", options: ["White", "Black", "Grey", "Beige", "Navy", "Blue", "Red", "Green", "Brown", "Multicolor", "Patterned", "Floral", "Striped"], icon: "fa-palette", allowCustom: true },
          size: { label: "Size (Width x Length)", options: ['48"x84"', '48"x96"', '52"x84"', '52"x96"', '54"x84"', '54"x96"', 'Custom Size', "Small Window", "Medium Window", "Large Window", "Sliding Door"], icon: "fa-expand" },
          blackout: { label: "Blackout Rating", options: ["100% Blackout", "Room Darkening", "Light Filtering", "Sheer"], icon: "fa-moon" },
          condition: { label: "Condition", options: ["Brand New", "New with Tags", "Like New", "Used"], icon: "fa-star" },
        }
      },
      rugs_mats: {
        name: "Rugs & Mats",
        icon: "fa-rug",
        specs: {
          type: { label: "Type", options: ["Area Rug", "Runner Rug", "Doormat", "Bath Mat", "Kitchen Mat", "Anti-Fatigue Mat", "Play Mat", "Yoga Mat", "Carpet", "Persian Rug", "Oriental Rug", "Shag Rug", "Braided Rug", "Outdoor Rug"], icon: "fa-rug" },
          material: { label: "Material", options: ["Wool", "Cotton", "Polyester", "Nylon", "Polypropylene", "Jute", "Sisal", "Silk", "Chenille", "Memory Foam", "Rubber", "Bamboo"], icon: "fa-layer-group" },
          size: { label: "Size", options: ['2\'x3\'', '3\'x5\'', '4\'x6\'', '5\'x7\'', '5\'x8\'', '6\'x9\'', '8\'x10\'', '9\'x12\'', '10\'x14\'', 'Runner 2\'x6\'', 'Runner 2\'x8\'', 'Runner 2\'x10\'', "Small", "Medium", "Large", "Extra Large"], icon: "fa-expand" },
          color: { label: "Color", options: ["Beige", "Grey", "Brown", "Navy", "Blue", "Red", "Green", "Black", "White", "Multicolor", "Patterned", "Geometric", "Floral", "Striped"], icon: "fa-palette", allowCustom: true },
          shape: { label: "Shape", options: ["Rectangle", "Square", "Round", "Oval", "Runner", "Irregular"], icon: "fa-shapes" },
          washable: { label: "Machine Washable", options: ["Yes", "No", "Spot Clean Only"], icon: "fa-tshirt" },
          condition: { label: "Condition", options: ["Brand New", "New", "Like New", "Gently Used", "Used", "Vintage"], icon: "fa-star" },
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. FOOD & GROCERIES (EXPANDED)
  // ═══════════════════════════════════════════════════════════════════════════
  food: {
    id: "food",
    name: "Food & Groceries",
    icon: "🍎",
    description: "Fresh produce, packaged food, beverages, cooking essentials, dairy, meat, and frozen foods",
    subcategories: {
      fresh_produce: {
        name: "Fresh Produce",
        icon: "fa-carrot",
        specs: {
          type: { label: "Category", options: ["Vegetables", "Fruits", "Herbs", "Mushrooms", "Sprouts", "Salad Greens", "Root Vegetables", "Leafy Greens", "Tropical Fruits", "Citrus Fruits", "Berries", "Melons", "Stone Fruits", "Exotic Fruits"], icon: "fa-carrot" },
          specific_item: { label: "Specific Item", options: ["Tomatoes", "Onions", "Potatoes", "Cabbage", "Kale (Sukuma Wiki)", "Spinach", "Lettuce", "Cucumber", "Carrots", "Bell Peppers", "Chilies", "Garlic", "Ginger", "Broccoli", "Cauliflower", "Avocado", "Bananas", "Oranges", "Mangoes", "Pineapple", "Watermelon", "Papaya", "Apples", "Grapes", "Lemons", "Limes", "Strawberries", "Fresh Herbs (Coriander)", "Fresh Herbs (Rosemary)", "Fresh Herbs (Mint)", "Fresh Herbs (Basil)", "Other"], icon: "fa-apple-alt", allowCustom: true },
          origin: { label: "Origin", options: ["Local", "Imported", "Organic Farm", "Smallholder Farmer", "Commercial Farm", "Imported (Europe)", "Imported (Asia)", "Imported (South America)"], icon: "fa-map-marker-alt" },
          organic: { label: "Organic", options: ["Organic Certified", "Conventional", "Pesticide-Free", "Transitional", "Not Specified"], icon: "fa-leaf" },
          unit: { label: "Unit", options: ["per kg", "per piece", "per bunch", "per crate", "per dozen", "per punnet", "per bag", "per 500g", "per 250g"], icon: "fa-balance-scale" },
          freshness: { label: "Freshness", options: ["Harvested Today", "1-2 Days Old", "3-5 Days Old", "Pre-packed (Dated)", "Ripe", "Ready to Eat", "Needs Ripening"], icon: "fa-clock" },
          quantity: { label: "Quantity Available", options: ["Limited (1-10 kg)", "Medium (10-50 kg)", "Large (50-100 kg)", "Bulk (100+ kg)"], icon: "fa-weight" },
        }
      },
      packaged_food: {
        name: "Packaged Food",
        icon: "fa-box",
        specs: {
          type: { label: "Type", options: ["Snacks", "Chips", "Biscuits", "Cookies", "Crackers", "Cereals", "Breakfast Cereal", "Granola", "Oats", "Pasta", "Spaghetti", "Macaroni", "Noodles", "Instant Noodles", "Rice", "Flour", "Wheat Flour", "Maize Flour", "Self-Raising Flour", "Bread Flour", "Sugar", "Brown Sugar", "Icing Sugar", "Oil", "Cooking Oil", "Olive Oil", "Coconut Oil", "Canned Food", "Canned Vegetables", "Canned Fruits", "Canned Beans", "Canned Fish", "Canned Meat", "Sauces", "Ketchup", "Mayonnaise", "Mustard", "Hot Sauce", "Soy Sauce", "Vinegar", "Soups", "Broth", "Instant Soup", "Baby Food", "Pet Food", "Spices (Packaged)", "Seasoning Mixes"], icon: "fa-box" },
          brand: { label: "Brand", options: ["Indomie", "Nescafe", "Blue Band", "Royco", "Ajab", "Kabras", "Kensalt", "Fresh Fri", "Coca-Cola", "Pepsi", "Knorr", "Maggi", "Kimbo", "Pembe", "Jogoo", "Bidco", "Other"], icon: "fa-tag", allowCustom: true },
          dietary: { label: "Dietary", options: ["Vegan", "Vegetarian", "Halal", "Kosher", "Gluten-Free", "Sugar-Free", "Low Sodium", "Low Fat", "High Protein", "Organic", "Non-GMO", "None"], icon: "fa-utensils", multiple: true },
          weight: { label: "Weight", options: ["50g", "100g", "150g", "200g", "250g", "300g", "400g", "500g", "750g", "1kg", "1.5kg", "2kg", "5kg", "10kg", "25kg", "50kg"], icon: "fa-weight" },
          shelf_life: { label: "Shelf Life", options: ["1-3 Months", "3-6 Months", "6-12 Months", "1 Year+", "2 Years+", "Best Before (Specific Date)"], icon: "fa-calendar" },
          packaging: { label: "Packaging", options: ["Pouch", "Box", "Can", "Jar", "Bottle", "Tetra Pak", "Vacuum Sealed", "Plastic Container"], icon: "fa-box" },
          condition: { label: "Condition", options: ["Brand New", "Sealed", "Expiry Date Approaching", "Damaged Packaging (Discount)"], icon: "fa-star" },
        }
      },
      beverages: {
        name: "Beverages",
        icon: "fa-glass-whiskey",
        specs: {
          type: { label: "Type", options: ["Soda", "Carbonated Drink", "Juice", "Fruit Juice", "Nectar", "Water", "Bottled Water", "Sparkling Water", "Energy Drink", "Sports Drink", "Tea", "Black Tea", "Green Tea", "Herbal Tea", "Coffee", "Ground Coffee", "Instant Coffee", "Coffee Beans", "Milk", "Fresh Milk", "UHT Milk", "Powdered Milk", "Plant Milk", "Yogurt Drink", "Smoothie", "Beer", "Alcoholic Beer", "Non-Alcoholic Beer", "Wine", "Red Wine", "White Wine", "Spirits", "Vodka", "Whiskey", "Gin", "Rum", "Cider", "Soft Drink"], icon: "fa-glass-whiskey" },
          brand: { label: "Brand", options: ["Coca-Cola", "Pepsi", "Fanta", "Sprite", "Red Bull", "Monster", "Nescafe", "Kericho Gold", "Brookside", "Keringet", "Dasani", "Aquamist", "Tusker", "Savanna", "Heineken", "Guinness", "Other"], icon: "fa-tag", allowCustom: true },
          volume: { label: "Volume", options: ["250ml", "330ml", "500ml", "600ml", "1L", "1.5L", "2L", "3L", "5L", "10L", "20L", "12 oz", "16 oz", "20 oz", "1 gallon", "5 gallons"], icon: "fa-flask" },
          packaging: { label: "Packaging", options: ["Bottle (Plastic)", "Bottle (Glass)", "Can", "Carton", "Tetra Pack", "Pouch", "Sachet", "Keg", "Bag in Box"], icon: "fa-box" },
          temperature: { label: "Serve", options: ["Chilled", "Room Temperature", "Hot", "On Ice"], icon: "fa-thermometer-half" },
          caffeine: { label: "Caffeine", options: ["Caffeinated", "Decaffeinated", "Caffeine Free"], icon: "fa-mug-hot" },
          alcohol_content: { label: "Alcohol Content", options: ["Non-Alcoholic (0%)", "Low Alcohol (<5%)", "Regular (5-10%)", "Strong (10-20%)", "High (>20%)"], icon: "fa-wine-bottle" },
          condition: { label: "Condition", options: ["Brand New", "Sealed", "Cold Storage Required"], icon: "fa-star" },
        }
      },
      cooking_essentials: {
        name: "Cooking Essentials",
        icon: "fa-fire",
        specs: {
          type: { label: "Type", options: ["Cooking Oil", "Vegetable Oil", "Palm Oil", "Sunflower Oil", "Olive Oil", "Coconut Oil", "Flour", "Wheat Flour", "Maize Flour", "Self-Raising Flour", "Bread Flour", "Sugar", "Brown Sugar", "Icing Sugar", "Salt", "Table Salt", "Sea Salt", "Himalayan Salt", "Spices", "Turmeric", "Cumin", "Coriander", "Paprika", "Chili Powder", "Black Pepper", "White Pepper", "Cinnamon", "Cloves", "Nutmeg", "Cardamom", "Garam Masala", "Curry Powder", "Sauce", "Soy Sauce", "Fish Sauce", "Oyster Sauce", "Worcestershire Sauce", "Vinegar", "White Vinegar", "Apple Cider Vinegar", "Balsamic Vinegar", "Rice Vinegar", "Baking Powder", "Baking Soda", "Yeast", "Cornstarch", "Gelatin", "Food Coloring", "Vanilla Extract"], icon: "fa-fire" },
          brand: { label: "Brand", options: ["Fresh Fri", "Rina", "Ajab", "Kabras", "Kensalt", "Chapa Mandashi", "Royco", "Kimbo", "Pembe", "Jogoo", "Bidco", "Elianto", "Salit", "Other"], icon: "fa-tag", allowCustom: true },
          weight: { label: "Weight/Volume", options: ["100g", "200g", "250g", "400g", "500g", "750g", "1kg", "2kg", "5kg", "10kg", "20kg", "25kg", "50kg", "250ml", "500ml", "1L", "2L", "3L", "5L", "10L", "20L"], icon: "fa-weight" },
          dietary: { label: "Dietary", options: ["Vegetable Oil", "Palm Oil Free", "Non-GMO", "Organic", "Gluten-Free", "Low Sodium", "Iodized", "Non-Iodized", "Halal", "Kosher"], icon: "fa-seedling", multiple: true },
          condition: { label: "Condition", options: ["Brand New", "Sealed", "Bulk Packaging"], icon: "fa-star" },
        }
      },
      dairy_eggs: {
        name: "Dairy & Eggs",
        icon: "fa-cheese",
        specs: {
          type: { label: "Type", options: ["Milk (Fresh)", "Milk (UHT)", "Milk (Powdered)", "Butter", "Margarine", "Cheese", "Cheddar", "Gouda", "Mozzarella", "Cream Cheese", "Blue Cheese", "Yogurt", "Greek Yogurt", "Drinking Yogurt", "Sour Cream", "Cream", "Whipping Cream", "Ice Cream", "Eggs (Chicken)", "Eggs (Free Range)", "Eggs (Quail)", "Eggs (Duck)", "Ghee", "Lard", "Cottage Cheese"], icon: "fa-cheese" },
          brand: { label: "Brand", options: ["Brookside", "New KCC", "Githunguri", "Ilara", "Palmhouse", "Happy Cow", "Kenchic", "Other"], icon: "fa-tag", allowCustom: true },
          size: { label: "Size", options: ["250ml", "500ml", "1L", "2L", "100g", "200g", "250g", "500g", "1kg", "Eggs (6 pcs)", "Eggs (12 pcs)", "Eggs (30 pcs)", "Egg Tray (30 eggs)", "Egg Crate (30 eggs)"], icon: "fa-weight" },
          fat_content: { label: "Fat Content", options: ["Full Fat (3.25%+)", "Low Fat (1-2%)", "Skim (0-1%)", "No Fat (0%)", "Whole Milk", "Semi-Skimmed", "Skimmed"], icon: "fa-tint" },
          organic: { label: "Organic", options: ["Organic", "Conventional", "Free Range", "Grass Fed", "Pasture Raised"], icon: "fa-leaf" },
          storage: { label: "Storage", options: ["Refrigerated", "Shelf Stable", "Frozen"], icon: "fa-temperature-low" },
          condition: { label: "Condition", options: ["Brand New", "Fresh", "Near Expiry (Discount)", "Frozen"], icon: "fa-star" },
        }
      },
      meat_poultry: {
        name: "Meat & Poultry",
        icon: "fa-drumstick-bite",
        specs: {
          type: { label: "Type", options: ["Beef", "Beef Steak", "Beef Mince", "Beef Roast", "Chicken (Whole)", "Chicken (Breast)", "Chicken (Thighs)", "Chicken (Wings)", "Chicken (Drumsticks)", "Chicken (Mince)", "Pork", "Pork Chops", "Pork Belly", "Pork Mince", "Lamb", "Lamb Chops", "Lamb Roast", "Goat Meat", "Turkey", "Duck", "Rabbit", "Bacon", "Sausages", "Ham", "Burgers", "Meatballs"], icon: "fa-drumstick-bite" },
          cut: { label: "Cut", options: ["Whole", "Diced", "Mince/Ground", "Steak", "Roast", "Chops", "Fillet", "Ribs", "Shank", "Breast", "Thigh", "Wings", "Leg", "Shoulder", "Loin"], icon: "fa-cut" },
          weight: { label: "Weight", options: ["250g", "500g", "750g", "1kg", "1.5kg", "2kg", "2.5kg", "3kg", "5kg", "10kg", "Whole Chicken", "Half Chicken"], icon: "fa-weight" },
          farming: { label: "Farming Method", options: ["Free Range", "Organic", "Grass Fed", "Grain Fed", "Conventional", "Halal", "Kosher"], icon: "fa-leaf" },
          storage: { label: "Storage", options: ["Fresh", "Frozen", "Chilled", "Vacuum Sealed"], icon: "fa-temperature-low" },
          condition: { label: "Condition", options: ["Fresh (Same Day)", "Fresh (1-2 Days)", "Frozen", "Pre-Marinated"], icon: "fa-star" },
        }
      },
      seafood: {
        name: "Seafood & Fish",
        icon: "fa-fish",
        specs: {
          type: { label: "Type", options: ["Fresh Fish (Whole)", "Fresh Fish (Fillet)", "Tilapia", "Nile Perch", "Trout", "Salmon", "Tuna", "Mackerel", "Catfish", "Sardines", "Crab", "Lobster", "Prawns", "Shrimp", "Oysters", "Mussels", "Clams", "Squid", "Octopus", "Smoked Fish", "Dried Fish (Mukene/Omena)", "Fish Balls", "Fish Cakes"], icon: "fa-fish" },
          weight: { label: "Weight", options: ["250g", "500g", "750g", "1kg", "1.5kg", "2kg", "Whole Fish (per kg)", "Per piece"], icon: "fa-weight" },
          origin: { label: "Origin", options: ["Local (Lake)", "Local (Ocean)", "Imported (Fresh)", "Imported (Frozen)", "Farm Raised", "Wild Caught"], icon: "fa-map-marker-alt" },
          storage: { label: "Storage", options: ["Fresh (On Ice)", "Fresh (Chilled)", "Frozen", "Smoked", "Dried", "Canned"], icon: "fa-temperature-low" },
          condition: { label: "Condition", options: ["Fresh Today", "Fresh (1-2 Days)", "Frozen", "Pre-Cleaned", "Pre-Filleted"], icon: "fa-star" },
        }
      },
      frozen_foods: {
        name: "Frozen Foods",
        icon: "fa-snowflake",
        specs: {
          type: { label: "Type", options: ["Frozen Vegetables", "Frozen Mixed Veg", "Frozen Peas", "Frozen Corn", "Frozen Broccoli", "Frozen Spinach", "Frozen Fruits", "Frozen Berries", "Frozen Mango", "Frozen Ice Cream", "Frozen Yogurt", "Frozen Pizza", "Frozen Ready Meals", "Frozen Chips/Fries", "Frozen Nuggets", "Frozen Fish Fingers", "Frozen Burgers", "Frozen Pastry", "Frozen Dough"], icon: "fa-snowflake" },
          brand: { label: "Brand", options: ["Farmers Choice", "Kenchic", "Ramtons", "Mika", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          weight: { label: "Weight", options: ["250g", "500g", "750g", "1kg", "1.5kg", "2kg", "2.5kg", "3kg", "5kg"], icon: "fa-weight" },
          storage: { label: "Storage", options: ["Keep Frozen", "Do Not Refreeze", "Keep at -18°C"], icon: "fa-snowflake" },
          condition: { label: "Condition", options: ["Frozen (Solid)", "Partially Thawed (Discounted)", "Fully Frozen"], icon: "fa-star" },
        }
      },
      baking_supplies: {
        name: "Baking Supplies",
        icon: "fa-birthday-cake",
        specs: {
          type: { label: "Type", options: ["Flour (Bread)", "Flour (Cake)", "Flour (Pastry)", "Self-Raising Flour", "Baking Powder", "Baking Soda", "Yeast (Active Dry)", "Yeast (Instant)", "Yeast (Fresh)", "Cornstarch", "Cocoa Powder", "Chocolate Chips", "Chocolate (Baking)", "Sprinkles", "Food Coloring (Liquid)", "Food Coloring (Gel)", "Vanilla Extract", "Almond Extract", "Lemon Extract", "Butter (Baking)", "Margarine (Baking)", "Cream Cheese", "Icing Sugar", "Brown Sugar", "Castor Sugar", "Gelatin", "Pectin", "Shortening", "Lard"], icon: "fa-birthday-cake" },
          brand: { label: "Brand", options: ["Ajab", "Kimbo", "Pembe", "Dr. Oetker", "Betty Crocker", "Duncan Hines", "Other"], icon: "fa-tag", allowCustom: true },
          weight: { label: "Weight", options: ["50g", "100g", "200g", "250g", "400g", "500g", "1kg", "2kg", "5kg"], icon: "fa-weight" },
          dietary: { label: "Dietary", options: ["Gluten-Free", "Vegan", "Dairy-Free", "Egg-Free", "Nut-Free", "Organic", "Conventional"], icon: "fa-leaf", multiple: true },
          condition: { label: "Condition", options: ["Brand New", "Sealed", "Bulk"], icon: "fa-star" },
        }
      },
      condiments: {
        name: "Condiments & Sauces",
        icon: "fa-tint",
        specs: {
          type: { label: "Type", options: ["Ketchup", "Tomato Sauce", "Mayonnaise", "Salad Dressing", "Mustard", "Yellow Mustard", "Dijon Mustard", "Hot Sauce", "Sriracha", "Tabasco", "BBQ Sauce", "Teriyaki Sauce", "Soy Sauce", "Fish Sauce", "Oyster Sauce", "Hoisin Sauce", "Worcestershire Sauce", "Vinegar", "White Vinegar", "Apple Cider Vinegar", "Balsamic Vinegar", "Rice Vinegar", "Pickles", "Relish", "Chutney", "Mango Chutney", "Jam", "Marmalade", "Honey", "Peanut Butter", "Nutella", "Syrup", "Maple Syrup"], icon: "fa-tint" },
          brand: { label: "Brand", options: ["Heinz", "Kraft", "Hellmann's", "French's", "Tabasco", "Sriracha", "Knorr", "Maggi", "Royco", "Other"], icon: "fa-tag", allowCustom: true },
          size: { label: "Size", options: ["50ml", "100ml", "150ml", "200ml", "250ml", "300ml", "500ml", "750ml", "1L", "5L", "100g", "200g", "250g", "500g", "1kg"], icon: "fa-flask" },
          dietary: { label: "Dietary", options: ["Gluten-Free", "Vegan", "Vegetarian", "Low Sugar", "Low Sodium", "Organic", "Non-GMO"], icon: "fa-leaf", multiple: true },
          condition: { label: "Condition", options: ["Brand New", "Sealed", "Near Expiry (Discount)"], icon: "fa-star" },
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. BABY, KIDS & MATERNITY (EXPANDED)
  // ═══════════════════════════════════════════════════════════════════════════
  baby: {
    id: "baby",
    name: "Baby, Kids & Maternity",
    icon: "🍼",
    description: "Baby care, toys, maternity products, feeding, gear, and kids essentials",
    subcategories: {
      baby_care: {
        name: "Baby Care",
        icon: "fa-baby",
        specs: {
          type: { label: "Type", options: ["Diapers", "Wipes", "Lotion", "Shampoo", "Baby Oil", "Baby Powder", "Rash Cream", "Nail Clippers", "Thermometer", "Nasal Aspirator", "Baby Toothbrush", "Toothpaste", "Baby Brush/Comb", "Baby Laundry Detergent", "Diaper Pail", "Diaper Bag"], icon: "fa-baby" },
          brand: { label: "Brand", options: ["Pampers", "Huggies", "Molfix", "Johnson's", "Vaseline Baby", "Zoe", "Softcare", "WaterWipes", "Avent", "Other"], icon: "fa-tag", allowCustom: true },
          age: { label: "Age", options: ["Newborn (0-3M)", "Infant (3-6M)", "Baby (6-12M)", "Toddler (1-2Y)", "Toddler (2-3Y)"], icon: "fa-baby-carriage" },
          diaper_size: { label: "Diaper Size", options: ["Size Newborn", "Size 1 (2-5kg)", "Size 2 (3-6kg)", "Size 3 (4-9kg)", "Size 4 (7-14kg)", "Size 5 (12-18kg)", "Size 6 (15-25kg)", "Diaper Pants (M)", "Diaper Pants (L)", "Diaper Pants (XL)"], icon: "fa-ruler" },
          pack_size: { label: "Pack Size", options: ["Small (10-20 pcs)", "Medium (30-50 pcs)", "Large (60-100 pcs)", "Jumbo (100+ pcs)", "Economy (200+ pcs)"], icon: "fa-box" },
          skin_type: { label: "Skin Type", options: ["Normal", "Sensitive", "Eczema Prone", "Allergy Prone"], icon: "fa-hand-sparkles" },
          condition: { label: "Condition", options: ["Brand New", "Sealed", "Open Box"], icon: "fa-star" },
        }
      },
      baby_feeding: {
        name: "Feeding & Nursing",
        icon: "fa-utensil-spoon",
        specs: {
          type: { label: "Type", options: ["Infant Formula (Powder)", "Infant Formula (Liquid)", "Baby Bottle", "Sippy Cup", "Straw Cup", "Training Cup", "Bottle Nipple", "Pacifier (Soother)", "Teether", "Breast Pump (Manual)", "Breast Pump (Electric)", "Nursing Pillow", "Nursing Cover", "Bibs (Baby)", "Burp Cloths", "Bottle Warmer", "Sterilizer", "Baby Food Maker", "High Chair", "Booster Seat", "Bottle Drying Rack", "Breast Milk Storage Bags"], icon: "fa-utensil-spoon" },
          brand: { label: "Brand", options: ["Nan", "SMA", "Aptamil", "Nuk", "Philips Avent", "Medela", "Tommee Tippee", "Munchkin", "Dr. Brown's", "Evenflo", "Other"], icon: "fa-tag", allowCustom: true },
          age: { label: "Age", options: ["0-6 Months", "6-12 Months", "12-18 Months", "18-24 Months", "2+ Years"], icon: "fa-baby-carriage" },
          formula_stage: { label: "Formula Stage", options: ["Stage 1 (0-6m)", "Stage 2 (6-12m)", "Stage 3 (1-3y)", "Stage 4 (3y+)", "Special (Premature)", "Special (Allergy)"], icon: "fa-layer-group" },
          bottle_material: { label: "Bottle Material", options: ["Plastic", "Glass", "Silicone", "Stainless Steel"], icon: "fa-layer-group" },
          bottle_size: { label: "Bottle Size", options: ["4oz/120ml", "5oz/150ml", "8oz/240ml", "9oz/270ml", "10oz/300ml", "11oz/330ml"], icon: "fa-flask" },
          condition: { label: "Condition", options: ["Brand New", "Sealed", "Used - Like New", "Used - Good"], icon: "fa-star" },
        }
      },
      baby_gear: {
        name: "Baby Gear & Furniture",
        icon: "fa-crib",
        specs: {
          type: { label: "Type", options: ["Stroller (Pram)", "Stroller (Umbrella)", "Stroller (Jogging)", "Double Stroller", "Car Seat (Infant)", "Car Seat (Convertible)", "Car Seat (Booster)", "Crib", "Mini Crib", "Portable Crib", "Bassinet", "Playpen", "Baby Playard", "Baby Walker", "Baby Bouncer", "Baby Swing", "Baby Carrier (Wrap)", "Baby Carrier (Structured)", "Hip Seat Carrier", "Baby Gym", "Activity Center", "Baby Gate", "Changing Table", "Dresser", "Glider/Rocker"], icon: "fa-crib" },
          brand: { label: "Brand", options: ["Graco", "Chicco", "Joie", "Baby Trend", "Evenflo", "Safety 1st", "Summer Infant", "Ergobaby", "Baby Bjorn", "Generic", "Local Brand", "Other"], icon: "fa-tag", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Used - Like New", "Used - Good", "Used - Fair", "Needs Assembly"], icon: "fa-star" },
          age: { label: "Age/Weight Limit", options: ["Newborn (0-3m)", "Infant (0-12m)", "Toddler (1-4y)", "Child (3-8y)", "Up to 15kg", "Up to 22kg", "Up to 36kg"], icon: "fa-baby-carriage" },
          features: { label: "Features", options: ["Foldable", "Lightweight", "Travel System", "Adjustable Handle", "Reversible Seat", "Removable Cover", "Washable", "Storage Basket", "Cup Holder", "Canopy", "Rain Cover"], icon: "fa-star", multiple: true },
          certification: { label: "Safety Certification", options: ["JPMA Certified", "ECE Certified", "FMVSS Certified", "ASTM Certified", "Not Certified"], icon: "fa-shield-alt" },
        }
      },
      toys: {
        name: "Toys & Games",
        icon: "fa-puzzle-piece",
        specs: {
          type: { label: "Type", options: ["Educational Toys", "Learning Toys", "Building Blocks", "LEGO", "Magnetic Tiles", "Dolls", "Baby Doll", "Fashion Doll", "Action Figures", "Superheroes", "Remote Control Car", "Remote Control Drone", "Puzzle", "Jigsaw Puzzle", "Floor Puzzle", "Board Game", "Card Game", "Outdoor Toy", "Swing", "Slide", "Trampoline", "Sandbox", "Water Table", "Play Kitchen", "Tool Set", "Doctor Kit", "Musical Toy", "Plush Toy", "Stuffed Animal", "Fidget Toy", "Sensory Toy", "Bath Toy", "Teething Toy", "Rattle", "Stacking Toy", "Shape Sorter"], icon: "fa-puzzle-piece" },
          age: { label: "Age Range", options: ["0-6 Months", "6-12 Months", "1-2 Years", "2-3 Years", "3-4 Years", "4-5 Years", "5-7 Years", "7-10 Years", "10-12 Years", "12+ Years", "Adult"], icon: "fa-baby" },
          brand: { label: "Brand", options: ["Lego", "Mattel", "Hasbro", "Fisher-Price", "Hot Wheels", "Barbie", "Disney", "Melissa & Doug", "VTech", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          material: { label: "Material", options: ["Plastic", "Wood", "Fabric", "Metal", "Foam", "Silicone", "Cardboard", "Paper"], icon: "fa-layer-group" },
          gender: { label: "Gender", options: ["Boys", "Girls", "Unisex"], icon: "fa-venus-mars" },
          educational_focus: { label: "Educational Focus", options: ["STEM", "Language", "Math", "Science", "Art", "Music", "Motor Skills", "Problem Solving", "Social Skills", "Creativity"], icon: "fa-graduation-cap", multiple: true },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Like New", "Used - Good", "Missing Pieces (Discounted)"], icon: "fa-star" },
        }
      },
      maternity: {
        name: "Maternity",
        icon: "fa-female",
        specs: {
          type: { label: "Type", options: ["Maternity Dress", "Maternity Top", "Maternity T-Shirt", "Maternity Blouse", "Maternity Leggings", "Maternity Jeans", "Maternity Shorts", "Maternity Pants", "Maternity Nightwear", "Nursing Bra", "Nursing Top", "Nursing Tank", "Pregnancy Pillow", "Full Body Pillow", "Wedge Pillow", "Maternity Support Belt", "Belly Band", "Stretch Mark Cream", "Stretch Mark Oil", "Nipple Cream", "Postpartum Belt", "Postpartum Recovery", "Maternity Belt", "Compression Socks", "Maternity Photoshoot Outfit", "Hospital Bag", "Hospital Bag Essentials"], icon: "fa-female" },
          size: { label: "Size", options: ["XS", "S", "M", "L", "XL", "XXL", "Maternity S", "Maternity M", "Maternity L", "Maternity XL", "One Size", "Plus Size", "Pre-pregnancy S", "Pre-pregnancy M", "Pre-pregnancy L"], icon: "fa-ruler" },
          trimester: { label: "Trimester", options: ["1st Trimester (0-12w)", "2nd Trimester (13-26w)", "3rd Trimester (27-40w)", "Postpartum", "All Trimesters"], icon: "fa-calendar" },
          color: { label: "Color", options: ["Black", "White", "Nude", "Pink", "Blue", "Grey", "Beige", "Navy", "Green", "Red", "Purple", "Multicolor"], icon: "fa-palette", allowCustom: true },
          material: { label: "Material", options: ["Cotton", "Polyester", "Spandex", "Bamboo", "Modal", "Rayon", "Jersey", "Linen"], icon: "fa-layer-group" },
          features: { label: "Features", options: ["Breastfeeding Access", "Adjustable Straps", "Removable Padding", "Drop Down Cup", "Front Opening", "Side Opening", "Full Bust Support", "Underwire", "Wireless", "Seamless"], icon: "fa-star", multiple: true },
          condition: { label: "Condition", options: ["Brand New", "New with Tags", "Like New", "Gently Used", "Used"], icon: "fa-star" },
        }
      },
      kids_accessories: {
        name: "Kids' Accessories",
        icon: "fa-child",
        specs: {
          type: { label: "Type", options: ["Backpack (Kids)", "Lunch Box", "Water Bottle", "School Bag", "Kids' Watch", "Hair Clips", "Hair Bands", "Headband", "Bow Tie", "Sunglasses (Kids)", "Hat (Kids)", "Cap (Kids)", "Gloves (Kids)", "Scarf (Kids)", "Umbrella (Kids)", "Kids' Jewelry", "Kids' Wallet"], icon: "fa-child" },
          age: { label: "Age", options: ["Toddler (1-3Y)", "Preschool (3-5Y)", "Child (5-8Y)", "Preteen (8-12Y)", "Teen (12-16Y)"], icon: "fa-baby" },
          gender: { label: "Gender", options: ["Boys", "Girls", "Unisex"], icon: "fa-venus-mars" },
          color: { label: "Color", options: ["Pink", "Blue", "Red", "Yellow", "Green", "Purple", "Orange", "Black", "White", "Multicolor", "Rainbow"], icon: "fa-palette", allowCustom: true },
          character: { label: "Character", options: ["Disney", "Marvel", "DC", "Peppa Pig", "Paw Patrol", "Frozen", "Spider-Man", "Princess", "Dinosaur", "Unicorn", "No Character", "Other"], icon: "fa-star", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New", "New with Tags", "Like New", "Used"], icon: "fa-star" },
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. SPORTS, FITNESS & OUTDOOR (EXPANDED)
  // ═══════════════════════════════════════════════════════════════════════════
  sports: {
    id: "sports",
    name: "Sports, Fitness & Outdoor",
    icon: "🏋️",
    description: "Exercise equipment, sportswear, outdoor gear, supplements, and team sports",
    subcategories: {
      fitness_equipment: {
        name: "Fitness Equipment",
        icon: "fa-dumbbell",
        specs: {
          type: { label: "Type", options: ["Dumbbell (Pair)", "Dumbbell (Single)", "Kettlebell", "Barbell", "Weight Plates", "Weight Bench", "Treadmill", "Exercise Bike (Upright)", "Exercise Bike (Recumbent)", "Spin Bike", "Elliptical Trainer", "Rowing Machine", "Stepper", "Multi-Gym", "Pull-Up Bar", "Dip Station", "Power Tower", "Yoga Mat", "Exercise Mat", "Resistance Band (Loop)", "Resistance Band (Tube)", "Resistance Band Set", "Skipping Rope", "Ab Wheel", "Medicine Ball", "Stability Ball", "Foam Roller", "Weighted Vest", "Ankle Weights", "Wrist Weights", "Boxing Gloves", "Punching Bag", "Push Up Handles"], icon: "fa-dumbbell" },
          brand: { label: "Brand", options: ["Nike", "Adidas", "Under Armour", "Reebok", "Bowflex", "NordicTrack", "ProForm", "Marcy", "CAP Barbell", "Generic", "Local Brand"], icon: "fa-tag", allowCustom: true },
          weight_range: { label: "Weight", options: ["1kg", "2kg", "3kg", "4kg", "5kg", "6kg", "7kg", "8kg", "9kg", "10kg", "12kg", "15kg", "20kg", "25kg", "30kg", "40kg", "50kg", "Set (1-10kg)", "Set (2-20kg)"], icon: "fa-weight-hanging" },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Open Box", "Used - Like New", "Used - Good", "Used - Fair", "Commercial Grade"], icon: "fa-star" },
          material: { label: "Material", options: ["Rubber Coated", "Vinyl Coated", "Neoprene", "Cast Iron", "Steel", "Urethane", "Plastic", "Wood", "Foam"], icon: "fa-layer-group" },
          max_user_weight: { label: "Max User Weight", options: ["100kg", "120kg", "150kg", "180kg", "200kg", "250kg", "300kg+"], icon: "fa-weight" },
          resistance_levels: { label: "Resistance Levels", options: ["1-8", "1-10", "1-16", "1-20", "1-24", "1-32", "Magnetic", "Air", "Hydraulic"], icon: "fa-chart-line" },
        }
      },
      sportswear: {
        name: "Sportswear",
        icon: "fa-running",
        specs: {
          type: { label: "Type", options: ["T-Shirt (Sports)", "Tank Top", "Singlet", "Long Sleeve (Sports)", "Hoodie (Sports)", "Jacket (Sports)", "Leggings (Sports)", "Sports Bra", "Shorts (Sports)", "Track Pants", "Joggers", "Compression Tights", "Compression Top", "Sports Socks", "Sports Underwear", "Training Top", "Jersey (Soccer)", "Jersey (Basketball)", "Jersey (Football)", "Running Singlet", "Tri Suit", "Swimsuit (Competition)", "Wetsuit"], icon: "fa-tshirt" },
          brand: { label: "Brand", options: ["Nike", "Adidas", "Puma", "Under Armour", "Gymshark", "Lululemon", "Reebok", "New Balance", "Asics", "Fila", "Decathlon", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          size: { label: "Size", options: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "Plus Size", "Kids XS", "Kids S", "Kids M", "Kids L", "Kids XL"], icon: "fa-ruler" },
          gender: { label: "Gender", options: ["Men", "Women", "Unisex", "Kids"], icon: "fa-venus-mars" },
          activity: { label: "Activity", options: ["Running", "Gym/Weightlifting", "Yoga/Pilates", "CrossFit", "Cycling", "Swimming", "Soccer/Football", "Basketball", "Tennis", "Golf", "Dancing", "Hiking", "General Fitness"], icon: "fa-running", multiple: true },
          material: { label: "Material", options: ["Polyester", "Nylon", "Spandex/Lycra", "Cotton Blend", "Moisture-Wicking", "Dri-FIT", "Climalite", "Dry Cell", "Coolmax", "Merino Wool", "Neoprene"], icon: "fa-layer-group" },
          condition: { label: "Condition", options: ["Brand New", "New with Tags", "Like New", "Gently Used", "Used"], icon: "fa-star" },
          compression: { label: "Compression Level", options: ["Light", "Medium", "High", "None"], icon: "fa-compress" },
        }
      },
      outdoor_camping: {
        name: "Outdoor & Camping",
        icon: "fa-campground",
        specs: {
          type: { label: "Type", options: ["Tent (Dome)", "Tent (Cabin)", "Tent (Pop-up)", "Tent (Backpacking)", "Sleeping Bag", "Camping Cot", "Camping Chair", "Camping Table", "Cooler Box", "Cool Bag", "Hiking Backpack", "Daypack", "Hydration Pack", "Camping Stove", "Camping Cookware", "Camping Utensils", "Camping Lantern", "Headlamp", "Flashlight (Camping)", "Solar Lamp", "Camping Light", "Fishing Rod", "Fishing Reel", "Fishing Tackle Box", "Fishing Line", "Fishing Lures", "Fishing Hooks", "Camping Knife", "Multi-tool", "Compass", "GPS Device", "Camping Shower", "Portable Toilet", "Tarp", "Groundsheet", "Camping Hammock", "Insulated Mug", "Water Filter", "Camping Saw", "Camping Axe"], icon: "fa-campground" },
          brand: { label: "Brand", options: ["Coleman", "Ozark Trail", "Quechua", "North Face", "REI", "Columbia", "Generic", "Local Brand", "Other"], icon: "fa-tag", allowCustom: true },
          capacity: { label: "Capacity (Tent)", options: ["1 Person", "2 Person", "3 Person", "4 Person", "6 Person", "8 Person", "10 Person", "12+ Person"], icon: "fa-users" },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Used - Like New", "Used - Good", "Used - Fair"], icon: "fa-star" },
          waterproof: { label: "Waterproof Rating", options: ["Yes (Waterproof)", "Water-Resistant", "Showerproof", "Not Waterproof", "Hydrostatic Head (mm)"], icon: "fa-tint" },
          season_rating: { label: "Season Rating", options: ["1 Season", "2 Season", "3 Season", "4 Season", "All Season"], icon: "fa-snowflake" },
          weight: { label: "Weight", options: ["<1kg", "1-2kg", "2-3kg", "3-5kg", "5-8kg", "8-10kg", "10kg+"], icon: "fa-weight" },
        }
      },
      supplements: {
        name: "Supplements & Nutrition",
        icon: "fa-capsules",
        specs: {
          type: { label: "Type", options: ["Whey Protein", "Whey Isolate", "Plant Protein", "Mass Gainer", "Creatine Monohydrate", "BCAA", "EAAs", "Pre-Workout", "Post-Workout", "Glutamine", "CLA", "Fat Burner", "Testosterone Booster", "Multivitamin", "Vitamin D", "Vitamin C", "B-Complex", "Omega 3/Fish Oil", "Probiotic", "Digestive Enzymes", "Joint Support", "Glucosamine", "Collagen", "Sleep Aid", "ZMA", "Electrolytes", "Energy Gels", "Protein Bar", "Meal Replacement"], icon: "fa-capsules" },
          brand: { label: "Brand", options: ["Optimum Nutrition", "BSN", "MuscleTech", "Dymatize", "USN", "MyProtein", "Nutritech", "Gold Standard", "EVLution", "Now Foods", "Garden of Life", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          flavor: { label: "Flavor", options: ["Chocolate", "Vanilla", "Strawberry", "Cookies & Cream", "Banana", "Unflavored", "Mocha", "Peanut Butter", "Blueberry", "Orange", "Fruit Punch", "Watermelon", "Unflavored", "Other"], icon: "fa-ice-cream", allowCustom: true },
          weight: { label: "Weight/Size", options: ["250g", "500g", "750g", "900g", "1kg", "1.8kg", "2kg", "2.27kg (5lb)", "4.5kg (10lb)", "5kg", "10kg", "30 Servings", "60 Servings", "90 Servings", "100 Tablets", "200 Tablets", "300 Tablets"], icon: "fa-weight" },
          dietary: { label: "Dietary", options: ["Whey (Milk)", "Vegan", "Plant-Based", "Keto", "Paleo", "Sugar-Free", "Gluten-Free", "Soy-Free", "Non-GMO", "Organic", "Halal", "Kosher"], icon: "fa-leaf", multiple: true },
          servings: { label: "Servings", options: ["10", "15", "20", "25", "30", "40", "50", "60", "75", "90", "100", "120", "150", "180", "200+"], icon: "fa-list-ol" },
          condition: { label: "Condition", options: ["Brand New", "Sealed", "Expiring Soon", "Open Box"], icon: "fa-star" },
        }
      },
      team_sports: {
        name: "Team Sports",
        icon: "fa-futbol",
        specs: {
          type: { label: "Type", options: ["Soccer Ball (Size 5)", "Soccer Ball (Size 4)", "Soccer Ball (Size 3)", "Basketball (Size 7)", "Basketball (Size 6)", "Basketball (Size 5)", "Volleyball", "Handball", "Rugby Ball", "Football Helmet", "Football Pads", "Shin Guards (Soccer)", "Soccer Cleats", "Football Boots", "Basketball Shoes", "Volleyball Shoes", "Goalkeeper Gloves", "Soccer Goal (Portable)", "Basketball Hoop", "Basketball Net", "Volleyball Net", "Soccer Net", "Training Cone", "Agility Ladder", "Ball Pump", "Ball Bag"], icon: "fa-futbol" },
          brand: { label: "Brand", options: ["Adidas", "Nike", "Puma", "Wilson", "Spalding", "Molten", "Mitre", "Select", "Under Armour", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          size: { label: "Ball Size", options: ["Size 1 (Skills)", "Size 2 (Mini)", "Size 3 (Junior)", "Size 4 (Youth)", "Size 5 (Adult)", "Size 6 (Women's Basketball)", "Size 7 (Men's Basketball)", "Size 5 (Volleyball)"], icon: "fa-expand" },
          age_group: { label: "Age Group", options: ["Kids (3-8)", "Youth (8-14)", "Teen (14-18)", "Adult (18+)", "All Ages"], icon: "fa-baby" },
          material: { label: "Material", options: ["Leather", "Synthetic Leather", "PVC", "TPU", "Rubber", "Foam", "EVA", "Plastic"], icon: "fa-layer-group" },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Used - Like New", "Used - Good", "Used - Flat (Needs Air)"], icon: "fa-star" },
          outdoor_indoor: { label: "Use", options: ["Outdoor", "Indoor", "Both", "Turf", "Grass", "Hard Court"], icon: "fa-building" },
        }
      },
      yoga_pilates: {
        name: "Yoga & Pilates",
        icon: "fa-praying-hands",
        specs: {
          type: { label: "Type", options: ["Yoga Mat (Standard)", "Yoga Mat (Travel)", "Yoga Mat (Extra Thick)", "Yoga Mat (Non-Slip)", "Yoga Towel", "Pilates Mat", "Yoga Block", "Yoga Brick", "Yoga Strap", "Pilates Ring", "Pilates Ball", "Yoga Wheel", "Meditation Cushion", "Bolster", "Yoga Blanket", "Yoga Socks", "Yoga Gloves"], icon: "fa-praying-hands" },
          brand: { label: "Brand", options: ["Lululemon", "Manduka", "JadeYoga", "Gaiam", "Alo Yoga", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          thickness: { label: "Mat Thickness", options: ["1mm (Travel)", "3mm (Light)", "4mm (Standard)", "5mm (Standard)", "6mm (Thick)", "8mm (Extra Thick)", "10mm (Padded)", "12mm+ (Cushioned)"], icon: "fa-ruler" },
          material: { label: "Material", options: ["PVC", "TPE", "Rubber", "Natural Rubber", "Jute", "Cork", "Cotton", "NBR", "EVA Foam"], icon: "fa-layer-group" },
          non_slip: { label: "Non-Slip", options: ["Yes", "No", "High Grip", "Dry Grip", "Wet Grip"], icon: "fa-hand-paper" },
          eco_friendly: { label: "Eco-Friendly", options: ["Yes (Biodegradable)", "Yes (Recycled)", "No (PVC)", "Natural Materials"], icon: "fa-leaf" },
          condition: { label: "Condition", options: ["Brand New", "New in Package", "Like New", "Gently Used"], icon: "fa-star" },
        }
      },
      swimming: {
        name: "Swimming",
        icon: "fa-swimmer",
        specs: {
          type: { label: "Type", options: ["Swim Goggles (Adult)", "Swim Goggles (Kids)", "Swim Cap (Silicone)", "Swim Cap (Latex)", "Swim Cap (Lycra)", "Swim Fins (Short)", "Swim Fins (Long)", "Kickboard", "Pull Buoy", "Hand Paddles", "Snorkel (Training)", "Swim Snorkel", "Nose Clip", "Ear Plugs (Swim)", "Swim Bag", "Swim Towel (Quick Dry)", "Swim Diaper", "Life Jacket (Kids)", "Life Vest (Adult)", "Swim Float", "Arm Bands (Swim)"], icon: "fa-swimmer" },
          brand: { label: "Brand", options: ["Speedo", "Arena", "TYR", "Aqua Sphere", "Zoggs", "FINIS", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          size: { label: "Size", options: ["XS", "S", "M", "L", "XL", "Kids S", "Kids M", "Kids L", "One Size", "Adjustable"], icon: "fa-ruler" },
          lens_type: { label: "Lens Type (Goggles)", options: ["Clear", "Tinted", "Mirrored", "Polarized", "Smoke", "Blue", "Amber", "Prescription"], icon: "fa-eye" },
          anti_fog: { label: "Anti-Fog", options: ["Yes", "No"], icon: "fa-eye-slash" },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Used - Like New", "Used"], icon: "fa-star" },
        }
      },
      cycling: {
        name: "Cycling",
        icon: "fa-bicycle",
        specs: {
          type: { label: "Type", options: ["Bicycle (Mountain Bike)", "Bicycle (Road Bike)", "Bicycle (Hybrid)", "Bicycle (BMX)", "Bicycle (Kids)", "Electric Bike (E-Bike)", "Helmet (Cycling)", "Bike Lock", "U-Lock", "Chain Lock", "Cable Lock", "Bike Lights", "Front Light", "Rear Light", "Bike Pump", "Floor Pump", "Hand Pump", "Patch Kit", "Inner Tube", "Tire", "Saddle/Seat", "Handlebar Grips", "Bike Computer", "Cycle GPS", "Water Bottle Cage", "Cycling Jersey", "Cycling Shorts (Padded)", "Cycling Gloves", "Cycling Shoes", "Knee Pads", "Elbow Pads", "Bike Stand", "Bike Rack (Car)", "Bike Trailer", "Cycling Glasses", "Reflective Vest"], icon: "fa-bicycle" },
          brand: { label: "Brand", options: ["Trek", "Giant", "Specialized", "Cannondale", "Scott", "Merida", "GT", "Schwinn", "Mongoose", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          wheel_size: { label: "Wheel Size", options: ["12\" (Kids)", "16\" (Kids)", "20\" (BMX)", "24\" (Youth)", "26\" (Mountain)", "27.5\" (Mountain)", "29\" (Mountain)", "650c (Road)", "700c (Road)", "27.5+\"", "29+\""], icon: "fa-circle" },
          frame_size: { label: "Frame Size", options: ["XS (13-14\")", "S (15-16\")", "M (17-18\")", "L (19-20\")", "XL (21-22\")", "XXL (23\"+)", "Kids 12\"", "Kids 16\"", "Kids 20\"", "Kids 24\""], icon: "fa-expand" },
          bike_type: { label: "Bike Type", options: ["Hardtail (Front Suspension)", "Full Suspension", "Rigid (No Suspension)", "Drop Bar (Road)", "Flat Bar (Hybrid)", "Step-Through", "Folding", "Electric Assist", "Fat Tire"], icon: "fa-bicycle" },
          condition: { label: "Condition", options: ["Brand New", "New (Assembly Required)", "Used - Like New", "Used - Good", "Used - Fair", "For Parts"], icon: "fa-star" },
          material: { label: "Material", options: ["Aluminum", "Carbon Fiber", "Steel", "Titanium", "Chromeoly", "Alloy"], icon: "fa-layer-group" },
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. AUTOMOTIVE & TOOLS (EXPANDED)
  // ═══════════════════════════════════════════════════════════════════════════
  automotive: {
    id: "automotive",
    name: "Automotive & Tools",
    icon: "🚗",
    description: "Car accessories, tools, spare parts, car care, and garage equipment",
    subcategories: {
      car_accessories: {
        name: "Car Accessories",
        icon: "fa-car",
        specs: {
          type: { label: "Type", options: ["Phone Holder (Dashboard)", "Phone Holder (Vent)", "Phone Holder (Windshield)", "Magnetic Mount", "Car Charger (USB-A)", "Car Charger (USB-C)", "Car Charger (Fast Charge)", "Wireless Charger (Car)", "Dash Cam (Front)", "Dash Cam (Front + Rear)", "Dash Cam (Inside)", "Seat Cover (Front)", "Seat Cover (Rear)", "Seat Cover (Full Set)", "Floor Mat (Carpet)", "Floor Mat (Rubber)", "Floor Mat (Custom Fit)", "Cargo Mat", "Trunk Organizer", "Backseat Organizer", "Car Organizer (Seat Gap)", "Sun Shade (Windshield)", "Sun Shade (Rear Window)", "Side Window Shades", "Air Freshener (Hanging)", "Air Freshener (Vent Clip)", "Air Freshener (Spray)", "Steering Wheel Cover", "Gear Shift Cover", "Handbrake Cover", "Car Seat Cushion", "Backrest Support (Lumbar)", "Neck Pillow (Car)", "Car Vacuum Cleaner", "Jump Starter", "Tire Inflator", "Emergency Kit", "First Aid Kit (Car)", "Warning Triangle", "Reflective Vest (Car)", "Fire Extinguisher (Car)", "Snow Chains"], icon: "fa-car" },
          brand: { label: "Brand", options: ["Baseus", "Anker", "Oraimo", "Xiaomi", "Garmin", "Nextbase", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          car_type: { label: "Compatible Vehicle", options: ["Universal", "Sedan", "SUV", "Hatchback", "Pickup", "Minivan", "Matatu/PSV", "Truck", "Motorcycle", "Specific Models (Toyota)", "Specific Models (Nissan)", "Specific Models (Honda)", "Specific Models (Subaru)", "Specific Models (Mercedes)", "Specific Models (BMW)", "Specific Models (Audi)", "Specific Models (VW)"], icon: "fa-car-side", allowCustom: true },
          color: { label: "Color", options: ["Black", "Beige", "Grey", "Red", "Blue", "Brown", "Tan", "White", "Carbon Fiber", "Universal Fit"], icon: "fa-palette", allowCustom: true },
          material: { label: "Material", options: ["Leather", "PU Leather", "Fabric", "Neoprene", "Rubber", "Carpet", "Plastic", "Aluminum", "Carbon Fiber"], icon: "fa-layer-group" },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Open Box", "Used"], icon: "fa-star" },
        }
      },
      car_electronics: {
        name: "Car Electronics",
        icon: "fa-bolt",
        specs: {
          type: { label: "Type", options: ["Car Stereo (Single DIN)", "Car Stereo (Double DIN)", "Car Stereo (Android Auto)", "Car Stereo (Apple CarPlay)", "Car Radio", "Speaker (Coaxial)", "Speaker (Component)", "Subwoofer (Active)", "Subwoofer (Passive)", "Subwoofer (Enclosed)", "Amplifier (Mono)", "Amplifier (Multi-channel)", "Car Alarm System", "Immobilizer", "GPS Tracker", "Reverse Camera (Wired)", "Reverse Camera (Wireless)", "Reverse Camera System (with Screen)", "Parking Sensor (Audible)", "Parking Sensor (Visual)", "Head Unit (LCD Screen)", "Head Unit (Touchscreen)", "DVD Player (Car)", "TV Tuner (Car)", "Hands-Free Kit", "Bluetooth Adapter (Car)", "FM Transmitter", "OBD2 Scanner", "Car Diagnostic Tool", "Battery Monitor", "Voltage Stabilizer", "Capacitor (Audio)"], icon: "fa-bolt" },
          brand: { label: "Brand", options: ["Pioneer", "Sony", "JVC", "Kenwood", "Alpine", "Boss", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          car_type: { label: "Compatible Vehicle", options: ["Universal", "Toyota (Specific)", "Nissan (Specific)", "Subaru (Specific)", "Mazda (Specific)", "Honda (Specific)", "Mercedes (Specific)", "BMW (Specific)", "VW (Specific)", "Ford (Specific)", "Mitsubishi (Specific)", "Isuzu (Specific)"], icon: "fa-car-side", allowCustom: true },
          screen_size: { label: "Screen Size", options: ["No Screen", "2\"", "3\"", "4\"", "5\"", "6.2\"", "6.5\"", "6.8\"", "7\"", "8\"", "9\"", "10\"", "10.1\"", "12\"+"], icon: "fa-expand" },
          watts: { label: "Power (Watts RMS)", options: ["25W x4", "50W x4", "60W x4", "80W x4", "100W x4", "200W", "300W", "500W", "1000W", "2000W+"], icon: "fa-bolt" },
          bluetooth: { label: "Bluetooth", options: ["Yes", "No", "Yes (Hands-Free)", "Yes (Audio Streaming)"], icon: "fa-bluetooth" },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Open Box", "Used - Like New", "Used - Good", "Refurbished"], icon: "fa-star" },
        }
      },
      tools: {
        name: "Tools & Hardware",
        icon: "fa-tools",
        specs: {
          type: { label: "Type", options: ["Power Drill (Corded)", "Power Drill (Cordless)", "Impact Driver", "Angle Grinder", "Circular Saw", "Jigsaw", "Reciprocating Saw", "Sander (Orbital)", "Sander (Belt)", "Planer", "Router", "Table Saw", "Miter Saw", "Band Saw", "Hammer Drill", "Rotary Hammer", "Heat Gun", "Multimeter", "Soldering Iron", "Hand Saw", "Hacksaw", "Hammer (Claw)", "Hammer (Sledge)", "Screwdriver Set", "Wrench Set", "Socket Set", "Allen Key Set", "Pliers Set", "Adjustable Wrench", "Pipe Wrench", "Tape Measure", "Spirit Level", "Utility Knife", "Tool Box", "Tool Bag", "Tool Chest", "Tool Organizer", "Workbench", "Vice", "Clamps", "Ladder (Step)", "Ladder (Extension)", "Ladder (Multi-position)"], icon: "fa-tools" },
          brand: { label: "Brand", options: ["Bosch", "Makita", "Stanley", "DeWalt", "Black & Decker", "Ryobi", "Milwaukee", "Hilti", "Einhell", "Total", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          power_source: { label: "Power Source", options: ["Electric (Corded)", "Battery (Cordless)", "Manual", "Petrol/Gas", "Pneumatic (Air)", "Hydraulic"], icon: "fa-plug" },
          voltage: { label: "Voltage (Cordless)", options: ["12V", "18V", "20V", "24V", "36V", "40V", "54V", "60V", "Not Applicable"], icon: "fa-bolt" },
          battery_type: { label: "Battery Type", options: ["Li-ion", "Ni-Cd", "Ni-MH", "Not Applicable"], icon: "fa-battery-full" },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Open Box", "Used - Like New", "Used - Good", "Used - Fair", "For Parts/Repair"], icon: "fa-star" },
          warranty: { label: "Warranty", options: ["None", "30 Days", "3 Months", "6 Months", "1 Year", "2 Years", "3 Years", "5 Years", "Lifetime"], icon: "fa-file-contract" },
        }
      },
      car_care: {
        name: "Car Care & Maintenance",
        icon: "fa-oil-can",
        specs: {
          type: { label: "Type", options: ["Engine Oil (Mineral)", "Engine Oil (Semi-Synthetic)", "Engine Oil (Full Synthetic)", "Brake Fluid (DOT 3)", "Brake Fluid (DOT 4)", "Brake Fluid (DOT 5.1)", "Coolant/Antifreeze", "Transmission Fluid (Automatic)", "Transmission Fluid (Manual)", "Power Steering Fluid", "Differential Oil", "Car Polish (Liquid)", "Car Polish (Paste)", "Car Wax (Liquid)", "Car Wax (Spray)", "Car Wax (Paste)", "Tire Shine", "Wheel Cleaner", "Car Shampoo", "Car Wash Soap", "Interior Cleaner", "Upholstery Cleaner", "Leather Cleaner", "Glass Cleaner (Automotive)", "Air Filter (Engine)", "Oil Filter", "Fuel Filter", "Cabin Air Filter", "Wiper Blade (Front)", "Wiper Blade (Rear)", "Spark Plug", "Brake Pad (Front)", "Brake Pad (Rear)", "Brake Disc/Rotor", "Battery (Car)", "Headlight Bulb (Halogen)", "Headlight Bulb (LED)", "Headlight Bulb (HID/Xenon)", "Fuse Set", "Tire (Summer)", "Tire (All-Season)", "Tire (Winter)", "Tire (All-Terrain)", "Tire Repair Kit", "Tire Pressure Gauge"], icon: "fa-oil-can" },
          brand: { label: "Brand", options: ["Shell", "Total", "Castrol", "Mobil", "Toyota Genuine", "Bosch", "NGK", "Michelin", "Bridgestone", "Goodyear", "Continental", "Pirelli", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          vehicle: { label: "Vehicle Type", options: ["Petrol", "Diesel", "Hybrid", "Electric (EV)", "Motorcycle", "Truck", "Bus"], icon: "fa-gas-pump" },
          viscosity: { label: "Oil Viscosity", options: ["0W-20", "5W-30", "5W-40", "10W-30", "10W-40", "15W-40", "20W-50", "Not Applicable"], icon: "fa-tint" },
          volume: { label: "Volume", options: ["500ml", "1L", "4L", "5L", "10L", "20L", "25L", "200L", "Single Item", "Pair (2)", "Set of 4", "Set of 8"], icon: "fa-flask" },
          size: { label: "Tire Size", options: ["R13", "R14", "R15", "R16", "R17", "R18", "R19", "R20", "R21", "R22", "R23", "Specific (e.g., 205/55R16)", "Not Applicable"], icon: "fa-circle", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Used - Like New", "Used - Good", "Used - Fair", "Remanufactured", "Refurbished"], icon: "fa-star" },
        }
      },
      motorcycle_accessories: {
        name: "Motorcycle Accessories",
        icon: "fa-motorcycle",
        specs: {
          type: { label: "Type", options: ["Helmet (Full Face)", "Helmet (Open Face)", "Helmet (Modular)", "Helmet (Half Helmet)", "Helmet (Off-Road)", "Helmet (Kids)", "Helmet Visor", "Helmet Bluetooth Kit", "Motorcycle Jacket (Leather)", "Motorcycle Jacket (Textile)", "Riding Pants", "Riding Jeans", "Riding Gloves (Summer)", "Riding Gloves (Winter)", "Riding Boots", "Knee Guards", "Elbow Guards", "Body Armor", "Back Protector", "Motorcycle Cover", "Phone Mount (Motorcycle)", "USB Charger (Motorcycle)", "Luggage Rack", "Top Box", "Saddle Bags", "Tank Bag", "Tail Bag", "Motorcycle Chain Lube", "Motorcycle Cleaner", "Chain Cleaner", "Chain Brush", "Motorcycle Stand", "Battery Charger (Motorcycle)", "GPS (Motorcycle)", "Action Camera Mount", "Handlebar Grips", "Handlebar Risers", "Lever (Clutch/Brake)", "Foot Pegs", "Exhaust Muffler (Slip-on)", "Air Filter (Motorcycle)", "Oil Filter (Motorcycle)", "Spark Plug (Motorcycle)", "Brake Pads (Motorcycle)", "Tire (Motorcycle)", "Inner Tube (Motorcycle)"], icon: "fa-motorcycle" },
          brand: { label: "Brand", options: ["HJC", "LS2", "AGV", "Shoei", "Arai", "Bell", "Alpinestars", "Dainese", "Rev'it", "Klim", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          size: { label: "Size", options: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Kids S", "Kids M", "Kids L", "Universal", "One Size"], icon: "fa-ruler" },
          helmet_type: { label: "Helmet Certification", options: ["ECE 22.05", "ECE 22.06", "DOT", "SNELL", "SHARP", "Not Certified"], icon: "fa-shield-alt" },
          material: { label: "Material", options: ["Polycarbonate", "Fiberglass", "Carbon Fiber", "Thermoplastic", "Kevlar", "Cordura", "Leather", "Textile"], icon: "fa-layer-group" },
          condition: { label: "Condition", options: ["Brand New", "New with Tags", "Used - Like New", "Used - Good"], icon: "fa-star" },
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. HEALTH & WELLNESS (NEW)
  // ═══════════════════════════════════════════════════════════════════════════
  health_wellness: {
    id: "health_wellness",
    name: "Health & Wellness",
    icon: "🏥",
    description: "Medical supplies, pharmacy, first aid, mobility aids, and wellness products",
    subcategories: {
      otc_medicine: {
        name: "Over-the-Counter Medicine",
        icon: "fa-tablets",
        specs: {
          type: { label: "Medicine Type", options: ["Pain Relief (Paracetamol)", "Pain Relief (Ibuprofen)", "Pain Relief (Aspirin)", "Cold & Flu Medicine", "Cough Syrup", "Cough Drops", "Allergy Medicine (Antihistamine)", "Antacid (Heartburn)", "Laxatives", "Anti-Diarrheal", "Motion Sickness", "Sleep Aid", "Nicotine Replacement", "Antibiotic Cream", "Antifungal Cream", "Hydrocortisone Cream", "Nasal Spray", "Eye Drops", "Ear Drops", "Throat Spray", "Rehydration Salts (ORS)"], icon: "fa-tablets" },
          brand: { label: "Brand", options: ["Panadol", "Advil", "Tylenol", "Claritin", "Benadryl", "Zyrtec", "Robitussin", "Mucinex", "Tums", "Pepto-Bismol", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          dosage: { label: "Dosage", options: ["100mg", "200mg", "250mg", "500mg", "650mg", "1000mg", "5ml", "10ml", "15ml", "1 spray", "2 sprays"], icon: "fa-chart-line" },
          count: { label: "Quantity", options: ["10 tablets", "20 tablets", "30 tablets", "50 tablets", "100 tablets", "250 tablets", "500 tablets", "50ml", "100ml", "200ml", "30 doses", "60 doses"], icon: "fa-hashtag" },
          age_group: { label: "Age Group", options: ["Adult", "Children (6-12)", "Children (2-6)", "Infant (under 2)", "Senior", "All Ages"], icon: "fa-baby" },
          expiry: { label: "Expiry Date", options: ["Within 6 months", "6-12 months", "12-24 months", "24+ months"], icon: "fa-calendar" },
          condition: { label: "Condition", options: ["Brand New", "Sealed", "Near Expiry (Discounted)"], icon: "fa-star" },
        }
      },
      first_aid: {
        name: "First Aid Kits & Supplies",
        icon: "fa-band-aid",
        specs: {
          type: { label: "Type", options: ["First Aid Kit (Small)", "First Aid Kit (Medium)", "First Aid Kit (Large)", "First Aid Kit (Car)", "First Aid Kit (Travel)", "First Aid Kit (Workplace)", "Bandages (Adhesive)", "Bandages (Elastic)", "Gauze Pads", "Gauze Roll", "Medical Tape", "Antiseptic Wipes", "Antiseptic Spray", "Burn Cream", "Burn Gel", "Triple Antibiotic Ointment", "Hydrogen Peroxide", "Rubbing Alcohol", "Cotton Balls", "Cotton Swabs", "Tweezers (First Aid)", "Scissors (Medical)", "Thermometer (Digital)", "Thermometer (Infrared)", "First Aid Scissors", "CPR Mask", "Splint", "Tourniquet", "Cold Pack (Instant)", "Hot Pack (Instant)", "Eye Wash", "Eye Pad", "Finger Splint"], icon: "fa-band-aid" },
          brand: { label: "Brand", options: ["Johnson & Johnson", "Curad", "Band-Aid", "First Aid Only", "Adventure Medical", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          piece_count: { label: "Piece Count", options: ["10-20 pcs", "21-50 pcs", "51-100 pcs", "101-200 pcs", "201-500 pcs", "500+ pcs"], icon: "fa-hashtag" },
          use_case: { label: "Best For", options: ["Home", "Car", "Travel", "Office", "School", "Outdoor", "Sports", "Workplace", "Industrial"], icon: "fa-home", multiple: true },
          condition: { label: "Condition", options: ["Brand New", "Sealed", "Unopened", "Missing Items (Discounted)"], icon: "fa-star" },
        }
      },
      vitamins_supplements: {
        name: "Vitamins & Supplements",
        icon: "fa-capsules",
        specs: {
          type: { label: "Supplement Type", options: ["Multivitamin (Men)", "Multivitamin (Women)", "Multivitamin (Kids)", "Multivitamin (Senior)", "Vitamin A", "Vitamin B Complex", "Vitamin B12", "Vitamin C", "Vitamin D3", "Vitamin E", "Vitamin K", "Calcium", "Magnesium", "Iron", "Zinc", "Omega-3 (Fish Oil)", "Flaxseed Oil", "Probiotics", "Digestive Enzymes", "Echinacea", "Garlic Extract", "Ginseng", "Ginkgo Biloba", "Turmeric/Curcumin", "Collagen (Beauty)", "Biotin (Hair/Nails)", "Melatonin (Sleep)", "Ashwagandha (Stress)", "Elderberry (Immune)"], icon: "fa-capsules" },
          brand: { label: "Brand", options: ["Centrum", "Nature Made", "Kirkland", "Garden of Life", "Now Foods", "Solgar", "Nature's Bounty", "Jamieson", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          form: { label: "Form", options: ["Tablet", "Capsule", "Gummy", "Liquid", "Powder", "Chewable", "Softgel", "Spray", "Patch"], icon: "fa-cube" },
          count: { label: "Count", options: ["30", "60", "90", "100", "120", "150", "180", "200", "240", "300", "365", "500", "1000"], icon: "fa-hashtag" },
          dietary: { label: "Dietary", options: ["Non-GMO", "Organic", "Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free", "Soy-Free", "No Artificial Colors", "No Preservatives"], icon: "fa-leaf", multiple: true },
          condition: { label: "Condition", options: ["Brand New", "Sealed", "Near Expiry"], icon: "fa-star" },
        }
      },
      medical_devices: {
        name: "Medical Devices",
        icon: "fa-stethoscope",
        specs: {
          type: { label: "Device Type", options: ["Blood Pressure Monitor (Upper Arm)", "Blood Pressure Monitor (Wrist)", "Thermometer (Digital)", "Thermometer (Infrared)", "Thermometer (Ear)", "Thermometer (Forehead)", "Glucometer (Blood Sugar)", "Glucose Test Strips", "Lancets", "Pulse Oximeter", "Nebulizer", "Inhaler Spacer", "Peak Flow Meter", "CPAP Machine", "CPAP Mask", "CPAP Tubing", "Humidifier (Medical)", "Heating Pad", "TENS Unit (Pain Relief)", "EMFI Machine (Pain Relief)", "Weight Scale (Digital)", "Weight Scale (Mechanical)", "Body Fat Scale", "Baby Scale", "Walking Cane", "Crutches (Underarm)", "Crutches (Forearm)", "Walker (Standard)", "Walker (Wheeled)", "Rollator (Walker with Seat)", "Wheelchair (Manual)", "Wheelchair (Electric)", "Mobility Scooter", "Shower Chair", "Bath Bench", "Toilet Safety Frame", "Bed Pan", "Urinal", "Commode Chair"], icon: "fa-stethoscope" },
          brand: { label: "Brand", options: ["Omron", "Braun", "Accu-Chek", "OneTouch", "Drive Medical", "Invacare", "Philips", "ResMed", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          power: { label: "Power Source", options: ["Battery (AA/AAA)", "Battery (Built-in Rechargeable)", "Battery (Button Cell)", "USB Rechargeable", "AC Adapter", "Manual (No Battery)"], icon: "fa-battery-full" },
          accuracy: { label: "Accuracy", options: ["±3 mmHg (BP)", "±0.2°C (Temp)", "FDA Approved", "CE Certified", "Clinically Validated", "Not Specified"], icon: "fa-check-circle" },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Open Box", "Used - Like New", "Used - Good", "For Parts"], icon: "fa-star" },
        }
      },
      mobility_aids: {
        name: "Mobility Aids",
        icon: "fa-wheelchair",
        specs: {
          type: { label: "Aid Type", options: ["Walking Cane (Standard)", "Walking Cane (Folding)", "Walking Cane (Quad)", "Walking Cane (Seat)", "Crutches (Underarm Pair)", "Crutches (Forearm Pair)", "Crutches (Platform)", "Walker (Standard)", "Walker (2-Wheel)", "Walker (4-Wheel/Rollator)", "Walker (Folding)", "Walker (With Seat)", "Wheelchair (Self-Propelled)", "Wheelchair (Attendant)", "Wheelchair (Transport)", "Wheelchair (Lightweight)", "Wheelchair (Heavy Duty)", "Wheelchair (Pediatric)", "Electric Wheelchair (Power Chair)", "Mobility Scooter (3-Wheel)", "Mobility Scooter (4-Wheel)", "Mobility Scooter (Foldable)", "Scooter Battery", "Scooter Charger", "Cushion (Wheelchair)", "Back Support (Wheelchair)", "Wheelchair Bag", "Cup Holder (Wheelchair)"], icon: "fa-wheelchair" },
          brand: { label: "Brand", options: ["Drive Medical", "Invacare", "Medline", "Compass Health", "Golden Technologies", "Pride Mobility", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          weight_capacity: { label: "Weight Capacity", options: ["100kg (220lbs)", "120kg (265lbs)", "136kg (300lbs)", "150kg (330lbs)", "180kg (400lbs)", "200kg (440lbs)", "250kg (550lbs)", "300kg (660lbs)", "350kg+"], icon: "fa-weight-hanging" },
          material: { label: "Material", options: ["Aluminum", "Steel", "Carbon Fiber", "Titanium", "Plastic", "Wood"], icon: "fa-layer-group" },
          adjustable_height: { label: "Adjustable Height", options: ["Yes", "No"], icon: "fa-arrows-alt-v" },
          foldable: { label: "Foldable", options: ["Yes", "No"], icon: "fa-compress" },
          condition: { label: "Condition", options: ["Brand New", "Used - Like New", "Used - Good", "Used - Fair", "Rental Available"], icon: "fa-star" },
        }
      },
      orthopedic_support: {
        name: "Orthopedic Supports",
        icon: "fa-hand-holding-heart",
        specs: {
          type: { label: "Support Type", options: ["Knee Brace (Sleeve)", "Knee Brace (Hinged)", "Knee Brace (Wrap)", "Knee Brace (Post-Op)", "Ankle Brace (Lace-up)", "Ankle Brace (Strap)", "Ankle Brace (Sleeve)", "Ankle Support (Air Cast)", "Wrist Brace (Splint)", "Wrist Brace (Wrap)", "Wrist Support (Carpal Tunnel)", "Elbow Brace (Sleeve)", "Elbow Brace (Strap)", "Shoulder Support (Immobilizer)", "Shoulder Support (Sling)", "Back Brace (Lumbar)", "Back Brace (Posture)", "Back Brace (Rigid)", "Neck Brace (Soft)", "Neck Brace (Rigid)", "Cervical Collar", "Compression Socks (Graduated)", "Compression Socks (Anti-Embolism)", "Compression Sleeve (Calf)", "Thigh Brace", "Hip Brace", "Finger Splint", "Toe Splint", "Posture Corrector", "Maternity Support Belt", "Abdominal Binder (Post-Surgery)"], icon: "fa-hand-holding-heart" },
          brand: { label: "Brand", options: ["Mueller", "ACE", "BraceAbility", "DonJoy", "Ossur", "Breg", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          size: { label: "Size", options: ["XS", "S", "M", "L", "XL", "XXL", "One Size", "Adjustable", "Universal", "Petite", "Regular", "Plus"], icon: "fa-ruler" },
          material: { label: "Material", options: ["Neoprene", "Elastic", "Nylon", "Spandex", "Cotton", "Fabric Blend", "Plastic", "Metal/Hinged"], icon: "fa-layer-group" },
          level: { label: "Support Level", options: ["Light (Compression)", "Medium (Stabilizing)", "Firm (Immobilizing)", "Maximum (Post-Op)"], icon: "fa-layer-group" },
          condition: { label: "Condition", options: ["Brand New", "New with Tags", "Like New", "Used"], icon: "fa-star" },
        }
      },
      family_planning: {
        name: "Family Planning",
        icon: "fa-heartbeat",
        specs: {
          type: { label: "Product Type", options: ["Condoms (Lubricated)", "Condoms (Ribbed)", "Condoms (Ultra Thin)", "Condoms (Flavored)", "Condoms (Large)", "Condoms (Female)", "Pregnancy Test (Strip)", "Pregnancy Test (Midstream)", "Pregnancy Test (Digital)", "Ovulation Test (Strip)", "Ovulation Test (Digital)", "Lubricant (Water-Based)", "Lubricant (Silicone-Based)", "Lubricant (Natural)", "Fertility Monitor", "Basal Thermometer", "Contraceptive Gel", "Contraceptive Sponge", "Emergency Contraceptive (Morning After Pill)", "Birth Control Pills (Prescription Required)", "Spermicide"], icon: "fa-heartbeat" },
          brand: { label: "Brand", options: ["Durex", "Trojan", "Lifestyles", "SKYN", "Clearblue", "First Response", "KY", "Astroglide", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          count: { label: "Quantity", options: ["1 test", "2 tests", "3 tests", "5 tests", "10 tests", "12 condoms", "24 condoms", "36 condoms", "50 condoms", "100 condoms", "50ml", "100ml", "150ml", "250ml", "500ml"], icon: "fa-hashtag" },
          sensitivity: { label: "Sensitivity (Tests)", options: ["10 mIU/mL (Early)", "20 mIU/mL (Standard)", "25 mIU/mL", "Digital (Easy Read)"], icon: "fa-chart-line" },
          expiry: { label: "Expiry Date", options: ["Within 6 months", "6-12 months", "12-24 months", "24+ months"], icon: "fa-calendar" },
          condition: { label: "Condition", options: ["Brand New", "Sealed"], icon: "fa-star" },
        }
      },
      traditional_medicine: {
        name: "Traditional & Herbal Medicine",
        icon: "fa-leaf",
        specs: {
          type: { label: "Product Type", options: ["Herbal Tea (Medicinal)", "Herbal Tincture", "Herbal Capsules", "Herbal Powder", "Herbal Syrup", "Herbal Ointment", "Herbal Oil", "Moringa Powder", "Moringa Capsules", "Aloe Vera Gel (Pure)", "Aloe Vera Juice", "Neem Capsules", "Neem Oil", "Black Seed Oil (Nigella Sativa)", "Black Seed Capsules", "Turmeric Powder (Medicinal)", "Turmeric Capsules", "Ginger Root (Dried)", "Garlic Capsules", "Echinacea", "Elderberry Syrup", "Ashwagandha", "Holy Basil (Tulsi)", "Ginseng", "Ginkgo Biloba", "Milk Thistle (Liver)", "Dandelion Root", "Saw Palmetto", "St. John's Wort", "Valerian Root (Sleep)", "Kava Kava", "CBD Oil (Hemp)", "Herbal Pain Relief Balm", "Herbal Cough Syrup"], icon: "fa-leaf" },
          brand: { label: "Brand", options: ["Nature's Way", "Herb Pharm", "Gaia Herbs", "Solaray", "Organic India", "Local Herbalist", "Other"], icon: "fa-tag", allowCustom: true },
          form: { label: "Form", options: ["Capsule", "Tablet", "Powder", "Liquid Extract", "Tincture", "Tea (Loose Leaf)", "Tea (Bagged)", "Syrup", "Ointment/Balm", "Oil", "Cream"], icon: "fa-cube" },
          dosage: { label: "Dosage (if applicable)", options: ["500mg", "1000mg", "1500mg", "2000mg", "1ml", "2ml", "5ml", "10 drops", "20 drops"], icon: "fa-chart-line" },
          organic: { label: "Organic Certification", options: ["USDA Organic", "Certified Organic", "Wildcrafted", "Conventional", "Not Specified"], icon: "fa-leaf" },
          condition: { label: "Condition", options: ["Brand New", "Sealed", "Freshly Prepared"], icon: "fa-star" },
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. PET SUPPLIES (NEW)
  // ═══════════════════════════════════════════════════════════════════════════
  pet_supplies: {
    id: "pet_supplies",
    name: "Pet Supplies",
    icon: "🐾",
    description: "Food, accessories, grooming, health, and toys for dogs, cats, birds, fish, and small animals",
    subcategories: {
      pet_food: {
        name: "Pet Food",
        icon: "fa-bowl-food",
        specs: {
          pet_type: { label: "Pet Type", options: ["Dog", "Cat", "Bird", "Fish", "Hamster", "Guinea Pig", "Rabbit", "Chicken", "Livestock", "Other"], icon: "fa-paw" },
          food_type: { label: "Food Type", options: ["Dry Kibble", "Wet Food (Canned)", "Semi-Moist", "Freeze-Dried", "Raw Food", "Treats", "Biscuits", "Chews", "Dental Sticks", "Training Treats", "Grain-Free", "Senior Formula", "Puppy/Kitten Formula", "Weight Management", "Hypoallergenic", "Prescription Diet"], icon: "fa-bowl-food" },
          brand: { label: "Brand", options: ["Royal Canin", "Hill's Science Diet", "Purina Pro Plan", "Pedigree", "Whiskas", "Friskies", "Blue Buffalo", "Eukanuba", "Acana", "Orijen", "Ken Caryl", "Farmers Choice", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          weight: { label: "Weight", options: ["200g", "400g", "500g", "1kg", "1.5kg", "2kg", "2.5kg", "3kg", "5kg", "7.5kg", "10kg", "12kg", "15kg", "18kg", "20kg", "25kg", "50kg"], icon: "fa-weight" },
          flavor: { label: "Flavor", options: ["Chicken", "Beef", "Lamb", "Fish (Salmon)", "Fish (Tuna)", "Turkey", "Duck", "Vegetarian", "Mixed", "Unflavored"], icon: "fa-utensils", allowCustom: true },
          life_stage: { label: "Life Stage", options: ["Puppy/Kitten (0-1yr)", "Adult (1-7yrs)", "Senior (7+yrs)", "All Life Stages", "Pregnant/Lactating"], icon: "fa-baby" },
          condition: { label: "Condition", options: ["Brand New", "Sealed", "Open Bag (Partial)"], icon: "fa-star" },
        }
      },
      pet_accessories: {
        name: "Pet Accessories",
        icon: "fa-dog",
        specs: {
          type: { label: "Accessory Type", options: ["Collar (Nylon)", "Collar (Leather)", "Collar (Padded)", "Collar (Reflective)", "Collar (GPS)", "Harness (Step-In)", "Harness (Over-Head)", "Harness (No-Pull)", "Harness (Vest)", "Leash (Standard)", "Leash (Retractable)", "Leash (Training)", "Leash (Long Line)", "Leash (Hands-Free)", "Muzzle (Soft)", "Muzzle (Basket)", "Muzzle (Leather)", "ID Tag (Metal)", "ID Tag (Silicon)", "ID Tag (QR Code)", "Bandana (Pet)", "Bow Tie (Pet)", "Pet Sweater", "Pet Jacket", "Pet Raincoat", "Pet Hoodie", "Pet Costume", "Pet Shoes/Boots", "Pet Socks", "Life Jacket (Dog)", "Pet Carrier (Backpack)", "Pet Carrier (Sling)", "Pet Carrier (Soft-Sided)", "Pet Carrier (Hard-Sided)", "Pet Car Seat", "Seat Cover (Car for Pets)", "Pet Ramp", "Pet Stairs"], icon: "fa-dog" },
          pet_type: { label: "Pet Type", options: ["Dog (Small)", "Dog (Medium)", "Dog (Large)", "Cat", "Both (Dog/Cat)", "Other"], icon: "fa-paw" },
          size: { label: "Size", options: ["XXS (Toy Breed)", "XS (Small)", "S (Small-Medium)", "M (Medium)", "L (Large)", "XL (Giant)", "Cat", "Adjustable", "One Size"], icon: "fa-ruler" },
          color: { label: "Color", options: ["Black", "Red", "Blue", "Green", "Pink", "Purple", "Yellow", "Orange", "Brown", "White", "Multicolor", "Reflective", "Neon"], icon: "fa-palette", allowCustom: true },
          material: { label: "Material", options: ["Nylon", "Polyester", "Leather", "Neoprene", "Cotton", "Mesh", "Rubber", "Plastic", "Metal"], icon: "fa-layer-group" },
          condition: { label: "Condition", options: ["Brand New", "New with Tags", "Like New", "Used"], icon: "fa-star" },
        }
      },
      pet_bedding: {
        name: "Pet Bedding & Cages",
        icon: "fa-bed",
        specs: {
          type: { label: "Type", options: ["Dog Bed (Rectangular)", "Dog Bed (Round)", "Dog Bed (Donut)", "Dog Bed (Orthopedic)", "Dog Bed (Cooling)", "Dog Bed (Heated)", "Cat Bed (Cave)", "Cat Bed (Donut)", "Cat Bed (Window Perch)", "Pet Crate (Wire)", "Pet Crate (Plastic)", "Pet Crate (Soft-Sided)", "Pet Crate (Furniture Style)", "Crate Pad", "Crate Cover", "Pet Playpen (Metal)", "Pet Playpen (Plastic)", "Pet Playpen (Mesh/Fabric)", "Pet Gate (Pressure Mounted)", "Pet Gate (Hardware Mounted)", "Pet Gate (Extra Wide)", "Pet Tent (Indoor)", "Pet Tent (Outdoor)", "Pet Blanket", "Pet Throw", "Pet Pillow", "Cat Tree", "Cat Tower", "Cat Condo", "Cat Scratching Post", "Cat Scratching Mat", "Cat Scratcher (Cardboard)", "Cat Hammock", "Cat Shelf (Wall Mounted)", "Aquarium (Small)", "Aquarium (Medium)", "Aquarium (Large)", "Bird Cage (Small)", "Bird Cage (Large)", "Bird Cage (Aviary)", "Hamster Cage", "Rabbit Hutch", "Chicken Coop"], icon: "fa-bed" },
          pet_type: { label: "Pet Type", options: ["Dog (Small)", "Dog (Medium)", "Dog (Large)", "Dog (Extra Large)", "Cat", "Bird", "Fish", "Hamster", "Rabbit", "Guinea Pig", "Chicken", "Multiple Pets"], icon: "fa-paw" },
          size: { label: "Dimensions", options: ["Small (18\"x24\")", "Medium (24\"x30\")", "Large (30\"x40\")", "Extra Large (40\"x50\")", "Cat (20\"x25\")", "Crate (S)", "Crate (M)", "Crate (L)", "Crate (XL)", "Bird Cage (S)", "Bird Cage (M)", "Bird Cage (L)", "Aquarium (10 Gal)", "Aquarium (20 Gal)", "Aquarium (30 Gal)", "Aquarium (40 Gal)", "Aquarium (55 Gal)", "Aquarium (75 Gal)"], icon: "fa-expand" },
          material: { label: "Material", options: ["Polyester", "Cotton", "Fleece", "Memory Foam", "Foam", "Canvas", "Metal (Wire)", "Metal (Steel)", "Plastic", "Wood", "Glass (Aquarium)"], icon: "fa-layer-group" },
          color: { label: "Color", options: ["Grey", "Brown", "Black", "Blue", "Red", "Green", "Beige", "Cream", "Multicolor", "Patterned"], icon: "fa-palette", allowCustom: true },
          machine_washable: { label: "Machine Washable", options: ["Yes", "No", "Spot Clean Only", "Removable Cover"], icon: "fa-tshirt" },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Used - Like New", "Used - Good", "Needs Assembly"], icon: "fa-star" },
        }
      },
      pet_grooming: {
        name: "Pet Grooming",
        icon: "fa-cut",
        specs: {
          type: { label: "Product Type", options: ["Dog Shampoo", "Dog Conditioner", "Cat Shampoo", "Medicated Shampoo", "Dry Shampoo (Pet)", "Grooming Brush (Slicker)", "Grooming Brush (Pin)", "Grooming Brush (Bristle)", "De-shedding Tool", "Undercoat Rake", "Flea Comb", "Mat Splitter", "Nail Clipper (Small)", "Nail Clipper (Large)", "Nail Grinder", "Nail File (Pet)", "Styptic Powder (Stop Bleeding)", "Pet Hair Clipper (Corded)", "Pet Hair Clipper (Cordless)", "Clipper Blades", "Clipper Guards", "Grooming Scissors (Straight)", "Grooming Scissors (Curved)", "Grooming Scissors (Thinning)", "Pet Toothbrush", "Pet Toothpaste", "Dental Spray (Pet)", "Dental Wipes (Pet)", "Ear Cleaner (Pet)", "Eye Wipes (Pet)", "Pet Wipes (General)", "Paw Cleaner", "Grooming Glove", "Grooming Table", "Grooming Arm (Table)", "Pet Hair Dryer (High Velocity)", "Pet Dryer (Forced Air)"], icon: "fa-cut" },
          pet_type: { label: "Pet Type", options: ["Dog (All)", "Dog (Short Hair)", "Dog (Long Hair)", "Dog (Double Coat)", "Dog (Shedding)", "Cat (All)", "Cat (Short Hair)", "Cat (Long Hair)", "Both (Dog/Cat)", "Small Animal"], icon: "fa-paw" },
          size: { label: "Size/Breed Size", options: ["Small Breeds (under 10kg)", "Medium Breeds (10-25kg)", "Large Breeds (25-40kg)", "Giant Breeds (40kg+)", "Cat", "Universal", "Not Applicable"], icon: "fa-ruler" },
          brand: { label: "Brand", options: ["Wahl", "Andis", "Oster", "Furminator", "PetSafe", "Burt's Bees", "Earthbath", "TropiClean", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          volume: { label: "Volume (Liquids)", options: ["100ml", "250ml", "355ml", "500ml", "750ml", "1L", "2L", "3.8L (1 Gal)", "5L", "20L"], icon: "fa-flask" },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Used", "Open but Unused"], icon: "fa-star" },
        }
      },
      pet_health: {
        name: "Pet Health & Wellness",
        icon: "fa-heartbeat",
        specs: {
          type: { label: "Product Type", options: ["Flea & Tick Treatment (Topical)", "Flea & Tick Treatment (Oral)", "Flea & Tick Collar", "Flea Spray", "Flea Powder", "Flea Shampoo", "Dewormer (Tablet)", "Dewormer (Liquid)", "Heartworm Prevention", "Joint Supplement (Glucosamine)", "Skin & Coat Supplement (Omega)", "Probiotics (Pet)", "Multivitamin (Pet)", "Calming Aid (Supplements)", "Calming Spray", "Calming Diffuser (Pheromone)", "Anxiety Wrap (Pet)", "Ear Mite Treatment", "Eye Drops (Pet)", "Wound Spray (Pet)", "Antibiotic Ointment (Pet)", "Dental Spray (Health)", "Dental Chews (Health)", "Flea Comb", "Tick Remover Tool", "Pet First Aid Kit", "Pet Thermometer"], icon: "fa-heartbeat" },
          pet_type: { label: "Pet Type", options: ["Dog (All Sizes)", "Dog (Small under 10kg)", "Dog (Medium 10-25kg)", "Dog (Large 25-40kg)", "Dog (Giant 40kg+)", "Cat", "Puppy", "Kitten", "Senior Dog", "Senior Cat", "All Pets"], icon: "fa-paw" },
          brand: { label: "Brand", options: ["Frontline", "Advantage", "NexGard", "Bravecto", "Simparica", "Sentinel", "Heartgard", "Nutramax (Dasuquin)", "Zesty Paws", "PetArmor", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          weight: { label: "Pet Weight Range", options: ["Under 5kg", "5-10kg", "10-20kg", "20-30kg", "30-40kg", "40kg+", "All Sizes", "Cat (All Sizes)"], icon: "fa-weight-hanging" },
          dosage: { label: "Dosage Form", options: ["Chewable Tablet", "Tablet (Swallowed)", "Liquid", "Topical (Spot-on)", "Collar", "Spray", "Powder", "Soft Chew"], icon: "fa-chart-line" },
          condition: { label: "Condition", options: ["Brand New", "Sealed", "Near Expiry (Discounted)", "Unit Dose", "Box of 3", "Box of 6", "Box of 12"], icon: "fa-star" },
        }
      },
      pet_toys: {
        name: "Pet Toys",
        icon: "fa-tennis-ball",
        specs: {
          type: { label: "Toy Type", options: ["Chew Toy (Rubber)", "Chew Toy (Nylon)", "Chew Toy (Rope)", "Chew Toy (Bone-shaped)", "Chew Toy (Stick)", "Tug Toy (Rope)", "Tug Toy (Rubber Ring)", "Fetch Toy (Ball)", "Fetch Toy (Tennis Ball)", "Fetch Toy (Frisbee)", "Fetch Toy (Rubber Ring)", "Squeaky Toy (Plush)", "Squeaky Toy (Rubber)", "Interactive Toy (Puzzle)", "Interactive Toy (Treat Dispenser)", "Snuffle Mat", "Plush Toy (Without Squeaker)", "Plush Toy (With Squeaker)", "Cat Toy (Feather Wand)", "Cat Toy (Laser Pointer)", "Cat Toy (Catnip Mouse)", "Cat Toy (Catnip Sack)", "Cat Toy (Track Ball)", "Cat Toy (Crinkle Toy)", "Cat Toy (Bell Ball)", "Dog Puzzle", "Kong Toy (Classic)", "Kong Toy (Extreme)"], icon: "fa-tennis-ball" },
          pet_type: { label: "Pet Type", options: ["Dog (Small)", "Dog (Medium)", "Dog (Large)", "Dog (Aggressive Chewer)", "Dog (Gentle Chewer)", "Cat (All)", "Puppy (Teething)", "Senior Dog", "Both (Dog/Cat)"], icon: "fa-paw" },
          durability: { label: "Durability", options: ["Light (Gentle Chewers)", "Medium (Moderate Chewers)", "Heavy (Aggressive Chewers)", "Extreme (Power Chewers)", "Not Applicable (Plush)"], icon: "fa-shield-alt" },
          material: { label: "Material", options: ["Natural Rubber", "TPR", "Nylon", "Rope (Cotton)", "Rope (Polyester)", "Plush (Fabric)", "Polyester", "Vinyl", "Plastic", "Non-Toxic Materials"], icon: "fa-layer-group" },
          color: { label: "Color", options: ["Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Pink", "Multicolor", "Neon"], icon: "fa-palette", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New", "New with Tags", "Like New", "Used - Good", "Missing Squeaker"], icon: "fa-star" },
        }
      },
      pet_hygiene: {
        name: "Pet Hygiene",
        icon: "fa-poop",
        specs: {
          type: { label: "Product Type", options: ["Poop Bags (Roll)", "Poop Bags (Dispensed)", "Poop Bag Dispenser", "Litter Box (Open)", "Litter Box (Covered/Hooded)", "Litter Box (Top Entry)", "Litter Box (Self-Cleaning)", "Litter Box Liners", "Cat Litter (Clumping Clay)", "Cat Litter (Crystal/Silica)", "Cat Litter (Biodegradable)", "Cat Litter (Paper/Pellets)", "Litter Scoop", "Litter Mat (Trap)", "Pet Urine Cleaner (Enzymatic)", "Pet Stain Remover", "Pet Odor Neutralizer", "Pet Waste Station (Outdoor)", "Pee Pads (Training)", "Pee Pads (Reusable/Washable)", "Pee Pads (Extra Absorbent)", "Dog Diapers (Male)", "Dog Diapers (Female)", "Dog Diapers (Wrap)", "Dog Diapers (Belly Band)", "Cat Diapers", "Heat/Season Diapers (Female)", "Incontinence Pads (For Bedding)", "Pet Wipes (Hygiene)", "Paw Wipes"], icon: "fa-poop" },
          pet_type: { label: "Pet Type", options: ["Dog (Small)", "Dog (Medium)", "Dog (Large)", "Dog (Extra Large)", "Cat", "Puppy (Training)", "Senior Pet (Incontinence)", "Both (Dog/Cat)"], icon: "fa-paw" },
          size: { label: "Size", options: ["XS (Toy Breed)", "S (Small)", "M (Medium)", "L (Large)", "XL (Giant)", "Cat (Small)", "Cat (Large)", "Litter Box (Small)", "Litter Box (Medium)", "Litter Box (Large)", "Pee Pad (Small 17x22\")", "Pee Pad (Medium 22x22\")", "Pee Pad (Large 22x32\")", "Pee Pad (XL 32x32\")"], icon: "fa-ruler" },
          count: { label: "Quantity", options: ["15 bags", "30 bags", "50 bags", "60 bags", "100 bags", "120 bags", "150 bags", "200 bags", "270 bags", "300 bags", "500 bags", "5 lb Litter", "10 lb Litter", "20 lb Litter", "25 lb Litter", "40 lb Litter", "5 pads", "10 pads", "20 pads", "30 pads", "50 pads", "100 pads"], icon: "fa-hashtag" },
          scent: { label: "Scent (Litter/Cleaners)", options: ["Unscented", "Lavender", "Fresh Scent", "Mountain Spring", "Ocean Breeze", "Lemon", "Charcoal (Odor Control)", "Baking Soda"], icon: "fa-leaf", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New", "Sealed", "Open Box"], icon: "fa-star" },
        }
      },
      pet_apparel: {
        name: "Pet Apparel",
        icon: "fa-tshirt",
        specs: {
          type: { label: "Apparel Type", options: ["Sweater (Dog)", "Hoodie (Dog)", "Jacket (Dog)", "Puffer Jacket (Dog)", "Raincoat (Dog)", "Snowsuit (Dog)", "T-Shirt (Dog)", "Tank Top (Dog)", "Costume (Halloween)", "Costume (Christmas)", "Costume (Birthday)", "Wedding Attire (Pet)", "Formal Wear (Bow Tie)", "Formal Wear (Tuxedo)", "Dress (Girl Dog)", "Skirt (Dog)", "Pajamas (Dog)", "Onesie (Dog)", "Boots/Shoes (Dog)", "Socks (Dog)", "Leg Warmers (Dog)", "Hat (Dog)", "Beanie (Dog)", "Baseball Cap (Dog)", "Bandana (Dog)", "Scarf (Dog)", "Bow Tie (Pet)", "Bow (Hair Accessory)", "Collar Cover (Fashion)", "Harness Cover (Fashion)"], icon: "fa-tshirt" },
          pet_type: { label: "Pet Type", options: ["Dog (Small)", "Dog (Medium)", "Dog (Large)", "Cat (Small)", "Cat (Medium)", "Both"], icon: "fa-paw" },
          size: { label: "Size", options: ["XXS (Toy Breed)", "XS (Chihuahua)", "S (Yorkie/French Bulldog)", "M (Beagle/Corgi)", "L (Border Collie/Bulldog)", "XL (Labrador/Golden)", "XXL (German Shepherd)", "XXXL (Great Dane/Mastiff)", "Cat S", "Cat M", "Cat L"], icon: "fa-ruler" },
          material: { label: "Material", options: ["Cotton", "Polyester", "Fleece", "Acrylic", "Wool", "Sherpa", "Nylon (Waterproof)", "Neoprene", "Mesh"], icon: "fa-layer-group" },
          color: { label: "Color", options: ["Red", "Blue", "Green", "Pink", "Purple", "Yellow", "Orange", "Black", "White", "Grey", "Brown", "Multicolor", "Patterned", "Striped", "Plaid"], icon: "fa-palette", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New", "New with Tags", "Like New", "Used"], icon: "fa-star" },
        }
      },
      // Continuing from where I left off - completing Bird Supplies:

      bird_supplies: {
        name: "Bird Supplies",
        icon: "fa-dove",
        specs: {
          type: { label: "Type", options: ["Bird Food (Seeds)", "Bird Food (Pellets)", "Bird Treats (Millet)", "Bird Treats (Honey Stick)", "Bird Treats (Fruit Blend)", "Bird Cage (Small)", "Bird Cage (Medium)", "Bird Cage (Large)", "Bird Cage (Aviary)", "Cage Cover (Bird)", "Perch (Natural Wood)", "Perch (Concrete/Cement)", "Perch (Rope)", "Perch (Plastic)", "Bird Toy (Mirror)", "Bird Toy (Bell)", "Bird Toy (Swing)", "Bird Toy (Ladder)", "Bird Toy (Chew/Shreddable)", "Bird Toy (Foraging)", "Bird Bath (Cage Mount)", "Bird Bath (Standalone)", "Bird Feeder (Cage Mount)", "Bird Feeder (Outdoor)", "Bird Nest (Breeding Box)", "Nesting Material", "Bird Grit", "Cuttlebone (Calcium)", "Mineral Block", "Bird Vitamin Supplement", "Water Bottle (Bird)", "Bird Harness & Leash", "Flight Suit (Bird Diaper)", "Bird Carrier (Travel)"], icon: "fa-dove" },
          bird_type: { label: "Bird Type", options: ["Parakeet/Budgie", "Cockatiel", "Lovebird", "African Grey", "Amazon Parrot", "Macaw", "Canary", "Finch", "Pigeon/Dove", "Chicken", "Duck", "General/Small Bird", "General/Large Bird"], icon: "fa-dove" },
          cage_size: { label: "Cage Size (if applicable)", options: ["Small (12x12x18\")", "Medium (18x18x24\")", "Large (24x24x36\")", "Extra Large (32x32x48\")", "Aviary (36x24x60\")", "Not Applicable"], icon: "fa-expand" },
          material: { label: "Material", options: ["Wood", "Plastic", "Metal (Stainless Steel)", "Metal (Powder Coated)", "Rope (Cotton)", "Rope (Polyester)", "Acrylic", "Ceramic"], icon: "fa-layer-group" },
          food_weight: { label: "Food Weight", options: ["250g", "500g", "1kg", "2kg", "2.5kg", "5kg", "10kg", "20kg", "25kg", "50lb bag"], icon: "fa-weight" },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Used - Like New", "Used - Good", "Needs Assembly"], icon: "fa-star" },
        }
      },
      small_pet_supplies: {
        name: "Small Animal Supplies (Hamster, Rabbit, Guinea Pig)",
        icon: "fa-rat",
        specs: {
          type: { label: "Type", options: ["Small Pet Cage (Hamster)", "Small Pet Cage (Rabbit)", "Small Pet Cage (Guinea Pig)", "Cage Bedding (Wood Shavings)", "Cage Bedding (Paper Based)", "Cage Bedding (Hemp)", "Cage Liners (Fleece)", "Hay (Timothy Hay)", "Hay (Alfalfa Hay)", "Hay (Orchard Grass)", "Small Pet Food (Pellets)", "Small Pet Treats", "Vitamin Supplement (Small Pet)", "Water Bottle (Small Pet)", "Food Bowl (Small Pet)", "Exercise Wheel (Hamster)", "Exercise Ball (Hamster)", "Tunnel (Hamster)", "Hideout (Small Pet)", "Chew Toy (Wood)", "Chew Toy (Mineral)", "Chew Block", "Salt Lick (Mineral)", "Playpen (Small Pet)", "Carrier (Small Pet)", "Grooming Brush (Small Pet)", "Nail Clippers (Small Pet)", "Small Pet Shampoo", "Small Pet Bed", "Small Pet Hammock"], icon: "fa-rat" },
          animal_type: { label: "Animal Type", options: ["Hamster (Dwarf)", "Hamster (Syrian)", "Guinea Pig", "Rabbit (Dwarf)", "Rabbit (Standard)", "Rabbit (Giant)", "Ferret", "Gerbil", "Mouse", "Rat", "Chinchilla", "Hedgehog"], icon: "fa-paw" },
          cage_size: { label: "Cage Size", options: ["Small (12x12x12\")", "Medium (18x18x18\")", "Large (24x24x24\")", "Rabbit (30x18x24\")", "Rabbit (36x24x24\")", "Multi-level (36x18x36\")", "Bin Cage (DIY Style)"], icon: "fa-expand" },
          bedding_weight: { label: "Bedding Weight", options: ["2L", "4L", "10L", "20L", "30L", "50L", "2kg", "5kg", "10kg", "20kg"], icon: "fa-weight" },
          food_weight: { label: "Food Weight", options: ["200g", "400g", "500g", "1kg", "2kg", "2.5kg", "5kg", "10kg", "25lb bag"], icon: "fa-weight" },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Used - Like New", "Used"], icon: "fa-star" },
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. OFFICE & STATIONERY (NEW)
  // ═══════════════════════════════════════════════════════════════════════════
  office_stationery: {
    id: "office_stationery",
    name: "Office & Stationery",
    icon: "📎",
    description: "Writing instruments, paper products, office supplies, school supplies, and shipping materials",
    subcategories: {
      writing_instruments: {
        name: "Writing Instruments",
        icon: "fa-pen",
        specs: {
          type: { label: "Type", options: ["Pen (Ballpoint)", "Pen (Gel)", "Pen (Rollerball)", "Pen (Fountain)", "Pen (Calligraphy)", "Pen (Multicolor)", "Pencil (Graphite)", "Pencil (Mechanical)", "Pencil (Colored)", "Pencil (Watercolor)", "Marker (Permanent)", "Marker (Whiteboard)", "Marker (Dry Erase)", "Marker (Highlighters)", "Marker (Fabric)", "Marker (Paint)", "Marker (Chalk)", "Sharpie", "Fineliner Pen", "Technical Pen", "Brush Pen", "Eraser (Pencil)", "Eraser (White/Plastic)", "Eraser (Kneaded)", "Pencil Sharpener (Manual)", "Pencil Sharpener (Electric)", "Pen Refill", "Pencil Lead Refill", "Correction Fluid (Whiteout)", "Correction Tape", "Correction Pen", "Ink (Bottle)", "Ink (Cartridge)", "Calligraphy Set", "Fountain Pen Set", "Pen Stand", "Pen Case/Pouch"], icon: "fa-pen" },
          brand: { label: "Brand", options: ["Bic", "Paper Mate", "Pilot", "Uni-ball", "Pentel", "Staedtler", "Faber-Castell", "Sharpie", "Crayola", "Prismacolor", "Zebra", "Lamy", "Montblanc", "Cross", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          color: { label: "Color/Ink Color", options: ["Black", "Blue", "Red", "Green", "Purple", "Pink", "Orange", "Yellow", "Multicolor Set", "Assorted", "Grey", "Brown"], icon: "fa-palette", allowCustom: true },
          tip_size: { label: "Tip Size (mm)", options: ["0.3mm", "0.4mm", "0.5mm", "0.7mm", "1.0mm", "1.2mm", "2.0mm", "3.0mm", "5.0mm", "Fine", "Medium", "Broad", "Chisel Tip"], icon: "fa-ruler" },
          quantity: { label: "Quantity", options: ["1 piece", "2 pieces", "3 pieces", "4 pieces", "5 pieces", "6 pieces", "10 pieces", "12 pieces", "20 pieces", "24 pieces", "36 pieces", "50 pieces", "100 pieces", "Set of 12", "Set of 24", "Set of 36", "Box of 12", "Box of 50"], icon: "fa-hashtag" },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Open Box"], icon: "fa-star" },
        }
      },
      paper_products: {
        name: "Paper Products",
        icon: "fa-file-alt",
        specs: {
          type: { label: "Type", options: ["A4 Paper (Ream 500 sheets)", "A3 Paper (Ream)", "Letter Size Paper", "Legal Size Paper", "Notebook (Lined)", "Notebook (Grid/Graph)", "Notebook (Dotted/Bullet Journal)", "Notebook (Blank)", "Composition Book", "Spiral Notebook (Single)", "Spiral Notebook (Multi-subject)", "Steno Pad", "Legal Pad", "Memo Pad", "Sticky Notes (3x3)", "Sticky Notes (4x4)", "Sticky Notes (3x5)", "Sticky Notes (Shaped)", "Index Cards (3x5)", "Index Cards (4x6)", "Index Cards (5x8)", "Postcards (Blank)", "Envelopes (Business #10)", "Envelopes (A2 / Invitation)", "Envelopes (A4 / C4)", "Envelopes (A5 / C5)", "Envelopes (A6 / C6)", "Envelopes (Bubble Mailer)", "Padded Envelopes (Bubble)", "Shipping Envelopes (Poly)", "Kraft Paper (Roll)", "Butcher Paper (Roll)", "Bond Paper (Roll)", "Plotter Paper (Roll)", "Photo Paper (Glossy)", "Photo Paper (Matte)", "Cardstock (Heavy Paper)", "Construction Paper", "Tissue Paper", "Wrapping Paper", "Gift Wrap", "Brown Paper (Kraft)", "Paper Bags (Shopping)", "Paper Bags (Lunch)", "Paper Towels (Shop)","Printer Paper (Color)", "Copier Paper"], icon: "fa-file-alt" },
          brand: { label: "Brand", options: ["HP", "Xerox", "Double A", "Moleskine", "Leuchtturm1917", "Rhodia", "Oxford", "Five Star", "Mead", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          size: { label: "Paper Size", options: ["A4 (210x297mm)", "A3 (297x420mm)", "A5 (148x210mm)", "Letter (8.5x11\")", "Legal (8.5x14\")", "A2 (420x594mm)", "Executive (7.25x10.5\")", "Custom/Notebook Size (6x9\")", "Notebook (A5)", "Notebook (B5)", "Notebook (A6)", "Pocket Size (3.5x5.5\")"], icon: "fa-expand" },
          sheet_count: { label: "Sheet/Page Count", options: ["20 sheets", "30 sheets", "50 sheets", "70 sheets", "80 sheets", "100 sheets", "120 sheets", "150 sheets", "200 sheets", "240 sheets", "300 sheets", "400 sheets", "500 sheets (Ream)", "5 reams (2500 sheets)", "10 reams (5000 sheets)", "20 reams (10000 sheets)"], icon: "fa-hashtag" },
          paper_weight: { label: "Paper Weight (gsm)", options: ["60gsm", "70gsm", "75gsm", "80gsm", "90gsm", "100gsm", "120gsm", "160gsm", "200gsm", "250gsm", "300gsm", "350gsm"], icon: "fa-weight" },
          ruling: { label: "Ruling/Line Type", options: ["College Ruled", "Wide Ruled", "Narrow Ruled", "Graph (5mm)", "Graph (10mm)", "Dot Grid (5mm)", "Dot Grid (3mm)", "Blank (Unruled)", "Lined (6mm)", "Lined (7mm)", "Lined (8mm)", "French Ruled", "Cornell Notes", "Music Manuscript", "Staff Paper"], icon: "fa-chart-line" },
          condition: { label: "Condition", options: ["Brand New", "Sealed", "Open but Unused", "Partial Ream"], icon: "fa-star" },
        }
      },
      desk_organizers: {
        name: "Desk Organizers",
        icon: "fa-th-large",
        specs: {
          type: { label: "Type", options: ["Pen Holder/Cup", "Desk Organizer (Mesh)", "Desk Organizer (Acrylic)", "Desk Organizer (Wood)", "Desk Drawer Organizer", "Desk Tray (Paper Tray)", "Letter Tray (Stackable)", "Document Holder (Vertical)", "File Sorter", "Magazine Holder", "Bookend (Metal)", "Bookend (Wood)", "Bookend (Plastic)", "Desk Pad (Mousepad Style)", "Blotter Pad (Desk Mat)", "Cable Management Box", "Cable Clips", "Cable Sleeve", "Cable Tie (Velcro)", "Cable Tie (Plastic)", "Monitor Stand (Riser)", "Monitor Stand (with Drawer)", "Laptop Stand (Portable)", "Laptop Stand (Elevated)", "Desk Shelf (Under-monitor)", "Desk Calendar", "Desktop Card Holder (Business Cards)", "Phone Stand (Desk)", "Tablet Stand (Desk)", "Letter Opener", "Staple Remover", "Desk Vacuum (Mini)", "Keyboard Drawer", "CPU Holder (Under Desk)"], icon: "fa-th-large" },
          material: { label: "Material", options: ["Plastic", "Metal (Mesh)", "Metal (Steel)", "Acrylic", "Wood (Bamboo)", "Wood (Solid)", "Glass", "Silicone", "Fabric", "Leather (PU)"], icon: "fa-layer-group" },
          color: { label: "Color", options: ["Black", "White", "Grey", "Silver", "Clear", "Blue", "Red", "Green", "Pink", "Brown", "Wood Color", "Natural Bamboo"], icon: "fa-palette", allowCustom: true },
          size: { label: "Size", options: ["Small (4x4\")", "Medium (6x8\")", "Large (8x10\")", "Extra Large (12x15\")", "Single Tray", "Double Tray", "Triple Tray", "Under 12\"", "12-18\"", "18-24\"", "24\"+"], icon: "fa-expand" },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Used - Like New", "Used"], icon: "fa-star" },
        }
      },
      filing_storage: {
        name: "Filing & Storage",
        icon: "fa-folder-open",
        specs: {
          type: { label: "Type", options: ["File Folder (Manila)", "File Folder (Hanging)", "File Folder (Pressboard)", "File Folder (Poly/Plastic)", "File Folder (Expanding)", "Pocket Folder (with Prongs)", "Pocket Folder (2 Pocket)", "Report Cover (Clear Front)", "Binder (1/2 inch)", "Binder (1 inch)", "Binder (1.5 inch)", "Binder (2 inch)", "Binder (3 inch)", "Binder (4 inch)", "Binder (D-Ring)", "Binder (O-Ring)", "Binder (Slant Ring)", "Binder Dividers (Tabbed)", "Sheet Protectors (Clear)", "Sheet Protectors (Poly)", "Index Dividers", "File Box (Banker's Box)", "File Box (Plastic/Crate)", "File Box (Locking/Latch)", "Storage Box (Cardboard)", "Storage Box (Plastic)", "Storage Box (with Lid)", "Storage Bin (Stackable)", "File Cabinet (2 Drawer)", "File Cabinet (4 Drawer)", "File Cabinet (Lateral)", "Rolling File Cart", "Document Box (Archival)", "Shipping Box (Corrugated)", "Moving Box (Small)", "Moving Box (Medium)", "Moving Box (Large)", "Moving Box (Wardrobe)", "Tote Box (with Handles)"], icon: "fa-folder-open" },
          size: { label: "Size", options: ["Letter (8.5x11\")", "Legal (8.5x14\")", "A4 (210x297mm)", "Index Card (3x5\")", "Check Size (6.5x3\")", "Small Box (12x12x12\")", "Medium Box (15x15x15\")", "Large Box (18x18x18\")", "Extra Large (20x20x20\")", "File Box (13x15x10\")", "Banker Box (15x12x10\")"], icon: "fa-expand" },
          material: { label: "Material", options: ["Cardboard", "Corrugated Cardboard", "Plastic (Polypropylene)", "Plastic (PVC)", "Metal (Steel)", "Metal (Aluminum)", "Wood", "Pressboard", "Manila (Paper)", "Tyvek (Poly)","Kraft Paper"], icon: "fa-layer-group" },
          color: { label: "Color", options: ["Manila/Tan", "White", "Black", "Blue", "Red", "Green", "Yellow", "Purple", "Orange", "Assorted", "Clear"], icon: "fa-palette", allowCustom: true },
          capacity: { label: "Capacity", options: ["Up to 50 sheets", "51-100 sheets", "101-200 sheets", "201-300 sheets", "301-500 sheets", "500+ sheets", "1/2 inch", "1 inch", "1.5 inch", "2 inch", "3 inch", "4 inch", "10-20 files", "21-50 files", "51-100 files", "100+ files"], icon: "fa-database" },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Used - Like New", "Used - Good", "Box Flattened (Storage)"], icon: "fa-star" },
        }
      },
      office_electronics: {
        name: "Office Electronics",
        icon: "fa-print",
        specs: {
          type: { label: "Type", options: ["Printer (Inkjet)", "Printer (Laser)", "Printer (All-in-One)", "Printer (Label)", "Scanner (Flatbed)", "Scanner (Sheetfed)", "Scanner (Document)", "Photocopier (Copier)", "Fax Machine", "Multifunction Printer (MFP)", "Calculator (Basic)", "Calculator (Scientific)", "Calculator (Financial/BA II Plus)", "Calculator (Printing)", "Shredder (Strip Cut)", "Shredder (Cross Cut)", "Shredder (Micro Cut)", "Shredder (Heavy Duty)", "Laminator (Pouch)", "Laminator (Roll)", "Laminating Pouches (Letter)", "Laminating Pouches (Legal)", "Laminating Pouches (A4)", "Binding Machine (Comb)", "Binding Machine (Coil)", "Binding Machine (Wire)", "Binding Combs (Spines)", "Binding Coils", "Binding Wire", "Paper Cutter/Trimmer (Guillotine)", "Paper Cutter (Rotary)", "Paper Folder (Automatic)", "Envelope Sealer", "Postage Scale (Digital)", "Postage Meter", "ID Card Printer", "Badge Holder (ID)", "Lanyard (ID Holder)"], icon: "fa-print" },
          brand: { label: "Brand", options: ["HP", "Canon", "Epson", "Brother", "Xerox", "Sharp", "Ricoh", "Kyocera", "Casio", "Texas Instruments", "Fellowes", "Swingline", "GBC", "Amazon Basics", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          connectivity: { label: "Connectivity", options: ["USB 2.0", "USB 3.0", "Ethernet", "Wi-Fi", "Bluetooth", "NFC", "Wireless Direct", "Cloud Print", "Apple AirPrint", "No Connectivity (Manual)"], icon: "fa-plug", multiple: true },
          function: { label: "Function (Printer/MFP)", options: ["Print Only", "Print & Scan", "Print, Scan, Copy", "Print, Scan, Copy, Fax", "Scan Only", "Copy Only", "Fax Only"], icon: "fa-tasks" },
          speed: { label: "Speed (Pages Per Minute)", options: ["Up to 10ppm", "11-15ppm", "16-20ppm", "21-25ppm", "26-30ppm", "31-35ppm", "36-40ppm", "40+ ppm", "Not Applicable"], icon: "fa-tachometer-alt" },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Open Box", "Refurbished", "Used - Like New", "Used - Good", "Used - For Parts"], icon: "fa-star" },
        }
      },
      shipping_supplies: {
        name: "Shipping & Mailing Supplies",
        icon: "fa-box",
        specs: {
          type: { label: "Type", options: ["Shipping Box (Small 6x6x6\")", "Shipping Box (Medium 12x12x12\")", "Shipping Box (Large 18x18x18\")", "Shipping Box (Extra Large 24x24x24\")", "Corrugated Box (Flat Pack)", "Mailer Box (Pizza Box Style)", "Shipping Tube (Cardboard)", "Shipping Tube (Plastic)", "Bubble Wrap (Small Bubble)", "Bubble Wrap (Large Bubble)", "Packing Peanuts (Biodegradable)", "Packing Peanuts (Styrofoam)", "Air Pillows (Void Fill)", "Packing Paper (Kraft)", "Newsprint Paper (Packing)", "Foam Sheets (Packing)", "Foam Rolls (Packing)", "Shipping Tape (Clear)", "Shipping Tape (Brown/Kraft)", "Shipping Tape (Reinforced)", "Tape Dispenser (Handheld)", "Tape Gun (Heavy Duty)", "Tape Gun (Light Duty)", "Label Printer (Thermal)", "Label Printer (Inkjet/Laser)", "Shipping Labels (Avery)", "Thermal Labels (4x6)", "Thermal Labels (2x7)", "Poly Mailers (Small #0)", "Poly Mailers (Medium #2)", "Poly Mailers (Large #4)", "Poly Mailers (Extra Large #6)", "Bubble Mailers (Padded Envelopes)", "Cardboard Mailers (Photo Mailers)", "Document Mailer (Flat)", "Address Label (Roll)", "Warning Label (Fragile)", "Warning Label (This Side Up)", "Shipping Scale (Digital)", "Shipping Scale (Mechanical)"], icon: "fa-box" },
          size: { label: "Size", options: ["#0 (6x10\")", "#00 (6x9\")", "#1 (8x10\")", "#2 (10x13\")", "#3 (11x14\")", "#4 (12x15.5\")", "#5 (14x17\")", "#6 (14.5x19\")", "A4 (12x16\")", "Box (6x6x6\")", "Box (8x8x8\")", "Box (10x10x10\")", "Box (12x12x12\")", "Box (14x14x14\")", "Box (16x16x16\")", "Box (18x18x18\")", "Box (20x20x20\")", "Box (24x18x18\")", "Box (24x24x24\")", "Tube (2x18\")", "Tube (3x24\")", "Tube (4x36\")", "Roll (100ft)", "Roll (200ft)", "Roll (500ft)", "Roll (1000ft)"], icon: "fa-expand" },
          material: { label: "Material", options: ["Cardboard/Corrugated", "Polyethylene (Plastic)", "Bubble (Plastic)", "Foam (Polyethylene)", "Foam (Polyurethane)", "Paper/Kraft", "Biodegradable/Compostable", "Glassine", "Vinyl"], icon: "fa-layer-group" },
          adhesive_type: { label: "Adhesive Type (Tape)", options: ["Acrylic", "Hot Melt", "Natural Rubber", "Synthetic Rubber", "Water Activated (Gummed)"], icon: "fa-hand-paper" },
          quantity: { label: "Quantity", options: ["10 pieces", "20 pieces", "25 pieces", "50 pieces", "100 pieces", "250 pieces", "500 pieces", "1000 pieces", "1 roll", "2 rolls", "4 rolls", "6 rolls", "12 rolls", "1 case (48 rolls)", "1 box"], icon: "fa-hashtag" },
          condition: { label: "Condition", options: ["Brand New", "Sealed", "Open Box", "Partial Roll/Box"], icon: "fa-star" },
        }
      },
      school_supplies: {
        name: "School Supplies",
        icon: "fa-graduation-cap",
        specs: {
          type: { label: "Type", options: ["Backpack (School)", "Lunch Box (Kids)", "Lunch Bag (Insulated)", "Geometry Set (Compass, Protractor)", "Math Set", "Ruler (12\"/30cm)", "Ruler (Metric/Inches)", "Ruler (Folding)", "Ruler (Flexible)", "Protractor", "Compass (Geometry)", "Set Square (Triangle)", "T-Square", "French Curve", "Eraser (Pencil)", "Pencil Case (Pouch)", "Pencil Box (Hard)", "Pencil Sharpener (Manual)", "Pencil Sharpener (Battery/Electric)", "Watercolor Set (Kids)", "Paintbrush Set (Student)", "Crayons (24 pack)", "Crayons (48 pack)", "Crayons (64 pack)", "Colored Pencils (12 pack)", "Colored Pencils (24 pack)", "Colored Pencils (36 pack)", "Markers (Washable)", "Markers (Permanent)", "Highlighters (Assorted)", "Glue Stick (School)", "Liquid Glue (School)", "White Glue (PVA)", "Scissors (Blunt Tip)", "Scissors (Pointed Tip)", "Scissors (Left Handed)", "Calculator (Basic School)", "Calculator (Scientific)", "Sticky Notes (School)", "Index Cards (School)", "Composition Book (School)", "Spiral Notebook (School)", "Folder (School)", "Binder (School 1\")", "Binder (School 2\")", "Binder Dividers (School)", "Sheet Protectors (School)", "Hand Sanitizer (School)", "Face Mask (School)", "Tissues (School Pack)", "Wet Wipes (School)"], icon: "fa-graduation-cap" },
          grade_level: { label: "Grade Level", options: ["Preschool (3-5)", "Kindergarten (5-6)", "Elementary (Grades 1-5)", "Middle School (Grades 6-8)", "High School (Grades 9-12)", "College/University", "Art Student", "General"], icon: "fa-chart-line" },
          brand: { label: "Brand", options: ["Crayola", "Elmer's", "Fiskars", "Five Star", "Mead", "Ticonderoga", "Sharpie", "Expo", "Bic", "Paper Mate", "Scotch", "Post-it", "Avery", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          quantity: { label: "Quantity/Count", options: ["Single", "2 pack", "3 pack", "4 pack", "5 pack", "6 pack", "8 pack", "10 pack", "12 pack", "16 pack", "20 pack", "24 pack", "30 pack", "36 pack", "48 pack", "60 pack", "72 pack", "100 pack", "Classroom Pack (200+)"], icon: "fa-hashtag" },
          condition: { label: "Condition", options: ["Brand New", "New in Package", "Open Box"], icon: "fa-star" },
        }
      },
      art_supplies: {
        name: "Art Supplies",
        icon: "fa-paint-brush",
        specs: {
          type: { label: "Type", options: ["Drawing Pencil Set (Graphite)", "Charcoal Pencil Set", "Pastel (Soft)", "Pastel (Oil)", "Colored Pencil Set (Artist Grade)", "Marker Set (Alcohol Based)", "Marker Set (Water Based)", "Watercolor Set (Pan)", "Watercolor Set (Tube)", "Acrylic Paint Set", "Oil Paint Set", "Gouache Paint Set", "Canvas (Stretched)", "Canvas (Panel Board)", "Canvas Pad (Paper)", "Watercolor Paper (Pad)", "Drawing Paper (Pad)", "Sketchbook (Spiral)", "Sketchbook (Hardbound)", "Mixed Media Paper (Pad)", "Art Portfolio (Carrying Case)", "Easel (Tabletop)", "Easel (Floor Standing)", "Easel (Field/Portable)", "Paintbrush Set (Synthetic)", "Paintbrush Set (Natural Hair)", "Palette (Wood)", "Palette (Plastic)", "Palette Knife", "Paint Tray", "Brush Cleaner", "Brush Holder", "Art Mannequin", "Clay (Polymer)", "Clay (Air Dry)", "Sculpting Tools", "Printmaking Kit", "Calligraphy Set (Pen & Ink)", "Ink (Drawing)", "India Ink", "Alcohol Ink Set", "Spray Fixative (Workable)", "Spray Varnish (Gloss/Matte)", "Gesso (Primer)", "Mod Podge (Sealer)", "Art Marker (Posca)", "Paint Marker", "Fabric Paint Set"], icon: "fa-paint-brush" },
          brand: { label: "Brand", options: ["Prismacolor", "Faber-Castell", "Copic", "Winsor & Newton", "Derwent", "Staedtler", "Caran d'Ache", "Arteza", "Crayola (Artist)", "Pentel", "Tombow", "Sakura", "Kuretake", "Liquitex", "Golden", "Bob Ross", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          skill_level: { label: "Skill Level", options: ["Student/Beginner", "Hobbyist", "Professional", "Kids", "All Levels"], icon: "fa-chart-line" },
          size: { label: "Size/Dimensions", options: ["Small (5x7\")", "Medium (8x10\")", "Large (11x14\")", "Extra Large (16x20\")", "Canvas 8x10\"", "Canvas 11x14\"", "Canvas 12x16\"", "Canvas 16x20\"", "Canvas 18x24\"", "Canvas 20x24\"", "Canvas 24x30\"", "Canvas 24x36\"", "Canvas 30x40\"", "Paper Pad A5 (5.8x8.3\")", "Paper Pad A4 (8.3x11.7\")", "Paper Pad A3 (11.7x16.5\")", "Paper Pad A2 (16.5x23.4\")", "Paper Pad 9x12\"", "Paper Pad 11x14\"", "Paper Pad 14x17\"", "Paper Pad 18x24\"", "Set (12 colors)", "Set (24 colors)", "Set (36 colors)", "Set (48 colors)", "Set (72 colors)"], icon: "fa-expand" },
          quantity: { label: "Quantity/Count", options: ["Single", "3 pcs", "5 pcs", "6 pcs", "8 pcs", "10 pcs", "12 pcs", "14 pcs", "16 pcs", "18 pcs", "20 pcs", "24 pcs", "30 pcs", "36 pcs", "48 pcs", "60 pcs", "72 pcs", "120 pcs", "150 pcs", "200+ pcs"], icon: "fa-hashtag" },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Open Box", "Unused", "Partial Set"], icon: "fa-star" },
        }
      },
      presentation_tools: {
        name: "Presentation & Meeting Tools",
        icon: "fa-chalkboard-teacher",
        specs: {
          type: { label: "Type", options: ["Whiteboard (Small 2x3\")", "Whiteboard (Medium 3x4\")", "Whiteboard (Large 4x6\")", "Whiteboard (Extra Large 4x8\")", "Whiteboard (Mobile/Easel)", "Whiteboard (Glass/Black)", "Whiteboard Eraser", "Whiteboard Cleaner (Spray)", "Dry Erase Markers (Black)", "Dry Erase Markers (Assorted)", "Dry Erase Markers (Fine Tip)", "Dry Erase Markers (Bullet Tip)", "Dry Erase Markers (Chisel Tip)", "Flip Chart Pad (Sticky)", "Flip Chart Pad (Standard)", "Flip Chart Easel (Stand)", "Flip Chart Easel (Tabletop)", "Bulletin Board (Cork)", "Bulletin Board (Fabric)", "Push Pins (Tacks)", "Push Pins (Map Tacks)", "Push Pins (Plastic Head)", "Magnetic Push Pins", "Magnets (Whiteboard)", "Magnetic Tape (Roll)", "Magnetic Dry Erase Sheet", "Laser Pointer (Red)", "Laser Pointer (Green)", "Presentation Clicker (Remote)", "Presenters Remote (Wireless)", "Pointer (Extendable Hand)", "Wall Projector Screen (Manual)", "Projector Screen (Tripod)", "Projector Screen (Electric)", "Portable Projector Screen (Tabletop)", "Ceiling Mount (Projector)", "Projector Cart (Mobile)", "TV Mount (Wall)", "TV Cart (Mobile Stand)", "Document Camera (Visual Presenter)"], icon: "fa-chalkboard-teacher" },
          size: { label: "Size", options: ["Small (2x3\")", "Medium (3x4\")", "Large (4x6\")", "Extra Large (4x8\")", "Whiteboard (36x24\")", "Whiteboard (48x36\")", "Whiteboard (72x48\")", "Projector Screen (60\")", "Projector Screen (72\")", "Projector Screen (84\")", "Projector Screen (100\")", "Projector Screen (120\")", "Projector Screen (150\")", "Flip Chart (20x23\")", "Flip Chart (27x34\")"], icon: "fa-expand" },
          brand: { label: "Brand", options: ["Quartet", "Expo", "Board Dudes", "U Brands", "Logitech (Presenter)", "Kensington (Presenter)", "Elmo (Document Camera)", "Epson (Projector)", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          color: { label: "Color (Marker)", options: ["Black", "Blue", "Red", "Green", "Purple", "Orange", "Brown", "Pink", "Assorted Set", "Fluorescent", "Earth Tones"], icon: "fa-palette", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Used - Like New", "Used - Good", "Needs Assembly"], icon: "fa-star" },
        }
      },
      calendars_planners: {
        name: "Calendars & Planners",
        icon: "fa-calendar-alt",
        specs: {
          type: { label: "Type", options: ["Wall Calendar (Monthly)", "Wall Calendar (Yearly)", "Desk Calendar (Tear-off)", "Desk Calendar (Standing)", "Academic Planner (School Year)", "Weekly Planner (Sunday Start)", "Weekly Planner (Monday Start)", "Daily Planner (Hourly)", "Daily Planner (Undated)", "Yearly Planner (12 Months)", "Pocket Planner (Wallet Size)", "Digital Planner (Printable PDF)", "Planner Refill (Paper)", "Planner Stickers (Functional)", "Planner Stickers (Decorative)", "Washi Tape (Planner)", "Calendar Stickers (Dots)", "Goal Tracker (Journal)", "Habit Tracker (Journal)", "Fitness Planner (Workout Log)", "Meal Planner (Grocery List)", "Budget Planner (Finance Tracker)", "Gratitude Journal", "Bullet Journal (Notebook)", "Discbound Planner (Disc System)", "Ring Bound Planner (6 Ring)", "Spiral Bound Planner", "Leather Planner Cover (Refillable)", "Fabric Planner Cover", "Pen Loop (Planner Accessory)", "Page Marker (Planner Tabs)"], icon: "fa-calendar-alt" },
          size: { label: "Size", options: ["Pocket (3.5x5.5\")", "A6 (4.1x5.8\")", "Personal (3.8x6.8\")", "Compact (4.5x6.5\")", "A5 (5.8x8.3\")", "B6 (5x7\")", "Half Letter (5.5x8.5\")", "Letter (8.5x11\")", "A4 (8.3x11.7\")", "Wall Calendar (12x12\")", "Wall Calendar (12x24\")", "Wall Calendar (18x24\")", "Desk Calendar (6x7\")", "Desk Calendar (8x9\")"], icon: "fa-expand" },
          date_range: { label: "Date Range", options: ["Jan-Dec (12 months)", "Jul-Jun (Academic Year)", "Aug-Jul (School Year)", "12 Months (Undated)", "18 Months", "24 Months", "52 Weeks (Undated)", "365 Days (Undated)"], icon: "fa-calendar-week" },
          binding: { label: "Binding Type", options: ["Spiral Bound", "Wire-O Bound", "Stapled", "Glued (Paperback)", "Hardcover", "Discbound", "Ring Binder (6 Ring)", "Ring Binder (3 Ring)", "Loose Leaf", "Tear-off (Perforated)"], icon: "fa-book" },
          cover_material: { label: "Cover Material", options: ["Paperboard", "Cardstock", "Leather (Genuine)", "Leather (PU/Faux)", "Fabric", "Plastic", "Vinyl", "Hardcover (Cloth)", "Hardcover (Paper)"], icon: "fa-layer-group" },
          condition: { label: "Condition", options: ["Brand New", "New (Sealed)", "Like New", "Used (Written in)", "Used (Like New)"], icon: "fa-star" },
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. BOOKS & MEDIA (NEW)
  // ═══════════════════════════════════════════════════════════════════════════
  books_media: {
    id: "books_media",
    name: "Books & Media",
    icon: "📚",
    description: "Books, textbooks, magazines, audiobooks, e-readers, and educational materials",
    subcategories: {
      textbooks_academic: {
        name: "Textbooks & Academic",
        icon: "fa-book",
        specs: {
          type: { label: "Type", options: ["School Textbook (Primary)", "School Textbook (Secondary)", "University Textbook", "College Textbook", "Workbook", "Study Guide", "Revision Book", "Exam Prep (KCPE)", "Exam Prep (KCSE)", "Exam Prep (SAT)", "Exam Prep (IELTS)", "Exam Prep (TOEFL)", "Exam Prep (GMAT)", "Exam Prep (GRE)", "Exam Prep (LSAT)", "Exam Prep (MCAT)", "Teacher's Edition", "Lab Manual", "Answer Key", "Reference Book", "Encyclopedia", "Dictionary (English)", "Dictionary (Bilingual)", "Thesaurus", "Almanac", "Yearbook", "Course Pack (Custom)", "Lecture Notes", "Academic Journal", "Research Paper", "Dissertation", "Thesis"], icon: "fa-book" },
          subject: { label: "Subject", options: ["Mathematics", "English/Literature", "Kiswahili", "Science (General)", "Biology", "Chemistry", "Physics", "History", "Geography", "Civics/PP", "Religious Education (CRE/IRE/HRE)", "Business Studies", "Economics", "Accounting", "Computer Science/ICT", "Engineering", "Medicine/Nursing", "Law", "Psychology", "Sociology", "Political Science", "Philosophy", "Art", "Music", "Physical Education", "Foreign Language (French)", "Foreign Language (German)", "Foreign Language (Chinese)", "Foreign Language (Arabic)", "Foreign Language (Spanish)", "Other"], icon: "fa-graduation-cap", allowCustom: true },
          level: { label: "Education Level", options: ["Preschool (Pre-K)", "Primary (Grade 1-8)", "Secondary (Form 1-4)", "High School (Grade 9-12)", "Undergraduate (Bachelor's)", "Postgraduate (Master's)", "Doctoral (PhD)", "Professional Certification", "Vocational/Trade School", "Adult Education"], icon: "fa-chart-line" },
          condition: { label: "Condition", options: ["Brand New", "Like New", "Very Good", "Good", "Acceptable", "Highlighted/Written In", "Missing Pages (Discounted)"], icon: "fa-star" },
          edition: { label: "Edition", options: ["1st Edition", "2nd Edition", "3rd Edition", "4th Edition", "5th Edition", "6th Edition", "Latest Edition", "International Edition", "Not Specified"], icon: "fa-code-branch" },
          publisher: { label: "Publisher", options: ["Oxford University Press", "Cambridge University Press", "Pearson", "McGraw-Hill", "Cengage", "Wiley", "Penguin Random House", "Macmillan", "Springer", "Sage", "Taylor & Francis", "Elsevier", "Kenya Literature Bureau (KLB)", "Longhorn Publishers", "Moran Publishers", "Jomo Kenyatta Foundation", "East African Educational Publishers", "Other"], icon: "fa-building", allowCustom: true },
          publication_year: { label: "Publication Year", options: ["2020", "2021", "2022", "2023", "2024", "2025", "Older (2010-2019)", "Vintage (Pre-2010)"], icon: "fa-calendar" },
        }
      },
      fiction_books: {
        name: "Fiction Books",
        icon: "fa-book-open",
        specs: {
          genre: { label: "Genre", options: ["Literary Fiction", "Contemporary Fiction", "Historical Fiction", "Romance", "Romantic Comedy", "Thriller", "Psychological Thriller", "Crime/Mystery", "Horror", "Science Fiction (Sci-Fi)", "Fantasy", "High Fantasy", "Urban Fantasy", "Dystopian", "Adventure", "Action", "Young Adult (YA)", "New Adult (NA)", "Children's Fiction (Chapter Books)", "Middle Grade (8-12)", "Graphic Novel", "Manga", "Light Novel", "Fan Fiction", "Short Story Collection", "Anthology", "Classics (Literary Canon)", "Magical Realism", "Paranormal Romance", "Erotica", "Western", "Military Fiction", "Satire", "Tragedy", "Comedy", "Drama"], icon: "fa-book-open" },
          format: { label: "Format", options: ["Hardcover", "Paperback (Mass Market)", "Paperback (Trade)", "Mass Market Paperback", "Audiobook (CD)", "Audiobook (Digital Download)", "Ebook (Kindle)", "Ebook (EPUB)", "Ebook (PDF)", "Large Print", "Leather Bound", "Collector's Edition", "Boxed Set", "Special Edition", "Signed Copy", "First Edition", "Library Binding"], icon: "fa-book" },
          author: { label: "Author", options: ["Chimamanda Ngozi Adichie", "Ngũgĩ wa Thiong'o", "Yvonne Adhiambo Owuor", "Binyavanga Wainaina", "John le Carré", "Stephen King", "J.K. Rowling", "George R.R. Martin", "Dan Brown", "James Patterson", "Nora Roberts", "Nicholas Sparks", "Colleen Hoover", "Taylor Jenkins Reid", "Other"], icon: "fa-user", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New", "Like New", "Very Good", "Good", "Acceptable", "Ex-Library", "Signed Copy (Good)", "Collectible Condition"], icon: "fa-star" },
          publication_year: { label: "Publication Year", options: ["2020", "2021", "2022", "2023", "2024", "2025", "Classic (Pre-2000)", "Vintage", "First Edition"], icon: "fa-calendar" },
          language: { label: "Language", options: ["English", "Kiswahili", "French", "Arabic", "German", "Spanish", "Italian", "Chinese", "Other"], icon: "fa-language", allowCustom: true },
        }
      },
      children_books: {
        name: "Children's Books",
        icon: "fa-child",
        specs: {
          type: { label: "Type", options: ["Picture Book (Board Book)", "Picture Book (Paperback)", "Picture Book (Hardcover)", "Early Reader (Ages 4-7)", "Chapter Book (Ages 6-9)", "Middle Grade (Ages 8-12)", "Young Adult (Ages 12+)", "Activity Book (Stickers)", "Coloring Book (Kids)", "Workbook (Educational)", "Pop-up Book", "Lift-the-Flap Book", "Sound Book (Interactive)", "Touch-and-Feel Book", "Sticker Book", "Paint with Water Book", "Magnetic Book", "Finger Puppet Book", "Bath Book (Waterproof)", "Cloth Book (Soft/Fabric)", "Bedtime Story Collection", "Fairy Tale Collection", "Nursery Rhyme Book", "Bible Storybook (Kids)", "Islamic Storybook (Kids)", "African Folktale Book"], icon: "fa-child" },
          age_group: { label: "Age Group", options: ["0-6 Months", "6-12 Months", "1-2 Years", "2-3 Years", "3-4 Years", "4-5 Years", "5-6 Years", "6-7 Years", "7-8 Years", "8-9 Years", "9-10 Years", "10-11 Years", "11-12 Years", "12-13 Years", "13-14 Years", "14-15 Years", "15-16 Years"], icon: "fa-baby" },
          reading_level: { label: "Reading Level", options: ["Pre-reader (0-4)", "Beginner (4-6)", "Emergent (6-7)", "Proficient (7-9)", "Fluent (9-12)", "Advanced (12+)"], icon: "fa-chart-line" },
          condition: { label: "Condition", options: ["Brand New", "Like New", "Very Good", "Good", "Acceptable (Minor wear)", "Missing Pages", "Damaged (Discounted)"], icon: "fa-star" },
          author: { label: "Author/Illustrator", options: ["Dr. Seuss", "Eric Carle", "Julia Donaldson", "Mo Willems", "Roald Dahl", "J.K. Rowling", "Enid Blyton", "Beatrix Potter", "Margaret Wise Brown", "Mercer Mayer", "Stan & Jan Berenstain", "Laura Numeroff", "African Authors", "Other"], icon: "fa-user", allowCustom: true },
        }
      },
      religious_books: {
        name: "Religious & Spiritual Books",
        icon: "fa-pray",
        specs: {
          type: { label: "Type", options: ["Bible (KJV)", "Bible (NIV)", "Bible (NKJV)", "Bible (ESV)", "Bible (NLT)", "Bible (Amharic)", "Bible (Kiswahili)", "Bible (Study Bible)", "Bible (Large Print)", "Bible (Leather Bound)", "Bible (Compact/Pocket)", "Bible (Teen/Student)", "Bible (Children's)", "Quran (Arabic)", "Quran (Translation - English)", "Quran (Translation - Kiswahili)", "Quran (Tajweed)", "Quran (Large Print)", "Quran (Pocket Size)", "Hadith Collection", "Tafsir (Quran Commentary)", "Devotional (Daily Bread)", "Devotional (Women)", "Devotional (Men)", "Devotional (Teen)", "Prayer Book (Christian)", "Prayer Book (Islamic - Du'a)", "Hymnal (Christian Songs)", "Worship Book (Praise & Worship)", "Religious Commentary", "Theology Book", "Apologetics", "Christian Living", "Islamic Studies (Fiqh)", "Islamic History (Seerah)", "Biblical History", "Religious Fiction", "Children's Bible Storybook", "Children's Quran Storybook"], icon: "fa-pray" },
          religion: { label: "Religion", options: ["Christianity (Protestant)", "Christianity (Catholic)", "Christianity (Orthodox)", "Islam (Sunni)", "Islam (Shia)", "Judaism", "Hinduism", "Buddhism", "Sikhism", "Traditional African Religion", "Other"], icon: "fa-church" },
          translation: { label: "Translation/Language", options: ["English (KJV)", "English (NIV)", "English (ESV)", "Kiswahili (Union Version)", "Kiswahili (Tafsiri)", "Arabic", "Amharic", "French", "Other"], icon: "fa-language", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New", "Like New", "Very Good", "Good", "Acceptable", "Family Heirloom", "Gift Edition"], icon: "fa-star" },
          features: { label: "Special Features", options: ["Red Letter Edition", "Study Notes", "Cross References", "Maps", "Concordance", "Daily Devotional (365 Days)", "Ribbon Marker", "Gilt Edges", "Thumb Indexed", "Magnetic Closure", "Zipper Case", "None"], icon: "fa-star", multiple: true },
        }
      },
      magazines: {
        name: "Magazines & Newspapers",
        icon: "fa-newspaper",
        specs: {
          type: { label: "Type", options: ["News Magazine", "Business Magazine", "Tech Magazine", "Fashion Magazine", "Lifestyle Magazine", "Health & Fitness Magazine", "Sports Magazine", "Entertainment Magazine", "Celebrity Gossip", "Home & Garden Magazine", "Travel Magazine", "Food & Cooking Magazine", "Parenting Magazine", "Science Magazine", "Nature Magazine", "History Magazine", "Art & Design Magazine", "Photography Magazine", "Gaming Magazine", "Comic Magazine (Monthly)", "Manga Magazine (Weekly)", "Newspaper (Daily)", "Newspaper (Weekly)", "Newspaper (Sunday Edition)", "Newspaper (Business Daily)", "Newspaper (Local/County)"], icon: "fa-newspaper" },
          publication: { label: "Publication", options: ["Daily Nation", "The Standard", "The Star", "Business Daily", "Taifa Leo", "The East African", "The Economist", "Time Magazine", "Forbes", "Fortune", "Bloomberg Businessweek", "Wired", "TechCrunch (Print)", "Vogue", "Harper's Bazaar", "Cosmopolitan", "Elle", "GQ", "Men's Health", "Women's Health", "Runner's World", "Sports Illustrated", "ESPN Magazine", "National Geographic", "Popular Science", "Scientific American", "New Scientist", "Better Homes & Gardens", "Good Housekeeping", "Food Network Magazine", "Bon Appétit", "Parents Magazine", "The New Yorker", "Rolling Stone", "People Magazine", "US Weekly", "OK! Magazine", "Other"], icon: "fa-building", allowCustom: true },
          issue: { label: "Issue/Date", options: ["Current Issue", "Previous Month", "2 Months Old", "3-6 Months Old", "6-12 Months Old", "Over 1 Year Old (Back Issue)", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December", "Special Edition", "Collector's Edition"], icon: "fa-calendar" },
          condition: { label: "Condition", options: ["Brand New (Sealed)", "Like New", "Good", "Read Once", "Multiple Reads", "Missing Pages/Cutout"], icon: "fa-star" },
          subscription: { label: "Subscription", options: ["Single Issue", "3-Month Subscription", "6-Month Subscription", "12-Month Subscription", "Gift Subscription"], icon: "fa-calendar-alt" },
        }
      },
      e_readers: {
        name: "E-Readers & Accessories",
        icon: "fa-tablet-alt",
        specs: {
          type: { label: "Type", options: ["E-Reader (Amazon Kindle)", "E-Reader (Kobo)", "E-Reader (Nook)", "E-Reader (PocketBook)", "E-Reader (Tolino)", "E-Reader (Android Tablet)", "E-Reader Case (Fabric)", "E-Reader Case (Leather)", "E-Reader Screen Protector", "E-Reader Stand (Tabletop)", "E-Reader Stand (Bed/Mount)", "E-Reader Page Turner (Remote)", "E-Reader Charger (USB)", "E-Reader Stylus (for Note-taking)", "E-Reader Glove (Touchscreen)", "E-Reader Light (Clip-on)", "E-Reader Power Bank (Case)", "E-Reader Sleeve (Pouch)", "E-Reader Pop Socket (Grip)", "E-Reader Cleaning Kit", "E-Reader Decal/Skin", "E-Reader Charging Dock"], icon: "fa-tablet-alt" },
          brand: { label: "Brand", options: ["Amazon Kindle", "Kobo", "Barnes & Noble Nook", "PocketBook", "Tolino", "Onyx Boox", "Remarkable", "Generic/Unbranded"], icon: "fa-tag", allowCustom: true },
          model: { label: "Model", options: ["Kindle Basic", "Kindle Paperwhite", "Kindle Oasis", "Kindle Scribe", "Kindle Kids Edition", "Kobo Clara", "Kobo Libra", "Kobo Sage", "Kobo Elipsa", "Nook GlowLight", "PocketBook Touch", "Onyx Boox Note", "Remarkable 2", "Other"], icon: "fa-microchip", allowCustom: true },
          storage: { label: "Storage (E-Reader)", options: ["8GB", "16GB", "32GB", "64GB", "128GB", "256GB", "512GB"], icon: "fa-hdd" },
          screen_size: { label: "Screen Size", options: ["6\"", "6.8\"", "7\"", "7.8\"", "8\"", "10.3\"", "13.3\""], icon: "fa-expand" },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Open Box", "Used - Like New", "Used - Good", "Used - Fair", "Refurbished (Certified)"], icon: "fa-star" },
          connectivity: { label: "Connectivity", options: ["Wi-Fi Only", "Wi-Fi + Cellular (4G)", "Wi-Fi + Cellular (5G)", "Bluetooth (Audio)"], icon: "fa-wifi" },
        }
      },
      comics_graphic_novels: {
        name: "Comics & Graphic Novels",
        icon: "fa-comic",
        specs: {
          type: { label: "Type", options: ["Comic Book (Single Issue)", "Graphic Novel (Trade Paperback)", "Comic Compendium (Omnibus)", "Manga (Volume)", "Manga (Box Set)", "Webtoon (Print Collection)", "Manhwa (Korean Comic)", "Manhua (Chinese Comic)", "European Comic (BD)", "Underground Comic", "Zine (Comic)", "Comic Strip Collection (Newspaper)", "Art Book (Comic)", "Comic Annual (Yearly)"], icon: "fa-comic" },
          publisher: { label: "Publisher", options: ["DC Comics", "Marvel Comics", "Image Comics", "Dark Horse Comics", "IDW Publishing", "Boom! Studios", "Dynamite Entertainment", "Valiant Comics", "Viz Media", "Kodansha Comics", "Yen Press", "Seven Seas Entertainment", "Vertical Comics", "AfterShock Comics", "Abstract Studios", "Fantagraphics", "Drawn & Quarterly", "Humanoids", "Other"], icon: "fa-building", allowCustom: true },
          series: { label: "Series/Franchise", options: ["Batman", "Superman", "Wonder Woman", "Spider-Man", "Avengers", "X-Men", "Guardians of the Galaxy", "The Walking Dead", "Saga", "Invincible", "Sandman", "Watchmen", "Naruto", "One Piece", "Dragon Ball", "Attack on Titan", "Demon Slayer", "My Hero Academia", "Jujutsu Kaisen", "Chainsaw Man", "Other"], icon: "fa-bookmark", allowCustom: true },
          issue_number: { label: "Issue/Volume Number", options: ["Issue #1", "Vol. 1", "Vol. 2", "Vol. 3", "Vol. 4", "Vol. 5", "Vol. 6", "Vol. 7", "Vol. 8", "Vol. 9", "Vol. 10+", "Collection (Vol. 1-3)", "Box Set (Vol. 1-10)", "Annual #1"], icon: "fa-hashtag", allowCustom: true },
          format: { label: "Format", options: ["Single Issue (Comic Book)", "Trade Paperback (TPB)", "Hardcover (HC)", "Omnibus (Hardcover)", "Compendium (Paperback)", "Box Set (Multiple Volumes)", "Variant Cover (Rare)", "Signed Edition", "Limited Edition (Numbered)", "Library Edition (Oversized)"], icon: "fa-book" },
          condition: { label: "Condition", options: ["Mint (Sealed)", "Near Mint (NM)", "Very Fine (VF)", "Fine (F)", "Very Good (VG)", "Good (G)", "Fair (FR)", "Poor (P)", "Reader Copy", "CGC Graded", "Raw/Unrated"], icon: "fa-star" },
        }
      },
      audiobooks: {
        name: "Audiobooks",
        icon: "fa-headphones",
        specs: {
          type: { label: "Format", options: ["CD (Audiobook)", "MP3 CD", "Audible (Digital Code)", "Audible (Gift Membership)", "Digital Download (MP3)", "Digital Download (M4B)", "Playaway (Pre-loaded Player)", "Cassette Tape (Vintage)", "Vinyl (Spoken Word)"], icon: "fa-headphones" },
          narrator: { label: "Narrator (if known)", options: ["Full Cast", "Single Narrator", "Jim Dale", "Stephen Fry", "Scott Brick", "Bahni Turpin", "Kevin R. Free", "Robin Miles", "Michael Kramer", "Kate Reading", "R.C. Bray", "Ray Porter", "Other"], icon: "fa-user", allowCustom: true },
          length: { label: "Length", options: ["Under 3 hours", "3-5 hours", "5-8 hours", "8-10 hours", "10-12 hours", "12-15 hours", "15-20 hours", "20-30 hours", "30-40 hours", "40+ hours"], icon: "fa-clock" },
          abridged: { label: "Abridged/Unabridged", options: ["Unabridged (Full)", "Abridged (Condensed)", "Dramatized (Full Cast)"], icon: "fa-compress" },
          condition: { label: "Condition", options: ["Brand New (Sealed)", "Like New", "Good (Minor wear)", "Scratched (CDs)", "Digital Code (Unused)", "Digital Code (Used - Valid)"], icon: "fa-star" },
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. CONSTRUCTION & HARDWARE (NEW)
  // ═══════════════════════════════════════════════════════════════════════════
  construction: {
    id: "construction",
    name: "Construction & Hardware",
    icon: "🔨",
    description: "Building materials, power tools, plumbing, electrical, paint, and safety equipment",
    subcategories: {
      building_materials: {
        name: "Building Materials",
        icon: "fa-hard-hat",
        specs: {
          type: { label: "Material Type", options: ["Cement (Portland)", "Cement (Simba/Bamburi)", "TMT Steel Bars (D8/D10/D12)", "Foundation Stones", "Iron Sheets (Box/G30/G32)", "Wire Mesh", "Timber (Cypress/Plywood)", "Bricks (Interlocking)", "Roof Nails", "Gypsum Screws"], icon: "fa-hard-hat" },
          unit: { label: "Unit", options: ["Per Bag (50kg)", "Per Tonne", "Per Piece", "Per Sheet", "Per Meter", "Per Kg"], icon: "fa-balance-scale" },
          brand: { label: "Brand", options: ["Bamburi", "Simba", "Mache", "Devki Steel", "MRM", "Generic"], icon: "fa-tag", allowCustom: true },
        }
      },
      masonry_supplies: {
        name: "Masonry & Finishing",
        icon: "fa-trowel",
        specs: {
          type: { label: "Type", options: ["Waterproofing Compound", "Tile Adhesive", "Grout", "Wall Filler", "Joint Compound", "Gypsum Board"], icon: "fa-trowel" },
          brand: { label: "Brand", options: ["Bamburi", "Simba", "Sika", "Sajen", "Generic"], icon: "fa-tag", allowCustom: true },
        }
      },
      glass_glazing: {
        name: "Glass & Glazing",
        icon: "fa-window-maximize",
        specs: {
          type: { label: "Type", options: ["Tinted Window Glass", "Clear Shower Screen", "Mirror Glass", "Reflective Glass", "Aluminum Casement", "Window Latch"], icon: "fa-window-maximize" },
          thickness: { label: "Thickness", options: ["3mm", "4mm", "5mm", "6mm", "8mm", "10mm", "12mm"], icon: "fa-ruler-combined" },
          condition: { label: "Condition", options: ["Brand New", "Custom Cut"], icon: "fa-star" },
        }
      },
      paint_supplies: {
        name: "Paint & Supplies",
        icon: "fa-paint-roller",
        specs: {
          type: { label: "Product Type", options: ["Paint (Emulsion - Interior)", "Paint (Emulsion - Exterior)", "Paint (Gloss)", "Paint (Satinwood)", "Paint (Matt)", "Paint (Silk)", "Paint (Textured)", "Paint (Ceiling White)", "Paint (Floor Paint)", "Paint (Metal Paint)", "Paint (Rust-Oleum)", "Paint (Spray Paint)", "Paint (Chalk Paint)", "Paint (Masonry Paint)", "Paint (Roof Paint)", "Paint (Waterproofing)", "Paint Primer (Wall)", "Paint Primer (Metal)", "Paint Primer (Wood)", "Paint Undercoat", "Paint Thinner", "Paint Brush (1 inch)", "Paint Brush (2 inch)", "Paint Brush (3 inch)", "Paint Brush (4 inch)", "Paint Brush (Angle)", "Paint Brush (Flat)", "Paint Roller (4 inch)", "Paint Roller (7 inch)", "Paint Roller (9 inch)", "Paint Roller (12 inch)", "Roller Cover (Short Pile)", "Roller Cover (Medium Pile)", "Roller Cover (Long Pile)", "Roller Tray", "Roller Frame", "Paint Sprayer (Electric)", "Paint Sprayer (Airless)", "Paint Sprayer (HVLP)", "Paint Masking Tape", "Painters Tape (Blue)", "Painters Tape (Green)", "Paint Kettle", "Paint Scraper", "Paint Stirrer", "Drop Cloth (Canvas)", "Drop Cloth (Plastic)", "Paint Tray Liners", "Paintbrush Cleaner", "Paint Remover (Solvent)", "Paint Stripper (Chemical)"], icon: "fa-paint-roller" },
          brand: { label: "Brand", options: ["Crown Paints", "Basco Paints", "Sadolin", "Dulux", "Kansai Plascon", "Rainbow Paints", "Nippon Paint", "Taichi Paints", "RPM", "Other"], icon: "fa-tag", allowCustom: true },
          color: { label: "Color", options: ["White", "Off-White", "Cream", "Magnolia", "Ivory", "Beige", "Grey", "Light Grey", "Dark Grey", "Black", "Red", "Burgundy", "Blue", "Navy Blue", "Light Blue", "Green", "Forest Green", "Sage Green", "Yellow", "Orange", "Brown", "Chocolate", "Purple", "Lavender", "Pink", "Custom Color (Tinted)"], icon: "fa-palette", allowCustom: true },
          volume: { label: "Volume", options: ["100ml (Sample)", "250ml", "500ml", "1L", "2L", "3L", "4L", "5L", "10L", "15L", "20L", "25L", "50L", "200L (Barrel)"], icon: "fa-flask" },
          finish: { label: "Finish", options: ["Matt (Flat)", "Soft Sheen", "Eggshell", "Satin", "Silk", "Semi-Gloss", "Gloss (High Sheen)", "Textured", "Metallic"], icon: "fa-star" },
          coverage: { label: "Coverage (m²/L)", options: ["8 m²/L", "10 m²/L", "12 m²/L", "14 m²/L", "16 m²/L", "18 m²/L", "20 m²/L"], icon: "fa-chart-line" },
          condition: { label: "Condition", options: ["Brand New (Sealed)", "New (Unopened)", "Tinted (Mixed)"], icon: "fa-star" },
        }
      },
      plumbing: {
        name: "Plumbing Supplies",
        icon: "fa-wrench",
        specs: {
          type: { label: "Type", options: ["Pipe (PVC - Pressure)", "Pipe (PVC - Sewer)", "Pipe (Copper)", "Pipe (PEX)", "Pipe (GI - Galvanized Iron)", "Pipe (HDPE)", "Pipe Fitting (Elbow)", "Pipe Fitting (Tee)", "Pipe Fitting (Coupling)", "Pipe Fitting (Reducer)", "Pipe Fitting (Union)", "Pipe Fitting (Cap)", "Pipe Fitting (Plug)", "Valve (Gate Valve)", "Valve (Ball Valve)", "Valve (Globe Valve)", "Valve (Check Valve)", "Valve (Float Valve)", "Valve (Angle Valve)", "Valve (Pressure Reducing)", "Tap (Kitchen Mixer)", "Tap (Basin Mixer)", "Tap (Bib Tap)", "Tap (Pillar Tap)", "Tap (Shower Mixer)", "Tap (Utility/Outlet)", "Tap (Self-closing)", "Shower Head (Rain)", "Shower Head (Handheld)", "Shower Head (Wall Mount)", "Shower Arm", "Shower Hose", "Shower Rail", "Shower Screen/Door", "Water Heater (Electric - Tank)", "Water Heater (Electric - Tankless)", "Water Heater (Solar)", "Water Heater (Gas - Instant)", "Water Heater (Gas - Storage)", "Water Heater Accessories (Anode Rod)", "Water Heater Thermostat", "Heating Element", "Toilet (WC - Close Coupled)", "Toilet (WC - Back to Wall)", "Toilet (WC - Wall Hung)", "Toilet Seat (Soft Close)", "Toilet Flush Valve", "Toilet Fill Valve", "Toilet Cistern (Concealed)", "Toilet Connector (Flexi Hose)", "Wash Basin (Ceramic)", "Wash Basin (Pedestal)", "Wash Basin (Wall Hung)", "Wash Basin (Countertop)", "Basin Waste (Pop-up)", "Basin Waste (Plug)", "Basin Trap (Bottle Trap)", "Basin Trap (P-Trap)", "Sink (Stainless Steel - Single Bowl)", "Sink (Stainless Steel - Double Bowl)", "Sink (Composite - Granite)", "Kitchen Sink Tap (Pull-out)", "Kitchen Sink Waste", "Kitchen Sink Trap", "Bathtub (Acrylic)", "Bathtub (Cast Iron)", "Bathtub (Freestanding)", "Bathtub (Corner)", "Bathtub Waste & Overflow", "Floor Drain (Gully Trap)", "Water Meter (Domestic)", "Pressure Gauge", "Pipe Thread Seal Tape (PTFE)", "Pipe Thread Sealant (Liquid)", "Plumber's Putty", "Pipe Cutter", "Pipe Wrench", "Basin Wrench", "Plunger", "Drain Auger (Snake)"], icon: "fa-wrench" },
          material: { label: "Material", options: ["PVC (Polyvinyl Chloride)", "uPVC (Unplasticized PVC)", "CPVC (Chlorinated PVC)", "PEX (Cross-linked Polyethylene)", "HDPE (High Density Polyethylene)", "Copper", "GI (Galvanized Iron)", "Stainless Steel", "Brass", "Bronze", "Cast Iron", "Ceramic", "Acrylic", "Fiberglass", "Tempered Glass"], icon: "fa-layer-group" },
          size: { label: "Size/Diameter", options: ["½ inch (15mm)", "¾ inch (20mm)", "1 inch (25mm)", "1.25 inch (32mm)", "1.5 inch (40mm)", "2 inch (50mm)", "3 inch (80mm)", "4 inch (100mm)", "6 inch (150mm)", "8 inch (200mm)", "10 inch (250mm)", "12 inch (300mm)"], icon: "fa-ruler" },
          pressure_rating: { label: "Pressure Rating", options: ["Class 150 (Low)", "Class 200", "Class 300", "PN10", "PN16", "PN20", "PN25", "Schedule 40", "Schedule 80", "Not Rated"], icon: "fa-tachometer-alt" },
          brand: { label: "Brand", options: ["Ajay", "Kari", "Morganite", "Nibco", "Uponor", "SharkBite", "Grohe", "Hansgrohe", "American Standard", "Toto", "Vitra", "Duravit", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Open Box", "Used - Like New", "Used - Good", "Salvaged"], icon: "fa-star" },
        }
      },
      electrical: {
        name: "Electrical Supplies",
        icon: "fa-bolt",
        specs: {
          type: { label: "Type", options: ["Wire (Cable - Single Core)", "Wire (Cable - Twin Core)", "Wire (Cable - 3 Core)", "Wire (Cable - Flexible)", "Wire (Earth Cable)", "Wire (Armoured Cable/SWA)", "Wire (Coaxial Cable)", "Wire (Speaker Wire)", "Wire (Ethernet Cable/Cat6)", "Wire (Telephone Cable)", "Conduit (PVC Flexible)", "Conduit (PVC Rigid)", "Conduit (Metal - Galvanized)", "Conduit Fittings (Bends)", "Conduit Fittings (Couplers)", "Conduit Fittings (Boxes)", "Switch (Light - 1 Gang)", "Switch (Light - 2 Gang)", "Switch (Light - 3 Gang)", "Switch (Light - Intermediate)", "Switch (Light - Dimmer)", "Switch (Light - Touch)", "Socket (Outlet - 13A Single)", "Socket (Outlet - 13A Double)", "Socket (Outlet - USB Built-in)", "Socket (Outlet - Universal)", "Socket (Outlet - Industrial 16A)", "Socket (Outlet - Industrial 32A)", "Socket (Outlet - TV/FM)", "Socket (Outlet - RJ45/Data)", "Socket (Outlet - Telephone)", "Switch Socket (Combination Unit)", "Consumer Unit (Fuse Box - 4 Way)", "Consumer Unit (Fuse Box - 8 Way)", "Consumer Unit (Fuse Box - 12 Way)", "Consumer Unit (Garage/Shed Unit)", "MCB (Miniature Circuit Breaker)", "RCD (Residual Current Device)", "RCBO (Combined RCD/MCB)", "Main Switch (Isolator)", "Distribution Board (DB)", "Meter Box (Single Phase)", "Meter Box (Three Phase)", "Light Bulb (LED - E27)", "Light Bulb (LED - B22)", "Light Bulb (LED - GU10)", "Light Bulb (LED - Filament)", "Light Bulb (Fluorescent - Tube)", "Light Bulb (CFL - Energy Saver)", "Light Bulb (Halogen)", "Light Fitting (Ceiling Rose)", "Light Fitting (Pendant Set)", "Light Fitting (Batten Holder)", "Light Fitting (Downlight)", "Light Fitting (Panel Light)", "Light Fitting (Floodlight)", "Light Fitting (Security Light - PIR)", "Light Fitting (Strip Light - LED)", "Junction Box (Circular)", "Junction Box (Waterproof)", "Cable Gland (Plastic)", "Cable Gland (Metal)", "Cable Tie (Nylon Zip Tie)", "Cable Clip (Plastic)", "Cable Ladder (Tray)", "Cable Trunking (PVC)", "Insulation Tape (Electrical)", "Wire Connector (Crimp)", "Wire Connector (Lever Nut)", "Wire Connector (Wago)", "Screwdriver Set (Electrical)", "Voltage Tester (Pen)", "Multimeter (Digital)", "Clamp Meter (Current)", "Soldering Iron", "Heat Shrink Tubing", "Flex (Flexible Cord - 2 Core)", "Flex (Flexible Cord - 3 Core)", "Extension Cord (Power Strip - 1m)", "Extension Cord (Power Strip - 3m)", "Extension Cord (Power Strip - 5m)", "Extension Cord (Heavy Duty - 10m)", "Plug Top (13A - UK Standard)", "Plug Top (Round Pin - SA)"], icon: "fa-bolt" },
          brand: { label: "Brand", options: ["Legrand", "Schneider Electric", "Hager", "MK Electric", "Crabtree", "Siemens", "ABB", "Philips (Lighting)", "Osram (Lighting)", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          voltage_rating: { label: "Voltage Rating", options: ["230V (Single Phase)", "240V (Single Phase)", "415V (Three Phase)", "Low Voltage (12V)", "Low Voltage (24V)", "Extra Low Voltage (5V)"], icon: "fa-bolt" },
          current_rating: { label: "Current Rating (Amps)", options: ["5A", "6A", "10A", "13A", "16A", "20A", "25A", "32A", "40A", "45A", "50A", "63A", "80A", "100A", "125A"], icon: "fa-chart-line" },
          wire_gauge: { label: "Wire Gauge (mm²)", options: ["0.5mm²", "0.75mm²", "1.0mm²", "1.5mm²", "2.5mm²", "4mm²", "6mm²", "10mm²", "16mm²", "25mm²", "35mm²", "50mm²", "70mm²", "95mm²", "120mm²"], icon: "fa-ruler" },
          certification: { label: "Certification", options: ["KEBS (Kenya Bureau of Standards)", "BS (British Standard)", "IEC (International)", "ASTA", "SEMKO", "NEMKO", "CCC", "CE", "UL", "ETL"], icon: "fa-certificate" },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Surplus", "Used - Good", "Used - For Parts"], icon: "fa-star" },
        }
      },
      doors_windows: {
        name: "Doors & Windows",
        icon: "fa-door-open",
        specs: {
          type: { label: "Type", options: ["Door (Interior - Flush)", "Door (Interior - Paneled)", "Door (Exterior - Solid Wood)", "Door (Exterior - Steel)", "Door (Exterior - Fiberglass)", "Door (French Door)", "Door (Sliding Door)", "Door (Bi-fold Door)", "Door (Glass Door - Frameless)", "Door (Glass Door - Aluminum Framed)", "Door (Garage Door - Roll-up)", "Door (Garage Door - Sectional)", "Door (Security Door - Grille)", "Door (Security Door - Bulletproof)", "Door Frame (Wooden)", "Door Frame (Metal)", "Door Frame (PVC)", "Door Frame (Aluminum)", "Door Handle (Lever)", "Door Handle (Knob)", "Door Handle (Pull Bar)", "Door Lock (Mortise Lock)", "Door Lock (Cylinder Lock)", "Door Lock (Digital/Smart Lock)", "Door Lock (Padlock - Heavy Duty)", "Door Lock (Padlock - Combination)", "Door Hinge (Butt Hinge)", "Door Hinge (Continuous Hinge)", "Door Closer (Hydraulic)", "Door Stopper (Floor Mount)", "Door Stopper (Wall Mount)", "Door Sweep (Weatherstrip)", "Door Viewer (Peephole)", "Door Chain (Security Chain)", "Window (Sliding - Aluminum)", "Window (Casement - Aluminum)", "Window (Louver - Glass)", "Window (Fixed Pane)", "Window (Awning)", "Window (Tilt & Turn)", "Window (Bay Window)", "Window Frame (uPVC)", "Window Frame (Aluminum)", "Window Frame (Wood)", "Window Glass (Tempered/Safety)", "Window Glass (Double Glazed)", "Window Glass (Tinted)", "Window Glass (Frosted)", "Window Handle (Espagnolette)", "Window Lock (Casement Latch)", "Window Stay (Friction Hinge)", "Window Screen (Insect Mesh)", "Window Blind (Roller Blind)", "Window Blind (Venetian Blind)", "Window Curtain (Rod & Brackets)", "Window Sill (Marble)", "Window Sill (Wood)", "Window Sill (PVC)"], icon: "fa-door-open" },
          material: { label: "Material", options: ["Wood (Solid Timber)", "Wood (Engineered)", "MDF (Medium Density Fiberboard)", "Steel (Powder Coated)", "Aluminum (Powder Coated)", "Aluminum (Anodized)", "uPVC (Unplasticized PVC)", "Fiberglass", "Glass (Tempered)", "Glass (Laminated)", "Composite (Wood+Aluminum)"], icon: "fa-layer-group" },
          size: { label: "Size (Width x Height)", options: ["30\"x78\" (Standard Bedroom)", "30\"x80\" (Standard Exterior)", "32\"x80\" (Wider Door)", "36\"x80\" (ADA/Wheelchair)", "Door 2'6\"x6'8\"", "Door 2'8\"x6'8\"", "Door 3'0\"x6'8\"", "Sliding Door (5'x7\")", "Sliding Door (6'x7\")", "Sliding Door (8'x7\")", "French Door (5'x6'8\")", "French Door (6'x6'8\")", "Window (24\"x36\")", "Window (24\"x48\")", "Window (30\"x36\")", "Window (30\"x48\")", "Window (36\"x48\")", "Window (48\"x48\")", "Custom Size"], icon: "fa-expand", allowCustom: true },
          color: { label: "Color/Finish", options: ["Natural Wood (Stained)", "White (Primed)", "White (Gloss)", "Black", "Grey", "Brown", "Walnut", "Mahogany", "Oak", "Aluminum (Silver)", "Aluminum (Dark Bronze)", "Aluminum (Black)", "Aluminum (White)"], icon: "fa-palette", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New", "New (Unfinished)", "Used - Like New", "Used - Good", "Reclaimed/Salvaged", "Needs Refinishing"], icon: "fa-star" },
        }
      },
      safety_equipment: {
        name: "Safety Equipment (PPE)",
        icon: "fa-shield-alt",
        specs: {
          type: { label: "Type", options: ["Hard Hat (Helmet - Full Brim)", "Hard Hat (Helmet - Cap Style)", "Hard Hat (Vented)", "Safety Glasses (Clear Lens)", "Safety Glasses (Tinted/Sunglasses)", "Safety Goggles (Anti-fog)", "Safety Goggles (Vented)", "Face Shield (Full Face)", "Face Shield (Mesh)", "Ear Plugs (Foam - Disposable)", "Ear Plugs (Reusable - Corded)", "Ear Muffs (Headband)", "Ear Muffs (Helmet Attached)", "High Visibility Vest (Class 2)", "High Visibility Vest (Class 3)", "High Visibility Jacket", "High Visibility T-Shirt", "High Visibility Pants", "Coverall (Disposable - Tyvek)", "Coverall (Flame Resistant)", "Coverall (Chemical Resistant)", "Safety Vest (Traffic Marshal)", "Respirator Mask (N95)", "Respirator Mask (FFP2)", "Respirator Mask (FFP3)", "Respirator (Half Face - Reusable)", "Respirator (Full Face - Reusable)", "Respirator Filters (P100)", "Respirator Filters (Gas - Organic Vapor)", "Dust Mask (General Purpose)", "Welding Helmet (Auto-darkening)", "Welding Helmet (Passive Shade)", "Welding Glasses (Shade 5)", "Welding Jacket (Leather)", "Welding Jacket (Flame Resistant Cotton)", "Welding Gloves (Leather)", "Welding Apron (Leather)", "Welding Blanket (Fiberglass)", "Safety Gloves (Cut Resistant - Level 5)", "Safety Gloves (Cut Resistant - Level 3)", "Safety Gloves (Mechanical/Riggers)", "Safety Gloves (Nitrile Coated)", "Safety Gloves (Latex Coated)", "Safety Gloves (PVC Coated - Chemical)", "Safety Gloves (Heat Resistant)", "Safety Gloves (Electrician - Rubber Insulating)", "Chemical Gloves (Butyl Rubber)", "Chemical Gloves (Neoprene)", "Chemical Gloves (Nitrile)", "Safety Boots (Steel Toe Cap)", "Safety Boots (Composite Toe)", "Safety Boots (Puncture Resistant Midsole)", "Safety Boots (Electrical Hazard Rated)", "Safety Boots (Slip Resistant)", "Safety Shoes (Sneaker Style)", "Safety Gumboots (PVC - Steel Toe)", "Safety Gumboots (Chemical Resistant)", "Knee Pads (Construction - Hard Shell)", "Knee Pads (Foam - Soft)", "Elbow Pads (Construction)", "Fall Arrest Harness (Full Body)", "Fall Arrest Harness (Chest Harness)", "Safety Lanyard (Shock Absorbing)", "Safety Lanyard (Positioning)", "Retractable Lifeline (Fall Arrester)", "Safety Rope (Static - Kernmantle)", "Safety Rope (Dynamic)", "Carabiner (Screw Gate)", "Carabiner (Auto-locking)", "Anchorage Connector (Strap)", "Anchorage Connector (Beam Clamp)", "Safety Net (Debris Netting)", "Safety Barrier (Caution Tape)", "Traffic Cone (Safety Cone)", "Warning Sign (Danger - Construction)", "Warning Sign (Caution - Wet Floor)", "First Aid Kit (Construction Site)", "Eye Wash Station (Portable)", "Safety Shower (Portable)", "Fire Extinguisher (ABC Powder)", "Fire Extinguisher (CO2)", "Fire Extinguisher (Foam)", "Fire Blanket", "Gas Detector (Portable - Single Gas)", "Gas Detector (Portable - Multi Gas)", "Safety Torch (Explosion Proof)", "Safety Whistle", "Safety Glove Box (Dispenser)", "Safety Glove Box (Wall Mount)"], icon: "fa-shield-alt" },
          certification: { label: "Certification", options: ["ANSI (American)", "OSHA (US)", "EN (European)", "ISO (International)", "CE (EU)", "KEBS (Kenya)", "SANS (South Africa)", "ASTM (Testing Standard)", "NFPA (Fire)", "Not Certified"], icon: "fa-certificate" },
          size: { label: "Size", options: ["XS", "S", "M", "L", "XL", "XXL", "One Size", "Adjustable", "Small (Hat 6-7)", "Medium (Hat 7-7.5)", "Large (Hat 7.5-8)", "Boots (EU 36-46)", "Boots (EU 38-47)", "Gloves S", "Gloves M", "Gloves L", "Gloves XL", "Gloves (Unisex Sizing)"], icon: "fa-ruler" },
          material: { label: "Material", options: ["Polycarbonate", "ABS Plastic", "HDPE (High Density Polyethylene)", "Nylon (Webbing)", "Polyester (Webbing)", "Leather (Cowhide)", "Leather (Pigskin)", "Kevlar", "Nomex (Flame Resistant)", "Cotton (Flame Resistant)", "Nitrile (Coating)", "PVC (Coating)", "Latex (Coating)", "Steel (Toe Cap)", "Composite (Non-metallic Toe)", "Rubber (Gumboots)", "PU (Polyurethane Sole)"], icon: "fa-layer-group" },
          condition: { label: "Condition", options: ["Brand New", "New with Tags", "Used - Like New", "Used - Good", "Expired (Discounted for non-critical use)"], icon: "fa-star" },
        }
      },
      power_tools: {
        name: "Power Tools (Construction)",
        icon: "fa-microchip",
        specs: {
          type: { label: "Tool Type", options: ["Drill (Hammer Drill - Corded)", "Drill (Hammer Drill - Cordless)", "Impact Driver (Cordless)", "Rotary Hammer (SDS Plus)", "Rotary Hammer (SDS Max)", "Angle Grinder (4\"/100mm)", "Angle Grinder (4.5\"/115mm)", "Angle Grinder (5\"/125mm)", "Angle Grinder (7\"/180mm)", "Angle Grinder (9\"/230mm)", "Cut-Off Saw (Metal - Chop Saw)", "Cut-Off Saw (Tile - Wet Saw)", "Circular Saw (7.25\"/185mm)", "Circular Saw (6.5\"/165mm)", "Track Saw (Plunge Cut)", "Jigsaw (Variable Speed)", "Reciprocating Saw (Sawzall)", "Band Saw (Portable)", "Table Saw (Contractor)", "Miter Saw (Compound - 10\")", "Miter Saw (Compound - 12\")", "Miter Saw (Sliding)", "Planer (Thicknesser)", "Planer (Handheld Electric)", "Jointer (Planer)", "Router (Fixed Base)", "Router (Plunge Base)", "Router (Trim Router)", "Sander (Belt Sander)", "Sander (Orbital/Random Orbit)", "Sander (Detail Sander)", "Nail Gun (Framing - Pneumatic)", "Nail Gun (Finish - Pneumatic)", "Nail Gun (Brad Nailer)", "Staple Gun (Electric)", "Staple Gun (Pneumatic)", "Concrete Mixer (Portable - Electric)", "Concrete Mixer (Portable - Petrol)", "Concrete Vibrator (Poker)", "Plate Compactor (Vibrating Plate)", "Jumping Jack (Rammer)", "Power Trowel (Concrete Finisher)", "Scaffolding Hoist (Electric Winch)", "Chain Hoist (Manual - Lever)", "Chain Block (Manual - Ratchet)", "Cable Puller (Come Along)", "Hydraulic Jack (Bottle Jack)", "Hydraulic Jack (Floor Jack)", "Hydraulic Press (Shop Press)", "Bench Grinder (6\" - 8\")", "Pedestal Drill (Drill Press)", "Lathe (Woodworking)", "Lathe (Metalworking)", "Welding Machine (Arc/Stick)", "Welding Machine (MIG)", "Welding Machine (TIG)", "Welding Machine (Inverter)", "Generator (Petrol - 1kVA)", "Generator (Petrol - 3kVA)", "Generator (Petrol - 5kVA)", "Generator (Petrol - 10kVA)", "Generator (Diesel - 15kVA+)", "Air Compressor (Pancake - 2 Gallon)", "Air Compressor (Hot Dog - 4 Gallon)", "Air Compressor (Vertical - 20 Gallon)", "Air Compressor (Vertical - 60 Gallon)", "Pressure Washer (Electric - 100 bar)", "Pressure Washer (Petrol - 200 bar)", "Water Pump (Submersible - Clean Water)", "Water Pump (Submersible - Dirty Water/Sewage)", "Water Pump (Centrifugal - Petrol)", "Water Pump (Diaphragm - High Pressure)"], icon: "fa-microchip" },
          brand: { label: "Brand", options: ["Bosch (Professional)", "Bosch (DIY/Green)", "Makita", "DeWalt", "Milwaukee", "Hilti", "Hitachi (HiKOKI)", "Metabo", "Festool", "Stanley", "Black & Decker", "Ryobi", "Einhell", "Total (TOTAL Tools)", "Generic (Chinese/Clone)", "Other"], icon: "fa-tag", allowCustom: true },
          power_type: { label: "Power Type", options: ["Corded (Electric - AC)", "Cordless (Battery - Li-ion)", "Cordless (Battery - Ni-Cd)", "Pneumatic (Air Compressor)", "Hydraulic", "Petrol (Gasoline)", "Diesel", "Manual"], icon: "fa-plug" },
          voltage: { label: "Voltage (Cordless)", options: ["12V", "18V", "20V Max (18V nominal)", "24V", "36V", "40V", "54V", "60V", "80V", "Not Applicable"], icon: "fa-bolt" },
          battery_platform: { label: "Battery Platform (Cordless)", options: ["Bosch 18V (ProCore)", "Bosch 18V (Green)", "Makita 18V LXT", "Makita 40V XGT", "DeWalt 20V MAX", "DeWalt 60V FLEXVOLT", "Milwaukee M12", "Milwaukee M18", "Metabo 18V (CAS)", "Ryobi 18V ONE+", "Generic", "Not Applicable"], icon: "fa-battery-full" },
          power_input: { label: "Power Input (Corded/Petrol)", options: ["500W", "750W", "1000W", "1200W", "1500W", "1800W", "2000W", "2200W", "2500W", "3000W+", "1 HP", "1.5 HP", "2 HP", "3 HP", "5 HP", "10 HP", "1.5 kVA", "3 kVA", "5 kVA", "10 kVA", "15 kVA+"], icon: "fa-bolt" },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Open Box (Demo)", "Refurbished (Factory)", "Used - Like New (Minimal Use)", "Used - Good (Regular Use)", "Used - Fair (Heavy Use)", "For Parts/Repair"], icon: "fa-star" },
        }
      },
      fasteners: {
        name: "Fasteners (Nails, Screws, Bolts)",
        icon: "fa-hand-holding-usd",
        specs: {
          type: { label: "Fastener Type", options: ["Nail (Common Wire Nail)", "Nail (Concrete/Masonry Nail)", "Nail (Roofing Nail)", "Nail (Finishing Nail)", "Nail (Brad Nail - 18 Gauge)", "Nail (Flooring Nail - 16 Gauge)", "Nail (Coil Nail - Roofing)", "Screw (Wood Screw - Countersunk)", "Screw (Wood Screw - Pan Head)", "Screw (Self-tapping Screw - Metal)", "Screw (Drywall Screw - Bugle Head)", "Screw (Decking Screw - Coated)", "Screw (Machine Screw - Hex Head)", "Screw (Machine Screw - Socket Cap)", "Screw (Security Screw - Tamper Proof)", "Screw (Concrete Screw - Blue Tapcon)", "Screw (Lag Screw - Hex Head)", "Screw (Eye Screw - Lag Eye)", "Screw (Hook Screw - Lag Hook)", "Screw (Sheet Metal Screw - Self Drilling)", "Screw (Furniture Screw - Confirmat)", "Bolt (Hex Head Bolt - Grade 8.8)", "Bolt (Hex Head Bolt - Grade 10.9)", "Bolt (Carriage Bolt - Dome Head)", "Bolt (Eye Bolt - Lifting)", "Bolt (U-Bolt - Pipe Clamp)", "Bolt (J-Bolt - Foundation)", "Bolt (Anchor Bolt - L-Shaped)", "Nut (Hex Nut - Standard)", "Nut (Nyloc Nut - Self-locking)", "Nut (Wing Nut - Hand Tighten)", "Nut (Flange Nut - Serrated)", "Washer (Flat Washer - Standard)", "Washer (Spring Washer - Split Lock)", "Washer (Penny Washer - Large OD)", "Washer (Fender Washer - Extra Large)", "Rivet (Pop Rivet - Blind)", "Rivet (Solid Rivet - Industrial)", "Anchor (Plastic Wall Plug)", "Anchor (Nylon Wall Plug)", "Anchor (Metal Expanding Anchor)", "Anchor (Toggle Bolt - Hollow Wall)", "Anchor (Chemical Anchor - Resin Capsule)", "Anchor (Sleeve Anchor - Concrete)", "Anchor (Drop-in Anchor - Concrete)", "Anchor (Lead Anchor - Soft Material)", "Staple (Construction Staple - 1/4\")", "Staple (Staple - 1/2\")", "Staple (Cable Staple - Round Crown)", "Screw Assortment Kit (Mixed Sizes/Types)", "Nail Assortment Kit (Mixed Sizes/Types)", "Bolt Assortment Kit (Mixed Sizes/Types)"], icon: "fa-hand-holding-usd" },
          size: { label: "Size", options: ["1 inch (25mm)", "1.25 inch (30mm)", "1.5 inch (38mm)", "2 inch (50mm)", "2.5 inch (63mm)", "3 inch (75mm)", "4 inch (100mm)", "5 inch (125mm)", "6 inch (150mm)", "8 inch (200mm)", "10 inch (250mm)", "12 inch (300mm)", "Diameter: 2.5mm (#4)", "Diameter: 3mm (#6)", "Diameter: 4mm (#8)", "Diameter: 5mm (#10)", "Diameter: 6mm (1/4\")", "Diameter: 8mm (5/16\")", "Diameter: 10mm (3/8\")", "Diameter: 12mm (1/2\")", "Diameter: 14mm (9/16\")", "Diameter: 16mm (5/8\")", "Diameter: 20mm (3/4\")", "Diameter: 24mm (1\")", "M3", "M4", "M5", "M6", "M8", "M10", "M12", "M14", "M16", "M20", "M24"], icon: "fa-ruler" },
          material: { label: "Material", options: ["Steel (Mild Steel - Plain)", "Steel (Galvanized - Zinc Plated)", "Steel (Galvanized - Hot Dipped)", "Steel (Stainless Steel - 304)", "Steel (Stainless Steel - 316 Marine)", "Steel (High Tensile - Grade 8.8)", "Steel (High Tensile - Grade 10.9)", "Steel (High Tensile - Grade 12.9)", "Brass (Corrosion Resistant)", "Copper (Roofing/Bonding)", "Aluminum (Lightweight)", "Nylon (Plastic - Electrical)", "Ceramic (High Temperature)"], icon: "fa-layer-group" },
          quantity: { label: "Quantity", options: ["50 pcs", "100 pcs", "200 pcs", "250 pcs", "500 pcs", "1000 pcs (1K)", "2500 pcs (2.5K)", "5000 pcs (5K)", "10000 pcs (10K)", "20000 pcs (20K)", "50000 pcs (50K)", "100000 pcs (100K)", "1 kg", "2 kg", "5 kg", "10 kg", "20 kg", "25 kg", "50 kg", "Small Box (100g)", "Medium Box (250g)", "Large Box (500g)", "1 lb (454g)", "5 lb (2.27kg)"], icon: "fa-hashtag" },
          condition: { label: "Condition", options: ["Brand New (Sealed Box)", "New (Bulk Loose)", "Used - Good (Removed)", "Rusty (Discounted)"], icon: "fa-star" },
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. AGRICULTURE & FARMING (NEW)
  // ═══════════════════════════════════════════════════════════════════════════
  agriculture: {
    id: "agriculture",
    name: "Agriculture & Farming",
    icon: "🌾",
    description: "Seeds, fertilizers, pesticides, farm tools, livestock supplies, irrigation, and farm machinery",
    subcategories: {
      seeds: {
        name: "Seeds",
        icon: "fa-seedling",
        specs: {
          crop_type: { label: "Crop Type", options: ["Maize (Corn)", "Beans", "Peas", "Cowpeas", "Green Grams (Mung Beans)", "Soybeans", "Rice", "Wheat", "Barley", "Sorghum", "Millet", "Potato (Irish)", "Sweet Potato", "Cassava (Cuttings)", "Tomato Seeds", "Onion Seeds", "Cabbage Seeds", "Kale (Sukuma Wiki) Seeds", "Spinach Seeds", "Carrot Seeds", "Cucumber Seeds", "Pepper (Hoho/Bell Pepper)", "Chili (Hot Pepper)", "Eggplant (Bringal)", "Pumpkin Seeds", "Watermelon Seeds", "Melon Seeds", "Sunflower Seeds", "Groundnuts (Peanuts)", "Sesame (Simsim)", "Cotton Seeds", "Coffee Seedlings", "Tea Seedlings", "Fruit Tree Seedlings (Mango)", "Fruit Tree Seedlings (Avocado)", "Fruit Tree Seedlings (Orange/Citrus)", "Fruit Tree Seedlings (Banana)", "Fruit Tree Seedlings (Papaya)", "Fruit Tree Seedlings (Apple)", "Flower Seeds (Marigold)", "Flower Seeds (Zinnia)", "Flower Seeds (Sunflower)", "Grass Seeds (Pasture - Napier)", "Grass Seeds (Pasture - Kikuyu)", "Grass Seeds (Lawn - Bermuda)", "Grass Seeds (Lawn - Paspalum)"], icon: "fa-seedling" },
          variety: { label: "Variety/Hybrid", options: ["H614 (Maize)", "DK 777 (Maize)", "DK 997 (Maize)", "Pioneer 30Y99", "SC Duma (Maize)", "SC Duma 43", "Jubilee (Maize)", "Anna (Tomato)", "Tylka F1 (Tomato)", "Cobra F1 (Tomato)", "Red Ruby (Onion)", "Bombay Red (Onion)", "Gloria (Cabbage)", "Santa F1", "Riena", "Local Variety", "Open Pollinated (OPV)", "Hybrid (F1)", "GMO (Genetically Modified)", "Organic (Untreated)", "Conventional (Treated)"], icon: "fa-code-branch", allowCustom: true },
          quantity: { label: "Quantity", options: ["500g", "1kg", "2kg", "5kg", "10kg", "25kg", "50kg", "100g (Small pack)", "250g (Small pack)", "Pack of 10 seeds", "Pack of 50 seeds", "Pack of 100 seeds", "Pack of 500 seeds", "Pack of 1000 seeds (1K)", "Plug tray (100 seedlings)", "Plug tray (200 seedlings)", "Grafted seedling", "Rootstock"], icon: "fa-weight" },
          germination_rate: { label: "Germination Rate", options: ["70%", "75%", "80%", "85%", "90%", "95%", "Above 95%", "Not Specified"], icon: "fa-chart-line" },
          brand: { label: "Brand/Supplier", options: ["Kenya Seed Company", "East African Seed", "Simlaw Seeds", "Royal Seed", "Kenya Highland Seed", "Amiran Seeds", "Bayer Crop Science", "Syngenta", "Monsanto", "Local Agro-vet", "Other"], icon: "fa-tag", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New (Current Season)", "New (Previous Season)", "Near Expiry (Discounted)", "Certified Seed", "Non-Certified"], icon: "fa-star" },
        }
      },
      fertilizers: {
        name: "Fertilizers & Soil Amendments",
        icon: "fa-tint",
        specs: {
          type: { label: "Fertilizer Type", options: ["DAP (Diammonium Phosphate - 18:46:0)", "NPK 17:17:17 (Balanced)", "NPK 23:23:0 (Maize)", "NPK 20:20:20 (Soluble)", "NPK 15:15:15 (General)", "CAN (Calcium Ammonium Nitrate - 27% N)", "UREA (46% Nitrogen)", "MOP (Muriate of Potash - 0:0:60)", "SSP (Single Super Phosphate - 20% P2O5)", "TSP (Triple Super Phosphate - 46% P2O5)", "LAN (Limestone Ammonium Nitrate - 26% N)", "Sulphur (Elemental - Acidifying)", "Magnesium (MgSO4 - Epsom Salt)", "Calcium (Lime - Dolomitic)", "Calcium (Gypsum - CaSO4)", "Zinc (ZnSO4 - Micro-nutrient)", "Iron (Fe - Chelated)", "Boron (B - Solubor)", "Manganese (Mn - Chelated)", "Copper (Cu - Chelated)", "Foliar Fertilizer (Liquid)", "Foliar Fertilizer (Water Soluble Powder)", "Organic Fertilizer (Manure - Composted)", "Organic Fertilizer (Manure - Poultry)", "Organic Fertilizer (Manure - Cow/Dairy)", "Organic Fertilizer (Worm Castings)", "Organic Fertilizer (Seaweed Extract)", "Organic Fertilizer (Fish Emulsion)", "Humic Acid (Soil Conditioner)", "Fulvic Acid (Soil Conditioner)", "Biochar (Carbon Sequestration)", "Mycorrhizae (Root Fungi Inoculant)", "Bacterial Inoculant (Rhizobia - Legumes)", "Slow Release Fertilizer (Coated Urea)", "Hydroponic Nutrient (A/B Mix)"], icon: "fa-tint" },
          npk_ratio: { label: "NPK Ratio", options: ["18:46:0 (DAP)", "17:17:17", "23:23:0", "20:20:20", "15:15:15", "46:0:0 (Urea)", "27:0:0 (CAN)", "0:0:60 (MOP)", "0:20:0 (SSP)", "0:46:0 (TSP)", "Not Applicable (Organic)", "Custom Blend (Specify)", "Other"], icon: "fa-chart-pie" },
          weight: { label: "Weight", options: ["1kg", "2kg", "5kg", "10kg", "20kg", "25kg (Bag)", "50kg (Bag)", "500g (Small pack)", "1L (Liquid)", "5L (Liquid)", "20L (Liquid)", "1 Liter (Measured)", "5 Liters (Measured)", "10 Liters (Measured)"], icon: "fa-weight" },
          application_rate: { label: "Application Rate (kg/acre)", options: ["25 kg/acre", "50 kg/acre", "75 kg/acre", "100 kg/acre", "125 kg/acre", "150 kg/acre", "200 kg/acre", "See Instructions"], icon: "fa-chart-line" },
          brand: { label: "Brand", options: ["Yara", "ETG (Export Trading Group)", "MEA (Minjingu)", "Fertil Africa", "Mavuno", "Ocp Africa", "Nairobi Milling", "CFC", "Toyota Tsusho", "Generic", "Other"], icon: "fa-tag", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New (Sealed Bag)", "New (Open Bag - Partial)", "Caked/Hard (Discounted)"], icon: "fa-star" },
        }
      },
      pesticides: {
        name: "Pesticides & Herbicides",
        icon: "fa-bug",
        specs: {
          type: { label: "Product Type", options: ["Insecticide (Chemical - Contact)", "Insecticide (Chemical - Systemic)", "Insecticide (Biological - Bt)", "Insecticide (Organic - Neem Oil)", "Insecticide (Organic - Pyrethrin)", "Herbicide (Pre-emergence)", "Herbicide (Post-emergence)", "Herbicide (Selective - Broadleaf)", "Herbicide (Non-selective - Glyphosate/Roundup)", "Herbicide (Grass-specific)", "Fungicide (Contact)", "Fungicide (Systemic)", "Fungicide (Copper-based)", "Fungicide (Sulphur-based)", "Acaricide (Miticide - Ticks/Mites)", "Rodenticide (Rat/Mouse Poison)", "Molluscicide (Snail Bait - Slug Pellets)", "Nematicide (Nematode Control)", "Fumigant (Soil Sterilization)", "Pheromone Trap (Insect Monitoring)", "Sticky Trap (Yellow/Blue)", "Bird Repellent (Scare Tape/Gel)", "Animal Repellent (Wild Animals)"], icon: "fa-bug" },
          active_ingredient: { label: "Active Ingredient", options: ["Glyphosate (Roundup)", "Imidacloprid (Confidor)", "Lambda-cyhalothrin (Karate)", "Abamectin", "Deltamethrin", "Cypermethrin", "Mancozeb", "Metalaxyl", "Copper Oxychloride", "Sulphur", "Paraquat (Gramoxone)", "Atrazine", "2,4-D", "Acetochlor", "Chlorpyrifos", "Other"], icon: "fa-flask", allowCustom: true },
          target_pest: { label: "Target Pest/Disease", options: ["Aphids", "Fall Armyworm (FAW)", "Stem Borer", "Whitefly", "Thrips", "Spider Mites", "Red Spider Mite", "Mealybugs", "Cutworms", "Root Knot Nematodes", "Late Blight (Tomato/Potato)", "Powdery Mildew", "Downy Mildew", "Rust (Wheat/Coffee)", "CBD (Coffee Berry Disease)", "Rats/Mice", "Birds", "Weeds (Broadleaf)", "Weeds (Grassy)", "Weeds (Sedges)", "All Pests (General)"], icon: "fa-skull-crossbones", multiple: true, allowCustom: true },
          volume: { label: "Volume/Weight", options: ["50ml", "100ml", "250ml", "500ml", "1L", "5L", "20L", "50g", "100g", "250g", "500g", "1kg", "5kg", "10kg", "20kg", "25kg", "Sachet (10ml)", "Sachet (20ml)", "Bottle (1L)", "Jerrycan (5L)", "Drum (20L)"], icon: "fa-flask" },
          dilution_rate: { label: "Dilution Rate (ml per 20L knapsack)", options: ["10ml", "20ml", "30ml", "40ml", "50ml", "100ml", "See Label", "Not Applicable (Ready to Use)"], icon: "fa-chart-line" },
          brand: { label: "Brand", options: ["Bayer (Confidor, Actara)", "Syngenta (Amistar, Ridomil)", "BASF (Regent, Acrobat)", "Dow AgroSciences", "FMC", "Adama", "UPL", "KAPI (Kenya)", "Osho (Twiga)", "Generic (Local)", "Other"], icon: "fa-tag", allowCustom: true },
          safety_period: { label: "Pre-harvest Interval (PHI - days)", options: ["1 day", "3 days", "7 days", "14 days", "21 days", "30 days", "Not Applicable"], icon: "fa-calendar" },
          condition: { label: "Condition", options: ["Brand New (Sealed)", "New (Unopened)", "Expired (Discounted for non-critical use)"], icon: "fa-star" },
        }
      },
      farm_tools: {
        name: "Farm Tools & Hand Tools",
        icon: "fa-tractor",
        specs: {
          type: { label: "Tool Type", options: ["Jembe (Hoe - Local)", "Jembe (Digging Hoe)", "Jembe (Weeding Hoe - Light)", "Panga (Machete)", "Slasher (Grass Cutter)", "Forked Jembe (Pitchfork)", "Rake (Metal Tine - Hay)", "Rake (Leaf Rake)", "Shovel (Digging - Round Point)", "Spade (Square Point)", "Pickaxe (Matock/Pick)", "Mattock (Cultivator - 2-in-1)", "Sickle (Harvesting Knife)", "Hand Trowel (Small Digging)", "Hand Cultivator (Claw)", "Hand Fork (Soil Loosener)", "Pruning Shears (Secateurs - Bypass)", "Pruning Shears (Anvil)", "Loppers (Long Handle Pruner)", "Pruning Saw (Folding)", "Hedge Shears (Trimmer)", "Axe (Wood Cutting)", "Splitting Maul (Log Splitter)", "Hand Saw (Wood)", "Bow Saw (Frame Saw)", "Tap Tap (Post Hole Digger - Manual)", "Post Hole Digger (Twist Auger - Manual)", "Sprayer (Knapsack - 16L Manual)", "Sprayer (Knapsack - 20L Manual)", "Sprayer (Knapsack - Battery Powered)", "Sprayer (Knapsack - Petrol Powered)", "Sprayer (Handheld - 1L/2L)", "Sprayer (Backpack - 5L)", "Wheelbarrow (Single Wheel - 2.5ft³)", "Wheelbarrow (Single Wheel - 3ft³)", "Wheelbarrow (Double Wheel - Heavy Duty)", "Watering Can (Plastic - 10L)", "Watering Can (Metal - 15L)", "Bucket (Galvanized - 20L)", "Bucket (Plastic - 20L)", "Milking Can (Aluminum)", "Milk Churn (Stainless Steel)", "Crate (Plastic - Egg/Produce)", "Sack (Gunny Bag - 50kg)", "Sack (Polypropylene - 70kg)", "Tarpaulin (Waterproof - Farm Cover)", "Twine (Baling Twine - Sisal)", "Twine (Garden Twine - Polypropylene)", "Net (Bird Netting - Anti-bird)", "Net (Insect Netting - Anti-insect)", "Net (Shade Net - 50% Shade)", "Electric Fence Insulator", "Electric Fence Energizer (Battery)", "Electric Fence Energizer (Mains)"], icon: "fa-tractor" },
          material: { label: "Material", options: ["Carbon Steel (Blade)", "Stainless Steel (Blade)", "Wooden Handle (Local)", "Fiberglass Handle", "Plastic Handle", "Plastic (Body)", "Metal (Frame)", "Polyethylene (Water Tank)", "Polypropylene (Sack)"], icon: "fa-layer-group" },
          condition: { label: "Condition", options: ["Brand New", "Used - Like New", "Used - Good", "Used - Fair (Handle broken)", "Rusty (Needs Cleaning)"], icon: "fa-star" },
          weight_capacity: { label: "Capacity (if applicable)", options: ["50kg", "75kg", "100kg", "150kg", "200kg", "500kg", "1 ton", "5L", "10L", "16L", "20L", "2.5 ft³", "3 ft³", "4 ft³"], icon: "fa-weight" },
        }
      },
      irrigation: {
        name: "Irrigation Equipment",
        icon: "fa-water",
        specs: {
          type: { label: "System Type", options: ["Drip Line (Drip Tape - 16mm)", "Drip Line (Drip Tube - 16mm)", "Drip Emitter (Button - 2L/h)", "Drip Emitter (Arrow Stake - 8L/h)", "Drip Emitter (Adjustable - 0-50L/h)", "Drip Accessories (Connector)", "Drip Accessories (Tee)", "Drip Accessories (End Cap)", "Drip Accessories (Valve)", "Drip Accessories (Flush Valve)", "Drip Filter (Screen - 120 Mesh)", "Drip Filter (Disc - 120 Mesh)", "Drip Fertilizer Injector (Venturi)", "Drip Regulator (Pressure - 1 Bar)", "Sprinkler (Impact - Brass)", "Sprinkler (Impact - Plastic)", "Sprinkler (Rotary - Gear Driven)", "Sprinkler (Oscillating)", "Sprinkler (Pop-up - Lawn)", "Sprinkler (Micro - Mister)", "Sprinkler (Micro - Spray Jet)", "Sprinkler Stand (Tripod)", "Sprinkler Pipe (Aluminum - 6m length)", "Sprinkler Pipe (PVC - 6m length)", "Hose Pipe (PVC - 1/2\")", "Hose Pipe (PVC - 3/4\")", "Hose Pipe (PVC - 1\")", "Hose Pipe (Rubber - Heavy Duty)", "Hose Connector (Threaded)", "Hose Connector (Quick Connect)", "Hose Splitter (Y-Connector)", "Hose Nozzle (Adjustable)", "Hose Nozzle (Pistol Grip)", "Hose Reel (Cart - Manual)", "Hose Reel (Wall Mounted)", "Water Pump (Submersible - Solar)", "Water Pump (Submersible - AC)", "Water Pump (Surface - Centrifugal)", "Water Pump (Surface - Pressure Booster)", "Water Tank (Plastic - 500L)", "Water Tank (Plastic - 1000L)", "Water Tank (Plastic - 2000L)", "Water Tank (Plastic - 3000L)", "Water Tank (Plastic - 5000L)", "Water Tank (Plastic - 10000L)", "Water Tank (Steel - 1000L)", "Water Tank (Fiberglass)", "Rain Barrel (Rainwater Harvesting)", "Gutter (PVC - Rainwater)", "Gutter Downpipe", "First Flush Diverter", "Tank Connector (Fittings)"], icon: "fa-water" },
          pipe_size: { label: "Pipe Size/Diameter", options: ["1/2 inch (12.5mm)", "3/4 inch (19mm)", "1 inch (25mm)", "1.25 inch (32mm)", "1.5 inch (40mm)", "2 inch (50mm)", "3 inch (80mm)", "4 inch (100mm)", "16mm (Drip Line)"], icon: "fa-ruler" },
          material: { label: "Material", options: ["PVC", "LDPE (Low Density Polyethylene - Drip)", "Polyethylene (PE - Hose)", "Rubber (Hose)", "Aluminum (Sprinkler Pipe)", "Brass (Sprinkler)", "Plastic (Sprinkler)"], icon: "fa-layer-group" },
          brand: { label: "Brand", options: ["Netafim (Drip)", "Rivulis (Drip)", "Jain Irrigation", "Hunter (Sprinklers)", "Rain Bird (Sprinklers)", "KSh 300 (Local Brand)", "SunCulture (Solar Pump)", "Davis & Shirtliff (Pumps)", "Aqua-tech", "Generic/Unbranded"], icon: "fa-tag", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New", "New in Box", "Used - Like New", "Used - Good (Cleaned)", "Used - Fair (Needs repairs)"], icon: "fa-star" },
        }
      },
      livestock: {
        name: "Livestock Supplies",
        icon: "fa-cow",
        specs: {
          type: { label: "Supply Type", options: ["Animal Feed (Dairy Meal - 70kg bag)", "Animal Feed (Chick Mash - 25kg)", "Animal Feed (Layers Mash - 25kg)", "Animal Feed (Broilers Mash - 25kg)", "Animal Feed (Pig Grower - 25kg)", "Animal Feed (Rabbit Pellets)", "Animal Feed (Fish Pellets - 5mm)", "Animal Feed (Hay Bale - Napier)", "Animal Feed (Hay Bale - Rhodes Grass)", "Animal Feed (Hay Bale - Lucerne/Alfalfa)", "Mineral Block (Salt Lick - Red)", "Mineral Block (Salt Lick - White)", "Mineral Supplement (Powder - 25kg)", "Calf Milk Replacer (Powder)", "Piglet Creep Feed (25kg)", "Chick Starter (25kg)", "Animal Health (Vaccine - Livestock)", "Animal Health (Dewormer - Oral)", "Animal Health (Dewormer - Injectable)", "Animal Health (Tick Dip - Acaricide)", "Animal Health (Fly Spray - Livestock)", "Animal Health (Antibiotic - Injectable)", "Livestock Waterer (Automatic - Nipple)", "Livestock Waterer (Drinking Bowl)", "Livestock Feeder (Trough - Galvanized)", "Livestock Feeder (Trough - Plastic)", "Livestock Feeder (Creep Feeder - Calves)", "Poultry Feeder (Hanging - 5kg)", "Poultry Feeder (Round - Plastic)", "Poultry Drinker (Bell - 5L)", "Poultry Drinker (Nipple System)", "Poultry Drinkers (Cup - Automatic)", "Poultry Nest Box (Rollaway)", "Poultry Perch (Roost Bar)", "Incubator (Egg - 48 Eggs)", "Incubator (Egg - 96 Eggs)", "Incubator (Egg - 200+ Eggs)", "Brooder (Chick - Infrared Bulb)", "Brooder (Gas - Propane)", "Brooder (Kerosene - Paraffin)", "Fencing (Electric Wire)", "Fencing (Poly Tape - Electric)", "Fencing (Barbed Wire)", "Fencing (Wire Mesh - Chicken)", "Fencing (Pig Panels)", "Fencing (Post - Wood/Treated)", "Fencing (Post - Metal/ T-Post)", "Fencing (Post - Concrete)", "Animal Identification (Ear Tag)", "Animal Identification (Leg Band - Poultry)", "Branding Iron (Livestock)", "Hoof Trimmer (Sheep/Goat)", "Hoof Trimmer (Cattle)", "Sheep Shears (Manual)", "Sheep Shears (Electric)", "Milking Machine (Portable - 1 cow)", "Milking Machine (2 cows - Bucket)", "Milk Filter (Sock - Disposable)", "Milk Cooling Tank (100L)", "Milk Cooling Tank (500L)", "Milk Can (Aluminum - 20L)", "Milk Jug (Plastic - 5L)", "Chaff Cutter (Fodder Chopper - Manual)", "Chaff Cutter (Fodder Chopper - Electric)", "Egg Grading Tray (30 eggs)", "Egg Tray (Cardboard - 30 eggs)", "Egg Carton (Pulp - 6 eggs)"], icon: "fa-cow" },
          animal_type: { label: "Animal Type", options: ["Dairy Cow (Lactating)", "Beef Cow", "Calf (0-6 months)", "Heifer (6-18 months)", "Goat (Dairy)", "Goat (Meat)", "Sheep", "Pig (Piglet)", "Pig (Grower)", "Pig (Breeder/Sow)", "Pig (Boar)", "Chicken (Layer)", "Chicken (Broiler)", "Chicken (Kienyeji/Indigenous)", "Chick (Day old)", "Rabbit", "Fish (Tilapia)", "Fish (Catfish)", "Horse/Donkey", "Camel", "Bee", "All Livestock"], icon: "fa-paw" },
          weight: { label: "Weight/Volume", options: ["1kg", "2kg", "5kg", "10kg", "15kg", "20kg", "25kg (Bag)", "50kg (Bag)", "70kg (Bag)", "1L", "5L", "10L", "20L", "500ml", "100ml", "1 Ton (Bale)", "Each (Unit)", "Pair", "Set"], icon: "fa-weight" },
          brand: { label: "Brand/Manufacturer", options: ["Unga Farm Care", "Kenchic (Feed)", "Brocklesby (Feed)", "Prolivestock (Feed)", "Novartis (Animal Health)", "Pfizer (Animal Health)", "Cooper (Animal Health)", "Coopers (Acaricide)", "Santana (Incubators)", "GQF (Incubators)", "Generic/Local", "Other"], icon: "fa-tag", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New", "Sealed", "New", "Open Bag (Partial)", "Used - Good", "Used - Fair"], icon: "fa-star" },
        }
      },
      beekeeping: {
        name: "Bee Keeping (Apiculture)",
        icon: "fa-bug",
        specs: {
          type: { label: "Equipment Type", options: ["Beehive (Langstroth - 8 Frame)", "Beehive (Langstroth - 10 Frame)", "Beehive (Top Bar - Kenya Top Bar Hive/KTBH)", "Beehive (Traditional Log Hive)", "Beehive (Warre Hive)", "Beehive Stand (Metal)", "Beehive Stand (Wood)", "Beehive (Complete Kit with Frames)", "Frames (Waxed - Langstroth)", "Foundation (Wax Sheet)", "Foundation (Plastic - Wax Coated)", "Smoker (Bee Smoker - Stainless)", "Smoker (Bee Smoker - Galvanized)", "Smoker Fuel (Pellets)", "Hive Tool (Scraper/Pry Bar)", "Bee Brush (Soft Bristle)", "Bee Suit (Full Coverall)", "Bee Jacket (Half Suit - with Veil)", "Bee Veil (Fencing Veil)", "Bee Veil (Round Hat Veil)", "Bee Gloves (Leather/Cotton)", "Bee Gloves (Synthetic/Polyester)", "Queen Excluder (Metal Grill)", "Queen Excluder (Plastic)", "Uncapping Knife (Electric)", "Uncapping Knife (Cold - Serrated)", "Honey Extractor (Manual - 2 Frame)", "Honey Extractor (Manual - 4 Frame)", "Honey Extractor (Electric - 8 Frame)", "Honey Strainer (Double Mesh)", "Honey Strainer (Nylon - 400 micron)", "Honey Bucket (Food Grade - 30L)", "Honey Bottle (Plastic - 500g)", "Honey Bottle (Glass - 1kg)", "Honey Jar (Pottle - 250g)", "Honey Label (Sticker)", "Wax Melter (Solar Wax Melter)", "Wax Mould (Soap/Foundation)", "Feeder (Entrance Feeder)", "Feeder (Frame Feeder - Internal)", "Feeder (Bucket Feeder - Top)", "Bee Feed (Sugar Syrup)", "Bee Pollen Trap (Bottom Mount)", "Queen Cage (Introduction Cage)", "Queen Marking Pen (Non-toxic)", "Queen Marking Pen (Posca Pen)"], icon: "fa-bug" },
          capacity: { label: "Capacity/Frames", options: ["5 Frames (Nuc)", "8 Frames", "10 Frames", "12 Frames", "Top Bar (20 bars)", "Top Bar (24 bars)", "2 Frame Extractor", "4 Frame Extractor", "8 Frame Extractor", "10 Frame Extractor", "1kg Honey", "2kg Honey", "5kg Honey", "10kg Honey", "20kg Honey", "30L Bucket", "50L Drum"], icon: "fa-weight" },
          material: { label: "Material", options: ["Wood (Cypress/Pine)", "Cedar (Rot Resistant)", "Plywood (Exterior Grade)", "Plastic (HDPE)", "Metal (Stainless Steel - Smoker/Tools)", "Galvanized Steel (Hive Stand)", "Polyurethane (Bee Suit - Nylon)", "Cotton (Bee Suit)", "Leather (Gloves)", "Nylon (Strainer)", "Glass (Jar)"], icon: "fa-layer-group" },
          condition: { label: "Condition", options: ["Brand New", "New (Unassembled/Flat pack)", "Used - Good (Cleaned)", "Used - Needs Repair", "Used - For Parts"], icon: "fa-star" },
        }
      },
      greenhouses: {
        name: "Greenhouses & Netting",
        icon: "fa-leaf",
        specs: {
          type: { label: "Structure Type", options: ["Greenhouse (Tunnel - Small 8x15m)", "Greenhouse (Tunnel - Medium 8x24m)", "Greenhouse (Tunnel - Large 8x30m)", "Greenhouse (UV Treated Plastic Cover)", "Greenhouse (Polycarbonate Panel)", "Greenhouse Frame (Galvanized Pipe)", "Greenhouse Frame (PVC Pipe - DIY)", "Greenhouse Clips (Spring)", "Greenhouse Clips (Plastic)", "Greenhouse Net (Insect Net - 0.6mm)", "Greenhouse Net (Insect Net - 0.8mm)", "Greenhouse Net (Shade Net - 50%)", "Greenhouse Net (Shade Net - 75%)", "Greenhouse Net (Shade Net - 90%)", "Greenhouse Twine (Nylon)", "Greenhouse Twine (Polyester)", "Greenhouse Hooks (Plant Training)", "Greenhouse Clips (Tomato)", "Greenhouse Roll-up System (Side Vent)", "Greenhouse Roll-up System (Crank Handle)", "Greenhouse Thermometer (Max/Min)", "Greenhouse Hygrometer (Humidity)", "Grow Bags (Coco Peat - 5kg)", "Grow Bags (Soil - 10L)", "Grow Bags (Hydroponic - 3L)", "Hydroponic System (Nutrient Film Technique/NFT)", "Hydroponic System (Deep Water Culture/DWC)", "Hydroponic Tray (Flood & Drain)", "Hydroponic Growing Medium (Rockwool)", "Hydroponic Growing Medium (Clay Pebbles)", "Coco Peat (Coir - Brick 5kg)", "Vermiculite (Soil Amendment)", "Perlite (Soil Amendment)", "Seedling Tray (Plug Tray - 104 cells)", "Seedling Tray (Plug Tray - 200 cells)", "Seedling Tray (Plastic - Standard)", "Peat Pellet (Jiffy Pod - Seed Starter)", "Potting Mix (Bag - 25L)", "Mulch Film (Black Plastic - 1.5m x 100m)", "Mulch Film (Silver/Reflective - 1.5m x 50m)", "Drip Irrigation Kit (Greenhouse - 100m²)", "Misting Kit (Fogger - Greenhouse Cooling)", "Heater (Greenhouse - Paraffin/Kerosene)", "Heater (Electric - Fan Heater)", "Fan (Exhaust - Greenhouse Ventilation)"], icon: "fa-leaf" },
          dimensions: { label: "Dimensions (Width x Length)", options: ["8m x 15m (120m²)", "8m x 24m (192m²)", "8m x 30m (240m²)", "8m x 36m (288m²)", "8m x 48m (384m²)", "10m x 20m (200m²)", "10m x 30m (300m²)", "6m x 12m (72m² - Small)", "Custom Size (Specify)", "Not Applicable (Accessory)"], icon: "fa-expand", allowCustom: true },
          cover_type: { label: "Cover Type", options: ["UV Plastic (200 micron)", "UV Plastic (150 micron)", "Polycarbonate (4mm)", "Polycarbonate (6mm)", "Insect Net (0.4mm holes)", "Shade Net (50%)", "Shade Net (75%)", "None (Frame Only)"], icon: "fa-layer-group" },
          condition: { label: "Condition", options: ["Brand New (Complete Kit)", "New (Frame Only)", "Used (Dismantled - Good Condition)", "Used (Plastic torn - Frame only)"], icon: "fa-star" },
        }
      }
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 15. EVENTS & PARTY SUPPLIES (NEW)
  // ═══════════════════════════════════════════════════════════════════════════
  events_party: {
    id: "events_party",
    name: "Events & Party Supplies",
    icon: "🎉",
    description: "Party decorations, tableware, tents, sound systems, lighting, and event rentals",
    subcategories: {
      party_decorations: {
        name: "Party Decorations",
        icon: "fa-balloon",
        specs: {
          type: { label: "Decoration Type", options: ["Balloons (Latex - Assorted Colors)", "Balloons (Latex - Pastel)", "Balloons (Latex - Metallic)", "Balloons (Foil - Number)", "Balloons (Foil - Letter)", "Balloons (Foil - Character)", "Balloon Arch Kit (with Frame)", "Balloon Column Kit", "Balloon Garland (Pre-made)", "Balloon Weight (Cup)", "Balloon Ribbon (String)", "Balloon Pump (Manual)", "Balloon Pump (Electric)", "Banner (Happy Birthday)", "Banner (Congratulations)", "Banner (Happy Anniversary)", "Banner (Baby Shower)", "Banner (Gender Reveal)", "Banner (Wedding - Mr & Mrs)", "Bunting (Triangle Banners)", "Bunting (Pennant Banner)", "Tinsel Curtain (Backdrop)", "Fringe Curtain (Party Backdrop)", "Confetti (Paper - Bag)", "Confetti (Biodegradable - Toss)", "Confetti (Wedding - Rice Paper)", "Table Confetti (Scatter)", "Streamers (Crepe Paper)", "Streamers (Twist - Metallic)", "Centerpiece (Flower - Artificial)", "Centerpiece (Candle Holder)", "Centerpiece (Balloon Weight)", "Photo Booth Props (Signs)", "Photo Booth Props (Funny Glasses)", "Photo Booth Backdrop (Fabric)", "Photo Booth Backdrop (Sequins)", "Wall Decor (Paper Fan)", "Wall Decor (Pom Pom)", "Wall Decor (Honeycomb Ball)", "Balloon Banner (Mini flags)", "Hanging Swirl Decor (Spiral)", "Garland (Fabric - Rainbow)", "Garland (Tissue Paper)"], icon: "fa-balloon" },
          color_theme: { label: "Color Theme", options: ["Assorted Multicolor", "Gold & Silver (Metallic)", "Rose Gold", "Black & Gold", "Black & White", "Pink (Blush)", "Blue (Navy)", "Blue (Sky)", "Red", "Green (Emerald)", "Purple (Lavender)", "Yellow (Sunflower)", "Orange (Coral)", "Rainbow", "Pastel Mix", "Primary Colors", "Custom (Specify)"], icon: "fa-palette", allowCustom: true },
          quantity: { label: "Quantity", options: ["10 pcs", "20 pcs", "25 pcs", "50 pcs", "100 pcs (Bag)", "200 pcs", "500 pcs", "1000 pcs", "1 Roll", "2 Rolls", "5 Rolls", "1 Set (Arch Kit)", "1 Bundle (Garland)", "1 pack (Banner)", "1 Bag (Confetti - 50g)", "1 Bag (Confetti - 100g)"], icon: "fa-hashtag" },
          material: { label: "Material", options: ["Latex (Balloons)", "Foil (Balloons)", "Paper (Confetti/Streamers)", "Crepe Paper", "Fabric (Bunting)", "Cardboard (Banner)", "Plastic (Banner)", "Tissue Paper (Pom Poms)"], icon: "fa-layer-group" },
          condition: { label: "Condition", options: ["Brand New (Sealed)", "New (Unopened)", "Used - Good (No Tears)"], icon: "fa-star" },
        }
      },
      tableware: {
        name: "Party Tableware",
        icon: "fa-utensils",
        specs: {
          type: { label: "Item Type", options: ["Paper Plates (Dinner - 10\")", "Paper Plates (Dessert - 7\")", "Paper Plates (Small - 5\")", "Plastic Plates (Heavy Duty - Reusable)", "Paper Cups (8 oz - Hot/Cold)", "Paper Cups (12 oz - Large)", "Plastic Cups (Clear - 9 oz)", "Plastic Cups (Clear - 16 oz)", "Plastic Cups (Colored - 9 oz)", "Plastic Wine Glasses (Disposable)", "Plastic Champagne Flutes (Disposable)", "Plastic Shot Glasses (2 oz)", "Paper Napkins (Cocktail - 2 ply)", "Paper Napkins (Dinner - 3 ply)", "Cloth Napkins (Reusable - Set of 12)", "Paper Towels (Party Rolls)", "Plastic Cutlery (Forks - Set of 50)", "Plastic Cutlery (Spoons - Set of 50)", "Plastic Cutlery (Knives - Set of 50)", "Plastic Cutlery (Full Set - Fork/Spoon/Knife)", "Wooden Cutlery (Biodegradable - Set)", "Bamboo Cutlery (Reusable - Set)", "Tablecloth (Plastic - Disposable)", "Tablecloth (Fabric - Polyester)", "Tablecloth (Lace - Decorative)", "Table Runner (Fabric)", "Placemat (Plastic - Reusable)", "Placemat (Bamboo/Rattan)", "Centerpiece Mat (Charger Plate)", "Serving Tray (Plastic - Disposable)", "Serving Tray (Aluminum - Foil)", "Serving Platter (Plastic - Heavy Duty)", "Serving Bowl (Plastic - Large)", "Serving Bowl (Disposable - Aluminum)", "Cake Stand (Acrylic)", "Cupcake Stand (Tiered - 3 layers)", "Cupcake Stand (Cardboard - Disposable)", "Chocolate Fountain (Electric - Rental/For Sale)", "Punch Bowl (Plastic - 2 Gallon)", "Drink Dispenser (Glass - 3 Gallon)", "Drink Dispenser (Plastic - 2 Gallon)"], icon: "fa-utensils" },
          color_design: { label: "Color/Design", options: ["White", "Gold", "Silver", "Black", "Clear (Transparent)", "Red", "Blue", "Green", "Pink", "Purple", "Yellow", "Floral Print", "Striped", "Polka Dot", "Solid Color (Assorted)", "Wedding Design (Ivory/Lace)", "Birthday Design (Happy Birthday Print)", "Baby Shower (Pastel)", "Christmas (Red/Green)"], icon: "fa-palette", allowCustom: true },
          quantity: { label: "Quantity", options: ["10 pcs", "20 pcs", "25 pcs", "30 pcs", "40 pcs", "50 pcs", "100 pcs", "200 pcs", "500 pcs", "1000 pcs", "1 Roll (Tablecloth - 1.2m x 10m)", "1 Set (12 place settings)", "1 Set (24 place settings)", "1 Pack (50 sets)", "1 Box (250 pcs)", "1 Carton (1000 pcs)"], icon: "fa-hashtag" },
          material: { label: "Material", options: ["Paper (Biodegradable)", "Plastic (Polypropylene - Reusable)", "Plastic (Polystyrene - Disposable)", "Plastic (PET - Clear)", "Aluminum (Foil)", "Wood (Birch/Pine)", "Bamboo", "Fabric (Polyester)", "Fabric (Lace)", "Glass", "Acrylic (Shatterproof)"], icon: "fa-layer-group" },
          condition: { label: "Condition", options: ["Brand New (Sealed)", "New (Unopened)", "Used - Like New (Washed)", "Used (Minor wear)"], icon: "fa-star" },
        }
      },
      tents_canopies: {
        name: "Tents & Canopies",
        icon: "fa-campground",
        specs: {
          type: { label: "Tent Type", options: ["Party Tent (Pop-up - 3x3m)", "Party Tent (Pop-up - 3x6m)", "Party Tent (Pop-up - 4x4m)", "Marquee Tent (Frame - 6x9m)", "Marquee Tent (Frame - 9x12m)", "Marquee Tent (Frame - 12x15m)", "Marquee Tent (Frame - 12x18m)", "Wedding Tent (Peak Style - 6x6m)", "Wedding Tent (Peak Style - 9x9m)", "Wedding Tent (Sailcloth - 8x8m)", "Canopy (Gazebo - 3x3m Folding)", "Canopy (Gazebo - 2x2m Pop-up)", "Canopy (Market Stall - 2x3m)", "Tent Side Wall (Clear PVC)", "Tent Side Wall (Solid PVC - White)", "Tent Weight (Water Barrel - 50kg)", "Tent Pegs (Heavy Duty - 40cm)", "Tent Pegs (Metal - 30cm)", "Tent Rope (Guy Line)", "Tent Pole (Replacement - Steel)", "Tent Pole (Replacement - Aluminum)", "Tent Repair Kit (Patch/Tape)", "Ground Sheet (Tent Floor - Tarp)", "Event Flooring (Plastic Interlocking Tile)", "Event Flooring (Wooden Decking Panel)", "Carpet (Event - Roll 2m wide)", "Dance Floor (LED Light Up - Panel)", "Dance Floor (White Marble - Panel)"], icon: "fa-campground" },
          size: { label: "Size (Width x Length)", options: ["3x3m (10x10 ft)", "3x6m (10x20 ft)", "4x4m (13x13 ft)", "5x5m (16x16 ft)", "6x6m (20x20 ft)", "6x9m (20x30 ft)", "6x12m (20x40 ft)", "8x8m (26x26 ft)", "9x9m (30x30 ft)", "9x12m (30x40 ft)", "9x15m (30x50 ft)", "10x10m (33x33 ft)", "12x12m (40x40 ft)", "12x15m (40x50 ft)", "12x18m (40x60 ft)", "15x15m (50x50 ft)", "15x21m (50x70 ft)", "18x24m (60x80 ft)", "Custom Size", "Not Applicable (Accessory)"], icon: "fa-expand" },
          material: { label: "Material", options: ["Polyester (600D - Waterproof)", "Polyester (210D - Lightweight)", "PVC Coated Polyester (Heavy Duty)", "Canvas (Cotton - Traditional)", "Vinyl (Clear Sidewall)", "Polyethylene (PE - Tarpaulin)", "Aluminum Frame (Marquee)", "Steel Frame (Galvanized)", "Fiberglass Poles (Pop-up)", "Steel Poles (Heavy Duty)"], icon: "fa-layer-group" },
          usage: { label: "Usage", options: ["Purchase (New)", "Purchase (Used)", "Rental (Daily)", "Rental (Weekly)", "Rental (Setup Included)", "Rental (DIY Pickup)"], icon: "fa-calendar" },
          condition: { label: "Condition", options: ["Brand New", "New (Unused)", "Used - Like New", "Used - Good (No Holes)", "Used - Fair (Minor Patches)", "Damaged (Discounted - Needs Repair)"], icon: "fa-star" },
        }
      },
      chairs_tables: {
        name: "Chairs & Tables (Event)",
        icon: "fa-chair",
        specs: {
          type: { label: "Furniture Type", options: ["Folding Chair (Plastic - White)", "Folding Chair (Plastic - Gold)", "Folding Chair (Plastic - Black)", "Folding Chair (Resin - White)", "Folding Chair (Padded - Cushion)", "Chiavari Chair (Gold - Resin)", "Chiavari Chair (Silver - Resin)", "Chiavari Chair (White - Wood)", "Ghost Chair (Clear Acrylic)", "Cross Back Chair (Rustic Wood)", "Banquet Chair (Fabric - White Cover)", "Bar Stool (Folding - Plastic)", "Bar Stool (Metal - 75cm)", "Folding Table (Plastic - 6ft Rectangular)", "Folding Table (Plastic - 4ft Round)", "Folding Table (Plastic - 5ft Round)", "Banquet Table (Wood - 6ft Rectangular)", "Banquet Table (Wood - 8ft Rectangular)", "Cocktail Table (High Top - 30\" Round)", "Cocktail Table (High Top - 36\" Round)", "Trestle Table (Wooden - 6ft)", "Round Table (Plastic - 60\" Seats 8)", "Round Table (Plastic - 72\" Seats 10)", "Card Table (Square - 34\" Folding)", "Table Skirt (Fabric - White pleated)", "Table Skirt (Elastic Fitted - 8ft)", "Tablecloth (Fitted - 6ft Table)", "Tablecloth (Fitted - 8ft Table)", "Tablecloth (Round - 60\" Table)", "Tablecloth (Round - 72\" Table)", "Chair Cover (Stretch Spandex - White)", "Chair Cover (Stretch Spandex - Gold)", "Chair Sash (Satin Ribbon)", "Chair Sash (Tulle Bow)"], icon: "fa-chair" },
          quantity: { label: "Quantity", options: ["1 piece", "2 pieces", "5 pieces", "10 pieces", "20 pieces", "25 pieces", "30 pieces", "40 pieces", "50 pieces", "100 pieces", "150 pieces", "200 pieces", "250 pieces", "300 pieces", "400 pieces", "500 pieces", "Set of 2", "Set of 4", "Set of 6", "Set of 8", "Set of 10"], icon: "fa-hashtag" },
          material: { label: "Material", options: ["Plastic (Polypropylene)", "Resin (Polyethylene)", "Wood (Hardwood - Oak/Teak)", "Metal (Steel - Powder Coated)", "Metal (Aluminum - Lightweight)", "Acrylic (Clear)", "Fabric (Spandex - Cover)", "Fabric (Polyester - Skirt)"], icon: "fa-layer-group" },
          color: { label: "Color", options: ["White", "Black", "Gold", "Silver", "Champagne", "Brown (Wood)", "Clear", "Red", "Blue", "Green", "Pink", "Purple", "Assorted"], icon: "fa-palette", allowCustom: true },
          usage: { label: "Usage", options: ["Purchase (New)", "Purchase (Used)", "Rental (Daily)", "Rental (Setup Included)", "Rental (DIY Pickup)"], icon: "fa-calendar" },
          condition: { label: "Condition", options: ["Brand New", "Used - Like New (No Scratches)", "Used - Good (Minor scratches)", "Used - Fair (Scratches/Wear)"], icon: "fa-star" },
        }
      },
      sound_system: {
        name: "Sound System & Speakers",
        icon: "fa-music",
        specs: {
          type: { label: "Equipment Type", options: ["Speaker (Active PA - 12\")", "Speaker (Active PA - 15\")", "Speaker (Passive PA - 12\")", "Speaker (Passive PA - 15\")", "Subwoofer (Active - 18\")", "Subwoofer (Passive - 18\")", "Speaker Stand (Tripod - Pair)", "Speaker Pole (Subwoofer Mount)", "Amplifier (Power Amp - 1000W)", "Amplifier (Power Amp - 2000W)", "Mixer (Audio - 6 Channel)", "Mixer (Audio - 12 Channel)", "Mixer (Audio - 16 Channel)", "Microphone (Wireless Handheld)", "Microphone (Wired Dynamic - Shure SM58)", "Microphone (Wired - Karaoke)", "Microphone (Lavalier/Lapel)", "Microphone (Headset)", "Microphone Stand (Boom)", "Microphone Stand (Round Base)", "Microphone Cable (XLR - 10m)", "Microphone Cable (XLR - 5m)", "Speaker Cable (Jack/XLR - 10m)", "Speaker Cable (Speakon - 10m)", "DJ Controller (Entry Level)", "DJ Controller (Professional)", "DJ Mixer (2 Channel)", "DJ Mixer (4 Channel)", "Turntable (Vinyl - DJ)", "CDJ (Media Player)", "Laptop Stand (DJ Booth)", "DJ Facade (Table Scrim - 6ft)", "DJ Facade (Light Up)", "Karaoke Machine (All-in-One)", "Karaoke Player (DVD/USB)", "Karaoke Speaker (Portable - 8\")", "Bluetooth Party Speaker (Portable - 12\")", "Bluetooth Party Speaker (Portable - 15\")", "Stage Monitor (Floor Wedge)", "Stage Snake (Audio - 20m)", "DI Box (Direct Input - Stereo)", "Sound Mixer Rack (Flight Case)", "Speaker Flight Case (Rolling)"], icon: "fa-music" },
          power: { label: "Power (Watts RMS)", options: ["100W", "200W", "300W", "500W", "800W", "1000W", "1200W", "1500W", "2000W", "3000W", "5000W", "10000W+"], icon: "fa-bolt" },
          brand: { label: "Brand", options: ["JBL", "QSC", "Yamaha", "Mackie", "EV (Electro-Voice)", "Behringer", "Peavey", "Bose", "Pioneer DJ", "Numark", "Shure", "Sennheiser", "LD Systems", "RCF", "Generic/No Name", "Other"], icon: "fa-tag", allowCustom: true },
          usage: { label: "Usage", options: ["Purchase (New)", "Purchase (Used)", "Rental (Daily)", "Rental (Weekend Package)", "Rental (Includes Sound Engineer)"], icon: "fa-calendar" },
          condition: { label: "Condition", options: ["Brand New", "New (Open Box)", "Used - Like New (Mint)", "Used - Good (Normal wear)", "Used - Fair (Scratches but works)"], icon: "fa-star" },
        }
      },
      lighting: {
        name: "Party & Event Lighting",
        icon: "fa-lightbulb",
        specs: {
          type: { label: "Lighting Type", options: ["String Lights (Fairy - Battery/USB)", "String Lights (Globe - 10m)", "String Lights (Edison Bulb - 15m)", "LED Strip (RGB - 5m Roll)", "LED Strip (Warm White - 5m)", "Disco Ball (20cm - Motorized)", "Disco Ball (30cm - Mirror)", "DJ Light (Moving Head - Beam)", "DJ Light (Moving Head - Spot)", "DJ Light (Laser - RGB)", "DJ Light (Strobe - 100W)", "DJ Light (LED PAR - 18x18W)", "DJ Light (LED PAR - 12x12W)", "Flood Light (LED - 50W Outdoor)", "Flood Light (LED - 100W Outdoor)", "Uplight (LED - Wireless/RGB)", "Uplight (LED - Wired/Warm White)", "Spotlight (LED - 30W Pin)", "Spotlight (Follow Spot - 300W)", "Blacklight (UV - 36W)", "Blacklight (UV LED Bar)", "Glow Stick (Party - 6 inch)", "Glow Necklace (Party)", "Glow Bracelet (Party)", "LED Balloon (Balloon Light)", "LED Candle (Flickering - Battery)", "LED Candle (Tealight - Battery)", "Paper Lantern (LED - 10\" Ball)", "Paper Lantern (LED - 14\" Ball)", "Light Stand (T-bar - 2m)", "Light Stand (Crank - 3m)", "Truss (Lighting - 2m section)", "Truss (Lighting - 1m triangle)", "Dimmer Pack (Lighting Controller)", "DMX Cable (3 pin - 5m)", "DMX Controller (Basic - 8 Channels)", "DMX Controller (Advanced - 192 Channels)", "Hazer (Fog Machine - 400W)", "Fog Machine (600W)", "Fog Machine (1000W)", "Fog Fluid (Water Based - 1L)", "Fog Fluid (Water Based - 5L)", "Bubble Machine (Party - 100W)", "Sparkle Ball (Motorized)"], icon: "fa-lightbulb" },
          power: { label: "Power (Watts)", options: ["5W", "10W", "20W", "30W", "50W", "100W", "200W", "300W", "400W", "600W", "1000W", "Not Applicable (Battery operated)"], icon: "fa-bolt" },
          color: { label: "Color", options: ["RGB (Full Color Changing)", "Warm White (2700K)", "Cool White (6000K)", "Red", "Blue", "Green", "Yellow", "Amber", "UV (Blacklight)", "Multicolor", "Single Color (Specify)"], icon: "fa-palette", allowCustom: true },
          usage: { label: "Usage", options: ["Purchase (New)", "Purchase (Used)", "Rental (Daily)", "Rental (Includes Setup)"], icon: "fa-calendar" },
          condition: { label: "Condition", options: ["Brand New", "New (Open Box)", "Used - Like New", "Used - Good (Working)", "Used - Fair (Some LEDs out)"], icon: "fa-star" },
        }
      },
      party_favors: {
        name: "Party Favors & Gifts",
        icon: "fa-gift",
        specs: {
          type: { label: "Favor Type", options: ["Wedding Favor (Personalized - Candy Box)", "Wedding Favor (Mini Champagne Bottle)", "Wedding Favor (Bottle Opener Keychain)", "Birthday Favor (Goodie Bag - Kids)", "Birthday Favor (Goodie Bag - Adults)", "Baby Shower Favor (Soap - Baby Shaped)", "Baby Shower Favor (Candle - Small)", "Bridal Shower Favor (Sachet - Lavender)", "Birthday Goodie Bag (Plastic - 6x9\")", "Birthday Goodie Bag (Paper - Kraft)", "Favor Box (Candy - Cardboard)", "Favor Box (Popcorn - Movie Theme)", "Favor Tag (Thank You - Sticker)", "Favor Tag (Custom Name - Card)", "Candy Buffet (Bulk - Assorted Wrappers)", "Party Popper (Confetti - Pull String)", "Party Popper (Cracker - Pull Tab)", "Party Horn (Blowout - Plastic)", "Party Hat (Paper - Cone)", "Party Hat (Glitter - Cardstock)", "Tiara (Birthday - Sparkle)", "Crown (Birthday - Gold Cardboard)", "Noise Maker (Whistle - Plastic)", "Bubble Wands (Favor - Mini", "Personalized Stickers (Name Label - Roll)", "Wedding Sparklers (40cm - Pack of 10)", "Wedding Sparklers (50cm - Pack of 20)", "Hand Sanitizer (Mini - 30ml Favor)", "Hand Lotion (Mini - 30ml Favor)", "Lip Balm (Personalized - Favor)", "Mini Candle (Soy Wax - 2 oz)", "Mini Notebook (Favor - Notepad)", "Keychain (Acrylic - Custom Text)", "Magnet (Fridge - Wedding Date)", "Puzzle (Mini - Favor Box)", "Stickers (Sheet - Kids Favor)", "Temporary Tattoos (Kids Favor Pack)", "Slap Bracelet (Party Favor)", "Silicone Wristband (Custom Text)", "Mini Playing Cards (Favor Deck)", "Beach Ball (Mini - Inflatable)", "Whistle (Sports Party Favor)", "Stretchy Animals (Fidget Toy)", "Finger Puppet (Favor - Animal Set)", "Ring Pop (Candy Favor)", "Lollipop (Personalized Label)"], icon: "fa-gift" },
          quantity: { label: "Quantity", options: ["1 piece", "5 pieces", "10 pieces", "12 pieces", "15 pieces", "20 pieces", "24 pieces", "25 pieces", "30 pieces", "36 pieces", "40 pieces", "48 pieces", "50 pieces", "60 pieces", "72 pieces", "100 pieces", "144 pieces (Gross)", "200 pieces", "250 pieces", "500 pieces", "1000 pieces", "Bag of 10", "Box of 50", "Box of 100", "Roll (Stickers - 100)", "Pack of 12", "Pack of 24", "Pack of 50", "Pack of 100"], icon: "fa-hashtag" },
          theme: { label: "Theme/Occasion", options: ["Wedding (Mr & Mrs)", "Birthday (Happy Birthday)", "Birthday (Age - 1, 5, 10, 18, 21, 30, 40, 50, 60+)", "Baby Shower (It's a Boy)", "Baby Shower (It's a Girl)", "Gender Reveal (Boy/Girl)", "Bridal Shower (Bride To Be)", "Anniversary (Gold/Silver)", "Graduation (Class of 2024)", "Christmas (Holiday)", "Easter (Spring)", "Halloween (Spooky)", "New Year (Party 2025)", "Valentine's Day (Love)", "Retirement (Farewell)", "Corporate Event (Logo Branded)", "Generic (No Theme)"], icon: "fa-star", allowCustom: true },
          customization: { label: "Customization", options: ["Standard (No Text)", "Personalized (Text - Add details)", "Custom Name (Each)", "Custom Date (Wedding Date)", "Logo Printed (Corporate)", "Handwritten Tag (Calligraphy)", "Not Customizable"], icon: "fa-pen", allowCustom: true },
          condition: { label: "Condition", options: ["Brand New (Sealed)", "New (Unused)", "Handmade (Custom Order)"], icon: "fa-star" },
        }
      },
      balloons: {
        name: "Balloons (Specialty)",
        icon: "fa-balloon",
        specs: {
          type: { label: "Balloon Type", options: ["Latex Balloon (11\" - Assorted)", "Latex Balloon (11\" - Single Color)", "Latex Balloon (5\" - Mini)", "Latex Balloon (36\" - Jumbo)", "Foil Balloon (Number - 0-9)", "Foil Balloon (Letter - A-Z)", "Foil Balloon (Star/Moon/Heart)", "Foil Balloon (Character - Unicorn)", "Foil Balloon (Shape - Circle 18\")", "Foil Balloon (Shape - Square 18\")", "Foil Balloon (Shape - Heart 18\")", "Confetti Balloon (Clear Latex)", "Confetti Balloon (Foil - Number)", "LED Balloon (Light Up - Battery)", "Bubble Balloon (Clear Latex - 14\")", "Modeling Balloon (Twisting - 260)", "Duck Balloon (Clackers - Sound)", "Water Balloon (Small - 100 pack)", "Balloon Arch (Pre-made Kit)", "Balloon Column (Pre-made Kit)", "Balloon Garland (DIY Kit)", "Balloon Drop Kit (Net with 100 balloons)", "Balloon Weights (Plastic Cup)", "Balloon Ribbon (Curling - Roll)", "Balloon Tape (Adhesive strip)", "Balloon Sizer (Box - 11\")", "Balloon Sealer (Heat - For Foil)", "Balloon Decorating Strip (Plastic track)"], icon: "fa-balloon" },
          color: { label: "Color", options: ["Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Pink", "Lavender", "Peach", "Mint Green", "Teal", "Navy", "Black", "White", "Ivory", "Gold (Metallic)", "Silver (Metallic)", "Rose Gold (Metallic)", "Chrome (Mirror Effect)", "Pastel Pink", "Pastel Blue", "Pastel Yellow", "Pastel Green", "Pastel Purple", "Assorted (Mix)", "Clear (Transparent)", "Confetti Inside", "Custom Printed (Logo/Text)"], icon: "fa-palette", allowCustom: true },
          quantity: { label: "Quantity", options: ["1 piece", "2 pieces", "5 pieces", "10 pieces", "12 pieces", "16 pieces", "20 pieces", "25 pieces", "30 pieces", "50 pieces", "60 pieces", "72 pieces", "75 pieces", "80 pieces", "100 pieces (Bag)", "200 pieces (Bag)", "250 pieces", "500 pieces (Bulk)", "1000 pieces (Case)", "Gross (144 pieces)", "Roll (100ft - Ribbon)"], icon: "fa-hashtag" },
          inflation: { label: "Inflation Type", options: ["Air (Room Air - Sink)", "Helium (Floats - Professional)", "Air (Helium - Will not float)", "DIY (Pump Required)", "Not Inflated (Balloon only)"], icon: "fa-air-freshener" },
          condition: { label: "Condition", options: ["Brand New (Sealed)", "New (Uninflated)", "Pre-inflated (Ready for pickup)"], icon: "fa-star" },
        }
      }
    }
  }
};

// ─── EXPORT ─────────────────────────────────────────────────────────────────

export default categoryData;