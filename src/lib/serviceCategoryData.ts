// Service Business Type Specifications Database
// Single source of truth for all service categories and their specifications
// EXPANDED VERSION with all missing categories and subcategories

export interface ServiceSpec {
  label: string;
  icon: string;
  options: string[];
  multiple?: boolean;
  allowCustom?: boolean;
}

export interface ServiceSubcategory {
  name: string;
  icon: string;
  specs: Record<string, ServiceSpec>;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  gradient: string;
  description: string;
  subcategories: Record<string, ServiceSubcategory>;
}

// ─── FULL EXPANDED SERVICE DATA ─────────────────────────────────────────────

export const serviceData: Record<string, ServiceCategory> = {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. BEAUTY & HAIR
  // ═══════════════════════════════════════════════════════════════════════════
  beauty: {
    id: "beauty",
    name: "Beauty & Hair",
    icon: "💇‍♀️",
    gradient: "from-[#f3e8ff] to-[#e9d5ff]",
    description: "Hair styling, makeup, nails, massage, facials, and waxing services",
    subcategories: {
      hair_styling: {
        name: "Hair Styling",
        icon: "fa-cut",
        specs: {
          service_type: { label: "Service Type", icon: "fa-cut", options: ["Hair Braiding", "Haircut", "Coloring", "Treatment", "Styling", "Weave Install", "Wig Install", "Locs", "Twists", "Cornrows", "Box Braids", "Knotless Braids"], allowCustom: true },
          hair_length: { label: "Hair Length", icon: "fa-ruler", options: ["Short (<2\")", "Medium (2-6\")", "Long (6-12\")", "Extra Long (12-20\")", "Very Long (20\"+)"] },
          hair_texture: { label: "Hair Texture", icon: "fa-wind", options: ["Straight", "Wavy", "Curly", "Coily (4C)", "All Types"] },
          products: { label: "Products Used", icon: "fa-pump-soap", options: ["Organic", "Synthetic", "Human Hair", "X-Pression", "Kanekalon", "Client Choice", "I Provide"], allowCustom: true },
          duration: { label: "Duration (hours)", icon: "fa-clock", options: ["1-2 hours", "2-3 hours", "3-4 hours", "4-5 hours", "5-6 hours", "6+ hours"] },
          price_range: { label: "Price Range (KES)", icon: "fa-tag", options: ["500-1000", "1000-2000", "2000-3000", "3000-5000", "5000-8000", "8000-10000", "10000+"] },
        },
      },
      makeup: {
        name: "Makeup",
        icon: "fa-magic",
        specs: {
          service_type: { label: "Service Type", icon: "fa-magic", options: ["Bridal Makeup", "Evening Makeup", "Editorial Makeup", "Photoshoot Makeup", "Everyday Makeup", "Special Effects", "Airbrush Makeup", "Facial Makeup"] },
          occasion: { label: "Occasion", icon: "fa-glass-cheers", options: ["Wedding", "Party", "Photoshoot", "Graduation", "Date Night", "Work Event", "Funeral"] },
          skin_type: { label: "Skin Type", icon: "fa-hand-sparkles", options: ["Normal", "Dry", "Oily", "Combination", "Sensitive", "Acne-Prone"] },
          includes: { label: "Includes", icon: "fa-check-circle", options: ["Foundation", "Eyeshadow", "Eyeliner", "Mascara", "Blush", "Highlighter", "Lipstick", "Setting Spray", "All of Above"], multiple: true },
          location: { label: "Location", icon: "fa-map-marker-alt", options: ["My Studio", "Client Location", "On-Site Event", "Destination Wedding"] },
        },
      },
      nails: {
        name: "Nails",
        icon: "fa-hand-peace",
        specs: {
          service_type: { label: "Service Type", icon: "fa-hand-peace", options: ["Manicure", "Pedicure", "Acrylic Nails", "Gel Nails", "Dip Powder", "Nail Art", "Nail Repair", "Cuticle Treatment"] },
          length: { label: "Nail Length", icon: "fa-ruler", options: ["Short", "Medium", "Long", "Extra Long"] },
          design: { label: "Design", icon: "fa-paint-brush", options: ["Plain", "French Tip", "Ombre", "Glitter", "3D Art", "Custom Design", "Seasonal"], allowCustom: true },
          duration: { label: "Duration", icon: "fa-clock", options: ["30-45 min", "45-60 min", "1-1.5 hours", "1.5-2 hours", "2+ hours"] },
        },
      },
      massage: {
        name: "Massage",
        icon: "fa-spa",
        specs: {
          service_type: { label: "Service Type", icon: "fa-spa", options: ["Swedish Massage", "Deep Tissue", "Hot Stone", "Aromatherapy", "Sports Massage", "Prenatal Massage", "Reflexology", "Chair Massage", "Couples Massage"] },
          duration: { label: "Duration", icon: "fa-clock", options: ["30 min", "45 min", "60 min", "90 min", "120 min"] },
          location: { label: "Location", icon: "fa-map-marker-alt", options: ["My Studio", "Client Home", "Mobile Service", "Spa"] },
          add_ons: { label: "Add-ons", icon: "fa-plus-circle", options: ["Hot Towels", "Essential Oils", "Hot Stones", "Cupping", "Scrub", "Mask"], multiple: true },
        },
      },
      facials: {
        name: "Facials & Skincare",
        icon: "fa-face-smile",
        specs: {
          service_type: { label: "Service Type", icon: "fa-face-smile", options: ["Basic Facial", "Deep Cleansing", "Anti-Aging", "Acne Treatment", "Hydrating Facial", "Brightening Facial", "Chemical Peel", "Microdermabrasion"] },
          skin_concern: { label: "Skin Concern", icon: "fa-exclamation-circle", options: ["Acne", "Dark Spots", "Wrinkles", "Dryness", "Oiliness", "Sensitivity", "Hyperpigmentation"], multiple: true },
          duration: { label: "Duration", icon: "fa-clock", options: ["30 min", "45 min", "60 min", "90 min"] },
          products: { label: "Products Used", icon: "fa-pump-soap", options: ["Organic", "Medical Grade", "Natural", "Client's Own", "I Provide"] },
        },
      },
      waxing: {
        name: "Waxing & Hair Removal",
        icon: "fa-remove-format",
        specs: {
          service_type: { label: "Service Type", icon: "fa-remove-format", options: ["Eyebrow Waxing", "Upper Lip", "Chin", "Underarm", "Arms", "Legs", "Bikini", "Brazilian", "Back", "Chest", "Full Body"] },
          wax_type: { label: "Wax Type", icon: "fa-tint", options: ["Hard Wax", "Soft Wax", "Sugar Wax", "Honey Wax"] },
          hair_length: { label: "Hair Length", icon: "fa-ruler", options: ["1/4 inch", "1/2 inch", "3/4 inch", "1 inch+"] },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. HOME SERVICES (EXPANDED)
  // ═══════════════════════════════════════════════════════════════════════════
  home: {
    id: "home",
    name: "Home Services",
    icon: "🔧",
    gradient: "from-[#fef3c7] to-[#fde68a]",
    description: "Plumbing, electrical, carpentry, painting, HVAC, appliance repair, and more",
    subcategories: {
      plumbing: {
        name: "Plumbing",
        icon: "fa-wrench",
        specs: {
          service_type: { label: "Service Type", icon: "fa-wrench", options: ["Leak Repair", "Pipe Installation", "Drain Cleaning", "Toilet Repair", "Water Heater", "Bathroom Renovation", "Kitchen Sink", "Burst Pipe Emergency", "Water Tank Installation"] },
          urgency: { label: "Urgency", icon: "fa-exclamation-circle", options: ["Emergency (Same Day)", "Standard (1-3 Days)", "Scheduled (1+ Week)"] },
          property_type: { label: "Property Type", icon: "fa-home", options: ["Apartment", "House", "Commercial", "Industrial"] },
          materials: { label: "Materials", icon: "fa-toolbox", options: ["I Bring Materials", "Client Provides", "Consultation Needed"] },
        },
      },
      electrical: {
        name: "Electrical",
        icon: "fa-bolt",
        specs: {
          service_type: { label: "Service Type", icon: "fa-bolt", options: ["Wiring", "Lighting Installation", "Outlet Repair", "Circuit Breaker", "Ceiling Fan", "Security Lights", "Electrical Inspection", "Generator Installation", "Solar Installation"] },
          urgency: { label: "Urgency", icon: "fa-exclamation-circle", options: ["Emergency", "Standard", "Scheduled"] },
          property_type: { label: "Property Type", icon: "fa-home", options: ["Residential", "Commercial", "Industrial"] },
          certification: { label: "Certification", icon: "fa-certificate", options: ["Licensed Electrician", "Certified", "Apprentice", "Master Electrician"] },
        },
      },
      carpentry: {
        name: "Carpentry & Woodwork",
        icon: "fa-hammer",
        specs: {
          service_type: { label: "Service Type", icon: "fa-hammer", options: ["Furniture Making", "Cabinet Installation", "Door Repair", "Window Frames", "Deck Building", "Flooring", "Custom Woodwork", "Shelving"] },
          material: { label: "Material", icon: "fa-tree", options: ["Hardwood", "Softwood", "MDF", "Plywood", "Client Provides", "I Provide"] },
          finish: { label: "Finish", icon: "fa-paint-roller", options: ["Stained", "Painted", "Varnished", "Natural", "Client Choice"] },
        },
      },
      painting: {
        name: "Painting & Decorating",
        icon: "fa-paint-roller",
        specs: {
          service_type: { label: "Service Type", icon: "fa-paint-roller", options: ["Interior Painting", "Exterior Painting", "Wallpaper Installation", "Texture Finishes", "Decorative Painting", "Furniture Painting", "Ceiling Painting"] },
          room_count: { label: "Number of Rooms", icon: "fa-home", options: ["1 Room", "2 Rooms", "3 Rooms", "4+ Rooms", "Whole House"] },
          paint_type: { label: "Paint Type", icon: "fa-tint", options: ["Matt", "Satin", "Gloss", "Emulsion", "Oil-Based", "Client Provides", "I Provide"] },
        },
      },
      appliance_repair: {
        name: "Appliance Repair",
        icon: "fa-microchip",
        specs: {
          service_type: { label: "Service Type", icon: "fa-microchip", options: ["Refrigerator", "Washing Machine", "Dryer", "Dishwasher", "Oven/Stove", "Microwave", "AC Unit", "Water Dispenser", "Vacuum Cleaner"] },
          brand: { label: "Brand", icon: "fa-tag", options: ["Samsung", "LG", "Bosch", "Whirlpool", "Generic", "Other"], allowCustom: true },
          urgency: { label: "Urgency", icon: "fa-exclamation-circle", options: ["Emergency", "Standard", "Scheduled"] },
          warranty: { label: "Warranty on Repair", icon: "fa-shield-alt", options: ["30 Days", "90 Days", "6 Months", "1 Year", "No Warranty"] },
        },
      },
      cleaning: {
        name: "Home Cleaning",
        icon: "fa-broom",
        specs: {
          service_type: { label: "Service Type", icon: "fa-broom", options: ["Regular Cleaning", "Deep Cleaning", "Move In/Out", "Post-Construction", "Office Cleaning", "Window Cleaning", "Carpet Cleaning", "Upholstery Cleaning"] },
          property_size: { label: "Property Size", icon: "fa-ruler-combined", options: ["Studio/1 Bed", "2 Bedroom", "3 Bedroom", "4+ Bedroom", "Office Space", "Commercial"] },
          frequency: { label: "Frequency", icon: "fa-redo", options: ["One-Time", "Weekly", "Bi-Weekly", "Monthly", "On Demand"] },
          supplies: { label: "Supplies", icon: "fa-spray-can", options: ["I Bring Everything", "Client Provides", "Eco-Friendly Only"] },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. HEALTH & WELLNESS (EXPANDED)
  // ═══════════════════════════════════════════════════════════════════════════
  health: {
    id: "health",
    name: "Health & Wellness",
    icon: "🏥",
    gradient: "from-[#dcfce7] to-[#bbf7d0]",
    description: "Personal training, yoga, nutrition coaching, therapy, and wellness services",
    subcategories: {
      personal_training: {
        name: "Personal Training",
        icon: "fa-dumbbell",
        specs: {
          service_type: { label: "Service Type", icon: "fa-dumbbell", options: ["One-on-One Training", "Small Group", "Online Coaching", "Couples Training", "Senior Fitness", "Post-Rehab"] },
          specialty: { label: "Specialty", icon: "fa-star", options: ["Weight Loss", "Muscle Gain", "Endurance", "Strength Training", "Sports Specific", "Pre/Post Natal", "Senior Fitness"], multiple: true },
          location: { label: "Location", icon: "fa-map-marker-alt", options: ["My Gym", "Client Home", "Outdoor", "Online", "Corporate Gym"] },
          session_length: { label: "Session Length", icon: "fa-clock", options: ["30 min", "45 min", "60 min", "90 min"] },
          equipment: { label: "Equipment", icon: "fa-dumbbell", options: ["Full Gym", "Minimal", "Bodyweight Only", "I Bring Equipment"] },
        },
      },
      yoga: {
        name: "Yoga & Pilates",
        icon: "fa-praying-hands",
        specs: {
          service_type: { label: "Service Type", icon: "fa-praying-hands", options: ["Hatha Yoga", "Vinyasa Flow", "Hot Yoga", "Yin Yoga", "Restorative", "Prenatal Yoga", "Kids Yoga", "Pilates Mat", "Pilates Reformer"] },
          level: { label: "Level", icon: "fa-chart-line", options: ["Beginner", "Intermediate", "Advanced", "All Levels", "Gentle/Senior"] },
          group_size: { label: "Group Size", icon: "fa-users", options: ["Private (1-on-1)", "Small Group (2-4)", "Medium Group (5-10)", "Large Group (10+)", "Corporate/Team"] },
          duration: { label: "Duration", icon: "fa-clock", options: ["30 min", "45 min", "60 min", "75 min", "90 min"] },
          location: { label: "Location", icon: "fa-map-marker-alt", options: ["Studio", "Client Home", "Outdoor", "Online", "Corporate"] },
        },
      },
      nutrition: {
        name: "Nutrition Coaching",
        icon: "fa-apple-alt",
        specs: {
          service_type: { label: "Service Type", icon: "fa-apple-alt", options: ["Meal Planning", "Weight Management", "Sports Nutrition", "Medical Nutrition", "Detox Programs", "Grocery Shopping Help"] },
          goal: { label: "Goal", icon: "fa-bullseye", options: ["Weight Loss", "Weight Gain", "Healthy Eating", "Disease Management", "Sports Performance", "Pregnancy Nutrition"] },
          duration: { label: "Program Length", icon: "fa-calendar", options: ["1 Month", "3 Months", "6 Months", "12 Months", "Single Consultation"] },
          follow_up: { label: "Follow-up Included", icon: "fa-sync", options: ["Weekly Check-ins", "Bi-weekly", "Monthly", "On Request"] },
        },
      },
      therapy: {
        name: "Therapy & Counseling",
        icon: "fa-heart",
        specs: {
          service_type: { label: "Service Type", icon: "fa-heart", options: ["Individual Therapy", "Couples Counseling", "Family Therapy", "Group Therapy", "Child/Adolescent", "Online Therapy", "Crisis Counseling", "Career Counseling"] },
          specialty: { label: "Specialty", icon: "fa-star", options: ["Anxiety", "Depression", "Trauma/PTSD", "Relationship Issues", "Grief/Loss", "Addiction", "Anger Management", "Stress Management"], multiple: true },
          session_type: { label: "Session Type", icon: "fa-laptop", options: ["In-Person", "Video Call", "Phone Call", "Text-Based"] },
          duration: { label: "Session Length", icon: "fa-clock", options: ["30 min", "45 min", "60 min", "90 min"] },
          license: { label: "License", icon: "fa-certificate", options: ["Licensed Psychologist", "Licensed Counselor", "Social Worker", "Life Coach", "In-Training"] },
        },
      },
      massage_therapy: {
        name: "Massage Therapy",
        icon: "fa-spa",
        specs: {
          service_type: { label: "Service Type", icon: "fa-spa", options: ["Swedish", "Deep Tissue", "Sports Massage", "Prenatal", "Trigger Point", "Hot Stone", "Aromatherapy", "Reflexology", "Couples Massage"] },
          focus_area: { label: "Focus Area", icon: "fa-map-pin", options: ["Full Body", "Back & Neck", "Legs & Feet", "Shoulders", "Arms & Hands", "Specific Injury"], multiple: true },
          duration: { label: "Duration", icon: "fa-clock", options: ["30 min", "45 min", "60 min", "90 min", "120 min"] },
          location: { label: "Location", icon: "fa-map-marker-alt", options: ["Spa/Clinic", "Mobile/Home Visit", "Corporate", "Outdoor Event"] },
        },
      },
      physical_therapy: {
        name: "Physical Therapy",
        icon: "fa-activity",
        specs: {
          service_type: { label: "Service Type", icon: "fa-activity", options: ["Injury Rehabilitation", "Post-Surgery Rehab", "Sports Injury", "Back Pain", "Neck Pain", "Joint Pain", "Balance Training", "Geriatric Therapy"] },
          condition: { label: "Condition", icon: "fa-exclamation-circle", options: ["ACL/Knee", "Shoulder", "Back/Spine", "Ankle/Foot", "Wrist/Hand", "Neck", "Chronic Pain"], multiple: true, allowCustom: true },
          session_length: { label: "Session Length", icon: "fa-clock", options: ["30 min", "45 min", "60 min", "90 min"] },
          location: { label: "Location", icon: "fa-map-marker-alt", options: ["Clinic", "Home Visit", "Online/Telehealth", "Gym/Sports Facility"] },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. EDUCATION & TUTORING (EXPANDED)
  // ═══════════════════════════════════════════════════════════════════════════
  education: {
    id: "education",
    name: "Education",
    icon: "📚",
    gradient: "from-[#e0e7ff] to-[#c7d2fe]",
    description: "Tutoring, test prep, language lessons, music lessons, and professional training",
    subcategories: {
      academic_tutoring: {
        name: "Academic Tutoring",
        icon: "fa-book",
        specs: {
          subject: { label: "Subject", icon: "fa-book", options: ["Mathematics", "English", "Kiswahili", "Science", "Physics", "Chemistry", "Biology", "History", "Geography", "Business Studies", "Computer Science", "Foreign Language"], allowCustom: true },
          grade_level: { label: "Grade/Level", icon: "fa-graduation-cap", options: ["Primary (Grade 1-8)", "Secondary (Form 1-4)", "High School (9-12)", "College/University", "Adult Education"] },
          exam_prep: { label: "Exam Prep", icon: "fa-file-alt", options: ["KCPE", "KCSE", "SAT", "IGCSE", "IB", "TOEFL", "IELTS", "GMAT", "GRE"], multiple: true },
          format: { label: "Format", icon: "fa-chalkboard-teacher", options: ["One-on-One", "Small Group (2-4)", "Medium Group (5-10)", "Classroom (10+)"] },
          delivery: { label: "Delivery", icon: "fa-laptop", options: ["In-Person", "Online Live", "Recorded", "Hybrid"] },
          session_length: { label: "Session Length", icon: "fa-clock", options: ["30 min", "45 min", "60 min", "90 min", "2 hours", "3 hours"] },
        },
      },
      language_lessons: {
        name: "Language Lessons",
        icon: "fa-language",
        specs: {
          language: { label: "Language", icon: "fa-language", options: ["English", "Kiswahili", "French", "Spanish", "German", "Italian", "Chinese/Mandarin", "Arabic", "Japanese", "Portuguese"], allowCustom: true },
          level: { label: "Level", icon: "fa-chart-line", options: ["Beginner (A1-A2)", "Intermediate (B1-B2)", "Advanced (C1-C2)", "Conversational", "Business", "Test Prep"] },
          focus: { label: "Focus Area", icon: "fa-bullseye", options: ["General Conversation", "Business Language", "Exam Preparation", "Writing", "Reading", "Listening", "Speaking"], multiple: true },
          delivery: { label: "Delivery", icon: "fa-laptop", options: ["In-Person", "Online", "Both"] },
          intensity: { label: "Intensity", icon: "fa-chart-line", options: ["Casual (1-2x/week)", "Moderate (3-4x/week)", "Intensive (5x/week)", "Immersion"] },
        },
      },
      music_lessons: {
        name: "Music Lessons",
        icon: "fa-music",
        specs: {
          instrument: { label: "Instrument", icon: "fa-music", options: ["Piano/Keyboard", "Guitar", "Violin", "Drums", "Voice/Singing", "Saxophone", "Flute", "Trumpet", "Cello", "Ukulele"], allowCustom: true },
          level: { label: "Level", icon: "fa-chart-line", options: ["Beginner", "Intermediate", "Advanced", "Professional", "Grade Prep"] },
          theory_included: { label: "Music Theory", icon: "fa-book", options: ["Included", "Optional", "Separate Lessons"] },
          format: { label: "Format", icon: "fa-chalkboard-teacher", options: ["Individual", "Small Group", "Online", "In-Person", "Hybrid"] },
          materials: { label: "Materials", icon: "fa-box", options: ["I Provide", "Student Provides", "Recommended Purchase"] },
        },
      },
      test_prep: {
        name: "Test Preparation",
        icon: "fa-file-alt",
        specs: {
          exam_type: { label: "Exam Type", icon: "fa-file-alt", options: ["KCPE", "KCSE", "SAT", "ACT", "IGCSE", "IB", "TOEFL", "IELTS", "GMAT", "GRE", "LSAT", "MCAT"], allowCustom: true },
          subject_focus: { label: "Subject Focus", icon: "fa-book", options: ["Math", "Reading/Writing", "Science", "Verbal", "Quantitative", "All Sections"], multiple: true },
          intensity: { label: "Intensity", icon: "fa-chart-line", options: ["Crash Course (1-2 weeks)", "Standard (1-3 months)", "Long-term (3-6 months)", "Year-long"] },
          includes: { label: "Includes", icon: "fa-check-circle", options: ["Practice Tests", "Study Materials", "Strategy Sessions", "Homework Review"], multiple: true },
        },
      },
      coding_classes: {
        name: "Coding & Tech Classes",
        icon: "fa-code",
        specs: {
          language: { label: "Programming Language", icon: "fa-code", options: ["Python", "JavaScript", "Java", "C++", "HTML/CSS", "React", "Node.js", "SQL", "Swift", "Ruby"], multiple: true, allowCustom: true },
          level: { label: "Level", icon: "fa-chart-line", options: ["Absolute Beginner", "Beginner", "Intermediate", "Advanced", "Professional"] },
          project_type: { label: "Project Type", icon: "fa-laptop-code", options: ["Web Development", "Mobile Apps", "Data Science", "Game Development", "Automation", "API Development"], multiple: true },
          format: { label: "Format", icon: "fa-chalkboard-teacher", options: ["One-on-One", "Small Group", "Bootcamp", "Online Live", "Self-Paced with Mentor"] },
        },
      },
      professional_training: {
        name: "Professional Training",
        icon: "fa-briefcase",
        specs: {
          field: { label: "Field", icon: "fa-briefcase", options: ["Leadership", "Management", "Communication", "Public Speaking", "Sales", "Customer Service", "Project Management", "Digital Marketing", "Excel", "Data Analysis"], allowCustom: true },
          format: { label: "Format", icon: "fa-chalkboard-teacher", options: ["Workshop", "Seminar", "One-on-One Coaching", "Online Course", "In-Person Training"] },
          duration: { label: "Duration", icon: "fa-clock", options: ["Half Day", "Full Day", "2-Day Workshop", "1 Week", "Certificate Program"] },
          certification: { label: "Certification", icon: "fa-certificate", options: ["Certificate of Completion", "Industry Certification", "Accredited", "No Certification"] },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. AUTOMOTIVE SERVICES (EXPANDED)
  // ═══════════════════════════════════════════════════════════════════════════
  automotive: {
    id: "automotive",
    name: "Automotive",
    icon: "🚗",
    gradient: "from-[#fecaca] to-[#fecaca]",
    description: "Car repair, detailing, oil changes, tire services, diagnostics, and more",
    subcategories: {
      repair_maintenance: {
        name: "Repair & Maintenance",
        icon: "fa-wrench",
        specs: {
          service_type: { label: "Service Type", icon: "fa-wrench", options: ["Oil Change", "Brake Service", "Engine Repair", "Transmission", "Suspension", "AC Service", "Cooling System", "Electrical Repair", "Exhaust System", "Fuel System"] },
          vehicle_type: { label: "Vehicle Type", icon: "fa-car", options: ["Sedan", "SUV", "Truck", "Van", "Luxury", "Motorcycle", "All Types"] },
          urgency: { label: "Urgency", icon: "fa-exclamation-circle", options: ["Emergency/Tow-In", "Standard (1-3 Days)", "Scheduled Appointment"] },
          parts: { label: "Parts", icon: "fa-cogs", options: ["OEM Parts", "Aftermarket", "Used/Recycled", "Client Provides", "Consultation"] },
          warranty: { label: "Warranty", icon: "fa-shield-alt", options: ["30 Days", "90 Days", "6 Months", "1 Year", "Lifetime on Parts"] },
        },
      },
      detailing: {
        name: "Detailing & Car Wash",
        icon: "fa-car-side",
        specs: {
          service_type: { label: "Service Type", icon: "fa-car-side", options: ["Exterior Wash", "Interior Cleaning", "Full Detail", "Paint Correction", "Ceramic Coating", "Headlight Restoration", "Upholstery Cleaning", "Engine Bay Cleaning"] },
          vehicle_size: { label: "Vehicle Size", icon: "fa-car", options: ["Small Car", "Medium Sedan", "Large SUV", "Truck", "Van", "Motorcycle"] },
          extras: { label: "Extras", icon: "fa-plus-circle", options: ["Wax", "Clay Bar", "Odor Removal", "Pet Hair Removal", "Scratch Removal"], multiple: true },
          location: { label: "Location", icon: "fa-map-marker-alt", options: ["My Shop", "Mobile (Your Location)", "Office/Corporate"] },
        },
      },
      tire_services: {
        name: "Tire Services",
        icon: "fa-circle",
        specs: {
          service_type: { label: "Service Type", icon: "fa-circle", options: ["Tire Replacement", "Tire Repair/Puncture", "Tire Rotation", "Wheel Alignment", "Tire Balancing", "Tire Storage", "Wheel Installation"] },
          tire_brand: { label: "Tire Brand", icon: "fa-tag", options: ["Michelin", "Bridgestone", "Goodyear", "Continental", "Pirelli", "Budget/Generic", "Client Provides"] },
          quantity: { label: "Quantity", icon: "fa-hashtag", options: ["1 Tire", "2 Tires", "3 Tires", "4 Tires", "Full Set (5)"] },
        },
      },
      diagnostics: {
        name: "Diagnostics",
        icon: "fa-microchip",
        specs: {
          service_type: { label: "Service Type", icon: "fa-microchip", options: ["Check Engine Light", "Computer Diagnostics", "Electrical Diagnosis", "Battery Testing", "Emissions Testing", "Pre-Purchase Inspection"] },
          vehicle_type: { label: "Vehicle Type", icon: "fa-car", options: ["Domestic", "European", "Asian", "Luxury", "All Makes"] },
          includes_report: { label: "Includes Report", icon: "fa-file-alt", options: ["Yes (Detailed)", "Yes (Basic)", "No", "Upon Request"] },
        },
      },
      towing: {
        name: "Towing & Recovery",
        icon: "fa-truck",
        specs: {
          service_type: { label: "Service Type", icon: "fa-truck", options: ["Emergency Towing", "Long Distance", "Flatbed", "Motorcycle Towing", "Winching/Extraction", "Accident Recovery", "Jump Start", "Flat Tire Change", "Fuel Delivery"] },
          vehicle_type: { label: "Vehicle Type", icon: "fa-car", options: ["Passenger Car", "SUV", "Truck", "Motorcycle", "Bus", "Heavy Equipment"] },
          distance: { label: "Distance", icon: "fa-route", options: ["Within City (0-10km)", "Short (10-25km)", "Medium (25-50km)", "Long (50-100km)", "Extended (100km+)"] },
          available_247: { label: "24/7 Available", icon: "fa-clock", options: ["Yes (24/7/365)", "Limited Hours", "Business Hours Only"] },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. EVENTS & PARTY SERVICES (EXPANDED)
  // ═══════════════════════════════════════════════════════════════════════════
  events: {
    id: "events",
    name: "Events",
    icon: "🎉",
    gradient: "from-[#fce7f3] to-[#fbcfe8]",
    description: "Event planning, decor, DJ, catering, photography, and more",
    subcategories: {
      planning: {
        name: "Event Planning",
        icon: "fa-calendar-star",
        specs: {
          event_type: { label: "Event Type", icon: "fa-calendar-star", options: ["Wedding", "Birthday Party", "Corporate Event", "Concert", "Festival", "Private Party", "Conference", "Fundraiser", "Graduation", "Baby Shower", "Bridal Shower", "Funeral"] },
          guest_count: { label: "Guest Count", icon: "fa-users", options: ["Under 50", "50-100", "100-250", "250-500", "500-1000", "1000+"] },
          services_included: { label: "Services Included", icon: "fa-check-circle", options: ["Venue Sourcing", "Vendor Coordination", "Budget Management", "Timeline Creation", "Day-of Coordination", "Full Planning"], multiple: true },
          budget_range: { label: "Budget Range (KES)", icon: "fa-tag", options: ["Under 50k", "50k-100k", "100k-250k", "250k-500k", "500k-1M", "1M+"] },
        },
      },
      decoration: {
        name: "Decoration",
        icon: "fa-paint-brush",
        specs: {
          decoration_type: { label: "Decoration Type", icon: "fa-paint-brush", options: ["Balloon Decor", "Floral Arrangements", "Table Settings", "Backdrops", "Lighting", "Stage Decor", "Ceiling Draping", "Themed Decor", "Wedding Arch"] },
          theme: { label: "Theme", icon: "fa-star", options: ["Rustic", "Elegant", "Modern", "Bohemian", "Traditional", "Tropical", "Vintage", "Custom"], allowCustom: true },
          setup_time: { label: "Setup Time", icon: "fa-clock", options: ["Same Day (Morning)", "Day Before", "2 Days Before", "Week Before"] },
          includes_teardown: { label: "Includes Teardown", icon: "fa-box", options: ["Yes", "No", "Extra Fee"] },
        },
      },
      djing: {
        name: "DJ & Music",
        icon: "fa-headphones",
        specs: {
          event_type: { label: "Event Type", icon: "fa-calendar-star", options: ["Wedding Reception", "Birthday Party", "Corporate Event", "Club/Nightlife", "Private Party", "School Event"] },
          duration: { label: "Duration", icon: "fa-clock", options: ["2-3 hours", "3-4 hours", "4-5 hours", "5-6 hours", "6+ hours"] },
          equipment: { label: "Equipment Provided", icon: "fa-microphone-alt", options: ["Speaker System", "Microphones", "Lighting", "DJ Controller", "Laptop", "All Equipment"], multiple: true },
          music_genres: { label: "Music Genres", icon: "fa-music", options: ["Afrobeat", "Hip Hop", "R&B", "Dancehall", "EDM", "Pop", "Reggae", "Gospel", "Lingala", "Bongo", "Country", "Rock", "Jazz"], multiple: true, allowCustom: true },
        },
      },
      catering: {
        name: "Catering",
        icon: "fa-utensils",
        specs: {
          cuisine: { label: "Cuisine Type", icon: "fa-utensils", options: ["Local/Kenyan", "Continental", "Italian", "Asian", "Indian", "BBQ/Grill", "Fusion", "Custom Menu", "Halal", "Vegetarian/Vegan"], allowCustom: true },
          event_type: { label: "Event Type", icon: "fa-calendar-star", options: ["Wedding", "Corporate", "Birthday", "Funeral", "Religious", "Casual Gathering"] },
          service_style: { label: "Service Style", icon: "fa-concierge-bell", options: ["Buffet", "Plated", "Family Style", "Food Stations", "Drop Off", "Full Service"] },
          guest_count: { label: "Guest Count", icon: "fa-users", options: ["Under 50", "50-100", "100-250", "250-500", "500+"] },
          dietary: { label: "Dietary Options", icon: "fa-leaf", options: ["Vegetarian", "Vegan", "Halal", "Gluten-Free", "Dairy-Free", "Nut-Free", "Kosher", "All"], multiple: true },
        },
      },
      photography_video: {
        name: "Photography & Video",
        icon: "fa-camera",
        specs: {
          service_type: { label: "Service Type", icon: "fa-camera", options: ["Event Photography", "Video Recording", "Live Streaming", "Photo Booth", "Drone Footage", "Highlight Reel", "Full Documentary"] },
          event_type: { label: "Event Type", icon: "fa-calendar-star", options: ["Wedding", "Birthday", "Corporate", "Concert", "Graduation", "Baby Shower"] },
          duration: { label: "Coverage Duration", icon: "fa-clock", options: ["1-2 hours", "2-4 hours", "4-6 hours", "6-8 hours", "Full Day (8-12)", "Multi-Day"] },
          deliverables: { label: "Deliverables", icon: "fa-images", options: ["Digital Photos", "Printed Photos", "USB Drive", "Online Gallery", "Raw Video", "Edited Video", "Same Day Edit"], multiple: true },
        },
      },
      rentals: {
        name: "Equipment Rentals",
        icon: "fa-chair",
        specs: {
          equipment_type: { label: "Equipment Type", icon: "fa-chair", options: ["Tents", "Chairs", "Tables", "Linens", "Glassware", "Dinnerware", "Lighting", "Sound System", "Dance Floor", "Photo Booth", "Bounce House", "Portable Restrooms"] },
          quantity: { label: "Quantity", icon: "fa-hashtag", options: ["Small (1-10)", "Medium (11-50)", "Large (51-100)", "Extra Large (100+)"] },
          rental_period: { label: "Rental Period", icon: "fa-calendar", options: ["1 Day", "Weekend", "1 Week", "Custom"] },
          delivery: { label: "Delivery Included", icon: "fa-truck", options: ["Yes", "No (Pickup Only)", "Extra Fee"] },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. TECH SUPPORT & IT SERVICES (EXPANDED)
  // ═══════════════════════════════════════════════════════════════════════════
  tech: {
    id: "tech",
    name: "Tech Support",
    icon: "💻",
    gradient: "from-[#dbeafe] to-[#bfdbfe]",
    description: "Computer repair, IT support, web development, app development, and more",
    subcategories: {
      computer_repair: {
        name: "Computer Repair",
        icon: "fa-laptop",
        specs: {
          service_type: { label: "Service Type", icon: "fa-laptop", options: ["Screen Replacement", "Keyboard Repair", "Battery Replacement", "Hard Drive Replacement", "SSD Upgrade", "RAM Upgrade", "Motherboard Repair", "Power Issue", "Water Damage Repair"] },
          device_type: { label: "Device Type", icon: "fa-laptop", options: ["Laptop", "Desktop", "Mac/Apple", "Windows PC", "All-in-One", "Chromebook"] },
          brand: { label: "Brand", icon: "fa-tag", options: ["Dell", "HP", "Lenovo", "Apple", "ASUS", "Acer", "Microsoft", "Other"], allowCustom: true },
          urgency: { label: "Urgency", icon: "fa-exclamation-circle", options: ["Same Day", "24-48 Hours", "3-5 Days", "1 Week"] },
          warranty: { label: "Warranty on Repair", icon: "fa-shield-alt", options: ["30 Days", "90 Days", "6 Months", "1 Year"] },
        },
      },
      phone_repair: {
        name: "Phone Repair",
        icon: "fa-mobile-alt",
        specs: {
          service_type: { label: "Service Type", icon: "fa-mobile-alt", options: ["Screen Replacement", "Battery Replacement", "Charging Port Repair", "Camera Repair", "Speaker/Mic Repair", "Water Damage Repair", "Software Issues", "Unlocking", "Data Recovery"] },
          device_type: { label: "Device Type", icon: "fa-mobile-alt", options: ["iPhone", "Samsung", "Google Pixel", "Huawei", "Xiaomi", "OnePlus", "Other Android"], allowCustom: true },
          turnaround: { label: "Turnaround Time", icon: "fa-clock", options: ["1-2 hours", "Same Day", "24 Hours", "2-3 Days"] },
          parts: { label: "Parts", icon: "fa-cogs", options: ["Original/OEM", "Premium Quality", "Generic", "Client Provides"] },
        },
      },
      web_development: {
        name: "Web Development",
        icon: "fa-code",
        specs: {
          service_type: { label: "Service Type", icon: "fa-code", options: ["Website Design", "E-commerce Site", "Landing Page", "Blog/Portfolio", "Web App", "CMS Integration", "Website Redesign", "Maintenance & Support", "SEO Optimization"] },
          platform: { label: "Platform", icon: "fa-layer-group", options: ["WordPress", "Shopify", "Wix", "Custom HTML/CSS", "React/Vue", "Full Stack", "No-code/Low-code"] },
          pages: { label: "Number of Pages", icon: "fa-file", options: ["1-5", "6-10", "11-20", "21-50", "51-100", "100+"] },
          includes: { label: "Includes", icon: "fa-check-circle", options: ["Domain", "Hosting", "SSL Certificate", "Mobile Responsive", "SEO Setup", "Analytics", "Contact Form", "Social Media Integration"], multiple: true },
          timeline: { label: "Timeline", icon: "fa-calendar", options: ["1-2 Weeks", "2-4 Weeks", "1-3 Months", "3-6 Months", "Custom"] },
        },
      },
      app_development: {
        name: "App Development",
        icon: "fa-mobile",
        specs: {
          service_type: { label: "Service Type", icon: "fa-mobile", options: ["iOS App", "Android App", "Cross-Platform", "UI/UX Design", "App Maintenance", "App Store Submission", "Backend Development"] },
          features: { label: "Key Features", icon: "fa-star", options: ["User Authentication", "Push Notifications", "Payment Gateway", "GPS/Location", "Chat/Messaging", "Photo/Video", "Offline Mode"], multiple: true },
          complexity: { label: "Complexity", icon: "fa-chart-line", options: ["Basic (MVP)", "Standard", "Complex", "Enterprise"] },
        },
      },
      it_support: {
        name: "IT Support",
        icon: "fa-server",
        specs: {
          service_type: { label: "Service Type", icon: "fa-server", options: ["Network Setup", "WiFi Installation", "Server Maintenance", "Data Backup", "Cybersecurity", "Email Setup", "Software Installation", "Virus Removal", "Remote Support", "On-site Support"] },
          client_type: { label: "Client Type", icon: "fa-briefcase", options: ["Home User", "Small Business (1-10)", "Medium Business (11-50)", "Large Business (50+)", "Non-Profit"] },
          support_plan: { label: "Support Plan", icon: "fa-calendar", options: ["One-Time", "Monthly Retainer", "Quarterly", "Annual Contract", "Emergency/On-Call"] },
          response_time: { label: "Response Time", icon: "fa-clock", options: ["Within 1 hour", "Within 4 hours", "Within 24 hours", "Next Business Day"] },
        },
      },
      data_recovery: {
        name: "Data Recovery",
        icon: "fa-hdd",
        specs: {
          service_type: { label: "Service Type", icon: "fa-hdd", options: ["Hard Drive Recovery", "SSD Recovery", "USB/Flash Drive", "Memory Card Recovery", "Phone Data Recovery", "Deleted File Recovery", "Corrupted Drive", "Accidentally Formatted"] },
          storage_type: { label: "Storage Type", icon: "fa-hdd", options: ["HDD", "SSD", "USB Drive", "SD Card", "Phone Internal", "RAID Array"] },
          urgency: { label: "Urgency", icon: "fa-exclamation-circle", options: ["Standard (3-5 Days)", "Expedited (24-48 hours)", "Emergency (Same Day)"] },
          diagnostic: { label: "Diagnostic Fee", icon: "fa-search", options: ["Free", "Charged (Applied to Repair)", "Flat Fee"] },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. FITNESS (EXPANDED)
  // ═══════════════════════════════════════════════════════════════════════════
  fitness: {
    id: "fitness",
    name: "Fitness",
    icon: "🏋️",
    gradient: "from-[#fef3c7] to-[#fde68a]",
    description: "Personal training, group classes, nutrition plans, and sports coaching",
    subcategories: {
      personal_training: {
        name: "Personal Training",
        icon: "fa-user-graduate",
        specs: {
          service_type: { label: "Service Type", icon: "fa-user-graduate", options: ["One-on-One", "Small Group (2-3)", "Couples Training", "Partner Training", "Online Coaching", "Hybrid"] },
          specialty: { label: "Specialty", icon: "fa-star", options: ["Weight Loss", "Muscle Building", "Strength", "Endurance", "Bodybuilding", "CrossFit", "Calisthenics", "Functional Fitness", "Senior Fitness", "Youth Training"], multiple: true },
          session_length: { label: "Session Length", icon: "fa-clock", options: ["30 min", "45 min", "60 min", "90 min"] },
          location: { label: "Location", icon: "fa-map-marker-alt", options: ["My Gym", "Client Home", "Outdoor Park", "Office/Corporate", "Online"] },
          package: { label: "Package Options", icon: "fa-box", options: ["Single Session", "5 Sessions", "10 Sessions", "20 Sessions", "Monthly Unlimited"] },
        },
      },
      group_fitness: {
        name: "Group Fitness Classes",
        icon: "fa-users",
        specs: {
          class_type: { label: "Class Type", icon: "fa-running", options: ["HIIT", "Bootcamp", "Circuit Training", "Zumba", "Dance Fitness", "Spin/Cycling", "Aerobics", "Step Aerobics", "Kickboxing"] },
          class_size: { label: "Class Size", icon: "fa-users", options: ["Small (2-5)", "Medium (6-12)", "Large (13-20)", "Open (20+)"] },
          duration: { label: "Class Duration", icon: "fa-clock", options: ["30 min", "45 min", "60 min", "75 min", "90 min"] },
          level: { label: "Level", icon: "fa-chart-line", options: ["Beginner", "Intermediate", "Advanced", "All Levels"] },
          schedule: { label: "Schedule", icon: "fa-calendar", options: ["Morning (6-9am)", "Mid-day (9am-12pm)", "Afternoon (12-3pm)", "Evening (3-6pm)", "Night (6-9pm)", "Weekends"] },
        },
      },
      sports_coaching: {
        name: "Sports Coaching",
        icon: "fa-futbol",
        specs: {
          sport: { label: "Sport", icon: "fa-futbol", options: ["Soccer/Football", "Basketball", "Tennis", "Swimming", "Boxing", "MMA", "Track & Field", "Volleyball", "Baseball", "Golf", "Rugby"], allowCustom: true },
          level: { label: "Level", icon: "fa-chart-line", options: ["Recreational", "Amateur", "Competitive", "Semi-Pro", "Professional", "Youth", "Adult"] },
          format: { label: "Format", icon: "fa-users", options: ["Individual", "Small Group", "Team Training", "Summer Camp", "Private Lessons"] },
          skill_focus: { label: "Skill Focus", icon: "fa-bullseye", options: ["Fundamentals", "Technique", "Tactics", "Strength & Conditioning", "Speed & Agility", "Game Strategy"], multiple: true },
        },
      },
      nutrition_meal_plan: {
        name: "Nutrition & Meal Plans",
        icon: "fa-apple-alt",
        specs: {
          service_type: { label: "Service Type", icon: "fa-apple-alt", options: ["Meal Planning", "Weight Loss Plan", "Muscle Gain Plan", "Sports Nutrition", "Dietary Consultation", "Grocery Shopping Guide", "Recipe Book"] },
          goal: { label: "Goal", icon: "fa-bullseye", options: ["Weight Loss", "Muscle Gain", "Maintenance", "Sports Performance", "Health Improvement", "Disease Management"] },
          duration: { label: "Program Length", icon: "fa-calendar", options: ["1 Week", "2 Weeks", "1 Month", "3 Months", "6 Months", "Ongoing"] },
          follow_up: { label: "Follow-up", icon: "fa-sync", options: ["Daily Check-ins", "Weekly Check-ins", "Bi-weekly", "Monthly", "On Request"] },
        },
      },
      rehabilitation: {
        name: "Rehabilitation & Recovery",
        icon: "fa-heartbeat",
        specs: {
          service_type: { label: "Service Type", icon: "fa-heartbeat", options: ["Post-Injury Rehab", "Post-Surgery Rehab", "Chronic Pain Management", "Mobility Training", "Flexibility Training", "Corrective Exercise"] },
          condition: { label: "Condition", icon: "fa-exclamation-circle", options: ["Back/Spine", "Knee", "Shoulder", "Ankle", "Hip", "Neck", "Wrist/Hand", "General"], multiple: true, allowCustom: true },
          session_length: { label: "Session Length", icon: "fa-clock", options: ["30 min", "45 min", "60 min", "90 min"] },
          includes: { label: "Includes", icon: "fa-check-circle", options: ["Assessment", "Exercise Plan", "Progress Tracking", "Home Program", "Stretching Guide"] },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. CLEANING SERVICES (EXPANDED)
  // ═══════════════════════════════════════════════════════════════════════════
  cleaning: {
    id: "cleaning",
    name: "Cleaning",
    icon: "🧹",
    gradient: "from-[#f0fdf4] to-[#dcfce7]",
    description: "Residential and commercial cleaning services",
    subcategories: {
      residential: {
        name: "Residential Cleaning",
        icon: "fa-home",
        specs: {
          service_type: { label: "Service Type", icon: "fa-home", options: ["Regular Cleaning", "Deep Cleaning", "Move In/Out", "Spring Cleaning", "Post-Construction", "Urgent/Same Day", "Holiday Cleaning"] },
          property_size: { label: "Property Size", icon: "fa-ruler-combined", options: ["Studio/1 Bed", "2 Bedroom", "3 Bedroom", "4 Bedroom", "5+ Bedroom", "Mansion"] },
          frequency: { label: "Frequency", icon: "fa-redo", options: ["One-Time", "Weekly", "Bi-Weekly", "Monthly", "Fortnightly", "Custom Schedule"] },
          rooms: { label: "Rooms to Clean", icon: "fa-door-open", options: ["Living Room", "Bedrooms", "Kitchen", "Bathrooms", "Home Office", "Garage", "All Rooms"], multiple: true },
          supplies: { label: "Supplies", icon: "fa-spray-can", options: ["I Bring Everything", "Client Provides", "Eco-Friendly Only", "Premium Products"] },
        },
      },
      commercial: {
        name: "Commercial Cleaning",
        icon: "fa-building",
        specs: {
          facility_type: { label: "Facility Type", icon: "fa-building", options: ["Office", "Retail Store", "Restaurant", "Medical Facility", "School/University", "Hotel", "Warehouse", "Gym", "Church"] },
          square_footage: { label: "Square Footage", icon: "fa-chart-line", options: ["Under 1000", "1000-2500", "2500-5000", "5000-10000", "10000-25000", "25000+"] },
          frequency: { label: "Frequency", icon: "fa-redo", options: ["Daily", "5 Days/Week", "3 Days/Week", "Weekly", "Bi-Weekly", "Monthly", "On Demand"] },
          services: { label: "Services Needed", icon: "fa-check-circle", options: ["General Office Cleaning", "Restroom Sanitation", "Breakroom Cleaning", "Floor Care", "Window Cleaning", "Trash Removal", "Carpet Cleaning"], multiple: true },
        },
      },
      carpet_upholstery: {
        name: "Carpet & Upholstery",
        icon: "fa-couch",
        specs: {
          service_type: { label: "Service Type", icon: "fa-couch", options: ["Carpet Cleaning", "Rug Cleaning", "Upholstery Cleaning", "Mattress Cleaning", "Stain Removal", "Deodorizing", "Protectant Application"] },
          area_size: { label: "Area Size", icon: "fa-chart-line", options: ["Small (1 Room)", "Medium (2-3 Rooms)", "Large (4-5 Rooms)", "Whole House", "Commercial Space"] },
          method: { label: "Cleaning Method", icon: "fa-water", options: ["Steam/Hot Water Extraction", "Dry Cleaning", "Shampoo", "Encapsulation", "Eco-Friendly"] },
          drying_time: { label: "Drying Time", icon: "fa-clock", options: ["2-4 hours", "4-6 hours", "6-8 hours", "8-12 hours", "Overnight"] },
        },
      },
      window_cleaning: {
        name: "Window Cleaning",
        icon: "fa-window-maximize",
        specs: {
          service_type: { label: "Service Type", icon: "fa-window-maximize", options: ["Interior Windows", "Exterior Windows", "Both Sides", "High-Rise Windows", "Skylights", "Glass Doors", "Screens"] },
          building_type: { label: "Building Type", icon: "fa-building", options: ["Single Story", "2-3 Stories", "4-6 Stories", "7+ Stories", "Commercial Building"] },
          window_count: { label: "Approx Windows", icon: "fa-hashtag", options: ["1-10", "11-20", "21-30", "31-50", "51-100", "100+"] },
          includes: { label: "Includes", icon: "fa-check-circle", options: ["Tracks", "Sills", "Screens", "Frames", "Tracks & Frames"], multiple: true },
        },
      },
      post_construction: {
        name: "Post-Construction",
        icon: "fa-hard-hat",
        specs: {
          property_type: { label: "Property Type", icon: "fa-home", options: ["Residential", "Commercial", "Renovation Site", "New Build", "Office Build-out"] },
          debris_level: { label: "Debris Level", icon: "fa-chart-line", options: ["Light (Dust)", "Medium (Construction Dust)", "Heavy (Dust & Debris)", "Extreme (Full Cleanup)"] },
          includes: { label: "Includes", icon: "fa-check-circle", options: ["Dust Removal", "Debris Hauling", "Surface Cleaning", "Window Cleaning", "Floor Cleaning", "Final Polish"], multiple: true },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. PHOTOGRAPHY (EXPANDED)
  // ═══════════════════════════════════════════════════════════════════════════
  photography: {
    id: "photography",
    name: "Photography",
    icon: "📸",
    gradient: "from-[#fff7ed] to-[#ffedd5]",
    description: "Professional photography for events, portraits, products, and more",
    subcategories: {
      event_photography: {
        name: "Event Photography",
        icon: "fa-camera",
        specs: {
          event_type: { label: "Event Type", icon: "fa-calendar-star", options: ["Wedding", "Birthday Party", "Corporate Event", "Concert", "Festival", "Graduation", "Baby Shower", "Bridal Shower", "Anniversary", "Quinceañera", "Bar/Bat Mitzvah"] },
          duration: { label: "Coverage Duration", icon: "fa-clock", options: ["1-2 hours", "2-4 hours", "4-6 hours", "6-8 hours", "Full Day (8-12)", "Multi-Day"] },
          deliverables: { label: "Deliverables", icon: "fa-images", options: ["Digital Photos", "Online Gallery", "USB Drive", "Printed Photos", "Album", "Sneak Peeks", "Full Resolution"], multiple: true },
          photographers: { label: "Number of Photographers", icon: "fa-users", options: ["1 Photographer", "2 Photographers", "3+ Photographers"] },
          turnaround: { label: "Turnaround Time", icon: "fa-clock", options: ["1 Week", "2 Weeks", "3-4 Weeks", "6-8 Weeks", "Express (3-5 Days)"] },
        },
      },
      portrait_photography: {
        name: "Portrait Photography",
        icon: "fa-portrait",
        specs: {
          portrait_type: { label: "Portrait Type", icon: "fa-portrait", options: ["Individual Portrait", "Couples", "Family", "Maternity", "Newborn", "Senior/Graduation", "Professional Headshot", "Personal Branding", "Fashion", "Glamour"] },
          location: { label: "Location", icon: "fa-map-marker-alt", options: ["Studio", "Outdoor", "Client Home", "Client Office", "On Location (Client Choice)"] },
          session_length: { label: "Session Length", icon: "fa-clock", options: ["30 min", "45 min", "60 min", "90 min", "2 hours"] },
          deliverables: { label: "Deliverables", icon: "fa-images", options: ["Edited Digital Photos", "Print Release", "Online Gallery", "Prints", "Canvas", "Album"], multiple: true },
          outfits: { label: "Outfit Changes", icon: "fa-tshirt", options: ["1 Outfit", "2 Outfits", "3 Outfits", "Unlimited"] },
        },
      },
      product_photography: {
        name: "Product Photography",
        icon: "fa-box",
        specs: {
          product_type: { label: "Product Type", icon: "fa-box", options: ["Clothing/Accessories", "Electronics", "Food/Beverage", "Jewelry", "Furniture", "Cosmetics", "Automotive", "Industrial", "Art/Prints"], allowCustom: true },
          quantity: { label: "Number of Products", icon: "fa-hashtag", options: ["1-5", "6-10", "11-20", "21-50", "51-100", "100+"] },
          style: { label: "Photo Style", icon: "fa-palette", options: ["White Background", "Lifestyle", "In-Use", "360° View", "Packshot", "Flat Lay", "On Model"], multiple: true },
          deliverables: { label: "Deliverables", icon: "fa-images", options: ["Edited Photos", "White Background", "Transparent Background", "Color Corrected", "Retouched", "Web Ready", "Print Ready"], multiple: true },
          usage_rights: { label: "Usage Rights", icon: "fa-file-contract", options: ["Full Commercial Rights", "Web Only", "Print Only", "Social Media Only", "Limited Usage"] },
        },
      },
      real_estate: {
        name: "Real Estate Photography",
        icon: "fa-building",
        specs: {
          property_type: { label: "Property Type", icon: "fa-building", options: ["Residential Home", "Apartment/Condo", "Commercial Property", "Land/Vacant", "Luxury Estate", "Rental Unit"] },
          square_footage: { label: "Square Footage", icon: "fa-chart-line", options: ["Under 1000", "1000-2000", "2000-3000", "3000-4000", "4000-5000", "5000+"] },
          services: { label: "Services", icon: "fa-check-circle", options: ["Interior Photos", "Exterior Photos", "Aerial/Drone", "Virtual Tour", "Floor Plan", "Twilight Photos", "Video Tour"], multiple: true },
          turnaround: { label: "Turnaround", icon: "fa-clock", options: ["Same Day", "24 Hours", "48 Hours", "72 Hours", "5 Days"] },
        },
      },
      wedding_photography: {
        name: "Wedding Photography",
        icon: "fa-heart",
        specs: {
          package_type: { label: "Package Type", icon: "fa-gift", options: ["Elopement (2-4 hours)", "Intimate (4-6 hours)", "Standard (6-8 hours)", "Full Day (8-10 hours)", "Premium (10-12 hours)", "Destination Wedding"] },
          coverage: { label: "Coverage Includes", icon: "fa-check-circle", options: ["Getting Ready", "Ceremony", "Family Photos", "Bridal Party", "Reception", "First Dance", "Cake Cutting", "Send-off"], multiple: true },
          deliverables: { label: "Deliverables", icon: "fa-images", options: ["Digital Gallery", "USB Drive", "Engagement Session", "Bridal Session", "Album", "Prints", "Second Photographer"], multiple: true },
          album_type: { label: "Album Type", icon: "fa-book", options: ["No Album", "Standard (10x10)", "Premium (12x12)", "Layflat (12x12)", "Parent Albums", "Mini Albums"] },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. CATERING (EXPANDED)
  // ═══════════════════════════════════════════════════════════════════════════
  catering: {
    id: "catering",
    name: "Catering",
    icon: "🍽️",
    gradient: "from-[#fff1f2] to-[#ffe4e6]",
    description: "Food catering for events, parties, corporate functions, and more",
    subcategories: {
      event_catering: {
        name: "Event Catering",
        icon: "fa-calendar-star",
        specs: {
          cuisine: { label: "Cuisine Type", icon: "fa-utensils", options: ["African/Kenyan", "Continental", "Italian", "Asian", "Indian", "Middle Eastern", "BBQ/Grill", "Seafood", "Fusion", "Custom Menu"], allowCustom: true },
          event_type: { label: "Event Type", icon: "fa-calendar-star", options: ["Wedding", "Corporate Event", "Birthday Party", "Anniversary", "Graduation", "Funeral", "Religious Gathering", "Baby Shower", "Retirement Party"] },
          guest_count: { label: "Guest Count", icon: "fa-users", options: ["Under 50", "50-100", "100-250", "250-500", "500-1000", "1000+"] },
          service_style: { label: "Service Style", icon: "fa-concierge-bell", options: ["Buffet", "Plated", "Family Style", "Food Stations", "Drop Off", "Full Service", "Passed Appetizers"] },
          dietary: { label: "Dietary Options", icon: "fa-leaf", options: ["Vegetarian", "Vegan", "Halal", "Gluten-Free", "Dairy-Free", "Nut-Free", "Kosher", "All"], multiple: true },
        },
      },
      corporate_catering: {
        name: "Corporate Catering",
        icon: "fa-briefcase",
        specs: {
          occasion: { label: "Occasion", icon: "fa-briefcase", options: ["Business Lunch", "Board Meeting", "Staff Party", "Client Event", "Training Session", "Conference", "Product Launch", "Holiday Party"] },
          guest_count: { label: "Guest Count", icon: "fa-users", options: ["Under 20", "20-50", "50-100", "100-250", "250-500"] },
          style: { label: "Service Style", icon: "fa-concierge-bell", options: ["Boxed Lunches", "Buffet", "Drop-off", "Full Service", "Breakfast/Brunch", "Break Stations"] },
          includes: { label: "Includes", icon: "fa-check-circle", options: ["Setup", "Cleanup", "Disposables", "Linens", "Staff", "Beverages"], multiple: true },
        },
      },
      private_chef: {
        name: "Private Chef",
        icon: "fa-chef-hat",
        specs: {
          occasion: { label: "Occasion", icon: "fa-calendar-star", options: ["Private Dinner", "Date Night", "Family Gathering", "Holiday Meal", "Special Occasion", "Weekly Meal Prep"] },
          guest_count: { label: "Guest Count", icon: "fa-users", options: ["2-4", "5-8", "9-12", "13-16", "17-20", "21+"] },
          courses: { label: "Number of Courses", icon: "fa-utensils", options: ["2 Courses", "3 Courses", "4 Courses", "5 Courses", "6+ Courses"] },
          includes: { label: "Includes", icon: "fa-check-circle", options: ["Menu Planning", "Grocery Shopping", "Cooking", "Plating", "Cleanup", "Recipe Cards"], multiple: true },
          dietary: { label: "Dietary Requirements", icon: "fa-leaf", options: ["None", "Vegetarian", "Vegan", "Gluten-Free", "Kosher", "Halal", "Allergies (specify)"], allowCustom: true },
        },
      },
      meal_prep: {
        name: "Meal Prep Delivery",
        icon: "fa-box",
        specs: {
          meal_type: { label: "Meal Type", icon: "fa-utensils", options: ["Breakfast", "Lunch", "Dinner", "Snacks", "All Meals", "Custom Plan"] },
          dietary: { label: "Dietary Style", icon: "fa-leaf", options: ["Standard", "Low Carb/Keto", "High Protein", "Vegetarian", "Vegan", "Paleo", "Gluten-Free"] },
          meals_per_week: { label: "Meals per Week", icon: "fa-calendar", options: ["5 Meals", "10 Meals", "15 Meals", "20 Meals", "25 Meals", "30 Meals"] },
          delivery_schedule: { label: "Delivery Schedule", icon: "fa-truck", options: ["Weekly (Monday)", "Bi-Weekly", "Monthly", "Custom"] },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. MEDICAL & HOSPITAL (EXPANDED)
  // ═══════════════════════════════════════════════════════════════════════════
  medical: {
    id: "medical",
    name: "Hospital & Medical",
    icon: "🏥",
    gradient: "from-[#fee2e2] to-[#fecaca]",
    description: "Medical facilities, clinics, specialists, and healthcare services",
    subcategories: {
      general_practice: {
        name: "General Practice",
        icon: "fa-stethoscope",
        specs: {
          consultation_type: { label: "Consultation Type", icon: "fa-stethoscope", options: ["General Check-up", "Sick Visit", "Follow-up", "Telemedicine", "Home Visit", "Pre-Employment", "School Physical", "Sports Physical"] },
          insurance: { label: "Insurance Accepted", icon: "fa-id-card", options: ["NHIF", "AAR", "Jubilee", "APA", "Madison", "Britam", "Cash Only", "All Major"], multiple: true },
          appointment_type: { label: "Appointment Type", icon: "fa-calendar", options: ["Walk-in", "Scheduled", "Emergency", "Virtual"] },
          wait_time: { label: "Typical Wait Time", icon: "fa-clock", options: ["Under 15 min", "15-30 min", "30-60 min", "1+ hours"] },
        },
      },
      specialist: {
        name: "Specialist Care",
        icon: "fa-user-md",
        specs: {
          specialty: { label: "Specialty", icon: "fa-user-md", options: ["Cardiology", "Dermatology", "Neurology", "Orthopedics", "Pediatrics", "Gynecology", "Urology", "ENT", "Ophthalmology", "Psychiatry", "Dental", "Physiotherapy"], allowCustom: true },
          referral_needed: { label: "Referral Needed", icon: "fa-file-alt", options: ["Yes (From GP)", "No", "Depends on Insurance"] },
          consultation_type: { label: "Consultation Type", icon: "fa-stethoscope", options: ["In-Person", "Telemedicine", "Second Opinion", "Follow-up"] },
          insurance: { label: "Insurance", icon: "fa-id-card", options: ["NHIF", "Private", "Cash", "Corporate"], multiple: true },
        },
      },
      dental: {
        name: "Dental Services",
        icon: "fa-tooth",
        specs: {
          service_type: { label: "Service Type", icon: "fa-tooth", options: ["Cleaning/Check-up", "Filling", "Extraction", "Root Canal", "Crown", "Bridge", "Dentures", "Braces", "Whitening", "Veneers", "Implant"] },
          emergency: { label: "Emergency Available", icon: "fa-exclamation-circle", options: ["Yes (24/7)", "Yes (Limited Hours)", "No"] },
          insurance: { label: "Insurance", icon: "fa-id-card", options: ["NHIF", "Private Dental", "Cash", "Payment Plan"] },
          sedation: { label: "Sedation Options", icon: "fa-bed", options: ["None", "Local", "Nitrous Oxide", "IV Sedation", "General Anesthesia"] },
        },
      },
      laboratory: {
        name: "Laboratory Services",
        icon: "fa-flask",
        specs: {
          test_type: { label: "Test Type", icon: "fa-flask", options: ["Blood Work", "Urinalysis", "COVID-19 Test", "Pregnancy Test", "STD Testing", "Thyroid Panel", "Lipid Panel", "Liver Function", "Kidney Function", "Cancer Markers", "Allergy Testing"], multiple: true },
          results_time: { label: "Results Time", icon: "fa-clock", options: ["Same Day (2-4 hrs)", "Next Day", "2-3 Days", "3-5 Days", "1 Week"] },
          home_service: { label: "Home Sample Collection", icon: "fa-home", options: ["Yes", "No", "Extra Fee"] },
          fasting_required: { label: "Fasting Required", icon: "fa-apple-alt", options: ["Yes", "No", "Depends on Test"] },
        },
      },
      pharmacy: {
        name: "Pharmacy",
        icon: "fa-prescription-bottle",
        specs: {
          service_type: { label: "Service Type", icon: "fa-prescription-bottle", options: ["Prescription Fill", "OTC Medication", "Health Supplements", "Medical Supplies", "Compounding", "Vaccinations", "Health Screening"] },
          delivery: { label: "Delivery Available", icon: "fa-truck", options: ["Yes (Free)", "Yes (Fee)", "Pickup Only", "Same Day Delivery"] },
          insurance: { label: "Insurance", icon: "fa-id-card", options: ["NHIF", "Private", "Cash", "Credit"] },
          hours: { label: "Pharmacy Hours", icon: "fa-clock", options: ["24/7", "Standard Hours", "Extended Hours", "Limited Hours"] },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. LEGAL SERVICES (NEW)
  // ═══════════════════════════════════════════════════════════════════════════
  legal: {
    id: "legal",
    name: "Legal Services",
    icon: "⚖️",
    gradient: "from-[#e0e7ff] to-[#c7d2fe]",
    description: "Legal consultation, document drafting, immigration, business law, and more",
    subcategories: {
      legal_consultation: {
        name: "Legal Consultation",
        icon: "fa-gavel",
        specs: {
          practice_area: { label: "Practice Area", icon: "fa-gavel", options: ["Family Law", "Criminal Law", "Civil Litigation", "Employment Law", "Business Law", "Intellectual Property", "Real Estate Law", "Immigration Law", "Estate Planning", "Bankruptcy"], multiple: true, allowCustom: true },
          consultation_type: { label: "Consultation Type", icon: "fa-comments", options: ["Initial Consultation", "Phone Consultation", "Video Call", "In-Person", "Urgent Matter"] },
          duration: { label: "Consultation Duration", icon: "fa-clock", options: ["15 min", "30 min", "60 min", "90 min"] },
          language: { label: "Language", icon: "fa-language", options: ["English", "Kiswahili", "French", "Arabic", "Other"], multiple: true },
        },
      },
      document_drafting: {
        name: "Document Drafting",
        icon: "fa-file-signature",
        specs: {
          document_type: { label: "Document Type", icon: "fa-file-signature", options: ["Contract", "Will/Testament", "Power of Attorney", "Lease Agreement", "Employment Agreement", "Partnership Agreement", "NDA", "Demand Letter", "Legal Notice", "Incorporation Documents"], allowCustom: true },
          complexity: { label: "Complexity", icon: "fa-chart-line", options: ["Standard (Template-based)", "Custom (Moderate)", "Complex (Heavy Customization)"] },
          turnaround: { label: "Turnaround Time", icon: "fa-clock", options: ["24 hours", "3 Days", "5 Days", "1 Week", "2 Weeks"] },
          includes_review: { label: "Includes Review", icon: "fa-check-circle", options: ["Yes (One Round)", "Yes (Unlimited)", "No", "Extra Fee"] },
        },
      },
      immigration: {
        name: "Immigration Services",
        icon: "fa-passport",
        specs: {
          service_type: { label: "Service Type", icon: "fa-passport", options: ["Visa Application", "Work Permit", "Residence Permit", "Citizenship", "Deportation Defense", "Sponsorship", "Family Reunification", "Student Visa"] },
          country: { label: "Country/Region", icon: "fa-globe", options: ["Kenya", "USA", "UK", "Canada", "Australia", "Schengen Zone", "UAE", "Other"], multiple: true, allowCustom: true },
          includes: { label: "Includes", icon: "fa-check-circle", options: ["Form Preparation", "Document Review", "Application Filing", "Follow-up", "Interview Prep"], multiple: true },
        },
      },
      business_law: {
        name: "Business Law",
        icon: "fa-building",
        specs: {
          service_type: { label: "Service Type", icon: "fa-building", options: ["Business Registration", "Company Formation", "Compliance", "Contract Review", "M&A", "Due Diligence", "Dispute Resolution", "IP Registration"] },
          business_type: { label: "Business Type", icon: "fa-briefcase", options: ["Sole Proprietorship", "LLC", "Corporation", "Partnership", "Non-Profit", "Startup"] },
          urgency: { label: "Urgency", icon: "fa-exclamation-circle", options: ["Standard", "Expedited (Faster)", "Emergency"] },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. FINANCIAL SERVICES (NEW)
  // ═══════════════════════════════════════════════════════════════════════════
  financial: {
    id: "financial",
    name: "Financial Services",
    icon: "💰",
    gradient: "from-[#fef3c7] to-[#fde68a]",
    description: "Accounting, tax preparation, financial planning, insurance, and more",
    subcategories: {
      accounting: {
        name: "Accounting & Bookkeeping",
        icon: "fa-calculator",
        specs: {
          service_type: { label: "Service Type", icon: "fa-calculator", options: ["Bookkeeping", "Financial Statements", "Payroll", "Account Reconciliation", "Accounts Payable", "Accounts Receivable", "Inventory Management"] },
          frequency: { label: "Frequency", icon: "fa-calendar", options: ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"] },
          software: { label: "Software Used", icon: "fa-laptop", options: ["QuickBooks", "Xero", "Sage", "Excel", "Manual", "Client's System"] },
          industry: { label: "Industry Experience", icon: "fa-building", options: ["Retail", "Services", "Manufacturing", "E-commerce", "Non-Profit", "Real Estate", "Hospitality"], multiple: true },
        },
      },
      tax_preparation: {
        name: "Tax Preparation",
        icon: "fa-file-invoice-dollar",
        specs: {
          service_type: { label: "Service Type", icon: "fa-file-invoice-dollar", options: ["Individual Tax Filing", "Business Tax Filing", "VAT Filing", "PAYE Filing", "Corporate Tax", "Tax Planning", "Tax Audit Support"] },
          tax_year: { label: "Tax Year", icon: "fa-calendar", options: ["Current Year", "Previous Year", "Multiple Years", "Ongoing"] },
          includes: { label: "Includes", icon: "fa-check-circle", options: ["Tax Calculation", "Form Preparation", "Electronic Filing", "Payment Processing", "Tax Advice"], multiple: true },
          complexity: { label: "Tax Complexity", icon: "fa-chart-line", options: ["Simple (Single Income)", "Moderate (Multiple Sources)", "Complex (Business/Investments)", "Very Complex (International)"] },
        },
      },
      financial_planning: {
        name: "Financial Planning",
        icon: "fa-chart-line",
        specs: {
          service_type: { label: "Service Type", icon: "fa-chart-line", options: ["Retirement Planning", "Investment Planning", "Estate Planning", "Education Planning", "Debt Management", "Budgeting", "Wealth Management"] },
          client_type: { label: "Client Type", icon: "fa-user", options: ["Individual", "Couple", "Family", "Small Business", "Corporate", "High Net Worth"] },
          plan_horizon: { label: "Plan Horizon", icon: "fa-calendar", options: ["Short-term (<1 year)", "Medium-term (1-5 years)", "Long-term (5+ years)", "Retirement"] },
          includes: { label: "Includes", icon: "fa-check-circle", options: ["Financial Analysis", "Goal Setting", "Investment Strategy", "Risk Assessment", "Progress Tracking"], multiple: true },
        },
      },
      insurance: {
        name: "Insurance Services",
        icon: "fa-shield-alt",
        specs: {
          insurance_type: { label: "Insurance Type", icon: "fa-shield-alt", options: ["Life Insurance", "Health Insurance", "Vehicle Insurance", "Home Insurance", "Business Insurance", "Travel Insurance", "Education Insurance"], multiple: true },
          provider: { label: "Provider", icon: "fa-building", options: ["Multiple Carriers", "Specific Carrier", "Independent Broker", "Direct Provider"] },
          quote_included: { label: "Free Quote Included", icon: "fa-tag", options: ["Yes", "No", "Upon Request"] },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. REAL ESTATE SERVICES (NEW)
  // ═══════════════════════════════════════════════════════════════════════════
  real_estate: {
    id: "real_estate",
    name: "Real Estate",
    icon: "🏠",
    gradient: "from-[#f0fdf4] to-[#dcfce7]",
    description: "Property sales, rentals, management, valuation, and more",
    subcategories: {
      property_sales: {
        name: "Property Sales",
        icon: "fa-home",
        specs: {
          property_type: { label: "Property Type", icon: "fa-home", options: ["House", "Apartment/Condo", "Land", "Commercial", "Industrial", "Vacation Home", "Investment Property"] },
          price_range: { label: "Price Range", icon: "fa-tag", options: ["Under 5M", "5M-10M", "10M-20M", "20M-50M", "50M-100M", "100M+"] },
          location: { label: "Location", icon: "fa-map-marker-alt", options: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Kiambu", "Other"], allowCustom: true },
          property_condition: { label: "Property Condition", icon: "fa-star", options: ["New Construction", "Renovated", "Good Condition", "Fixer Upper", "As-Is"] },
        },
      },
      property_rentals: {
        name: "Property Rentals",
        icon: "fa-key",
        specs: {
          property_type: { label: "Property Type", icon: "fa-home", options: ["House", "Apartment", "Room", "Commercial Space", "Office", "Warehouse", "Short-term/Vacation"] },
          rental_period: { label: "Rental Period", icon: "fa-calendar", options: ["Short-term (Monthly)", "Long-term (Yearly)", "Vacation (Daily)", "Corporate Lease"] },
          budget: { label: "Monthly Budget (KES)", icon: "fa-tag", options: ["Under 20k", "20k-50k", "50k-100k", "100k-200k", "200k-500k", "500k+"] },
          furnished: { label: "Furnished", icon: "fa-couch", options: ["Fully Furnished", "Partially Furnished", "Unfurnished", "Negotiable"] },
        },
      },
      property_management: {
        name: "Property Management",
        icon: "fa-clipboard-list",
        specs: {
          service_type: { label: "Service Type", icon: "fa-clipboard-list", options: ["Tenant Finding", "Rent Collection", "Maintenance", "Property Marketing", "Legal Compliance", "Full Management"] },
          property_count: { label: "Number of Properties", icon: "fa-hashtag", options: ["1-2", "3-5", "6-10", "11-20", "21-50", "50+"] },
          management_fee: { label: "Management Fee Structure", icon: "fa-percent", options: ["Percentage of Rent", "Fixed Monthly", "Per Service", "Custom"] },
        },
      },
      real_estate_valuation: {
        name: "Real Estate Valuation",
        icon: "fa-chart-line",
        specs: {
          property_type: { label: "Property Type", icon: "fa-home", options: ["Residential", "Commercial", "Industrial", "Land", "Agricultural", "Special Purpose"] },
          valuation_purpose: { label: "Valuation Purpose", icon: "fa-bullseye", options: ["Sale/Purchase", "Mortgage/Loan", "Insurance", "Tax Assessment", "Investment Analysis", "Legal Dispute"] },
          includes_report: { label: "Includes Report", icon: "fa-file-alt", options: ["Yes (Detailed)", "Yes (Summary)", "Verbal Only"] },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. LOGISTICS & TRANSPORTATION (NEW)
  // ═══════════════════════════════════════════════════════════════════════════
  logistics: {
    id: "logistics",
    name: "Logistics & Transport",
    icon: "🚚",
    gradient: "from-[#dbeafe] to-[#bfdbfe]",
    description: "Moving services, courier delivery, freight shipping, and more",
    subcategories: {
      moving_services: {
        name: "Moving Services",
        icon: "fa-truck-moving",
        specs: {
          move_type: { label: "Move Type", icon: "fa-truck-moving", options: ["Local Move", "Long Distance", "Office/Commercial", "Piano/Heavy Items", "Single Item", "Full Household"] },
          property_size: { label: "Property Size", icon: "fa-ruler-combined", options: ["Studio/1 Bed", "2 Bedroom", "3 Bedroom", "4 Bedroom", "5+ Bedroom", "Office"] },
          includes: { label: "Includes", icon: "fa-check-circle", options: ["Packing", "Loading", "Transport", "Unloading", "Unpacking", "Furniture Assembly"], multiple: true },
          truck_size: { label: "Truck Size", icon: "fa-truck", options: ["Small (1-2 rooms)", "Medium (3-4 rooms)", "Large (5+ rooms)", "TBD After Quote"] },
        },
      },
      courier_delivery: {
        name: "Courier & Delivery",
        icon: "fa-shipping-fast",
        specs: {
          delivery_type: { label: "Delivery Type", icon: "fa-shipping-fast", options: ["Same Day", "Next Day", "Express (2-4 hours)", "Scheduled", "On-Demand", "Medical/Urgent"] },
          item_type: { label: "Item Type", icon: "fa-box", options: ["Documents", "Packages (<5kg)", "Parcels (5-20kg)", "Heavy Items (20-50kg)", "Fragile Items", "Temperature Sensitive"], multiple: true },
          distance: { label: "Distance", icon: "fa-route", options: ["Within City", "City to City", "Inter-County", "National", "International"] },
          tracking: { label: "Tracking Provided", icon: "fa-map-marked-alt", options: ["Yes (Real-time)", "Yes (Basic)", "No", "Upon Request"] },
        },
      },
      freight_shipping: {
        name: "Freight Shipping",
        icon: "fa-ship",
        specs: {
          freight_type: { label: "Freight Type", icon: "fa-truck", options: ["LTL (Less than Truckload)", "FTL (Full Truckload)", "Air Freight", "Ocean Freight", "Rail Freight", "Intermodal"] },
          cargo_type: { label: "Cargo Type", icon: "fa-boxes", options: ["General Cargo", "Palletized", "Oversized", "Hazardous", "Perishable", "Fragile"], multiple: true },
          origin_destination: { label: "Route", icon: "fa-route", options: ["Domestic", "Regional (Africa)", "International", "Door-to-Door", "Port-to-Port"] },
          weight: { label: "Estimated Weight", icon: "fa-weight", options: ["Under 100kg", "100-500kg", "500-1000kg", "1-5 tons", "5-10 tons", "10+ tons"] },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 17. TRAVEL & TOURISM (NEW)
  // ═══════════════════════════════════════════════════════════════════════════
  travel: {
    id: "travel",
    name: "Travel & Tourism",
    icon: "✈️",
    gradient: "from-[#fff7ed] to-[#ffedd5]",
    description: "Flight booking, hotel reservation, tour packages, safari planning, and more",
    subcategories: {
      tour_packages: {
        name: "Tour Packages",
        icon: "fa-umbrella-beach",
        specs: {
          tour_type: { label: "Tour Type", icon: "fa-umbrella-beach", options: ["Safari", "Beach Vacation", "Cultural Tour", "Adventure", "Hiking", "City Tour", "Honeymoon", "Family Tour", "Group Tour"] },
          destination: { label: "Destination", icon: "fa-map-marker-alt", options: ["Maasai Mara", "Mombasa/Diani", "Nairobi", "Naivasha", "Nakuru", "Amboseli", "Tsavo", "Samburu", "Lamu", "International"], allowCustom: true },
          duration: { label: "Duration", icon: "fa-calendar", options: ["1 Day", "2-3 Days", "4-5 Days", "6-7 Days", "8-10 Days", "2 Weeks+"] },
          group_size: { label: "Group Size", icon: "fa-users", options: ["Solo", "Couple", "Small Group (2-4)", "Medium Group (5-8)", "Large Group (9+)", "Private Tour"] },
          includes: { label: "Includes", icon: "fa-check-circle", options: ["Transport", "Accommodation", "Meals", "Park Fees", "Guide", "Activities", "Insurance"], multiple: true },
        },
      },
      flight_booking: {
        name: "Flight Booking",
        icon: "fa-plane",
        specs: {
          trip_type: { label: "Trip Type", icon: "fa-plane", options: ["One Way", "Round Trip", "Multi-City", "Group Booking"] },
          class: { label: "Class", icon: "fa-chair", options: ["Economy", "Premium Economy", "Business", "First Class"] },
          destinations: { label: "Route", icon: "fa-route", options: ["Domestic", "Regional Africa", "International", "Multiple Stops"] },
          passenger_count: { label: "Passenger Count", icon: "fa-users", options: ["1 Adult", "2 Adults", "3-4 Adults", "5-9 Adults", "10+ Group", "With Children"] },
        },
      },
      hotel_reservation: {
        name: "Hotel Reservation",
        icon: "fa-hotel",
        specs: {
          hotel_type: { label: "Hotel Type", icon: "fa-hotel", options: ["Luxury (5-star)", "Premium (4-star)", "Standard (3-star)", "Budget", "Boutique", "Resort", "Lodge/Camp"] },
          room_type: { label: "Room Type", icon: "fa-bed", options: ["Single", "Double", "Twin", "Suite", "Family Room", "Connecting Rooms"] },
          amenities: { label: "Required Amenities", icon: "fa-star", options: ["WiFi", "Breakfast Included", "Pool", "Gym", "Parking", "Airport Transfer", "Room Service", "Restaurant"], multiple: true },
          guests: { label: "Guests", icon: "fa-users", options: ["1 Adult", "2 Adults", "2 Adults + Child", "Family (3-4)", "Group (5+)"] },
        },
      },
      safari_planning: {
        name: "Safari Planning",
        icon: "fa-lion",
        specs: {
          park: { label: "National Park", icon: "fa-tree", options: ["Maasai Mara", "Amboseli", "Tsavo East", "Tsavo West", "Nakuru", "Naivasha", "Samburu", "Aberdare", "Meru"], multiple: true },
          safari_type: { label: "Safari Type", icon: "fa-camera", options: ["Game Drive", "Walking Safari", "Night Safari", "Balloon Safari", "Boat Safari", "Photography Safari"] },
          accommodation: { label: "Accommodation Type", icon: "fa-bed", options: ["Luxury Lodge", "Tented Camp", "Budget Camp", "Mid-range Lodge", "Glamping"] },
          days: { label: "Number of Days", icon: "fa-calendar", options: ["1 Day", "2 Days/1 Night", "3 Days/2 Nights", "4 Days/3 Nights", "5+ Days"] },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 18. OTHER SERVICES (Default/Catch-all)
  // ═══════════════════════════════════════════════════════════════════════════
  other: {
    id: "other",
    name: "Other Services",
    icon: "✨",
    gradient: "from-[#f8fafc] to-[#f1f5f9]",
    description: "Consulting, repair, installation, maintenance, design, and other services",
    subcategories: {
      consulting: {
        name: "Consulting",
        icon: "fa-comments",
        specs: {
          consulting_type: { label: "Consulting Type", icon: "fa-comments", options: ["Business Consulting", "Management Consulting", "IT Consulting", "Marketing Consulting", "HR Consulting", "Career Coaching", "Life Coaching"] },
          industry: { label: "Industry Expertise", icon: "fa-building", options: ["Retail", "Tech", "Healthcare", "Education", "Manufacturing", "Services", "Non-Profit"], multiple: true },
          engagement: { label: "Engagement Type", icon: "fa-handshake", options: ["Hourly", "Project-Based", "Retainer", "Advisory Board", "Strategy Session"] },
          includes: { label: "Includes", icon: "fa-check-circle", options: ["Analysis", "Strategy", "Implementation Plan", "Training", "Follow-up"], multiple: true },
        },
      },
      repair_maintenance: {
        name: "Repair & Maintenance",
        icon: "fa-wrench",
        specs: {
          equipment_type: { label: "Equipment Type", icon: "fa-microchip", options: ["Electronics", "Appliances", "Tools", "Machinery", "Furniture", "Instruments", "Other"], allowCustom: true },
          issue: { label: "Issue Type", icon: "fa-exclamation-circle", options: ["Not Working", "Broken", "Needs Tune-up", "Routine Maintenance", "Upgrade/Replacement", "Diagnostic Only"] },
          warranty: { label: "Warranty on Repair", icon: "fa-shield-alt", options: ["30 Days", "90 Days", "6 Months", "1 Year", "No Warranty"] },
          parts: { label: "Parts", icon: "fa-cogs", options: ["I Provide", "Client Provides", "Original/OEM", "Aftermarket"] },
        },
      },
      installation: {
        name: "Installation Services",
        icon: "fa-tools",
        specs: {
          installation_type: { label: "Installation Type", icon: "fa-tools", options: ["TV Mounting", "AC Installation", "Security System", "Smart Home", "Furniture Assembly", "Lighting Fixtures", "Shelf/Storage", "Solar Panel", "Satellite Dish"] },
          location: { label: "Location", icon: "fa-home", options: ["Residential", "Commercial", "Industrial", "Outdoor"] },
          includes: { label: "Includes", icon: "fa-check-circle", options: ["Mounting/Hanging", "Wiring", "Testing", "Demo/Training", "Cleanup"], multiple: true },
        },
      },
    },
  },
};

// UI Display helpers for categories
export const SERVICE_CATEGORIES = Object.values(serviceData).map(cat => ({
  id: cat.id,
  name: cat.name,
  icon: cat.icon,
  gradient: cat.gradient,
  description: cat.description,
}));

// Helper to get subcategories for a service category
export function getServiceSubcategories(categoryId: string): Array<{ key: string; name: string; icon: string }> {
  const category = serviceData[categoryId];
  if (!category) return [];
  return Object.entries(category.subcategories).map(([key, sub]) => ({
    key,
    name: sub.name,
    icon: sub.icon,
  }));
}

// Helper to get specs for a specific subcategory
export function getServiceSpecs(categoryId: string, subcategoryKey: string): Record<string, ServiceSpec> | null {
  const category = serviceData[categoryId];
  if (!category) return null;
  const subcategory = category.subcategories[subcategoryKey];
  if (!subcategory) return null;
  return subcategory.specs;
}