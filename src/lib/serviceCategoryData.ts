// Service Business Type Specifications Database
// Single source of truth for all service categories and their specifications

export interface ServiceSpec {
  label: string;
  icon: string;
  options: string[];
}

export interface ServiceBusinessType {
  name: string;
  specs: Record<string, ServiceSpec>;
}

export const businessSpecs: Record<string, ServiceBusinessType> = {
  beauty: {
    name: "Beauty & Hair",
    specs: {
      service_type: { label: "Service Type", icon: "fa-cut", options: ["Hair Braiding", "Haircut", "Coloring", "Treatment", "Styling", "Makeup", "Nails", "Massage", "Facial", "Waxing"] },
      hair_length: { label: "Hair Length", icon: "fa-ruler", options: ["Short", "Medium", "Long", "Extra Long"] },
      hair_texture: { label: "Hair Texture", icon: "fa-wind", options: ["Straight", "Wavy", "Curly", "Coily", "All Types"] },
      style: { label: "Style/Pattern", icon: "fa-paint-brush", options: ["Box Braids", "Knotless", "Cornrows", "Twists", "Locs", "Weave", "Wig Install", "Custom"] },
      products: { label: "Products Used", icon: "fa-pump-soap", options: ["Organic", "Synthetic", "Human Hair", "X-Pression", "Kanekalon", "Client Choice"] },
    },
  },
  home: {
    name: "Home Services",
    specs: {
      service_type: { label: "Service Type", icon: "fa-tools", options: ["Plumbing", "Electrical", "Carpentry", "Painting", "HVAC", "Appliance Repair", "Roofing", "Tiling"] },
      urgency: { label: "Urgency Level", icon: "fa-exclamation-circle", options: ["Emergency (Same Day)", "Standard (1-3 Days)", "Scheduled (1+ Week)"] },
      property_type: { label: "Property Type", icon: "fa-home", options: ["Apartment", "House", "Commercial", "Industrial"] },
      tools_needed: { label: "Tools/Materials", icon: "fa-toolbox", options: ["I Bring Everything", "Client Provides Materials", "Consultation Required"] },
    },
  },
  health: {
    name: "Health & Wellness",
    specs: {
      service_type: { label: "Service Type", icon: "fa-heartbeat", options: ["Personal Training", "Yoga", "Nutrition Coaching", "Therapy", "Massage", "Meditation", "Physical Therapy"] },
      session_type: { label: "Session Type", icon: "fa-users", options: ["One-on-One", "Couples", "Group (3-5)", "Group (6-10)", "Workshop (10+)"] },
      fitness_level: { label: "Client Level", icon: "fa-chart-line", options: ["Beginner", "Intermediate", "Advanced", "All Levels"] },
      equipment: { label: "Equipment", icon: "fa-dumbbell", options: ["Gym Required", "Home Equipment", "No Equipment", "I Bring Equipment"] },
    },
  },
  education: {
    name: "Education",
    specs: {
      subject: { label: "Subject", icon: "fa-book", options: ["Math", "Science", "English", "Languages", "Music", "Coding", "Test Prep", "Art"] },
      grade_level: { label: "Grade/Level", icon: "fa-graduation-cap", options: ["Elementary", "Middle School", "High School", "College", "Adult Learning", "Professional"] },
      session_format: { label: "Format", icon: "fa-chalkboard-teacher", options: ["One-on-One", "Small Group", "Classroom", "Workshop", "Crash Course"] },
      delivery: { label: "Delivery", icon: "fa-laptop", options: ["In-Person", "Online Live", "Recorded", "Hybrid"] },
    },
  },
  automotive: {
    name: "Automotive",
    specs: {
      service_type: { label: "Service Type", icon: "fa-car", options: ["Oil Change", "Brake Service", "Detailing", "Tire Service", "Engine Repair", "AC Service", "Diagnostics"] },
      vehicle_type: { label: "Vehicle", icon: "fa-truck", options: ["Sedan", "SUV", "Truck", "Motorcycle", "Van", "All Types"] },
      location: { label: "Service Location", icon: "fa-map-marker-alt", options: ["My Garage", "Client Location", "Both"] },
      parts: { label: "Parts", icon: "fa-cogs", options: ["OEM Parts", "Aftermarket", "Client Provides", "Consultation Needed"] },
    },
  },
  events: {
    name: "Events",
    specs: {
      event_type: { label: "Event Type", icon: "fa-calendar-star", options: ["Wedding", "Birthday", "Corporate", "Concert", "Festival", "Private Party", "Conference"] },
      role: { label: "Your Role", icon: "fa-user-tie", options: ["Planner", "Decorator", "DJ", "Caterer", "Photographer", "Videographer", "MC/Host", "Security"] },
      guest_count: { label: "Guest Count", icon: "fa-users", options: ["Under 50", "50-100", "100-250", "250-500", "500-1000", "1000+"] },
      setup_time: { label: "Setup Required", icon: "fa-clock", options: ["Same Day", "1 Day Before", "2-3 Days", "1 Week+"] },
    },
  },
  tech: {
    name: "Tech Support",
    specs: {
      service_type: { label: "Service Type", icon: "fa-laptop-code", options: ["Phone Repair", "Computer Fix", "Web Design", "App Development", "IT Support", "Data Recovery", "Network Setup"] },
      device: { label: "Device Type", icon: "fa-mobile-alt", options: ["iPhone", "Android", "Laptop", "Desktop", "Tablet", "Server", "Smart Home"] },
      issue_type: { label: "Common Issues", icon: "fa-bug", options: ["Screen/Broken", "Software", "Virus/Malware", "Data Loss", "Upgrade", "Custom Build"] },
      warranty: { label: "Warranty", icon: "fa-shield-alt", options: ["30 Days", "90 Days", "6 Months", "1 Year", "No Warranty"] },
    },
  },
  fitness: {
    name: "Fitness",
    specs: {
      service_type: { label: "Service Type", icon: "fa-running", options: ["Personal Training", "Group Classes", "Nutrition Plan", "Sports Coaching", "Rehabilitation", "Online Coaching"] },
      specialty: { label: "Specialty", icon: "fa-star", options: ["Weight Loss", "Muscle Gain", "Endurance", "Flexibility", "Sports Specific", "Senior Fitness", "Pre/Post Natal"] },
      location: { label: "Location", icon: "fa-map-marker-alt", options: ["Gym", "Home Visit", "Outdoor", "Online", "My Studio"] },
      equipment: { label: "Equipment", icon: "fa-dumbbell", options: ["Full Gym", "Minimal", "Bodyweight Only", "I Bring Equipment"] },
    },
  },
  cleaning: {
    name: "Cleaning",
    specs: {
      service_type: { label: "Service Type", icon: "fa-broom", options: ["Regular Cleaning", "Deep Cleaning", "Move In/Out", "Office Cleaning", "Post-Construction", "Urgent/Same Day"] },
      property_size: { label: "Property Size", icon: "fa-ruler-combined", options: ["Studio", "1-2 Bedroom", "3-4 Bedroom", "5+ Bedroom", "Office Space", "Commercial"] },
      frequency: { label: "Frequency", icon: "fa-redo", options: ["One-Time", "Weekly", "Bi-Weekly", "Monthly", "On Demand"] },
      supplies: { label: "Supplies", icon: "fa-spray-can", options: ["I Bring Everything", "Client Provides", "Eco-Friendly Only"] },
    },
  },
  photography: {
    name: "Photography",
    specs: {
      shoot_type: { label: "Shoot Type", icon: "fa-camera", options: ["Portrait", "Wedding", "Event", "Product", "Real Estate", "Fashion", "Family", "Headshots"] },
      duration: { label: "Duration", icon: "fa-clock", options: ["1 Hour", "2-3 Hours", "Half Day", "Full Day", "Multi-Day"] },
      deliverables: { label: "Deliverables", icon: "fa-images", options: ["Digital Only", "Prints", "Album", "Edited Photos", "Raw Files", "All"] },
      locations: { label: "Locations", icon: "fa-map-marked-alt", options: ["1 Location", "2 Locations", "3+ Locations", "Client Choice"] },
    },
  },
  catering: {
    name: "Catering",
    specs: {
      cuisine: { label: "Cuisine Type", icon: "fa-utensils", options: ["Local/Kenyan", "Continental", "Italian", "Asian", "Indian", "BBQ/Grill", "Fusion", "Custom Menu"] },
      event_type: { label: "Event Type", icon: "fa-glass-cheers", options: ["Wedding", "Corporate", "Birthday", "Funeral", "Religious", "Casual Gathering"] },
      service_style: { label: "Service Style", icon: "fa-concierge-bell", options: ["Buffet", "Plated", "Family Style", "Food Stations", "Drop Off", "Full Service"] },
      dietary: { label: "Dietary Options", icon: "fa-leaf", options: ["Vegetarian", "Vegan", "Halal", "Gluten-Free", "Dairy-Free", "Nut-Free", "All"] },
    },
  },
  medical: {
    name: "Hospital & Medical",
    specs: {
      facility_type: { label: "Facility Type", icon: "fa-hospital", options: ["Private Hospital", "Public Hospital", "Clinic", "Specialist Center", "Diagnostic Center", "Maternity", "Dental Clinic", "Eye Clinic"] },
      department: { label: "Department/Specialty", icon: "fa-user-md", options: ["General Practice", "Pediatrics", "Gynecology", "Cardiology", "Orthopedics", "Dermatology", "ENT", "Ophthalmology", "Dental", "Laboratory", "Radiology", "Physiotherapy", "Mental Health", "Emergency"] },
      consultation_type: { label: "Consultation Type", icon: "fa-stethoscope", options: ["In-Person Visit", "Telemedicine", "Home Visit", "Second Opinion", "Follow-up", "Emergency Consultation"] },
      insurance: { label: "Insurance Accepted", icon: "fa-id-card", options: ["NHIF", "AAR Insurance", "Jubilee Health", "APA Insurance", "Madison Insurance", "Britam", "Cash Only", "All Major Insurers"] },
      services_offered: { label: "Services Offered", icon: "fa-procedures", options: ["General Consultation", "Laboratory Tests", "X-Ray/Ultrasound", "Minor Surgery", "Vaccination", "Health Screening", "Maternity Care", "Pharmacy", "Ambulance Service", "ICU/NCCU"] },
      operating_hours: { label: "Operating Hours", icon: "fa-clock", options: ["24/7 Emergency", "Mon-Fri 8AM-6PM", "Mon-Sat 8AM-8PM", "Weekends Only", "By Appointment", "On-Call Service"] },
    },
  },
  other: {
    name: "Other Services",
    specs: {
      category: { label: "Custom Category", icon: "fa-tag", options: ["Consulting", "Repair", "Installation", "Maintenance", "Design", "Translation", "Legal", "Financial"] },
      experience: { label: "Experience Level", icon: "fa-award", options: ["Entry Level", "Intermediate", "Expert", "Master"] },
      certification: { label: "Certification", icon: "fa-certificate", options: ["Certified", "Licensed", "Insured", "Bonded", "None Required"] },
    },
  },
};

// UI Display helpers
export const BUSINESS_ICONS: Record<string, string> = {
  beauty: "💇‍♀️", home: "🔧", health: "🏥", education: "📚",
  automotive: "🚗", events: "🎉", tech: "💻", fitness: "🏋️",
  cleaning: "🧹", photography: "📸", catering: "🍽️", medical: "🏥", other: "✨",
};

export const BUSINESS_GRADIENTS: Record<string, string> = {
  beauty: "from-[#f3e8ff] to-[#e9d5ff]",
  home: "from-[#fef3c7] to-[#fde68a]",
  health: "from-[#dcfce7] to-[#bbf7d0]",
  education: "from-[#e0e7ff] to-[#c7d2fe]",
  automotive: "from-[#fecaca] to-[#fecaca]",
  events: "from-[#fce7f3] to-[#fbcfe8]",
  tech: "from-[#dbeafe] to-[#bfdbfe]",
  fitness: "from-[#fef3c7] to-[#fde68a]",
  cleaning: "from-[#f0fdf4] to-[#dcfce7]",
  photography: "from-[#fff7ed] to-[#ffedd5]",
  catering: "from-[#fff1f2] to-[#ffe4e6]",
  medical: "from-[#fee2e2] to-[#fecaca]",
  other: "from-[#f8fafc] to-[#f1f5f9]",
};
