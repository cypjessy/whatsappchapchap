"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { serviceService } from "@/lib/db";
import { bunnyStorage } from "@/lib/storage";
import { useRouter } from "next/navigation";

// Business Type Specifications Database (exact as provided)
const businessSpecs: Record<string, any> = {
  beauty: {
    name: 'Beauty & Hair',
    specs: {
      service_type: { label: 'Service Type', icon: 'fa-cut', options: ['Hair Braiding', 'Haircut', 'Coloring', 'Treatment', 'Styling', 'Makeup', 'Nails', 'Massage', 'Facial', 'Waxing'] },
      hair_length: { label: 'Hair Length', icon: 'fa-ruler', options: ['Short', 'Medium', 'Long', 'Extra Long'] },
      hair_texture: { label: 'Hair Texture', icon: 'fa-wind', options: ['Straight', 'Wavy', 'Curly', 'Coily', 'All Types'] },
      style: { label: 'Style/Pattern', icon: 'fa-paint-brush', options: ['Box Braids', 'Knotless', 'Cornrows', 'Twists', 'Locs', 'Weave', 'Wig Install', 'Custom'] },
      products: { label: 'Products Used', icon: 'fa-pump-soap', options: ['Organic', 'Synthetic', 'Human Hair', 'X-Pression', 'Kanekalon', 'Client Choice'] }
    }
  },
  home: {
    name: 'Home Services',
    specs: {
      service_type: { label: 'Service Type', icon: 'fa-tools', options: ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'HVAC', 'Appliance Repair', 'Roofing', 'Tiling'] },
      urgency: { label: 'Urgency Level', icon: 'fa-exclamation-circle', options: ['Emergency (Same Day)', 'Standard (1-3 Days)', 'Scheduled (1+ Week)'] },
      property_type: { label: 'Property Type', icon: 'fa-home', options: ['Apartment', 'House', 'Commercial', 'Industrial'] },
      tools_needed: { label: 'Tools/Materials', icon: 'fa-toolbox', options: ['I Bring Everything', 'Client Provides Materials', 'Consultation Required'] }
    }
  },
  health: {
    name: 'Health & Wellness',
    specs: {
      service_type: { label: 'Service Type', icon: 'fa-heartbeat', options: ['Personal Training', 'Yoga', 'Nutrition Coaching', 'Therapy', 'Massage', 'Meditation', 'Physical Therapy'] },
      session_type: { label: 'Session Type', icon: 'fa-users', options: ['One-on-One', 'Couples', 'Group (3-5)', 'Group (6-10)', 'Workshop (10+)'] },
      fitness_level: { label: 'Client Level', icon: 'fa-chart-line', options: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'] },
      equipment: { label: 'Equipment', icon: 'fa-dumbbell', options: ['Gym Required', 'Home Equipment', 'No Equipment', 'I Bring Equipment'] }
    }
  },
  education: {
    name: 'Education',
    specs: {
      subject: { label: 'Subject', icon: 'fa-book', options: ['Math', 'Science', 'English', 'Languages', 'Music', 'Coding', 'Test Prep', 'Art'] },
      grade_level: { label: 'Grade/Level', icon: 'fa-graduation-cap', options: ['Elementary', 'Middle School', 'High School', 'College', 'Adult Learning', 'Professional'] },
      session_format: { label: 'Format', icon: 'fa-chalkboard-teacher', options: ['One-on-One', 'Small Group', 'Classroom', 'Workshop', 'Crash Course'] },
      delivery: { label: 'Delivery', icon: 'fa-laptop', options: ['In-Person', 'Online Live', 'Recorded', 'Hybrid'] }
    }
  },
  automotive: {
    name: 'Automotive',
    specs: {
      service_type: { label: 'Service Type', icon: 'fa-car', options: ['Oil Change', 'Brake Service', 'Detailing', 'Tire Service', 'Engine Repair', 'AC Service', 'Diagnostics'] },
      vehicle_type: { label: 'Vehicle', icon: 'fa-truck', options: ['Sedan', 'SUV', 'Truck', 'Motorcycle', 'Van', 'All Types'] },
      location: { label: 'Service Location', icon: 'fa-map-marker-alt', options: ['My Garage', 'Client Location', 'Both'] },
      parts: { label: 'Parts', icon: 'fa-cogs', options: ['OEM Parts', 'Aftermarket', 'Client Provides', 'Consultation Needed'] }
    }
  },
  events: {
    name: 'Events',
    specs: {
      event_type: { label: 'Event Type', icon: 'fa-calendar-star', options: ['Wedding', 'Birthday', 'Corporate', 'Concert', 'Festival', 'Private Party', 'Conference'] },
      role: { label: 'Your Role', icon: 'fa-user-tie', options: ['Planner', 'Decorator', 'DJ', 'Caterer', 'Photographer', 'Videographer', 'MC/Host', 'Security'] },
      guest_count: { label: 'Guest Count', icon: 'fa-users', options: ['Under 50', '50-100', '100-250', '250-500', '500-1000', '1000+'] },
      setup_time: { label: 'Setup Required', icon: 'fa-clock', options: ['Same Day', '1 Day Before', '2-3 Days', '1 Week+'] }
    }
  },
  tech: {
    name: 'Tech Support',
    specs: {
      service_type: { label: 'Service Type', icon: 'fa-laptop-code', options: ['Phone Repair', 'Computer Fix', 'Web Design', 'App Development', 'IT Support', 'Data Recovery', 'Network Setup'] },
      device: { label: 'Device Type', icon: 'fa-mobile-alt', options: ['iPhone', 'Android', 'Laptop', 'Desktop', 'Tablet', 'Server', 'Smart Home'] },
      issue_type: { label: 'Common Issues', icon: 'fa-bug', options: ['Screen/Broken', 'Software', 'Virus/Malware', 'Data Loss', 'Upgrade', 'Custom Build'] },
      warranty: { label: 'Warranty', icon: 'fa-shield-alt', options: ['30 Days', '90 Days', '6 Months', '1 Year', 'No Warranty'] }
    }
  },
  fitness: {
    name: 'Fitness',
    specs: {
      service_type: { label: 'Service Type', icon: 'fa-running', options: ['Personal Training', 'Group Classes', 'Nutrition Plan', 'Sports Coaching', 'Rehabilitation', 'Online Coaching'] },
      specialty: { label: 'Specialty', icon: 'fa-star', options: ['Weight Loss', 'Muscle Gain', 'Endurance', 'Flexibility', 'Sports Specific', 'Senior Fitness', 'Pre/Post Natal'] },
      location: { label: 'Location', icon: 'fa-map-marker-alt', options: ['Gym', 'Home Visit', 'Outdoor', 'Online', 'My Studio'] },
      equipment: { label: 'Equipment', icon: 'fa-dumbbell', options: ['Full Gym', 'Minimal', 'Bodyweight Only', 'I Bring Equipment'] }
    }
  },
  cleaning: {
    name: 'Cleaning',
    specs: {
      service_type: { label: 'Service Type', icon: 'fa-broom', options: ['Regular Cleaning', 'Deep Cleaning', 'Move In/Out', 'Office Cleaning', 'Post-Construction', 'Urgent/Same Day'] },
      property_size: { label: 'Property Size', icon: 'fa-ruler-combined', options: ['Studio', '1-2 Bedroom', '3-4 Bedroom', '5+ Bedroom', 'Office Space', 'Commercial'] },
      frequency: { label: 'Frequency', icon: 'fa-redo', options: ['One-Time', 'Weekly', 'Bi-Weekly', 'Monthly', 'On Demand'] },
      supplies: { label: 'Supplies', icon: 'fa-spray-can', options: ['I Bring Everything', 'Client Provides', 'Eco-Friendly Only'] }
    }
  },
  photography: {
    name: 'Photography',
    specs: {
      shoot_type: { label: 'Shoot Type', icon: 'fa-camera', options: ['Portrait', 'Wedding', 'Event', 'Product', 'Real Estate', 'Fashion', 'Family', 'Headshots'] },
      duration: { label: 'Duration', icon: 'fa-clock', options: ['1 Hour', '2-3 Hours', 'Half Day', 'Full Day', 'Multi-Day'] },
      deliverables: { label: 'Deliverables', icon: 'fa-images', options: ['Digital Only', 'Prints', 'Album', 'Edited Photos', 'Raw Files', 'All'] },
      locations: { label: 'Locations', icon: 'fa-map-marked-alt', options: ['1 Location', '2 Locations', '3+ Locations', 'Client Choice'] }
    }
  },
  catering: {
    name: 'Catering',
    specs: {
      cuisine: { label: 'Cuisine Type', icon: 'fa-utensils', options: ['Local/Kenyan', 'Continental', 'Italian', 'Asian', 'Indian', 'BBQ/Grill', 'Fusion', 'Custom Menu'] },
      event_type: { label: 'Event Type', icon: 'fa-glass-cheers', options: ['Wedding', 'Corporate', 'Birthday', 'Funeral', 'Religious', 'Casual Gathering'] },
      service_style: { label: 'Service Style', icon: 'fa-concierge-bell', options: ['Buffet', 'Plated', 'Family Style', 'Food Stations', 'Drop Off', 'Full Service'] },
      dietary: { label: 'Dietary Options', icon: 'fa-leaf', options: ['Vegetarian', 'Vegan', 'Halal', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'All'] }
    }
  },
  medical: {
    name: 'Hospital & Medical',
    specs: {
      facility_type: { label: 'Facility Type', icon: 'fa-hospital', options: ['Private Hospital', 'Public Hospital', 'Clinic', 'Specialist Center', 'Diagnostic Center', 'Maternity', 'Dental Clinic', 'Eye Clinic'] },
      department: { label: 'Department/Specialty', icon: 'fa-user-md', options: ['General Practice', 'Pediatrics', 'Gynecology', 'Cardiology', 'Orthopedics', 'Dermatology', 'ENT', 'Ophthalmology', 'Dental', 'Laboratory', 'Radiology', 'Physiotherapy', 'Mental Health', 'Emergency'] },
      consultation_type: { label: 'Consultation Type', icon: 'fa-stethoscope', options: ['In-Person Visit', 'Telemedicine', 'Home Visit', 'Second Opinion', 'Follow-up', 'Emergency Consultation'] },
      insurance: { label: 'Insurance Accepted', icon: 'fa-id-card', options: ['NHIF', 'AAR Insurance', 'Jubilee Health', 'APA Insurance', 'Madison Insurance', 'Britam', 'Cash Only', 'All Major Insurers'] },
      services_offered: { label: 'Services Offered', icon: 'fa-procedures', options: ['General Consultation', 'Laboratory Tests', 'X-Ray/Ultrasound', 'Minor Surgery', 'Vaccination', 'Health Screening', 'Maternity Care', 'Pharmacy', 'Ambulance Service', 'ICU/NCCU'] },
      operating_hours: { label: 'Operating Hours', icon: 'fa-clock', options: ['24/7 Emergency', 'Mon-Fri 8AM-6PM', 'Mon-Sat 8AM-8PM', 'Weekends Only', 'By Appointment', 'On-Call Service'] }
    }
  },
  other: {
    name: 'Other Services',
    specs: {
      category: { label: 'Custom Category', icon: 'fa-tag', options: ['Consulting', 'Repair', 'Installation', 'Maintenance', 'Design', 'Translation', 'Legal', 'Financial'] },
      experience: { label: 'Experience Level', icon: 'fa-award', options: ['Entry Level', 'Intermediate', 'Expert', 'Master'] },
      certification: { label: 'Certification', icon: 'fa-certificate', options: ['Certified', 'Licensed', 'Insured', 'Bonded', 'None Required'] }
    }
  }
};

export default function AddServiceButton() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, Set<string>>>({});
  const [selectedTier, setSelectedTier] = useState<"basic" | "standard" | "premium">("standard");
  const [selectedMode, setSelectedMode] = useState<"in-person" | "remote" | "both">("in-person");
  const [selectedLocation, setSelectedLocation] = useState<"client-place" | "my-place" | "both-places" | "remote">("client-place");
  const [selectedDuration, setSelectedDuration] = useState<string>("60");
  const [activeCustomSpec, setActiveCustomSpec] = useState<string | null>(null);
  const [tempCustomValue, setTempCustomValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']));
  const [selectedTimes, setSelectedTimes] = useState<Set<string>>(new Set());
  const [bookedTimes] = useState<Set<string>>(new Set(['10:00 AM', '2:00 PM', '4:00 PM'])); // Simulated booked slots
  const [portfolioImages, setPortfolioImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  // Package features state
  const [packageFeatures, setPackageFeatures] = useState({
    basic: ['Core service included', 'Professional quality'],
    standard: ['Everything in Basic', 'Priority scheduling', 'Enhanced support'],
    premium: ['Everything in Standard', 'VIP treatment', '24/7 support']
  });

  const specsContainerRef = useRef<HTMLDivElement>(null);

  // Generate time slots based on service duration
  const generateTimeSlots = (durationMinutes: number): string[] => {
    const slots: string[] = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    
    // Calculate interval based on duration
    let interval = 60; // default 1 hour
    if (durationMinutes <= 30) interval = 30;
    else if (durationMinutes <= 45) interval = 45;
    else if (durationMinutes <= 60) interval = 60;
    else if (durationMinutes <= 90) interval = 90;
    else interval = 120; // 2+ hours
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        if (hour + (minute / 60) >= endHour) break;
        
        const h = hour % 12 || 12;
        const ampm = hour < 12 ? 'AM' : 'PM';
        const m = minute === 0 ? '00' : minute.toString();
        slots.push(`${h}:${m} ${ampm}`);
      }
    }
    
    return slots.length > 0 ? slots : ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
  };

  // Business Type Specifications Database (exact as provided)
  const businessSpecs: Record<string, any> = {
    beauty: {
      name: 'Beauty & Hair',
      specs: {
        service_type: { label: 'Service Type', icon: 'fa-cut', options: ['Hair Braiding', 'Haircut', 'Coloring', 'Treatment', 'Styling', 'Makeup', 'Nails', 'Massage', 'Facial', 'Waxing'] },
        hair_length: { label: 'Hair Length', icon: 'fa-ruler', options: ['Short', 'Medium', 'Long', 'Extra Long'] },
        hair_texture: { label: 'Hair Texture', icon: 'fa-wind', options: ['Straight', 'Wavy', 'Curly', 'Coily', 'All Types'] },
        style: { label: 'Style/Pattern', icon: 'fa-paint-brush', options: ['Box Braids', 'Knotless', 'Cornrows', 'Twists', 'Locs', 'Weave', 'Wig Install', 'Custom'] },
        products: { label: 'Products Used', icon: 'fa-pump-soap', options: ['Organic', 'Synthetic', 'Human Hair', 'X-Pression', 'Kanekalon', 'Client Choice'] }
      }
    },
    home: {
      name: 'Home Services',
      specs: {
        service_type: { label: 'Service Type', icon: 'fa-tools', options: ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'HVAC', 'Appliance Repair', 'Roofing', 'Tiling'] },
        urgency: { label: 'Urgency Level', icon: 'fa-exclamation-circle', options: ['Emergency (Same Day)', 'Standard (1-3 Days)', 'Scheduled (1+ Week)'] },
        property_type: { label: 'Property Type', icon: 'fa-home', options: ['Apartment', 'House', 'Commercial', 'Industrial'] },
        tools_needed: { label: 'Tools/Materials', icon: 'fa-toolbox', options: ['I Bring Everything', 'Client Provides Materials', 'Consultation Required'] }
      }
    },
    health: {
      name: 'Health & Wellness',
      specs: {
        service_type: { label: 'Service Type', icon: 'fa-heartbeat', options: ['Personal Training', 'Yoga', 'Nutrition Coaching', 'Therapy', 'Massage', 'Meditation', 'Physical Therapy'] },
        session_type: { label: 'Session Type', icon: 'fa-users', options: ['One-on-One', 'Couples', 'Group (3-5)', 'Group (6-10)', 'Workshop (10+)'] },
        fitness_level: { label: 'Client Level', icon: 'fa-chart-line', options: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'] },
        equipment: { label: 'Equipment', icon: 'fa-dumbbell', options: ['Gym Required', 'Home Equipment', 'No Equipment', 'I Bring Equipment'] }
      }
    },
    education: {
      name: 'Education',
      specs: {
        subject: { label: 'Subject', icon: 'fa-book', options: ['Math', 'Science', 'English', 'Languages', 'Music', 'Coding', 'Test Prep', 'Art'] },
        grade_level: { label: 'Grade/Level', icon: 'fa-graduation-cap', options: ['Elementary', 'Middle School', 'High School', 'College', 'Adult Learning', 'Professional'] },
        session_format: { label: 'Format', icon: 'fa-chalkboard-teacher', options: ['One-on-One', 'Small Group', 'Classroom', 'Workshop', 'Crash Course'] },
        delivery: { label: 'Delivery', icon: 'fa-laptop', options: ['In-Person', 'Online Live', 'Recorded', 'Hybrid'] }
      }
    },
    automotive: {
      name: 'Automotive',
      specs: {
        service_type: { label: 'Service Type', icon: 'fa-car', options: ['Oil Change', 'Brake Service', 'Detailing', 'Tire Service', 'Engine Repair', 'AC Service', 'Diagnostics'] },
        vehicle_type: { label: 'Vehicle', icon: 'fa-truck', options: ['Sedan', 'SUV', 'Truck', 'Motorcycle', 'Van', 'All Types'] },
        location: { label: 'Service Location', icon: 'fa-map-marker-alt', options: ['My Garage', 'Client Location', 'Both'] },
        parts: { label: 'Parts', icon: 'fa-cogs', options: ['OEM Parts', 'Aftermarket', 'Client Provides', 'Consultation Needed'] }
      }
    },
    events: {
      name: 'Events',
      specs: {
        event_type: { label: 'Event Type', icon: 'fa-calendar-star', options: ['Wedding', 'Birthday', 'Corporate', 'Concert', 'Festival', 'Private Party', 'Conference'] },
        role: { label: 'Your Role', icon: 'fa-user-tie', options: ['Planner', 'Decorator', 'DJ', 'Caterer', 'Photographer', 'Videographer', 'MC/Host', 'Security'] },
        guest_count: { label: 'Guest Count', icon: 'fa-users', options: ['Under 50', '50-100', '100-250', '250-500', '500-1000', '1000+'] },
        setup_time: { label: 'Setup Required', icon: 'fa-clock', options: ['Same Day', '1 Day Before', '2-3 Days', '1 Week+'] }
      }
    },
    tech: {
      name: 'Tech Support',
      specs: {
        service_type: { label: 'Service Type', icon: 'fa-laptop-code', options: ['Phone Repair', 'Computer Fix', 'Web Design', 'App Development', 'IT Support', 'Data Recovery', 'Network Setup'] },
        device: { label: 'Device Type', icon: 'fa-mobile-alt', options: ['iPhone', 'Android', 'Laptop', 'Desktop', 'Tablet', 'Server', 'Smart Home'] },
        issue_type: { label: 'Common Issues', icon: 'fa-bug', options: ['Screen/Broken', 'Software', 'Virus/Malware', 'Data Loss', 'Upgrade', 'Custom Build'] },
        warranty: { label: 'Warranty', icon: 'fa-shield-alt', options: ['30 Days', '90 Days', '6 Months', '1 Year', 'No Warranty'] }
      }
    },
    fitness: {
      name: 'Fitness',
      specs: {
        service_type: { label: 'Service Type', icon: 'fa-running', options: ['Personal Training', 'Group Classes', 'Nutrition Plan', 'Sports Coaching', 'Rehabilitation', 'Online Coaching'] },
        specialty: { label: 'Specialty', icon: 'fa-star', options: ['Weight Loss', 'Muscle Gain', 'Endurance', 'Flexibility', 'Sports Specific', 'Senior Fitness', 'Pre/Post Natal'] },
        location: { label: 'Location', icon: 'fa-map-marker-alt', options: ['Gym', 'Home Visit', 'Outdoor', 'Online', 'My Studio'] },
        equipment: { label: 'Equipment', icon: 'fa-dumbbell', options: ['Full Gym', 'Minimal', 'Bodyweight Only', 'I Bring Equipment'] }
      }
    },
    cleaning: {
      name: 'Cleaning',
      specs: {
        service_type: { label: 'Service Type', icon: 'fa-broom', options: ['Regular Cleaning', 'Deep Cleaning', 'Move In/Out', 'Office Cleaning', 'Post-Construction', 'Urgent/Same Day'] },
        property_size: { label: 'Property Size', icon: 'fa-ruler-combined', options: ['Studio', '1-2 Bedroom', '3-4 Bedroom', '5+ Bedroom', 'Office Space', 'Commercial'] },
        frequency: { label: 'Frequency', icon: 'fa-redo', options: ['One-Time', 'Weekly', 'Bi-Weekly', 'Monthly', 'On Demand'] },
        supplies: { label: 'Supplies', icon: 'fa-spray-can', options: ['I Bring Everything', 'Client Provides', 'Eco-Friendly Only'] }
      }
    },
    photography: {
      name: 'Photography',
      specs: {
        shoot_type: { label: 'Shoot Type', icon: 'fa-camera', options: ['Portrait', 'Wedding', 'Event', 'Product', 'Real Estate', 'Fashion', 'Family', 'Headshots'] },
        duration: { label: 'Duration', icon: 'fa-clock', options: ['1 Hour', '2-3 Hours', 'Half Day', 'Full Day', 'Multi-Day'] },
        deliverables: { label: 'Deliverables', icon: 'fa-images', options: ['Digital Only', 'Prints', 'Album', 'Edited Photos', 'Raw Files', 'All'] },
        locations: { label: 'Locations', icon: 'fa-map-marked-alt', options: ['1 Location', '2 Locations', '3+ Locations', 'Client Choice'] }
      }
    },
    catering: {
      name: 'Catering',
      specs: {
        cuisine: { label: 'Cuisine Type', icon: 'fa-utensils', options: ['Local/Kenyan', 'Continental', 'Italian', 'Asian', 'Indian', 'BBQ/Grill', 'Fusion', 'Custom Menu'] },
        event_type: { label: 'Event Type', icon: 'fa-glass-cheers', options: ['Wedding', 'Corporate', 'Birthday', 'Funeral', 'Religious', 'Casual Gathering'] },
        service_style: { label: 'Service Style', icon: 'fa-concierge-bell', options: ['Buffet', 'Plated', 'Family Style', 'Food Stations', 'Drop Off', 'Full Service'] },
        dietary: { label: 'Dietary Options', icon: 'fa-leaf', options: ['Vegetarian', 'Vegan', 'Halal', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'All'] }
      }
    },
    medical: {
      name: 'Hospital & Medical',
      specs: {
        facility_type: { label: 'Facility Type', icon: 'fa-hospital', options: ['Private Hospital', 'Public Hospital', 'Clinic', 'Specialist Center', 'Diagnostic Center', 'Maternity', 'Dental Clinic', 'Eye Clinic'] },
        department: { label: 'Department/Specialty', icon: 'fa-user-md', options: ['General Practice', 'Pediatrics', 'Gynecology', 'Cardiology', 'Orthopedics', 'Dermatology', 'ENT', 'Ophthalmology', 'Dental', 'Laboratory', 'Radiology', 'Physiotherapy', 'Mental Health', 'Emergency'] },
        consultation_type: { label: 'Consultation Type', icon: 'fa-stethoscope', options: ['In-Person Visit', 'Telemedicine', 'Home Visit', 'Second Opinion', 'Follow-up', 'Emergency Consultation'] },
        insurance: { label: 'Insurance Accepted', icon: 'fa-id-card', options: ['NHIF', 'AAR Insurance', 'Jubilee Health', 'APA Insurance', 'Madison Insurance', 'Britam', 'Cash Only', 'All Major Insurers'] },
        services_offered: { label: 'Services Offered', icon: 'fa-procedures', options: ['General Consultation', 'Laboratory Tests', 'X-Ray/Ultrasound', 'Minor Surgery', 'Vaccination', 'Health Screening', 'Maternity Care', 'Pharmacy', 'Ambulance Service', 'ICU/NCCU'] },
        operating_hours: { label: 'Operating Hours', icon: 'fa-clock', options: ['24/7 Emergency', 'Mon-Fri 8AM-6PM', 'Mon-Sat 8AM-8PM', 'Weekends Only', 'By Appointment', 'On-Call Service'] }
      }
    },
    other: {
      name: 'Other Services',
      specs: {
        category: { label: 'Custom Category', icon: 'fa-tag', options: ['Consulting', 'Repair', 'Installation', 'Maintenance', 'Design', 'Translation', 'Legal', 'Financial'] },
        experience: { label: 'Experience Level', icon: 'fa-award', options: ['Entry Level', 'Intermediate', 'Expert', 'Master'] },
        certification: { label: 'Certification', icon: 'fa-certificate', options: ['Certified', 'Licensed', 'Insured', 'Bonded', 'None Required'] }
      }
    }
  };

  const closeModal = () => {
    if (confirm('Close without saving?')) {
      setOpen(false);
      // Reset all state
      setSelectedBusiness(null);
      setSelectedMode("in-person");
      setSelectedLocation("client-place");
      setSelectedDuration("60");
      setSelectedSpecs({});
      setSelectedTier("standard");
      setActiveCustomSpec(null);
      setTempCustomValue("");
      setSelectedDays(new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']));
      setSelectedTimes(new Set());
      setPortfolioImages([]);
    }
  };

  // Toggle spec option
  const toggleSpec = (specKey: string, option: string) => {
    const currentSet = selectedSpecs[specKey] || new Set<string>();
    const newSet = new Set(currentSet);
    if (newSet.has(option)) {
      newSet.delete(option);
    } else {
      newSet.add(option);
    }
    setSelectedSpecs(prev => ({ ...prev, [specKey]: newSet }));
  };

  // Add custom option UI
  const addCustomOption = (specKey: string) => {
    setActiveCustomSpec(specKey);
    setTempCustomValue("");
  };

  const saveCustom = (specKey: string) => {
    const val = tempCustomValue.trim();
    if (val) {
      toggleSpec(specKey, val);
    }
    setActiveCustomSpec(null);
    setTempCustomValue("");
  };

  const cancelCustom = () => {
    setActiveCustomSpec(null);
    setTempCustomValue("");
  };

  // Handle portfolio image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newImages = [...portfolioImages];
      newImages[index] = files[0];
      setPortfolioImages(newImages.filter(img => img != null));
    }
  };

  // Remove portfolio image
  const removeImage = (index: number) => {
    const newImages = portfolioImages.filter((_, i) => i !== index);
    setPortfolioImages(newImages);
  };

  // Save service to database
  const saveService = async () => {
    if (!user) {
      alert("You must be logged in to create a service");
      return;
    }

    const nameInput = document.getElementById("serviceName") as HTMLInputElement;
    const name = nameInput?.value.trim();
    if (!name) { alert("Please enter a service name"); return; }
    if (!selectedBusiness) { alert("Please select a business type"); return; }

    setSaving(true);
    try {
      // Collect specs
      const specs: Record<string, string[]> = {};
      Object.entries(selectedSpecs).forEach(([key, set]) => {
        specs[key] = Array.from(set);
      });

      // Get description
      const descInput = document.getElementById("serviceDesc") as HTMLTextAreaElement;
      const description = descInput?.value || '';

      // Get provider name
      const providerNameInput = document.getElementById("providerName") as HTMLInputElement;
      const providerName = providerNameInput?.value.trim() || '';

      // Get business icon emoji based on type
      const businessIcons: Record<string, string> = {
        beauty: '💇‍♀️', home: '🔧', health: '🏥', education: '📚',
        automotive: '🚗', events: '🎉', tech: '💻', fitness: '🏋️',
        cleaning: '🧹', photography: '📸', catering: '🍽️', medical: '🏥', other: '✨'
      };

      // Generate gradient based on business type
      const gradients: Record<string, string> = {
        beauty: 'from-[#f3e8ff] to-[#e9d5ff]',
        home: 'from-[#fef3c7] to-[#fde68a]',
        health: 'from-[#dcfce7] to-[#bbf7d0]',
        education: 'from-[#e0e7ff] to-[#c7d2fe]',
        automotive: 'from-[#fecaca] to-[#fecaca]',
        events: 'from-[#fce7f3] to-[#fbcfe8]',
        tech: 'from-[#dbeafe] to-[#bfdbfe]',
        fitness: 'from-[#fef3c7] to-[#fde68a]',
        cleaning: 'from-[#f0fdf4] to-[#dcfce7]',
        photography: 'from-[#fff7ed] to-[#ffedd5]',
        catering: 'from-[#fff1f2] to-[#ffe4e6]',
        medical: 'from-[#fee2e2] to-[#fecaca]',
        other: 'from-[#f8fafc] to-[#f1f5f9]'
      };

      // Upload portfolio images
      let portfolioImageUrls: string[] = [];
      const validImages = portfolioImages.filter(img => img != null);
      
      if (validImages.length > 0) {
        setUploadingImages(true);
        try {
          const uploadPromises = validImages.map(img => bunnyStorage.uploadFile(user, img, "services"));
          
          const uploadResults = await Promise.all(uploadPromises);
          portfolioImageUrls = uploadResults
            .filter(result => result.success && result.url)
            .map(result => result.url!);
          
          console.log("Uploaded portfolio images:", portfolioImageUrls);
        } catch (error) {
          console.error("Error uploading images:", error);
          alert("Failed to upload images. Please try again.");
          return;
        } finally {
          setUploadingImages(false);
        }
      }

      // Get pricing from tier inputs
      const tierInputs = document.querySelectorAll('.tier-price-input') as NodeListOf<HTMLInputElement>;
      const prices = {
        basic: Number(tierInputs[0]?.value) || 0,
        standard: Number(tierInputs[1]?.value) || 0,
        premium: Number(tierInputs[2]?.value) || 0
      };
      
      // Calculate min and max prices
      const validPrices = [prices.basic, prices.standard, prices.premium].filter(p => p > 0);
      const priceMin = validPrices.length > 0 ? Math.min(...validPrices) : 0;
      const priceMax = validPrices.length > 0 ? Math.max(...validPrices) : 0;

      // Create service data first (without bookingUrl)
      const serviceDataWithoutUrl = {
        name,
        description,
        providerName,
        emoji: businessIcons[selectedBusiness] || '✨',
        bgGradient: gradients[selectedBusiness] || 'from-gray-100 to-gray-200',
        duration: `${selectedDuration} min`,
        location: selectedLocation,
        tags: [selectedBusiness, ...specs.service_type || []].slice(0, 5),
        priceMin,
        priceMax,
        packagePrices: prices, // Save individual tier prices
        businessType: selectedBusiness,
        specifications: specs,
        tier: selectedTier,
        mode: selectedMode,
        selectedDuration: Number(selectedDuration),
        status: 'active' as const,
        portfolioImages: portfolioImageUrls,
        imageUrl: portfolioImageUrls.length > 0 ? portfolioImageUrls[0] : undefined,
        packageFeatures,
        availability: {
          days: Array.from(selectedDays),
          timeSlots: Array.from(selectedTimes)
        },
        customTimeSlots: generateTimeSlots(Number(selectedDuration)),
      };

      // Create the service in Firestore
      const createdService = await serviceService.createService(user, serviceDataWithoutUrl);
      
      // Generate booking URL with the actual service ID
      const bookingUrl = `${window.location.origin}/book/${createdService.id}`;
      console.log("Generated booking URL:", bookingUrl);
      
      // Update the service with the booking URL
      await serviceService.updateService(user, createdService.id, { bookingUrl });
      console.log("Service created successfully with", portfolioImageUrls.length, "portfolio images");
      alert(`Service "${name}" saved successfully!`);
      closeModal();
      // Reload the page to refresh services list
      window.location.reload();
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Failed to save service. Please try again.");
    } finally {
      setSaving(false);
      setUploadingImages(false);
    }
  };

  // Toggle day selection
  const toggleDay = (day: string) => {
    const newDays = new Set(selectedDays);
    if (newDays.has(day)) {
      newDays.delete(day);
    } else {
      newDays.add(day);
    }
    setSelectedDays(newDays);
  };

  // Toggle time slot selection
  const toggleTime = (time: string) => {
    if (bookedTimes.has(time)) return; // Can't select booked slots
    const newTimes = new Set(selectedTimes);
    if (newTimes.has(time)) {
      newTimes.delete(time);
    } else {
      newTimes.add(time);
    }
    setSelectedTimes(newTimes);
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dates = [6, 7, 8, 9, 10, 11, 12];
  const times = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'];

  // Build specs HTML dynamically
  const renderSpecs = () => {
    if (!selectedBusiness) return null;
    const business = businessSpecs[selectedBusiness];
    if (!business) return null;

    return Object.entries(business.specs).map(([key, spec]: [string, any]) => (
      <div key={key} className="spec-group">
        <div className="spec-header">
          <div className="spec-title">
            <i className={`fas ${spec.icon}`}></i>
            {spec.label}
          </div>
        </div>
        <div className="spec-options" id={`spec-${key}`}>
          {spec.options.map((opt: string) => (
            <button
              key={opt}
              className={`spec-option ${selectedSpecs[key]?.has(opt) ? 'active' : ''}`}
              onClick={() => toggleSpec(key, opt)}
            >
              <i className="fas fa-check check-icon"></i>
              {opt}
            </button>
          ))}
          <button
            className="add-custom-btn"
            onClick={() => addCustomOption(key)}
            style={{ display: activeCustomSpec === key ? 'none' : 'flex' }}
          >
            <i className="fas fa-plus"></i>
            Add Custom
          </button>
          {activeCustomSpec === key && (
            <div className="custom-input-row">
              <input
                type="text"
                className="custom-input"
                placeholder="Enter custom..."
                value={tempCustomValue}
                onChange={(e) => setTempCustomValue(e.target.value)}
                autoFocus
              />
              <button
                className="spec-option"
                onClick={() => saveCustom(key)}
                style={{ background: 'var(--service)', color: 'white' }}
              >
                <i className="fas fa-check"></i>
              </button>
              <button
                className="spec-option"
                onClick={cancelCustom}
                style={{ background: 'var(--danger)', color: 'white' }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    ));
  };

  // Get business icon emoji
  const getBusinessIcon = (key: string): string => {
    const icons: Record<string, string> = {
      beauty: '💇‍♀️', home: '🔧', health: '🏥', education: '📚',
      automotive: '🚗', events: '🎉', tech: '💻', fitness: '🏋️',
      cleaning: '🧹', photography: '📸', catering: '🍽️', medical: '🏥', other: '✨'
    };
    return icons[key] || '✨';
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-semibold text-sm shadow-lg"
      >
        <i className="fas fa-plus mr-2"></i>
        Add Service
      </button>

      {/* Modal */}
      {open && (
        <div className="modal-overlay" id="addServiceModal" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="modal-header">
              <h2 className="modal-title">
                <i className="fas fa-plus-circle"></i>
                Add New Service
              </h2>
              <button className="modal-close" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              
              {/* Basic Info */}
              <div className="form-section">
                <div className="section-title">
                  <i className="fas fa-info-circle"></i>
                  Service Information
                </div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Business/Provider Name *</label>
                    <input type="text" className="form-input" id="providerName" placeholder="e.g., Sarah's Beauty Salon" />
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Service Name *</label>
                    <input type="text" className="form-input" id="serviceName" placeholder="e.g., Professional Box Braids" />
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Description</label>
                    <textarea className="form-textarea" id="serviceDesc" placeholder="Describe what clients can expect..."></textarea>
                  </div>
                </div>
              </div>

              {/* Business Type */}
              <div className="form-section">
                <div className="section-title">
                  <i className="fas fa-store"></i>
                  Select Your Business Type
                </div>
                <div className="business-types" id="businessTypes">
                  {Object.entries(businessSpecs).map(([key, spec]: [string, any]) => (
                    <div 
                      key={key} 
                      className={`business-card ${selectedBusiness === key ? 'active' : ''}`}
                      onClick={() => setSelectedBusiness(key)}
                    >
                      <div className="business-icon">{getBusinessIcon(key)}</div>
                      <div className="business-name">{spec.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Mode */}
              {selectedBusiness && (
                <div className="form-section" id="serviceModeSection">
                  <div className="section-title">
                    <i className="fas fa-briefcase"></i>
                    How Do You Deliver This Service?
                  </div>
                  <div className="mode-selector">
                    <button 
                      className={`mode-btn ${selectedMode === 'in-person' ? 'active' : ''}`}
                      onClick={() => setSelectedMode('in-person')}
                    >
                      <i className="fas fa-map-marker-alt"></i>
                      In-Person
                    </button>
                    <button 
                      className={`mode-btn ${selectedMode === 'remote' ? 'active' : ''}`}
                      onClick={() => setSelectedMode('remote')}
                    >
                      <i className="fas fa-video"></i>
                      Remote/Video
                    </button>
                    <button 
                      className={`mode-btn ${selectedMode === 'both' ? 'active' : ''}`}
                      onClick={() => setSelectedMode('both')}
                    >
                      <i className="fas fa-random"></i>
                      Both
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic Specifications */}
              {selectedBusiness && (
                <div className="specs-container active" ref={specsContainerRef}>
                  {renderSpecs()}
                </div>
              )}

               {/* Pricing Tiers */}
               {selectedBusiness && (
                 <div className="form-section" id="pricingSection">
                   <div className="section-title">
                     <i className="fas fa-tags"></i>
                     Pricing Packages
                   </div>
                   <div className="pricing-tiers">
                     {[
                       { 
                         key: 'basic', 
                         label: 'Starter', 
                         badge: 'Basic', 
                         badgeClass: 'basic',
                         features: [
                           <div className="tier-feature" key="1"><i className="fas fa-check"></i> Core service</div>,
                           <div className="tier-feature" key="2"><i className="fas fa-check"></i> Standard quality</div>,
                           <div className="tier-feature" key="3"><i className="fas fa-check"></i> 1 revision</div>,
                         ]
                       },
                       { 
                         key: 'standard', 
                         label: 'Standard', 
                         badge: 'Popular', 
                         badgeClass: 'standard',
                         features: [
                           <div className="tier-feature" key="1"><i className="fas fa-check"></i> Everything in Basic</div>,
                           <div className="tier-feature" key="2"><i className="fas fa-check"></i> Premium materials</div>,
                           <div className="tier-feature" key="3"><i className="fas fa-check"></i> 2 revisions</div>,
                         ]
                       },
                       { 
                         key: 'premium', 
                         label: 'Premium', 
                         badge: 'Best', 
                         badgeClass: 'premium',
                         features: [
                           <div className="tier-feature" key="1"><i className="fas fa-check"></i> Everything in Standard</div>,
                           <div className="tier-feature" key="2"><i className="fas fa-check"></i> VIP treatment</div>,
                           <div className="tier-feature" key="3"><i className="fas fa-check"></i> Unlimited revisions</div>,
                         ]
                       },
                     ].map((tier) => (
                       <div
                         key={tier.key}
                         className={`tier-card ${selectedTier === tier.key ? 'active' : ''}`}
                         onClick={() => setSelectedTier(tier.key as "basic" | "standard" | "premium")}
                       >
                         <span className={`tier-badge ${tier.badgeClass}`}>{tier.badge}</span>
                         <div className="tier-name">{tier.label}</div>
                         <input type="number" className="tier-price-input" placeholder="KSh 0.00" />
                         <div className="tier-features">
                           {tier.features}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}



              {/* Pricing & Tier Customization */}
              {selectedBusiness && (
                <div className="form-section">
                </div>
              )}

              {/* Availability */}
              {selectedBusiness && (
                <div className="form-section" id="availabilitySection">
                  <div className="section-title">
                    <i className="fas fa-calendar-alt"></i>
                    Availability
                  </div>
                  <div className="availability-grid">
                    {days.map((day, i) => (
                      <button
                        key={day}
                        className={`day-btn ${selectedDays.has(day) ? 'active' : ''}`}
                        onClick={() => toggleDay(day)}
                      >
                        <span className="day-name">{day}</span>
                        <span className="day-date">{dates[i]}</span>
                      </button>
                    ))}
                  </div>
                  <div className="time-slots">
                    {times.map(time => (
                      <button
                        key={time}
                        className={`time-slot ${bookedTimes.has(time) ? 'booked' : ''} ${selectedTimes.has(time) ? 'active' : ''}`}
                        onClick={() => toggleTime(time)}
                        disabled={bookedTimes.has(time)}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              {selectedBusiness && (
                <div className="form-section" id="locationSection">
                  <div className="section-title">
                    <i className="fas fa-map-pin"></i>
                    Service Location
                  </div>
                  <div className="location-options">
                    {[
                      { key: 'client-place', label: "Client's Place", icon: 'fa-home' },
                      { key: 'my-place', label: 'My Studio/Shop', icon: 'fa-store' },
                      { key: 'both-places', label: 'Both', icon: 'fa-exchange-alt' },
                      { key: 'remote', label: 'Online/Remote', icon: 'fa-laptop' },
                    ].map(loc => (
                       <button
                         key={loc.key}
                         className={`location-btn ${selectedLocation === loc.key ? 'active' : ''}`}
                         onClick={() => setSelectedLocation(loc.key as "client-place" | "my-place" | "both-places" | "remote")}
                       >
                        <i className={`fas ${loc.icon}`}></i>
                        {loc.label}
                      </button>
                    ))}
                  </div>
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label">Service Area / Radius (km)</label>
                    <input type="number" className="form-input" placeholder="e.g., 10" />
                  </div>
                </div>
              )}

              {/* Duration */}
              {selectedBusiness && (
                <div className="form-section" id="durationSection">
                  <div className="section-title">
                    <i className="fas fa-clock"></i>
                    Service Duration
                  </div>
                  <div className="duration-selector">
                    {['15 min','30 min','1 hour','1.5 hours','2 hours','3 hours','4+ hours','Custom'].map((d, idx) => {
                      const val = ['15','30','60','90','120','180','240','custom'][idx];
                      return (
                        <button
                          key={val}
                          className={`duration-btn ${selectedDuration === val ? 'active' : ''}`}
                          onClick={() => setSelectedDuration(val)}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Deposit & Cancellation */}
              {selectedBusiness && (
                <div className="form-section" id="policySection">
                  <div className="section-title">
                    <i className="fas fa-shield-alt"></i>
                    Booking Policy
                  </div>
                  <div className="toggle-row">
                    <span className="toggle-label">Require Deposit</span>
                    <div className="toggle" onClick={(e) => e.currentTarget.classList.toggle('active')}>
                      <div className="toggle-slider"></div>
                    </div>
                  </div>
                  <div className="toggle-row">
                    <span className="toggle-label">Allow Rescheduling</span>
                    <div className="toggle active" onClick={(e) => e.currentTarget.classList.toggle('active')}>
                      <div className="toggle-slider"></div>
                    </div>
                  </div>
                  <div className="toggle-row">
                    <span className="toggle-label">24h Cancellation Notice</span>
                    <div className="toggle active" onClick={(e) => e.currentTarget.classList.toggle('active')}>
                      <div className="toggle-slider"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Portfolio Images */}
              <div className="form-section">
                <div className="section-title">
                  <i className="fas fa-images"></i>
                  Portfolio Photos
                </div>
                <div className="image-upload-grid">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="upload-slot">
                      {portfolioImages[i] ? (
                        <div className="image-preview">
                          <img
                            src={URL.createObjectURL(portfolioImages[i])}
                            alt={`Portfolio ${i + 1}`}
                            className="preview-image"
                          />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => removeImage(i)}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        <div
                          className="upload-placeholder"
                          onClick={() => document.getElementById(`portfolioInput${i}`)?.click()}
                        >
                          <i className="fas fa-plus"></i>
                          <span>Add Photo</span>
                        </div>
                      )}
                      <input
                        type="file"
                        id={`portfolioInput${i}`}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageSelect(e, i)}
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal} disabled={saving || uploadingImages}>Cancel</button>
              <button className="btn btn-primary" onClick={saveService} disabled={saving || uploadingImages}>
                <i className={`fas ${uploadingImages ? 'fa-spinner fa-spin' : saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
                {uploadingImages ? 'Uploading...' : saving ? 'Saving...' : 'Save Service'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
