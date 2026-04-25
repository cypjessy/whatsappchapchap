"use client";

import { useState, useEffect } from "react";
import { useMode } from "@/context/ModeContext";
import { useAuth } from "@/context/AuthContext";
import { portfolioService, certificationService, reviewService, PortfolioItem, Certification, Review } from "@/lib/db";

export default function PortfolioPage() {
  const { mode } = useMode();
  const { user } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [testimonials, setTestimonials] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<"gallery" | "before-after" | "videos" | "certifications" | "testimonials">("gallery");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "info">("info");
  const [uploading, setUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "gallery" as PortfolioItem["category"],
    clientName: "",
    serviceName: "",
    tags: "",
    featured: false,
  });

  useEffect(() => {
    if (mode === "service" && user) {
      loadPortfolioData();
    }
  }, [mode, user]);

  const loadPortfolioData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [items, certs, reviews] = await Promise.all([
        portfolioService.getPortfolioItems(user),
        certificationService.getCertifications(user),
        reviewService.getReviews(user),
      ]);
      setPortfolioItems(items);
      setCertifications(certs);
      setTestimonials(reviews);
    } catch (error) {
      console.error("Error loading portfolio data:", error);
    } finally {
      setLoading(false);
    }
  };

  const displayToast = (type: "success" | "info", message: string) => {
    setToastType(type);
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const uploadToBunny = async (file: File): Promise<string> => {
    if (!user) throw new Error("User not authenticated");
    
    const token = await user.getIdToken();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "portfolio");

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile) return;

    setUploading(true);
    try {
      const imageUrl = await uploadToBunny(selectedFile);

      await portfolioService.createPortfolioItem(user, {
        title: formData.title,
        description: formData.description,
        imageUrl,
        category: formData.category,
        clientName: formData.clientName,
        serviceName: formData.serviceName,
        tags: formData.tags.split(",").map(t => t.trim()).filter(t => t),
        featured: formData.featured,
      });

      displayToast("success", "Portfolio item added successfully!");
      setShowAddModal(false);
      resetForm();
      loadPortfolioData();
    } catch (error) {
      console.error("Error creating portfolio item:", error);
      alert("Failed to add portfolio item");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setFormData({
      title: "",
      description: "",
      category: "gallery",
      clientName: "",
      serviceName: "",
      tags: "",
      featured: false,
    });
  };

  const deleteItem = async (itemId: string, imageUrl?: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await portfolioService.deletePortfolioItem(user, itemId);
      
      // Delete from Bunny.net if URL exists
      if (imageUrl) {
        const token = await user.getIdToken();
        await fetch(`/api/upload?url=${encodeURIComponent(imageUrl)}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      
      displayToast("success", "Item deleted successfully!");
      loadPortfolioData();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item");
    }
  };

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    const galleryItems = portfolioItems.filter(item => item.category === "gallery");
    setCurrentImageIndex((currentImageIndex + 1) % galleryItems.length);
  };

  const prevImage = () => {
    const galleryItems = portfolioItems.filter(item => item.category === "gallery");
    setCurrentImageIndex((currentImageIndex - 1 + galleryItems.length) % galleryItems.length);
  };

  // Calculate stats
  const totalWorks = portfolioItems.length;
  const averageRating = testimonials.length > 0 
    ? (testimonials.reduce((sum, t) => sum + (t.rating || 0), 0) / testimonials.length).toFixed(1)
    : "0";
  const totalViews = portfolioItems.reduce((sum, item) => sum + (item.views || 0), 0);

  const tabs = [
    { id: "gallery", label: "Gallery", icon: "fa-images" },
    { id: "before-after", label: "Before/After", icon: "fa-columns" },
    { id: "videos", label: "Videos", icon: "fa-video" },
    { id: "certifications", label: "Certs", icon: "fa-certificate" },
    { id: "testimonials", label: "Reviews", icon: "fa-quote-left" },
  ];

  if (mode !== "service") {
    return (
      <div className="p-4 md:p-6 text-center">
        <p className="text-[#64748b]">Switch to Service Mode to view portfolio</p>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 animate-fadeIn">
      {/* Profile Hero */}
      <div className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] rounded-2xl p-6 md:p-8 text-white mb-6 relative overflow-hidden">
        <div className="absolute top-[-50%] right-[-20%] w-[400px] h-[400px] bg-white/10 rounded-full"></div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white flex items-center justify-center text-4xl shrink-0 border-4 border-white/30">
            💇‍♀️
          </div>
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-extrabold mb-2">Your Portfolio</h2>
            <p className="text-white/90 text-sm mb-4">Showcase your best work and credentials</p>
            <div className="flex gap-6 md:gap-8">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-extrabold">{totalWorks}</div>
                <div className="text-xs uppercase opacity-80">Works</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-extrabold">{averageRating}</div>
                <div className="text-xs uppercase opacity-80">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-extrabold">{totalViews}</div>
                <div className="text-xs uppercase opacity-80">Views</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl p-1 mb-5 border border-[#e2e8f0] flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap flex items-center gap-2 transition-all ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-md"
                : "text-[#64748b] hover:text-[#8b5cf6]"
            }`}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <i className="fas fa-spinner fa-spin text-4xl text-[#8b5cf6] mb-4"></i>
          <p className="text-[#64748b]">Loading portfolio...</p>
        </div>
      ) : (
        <>
          {/* Gallery Tab */}
          {activeTab === "gallery" && (
            <div className="animate-fadeIn">
              <div
                onClick={() => setShowAddModal(true)}
                className="border-2 border-dashed border-[#e2e8f0] rounded-2xl p-8 text-center cursor-pointer hover:border-[#8b5cf6] hover:bg-[rgba(139,92,246,0.05)] transition-all mb-6"
              >
                <div className="w-20 h-20 rounded-full bg-[#ede9fe] flex items-center justify-center mx-auto mb-4 text-[#8b5cf6] text-3xl">
                  <i className="fas fa-cloud-upload-alt"></i>
                </div>
                <div className="font-bold text-lg text-[#1e293b] mb-1">Upload New Work</div>
                <div className="text-sm text-[#64748b]">Click to add photos to your portfolio</div>
              </div>

              {portfolioItems.filter(item => item.category === "gallery").length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-images text-6xl text-[#e2e8f0] mb-4"></i>
                  <h3 className="text-xl font-bold text-[#64748b] mb-2">No gallery items yet</h3>
                  <p className="text-[#64748b]">Start building your portfolio by uploading your first work</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {portfolioItems.filter(item => item.category === "gallery").map((item, index) => (
                    <div
                      key={item.id}
                      className="relative rounded-xl overflow-hidden cursor-pointer aspect-square border-2 border-[#e2e8f0] hover:border-[#8b5cf6] hover:shadow-lg transition-all group"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onClick={() => openLightbox(index)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
                        <div className="font-bold">{item.title}</div>
                        <div className="text-sm opacity-90">{item.clientName} • {item.serviceName}</div>
                      </div>
                      {item.featured && (
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-[#8b5cf6] text-white">
                          Featured
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(item.id, item.imageUrl);
                        }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <i className="fas fa-trash text-sm"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Before/After Tab */}
          {activeTab === "before-after" && (
            <div className="animate-fadeIn">
              {portfolioItems.filter(item => item.category === "before-after").length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-columns text-6xl text-[#e2e8f0] mb-4"></i>
                  <h3 className="text-xl font-bold text-[#64748b] mb-2">No before/after comparisons</h3>
                  <p className="text-[#64748b]">Upload transformation photos to showcase your skills</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {portfolioItems.filter(item => item.category === "before-after").map((item) => (
                    <div key={item.id} className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
                      <div className="relative h-[250px] md:h-[300px]">
                        <img
                          src={item.afterImageUrl || item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold bg-[#10b981] text-white">After</div>
                      </div>
                      <div className="p-4">
                        <div className="font-bold text-lg text-[#1e293b] mb-2">{item.title}</div>
                        <div className="flex gap-4 text-sm text-[#64748b]">
                          {item.clientName && <span><i className="fas fa-user mr-1"></i>{item.clientName}</span>}
                          {item.serviceName && <span><i className="fas fa-cut mr-1"></i>{item.serviceName}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Videos Tab */}
          {activeTab === "videos" && (
            <div className="animate-fadeIn">
              {portfolioItems.filter(item => item.category === "video").length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-video text-6xl text-[#e2e8f0] mb-4"></i>
                  <h3 className="text-xl font-bold text-[#64748b] mb-2">No videos yet</h3>
                  <p className="text-[#64748b]">Add video tutorials and showcases</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {portfolioItems.filter(item => item.category === "video").map((item) => (
                    <div
                      key={item.id}
                      className="relative rounded-xl overflow-hidden aspect-video bg-[#0f172a] cursor-pointer border-2 border-[#e2e8f0] hover:border-[#8b5cf6] transition-all"
                    >
                      {item.videoUrl ? (
                        <video src={item.videoUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed]">
                          <i className="fas fa-play-circle text-6xl text-white"></i>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="font-bold text-white">{item.title}</div>
                        <div className="text-sm text-white/90">{item.views || 0} views • {item.videoDuration || "N/A"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Certifications Tab */}
          {activeTab === "certifications" && (
            <div className="animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certifications.map((cert) => (
                  <div key={cert.id} className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm flex gap-4 hover:border-[#8b5cf6] hover:shadow-md transition-all">
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl shrink-0 bg-gradient-to-br from-[#ede9fe] to-[#e0e7ff] text-[#7c3aed]">
                      <i className={`fas ${cert.icon || "fa-award"}`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-[#1e293b]">{cert.title}</div>
                      <div className="text-sm text-[#64748b] mb-2">{cert.issuer}</div>
                      <div className="text-xs text-[#64748b] flex items-center gap-2">
                        <i className="far fa-calendar"></i>
                        Issued: {cert.issueDate}
                        {cert.verified && (
                          <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold bg-[rgba(37,211,102,0.1)] text-[#10b981]">Verified</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Testimonials Tab */}
          {activeTab === "testimonials" && (
            <div className="animate-fadeIn">
              {testimonials.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-quote-left text-6xl text-[#e2e8f0] mb-4"></i>
                  <h3 className="text-xl font-bold text-[#64748b] mb-2">No testimonials yet</h3>
                  <p className="text-[#64748b]">Reviews from your clients will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ede9fe] to-[#e0e7ff] flex items-center justify-center font-bold text-lg text-[#7c3aed]">
                          {(testimonial.customerName || "A")[0]}
                        </div>
                        <div>
                          <div className="font-bold text-[#1e293b]">{testimonial.customerName || "Anonymous"}</div>
                          <div className="text-sm text-[#64748b]">{new Date(testimonial.createdAt?.toDate()).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="text-[#f59e0b] mb-3">
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`fas fa-${i < (testimonial.rating || 0) ? "star" : "star"}`}
                            style={{ opacity: i < (testimonial.rating || 0) ? 1 : 0.3 }}
                          ></i>
                        ))}
                      </div>
                      <p className="text-sm text-[#64748b] leading-relaxed mb-4">{testimonial.comment}</p>
                      {testimonial.serviceId && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#f8fafc] rounded-full text-sm font-semibold text-[#8b5cf6]">
                          <i className="fas fa-cut"></i>
                          Service Review
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="md:hidden fixed bottom-20 right-5 w-14 h-14 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white flex items-center justify-center text-2xl shadow-lg z-50"
      >
        <i className="fas fa-plus"></i>
      </button>

      {/* Add Portfolio Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-[#e2e8f0] flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-extrabold text-[#1e293b] flex items-center gap-2">
                <i className="fas fa-plus-circle text-[#8b5cf6]"></i>
                Add Portfolio Item
              </h2>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="w-9 h-9 rounded-full bg-[#f8fafc] flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-[#64748b] mb-2">Image *</label>
                <div className="border-2 border-dashed border-[#e2e8f0] rounded-xl p-6 text-center hover:border-[#8b5cf6] transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="portfolio-upload"
                    required
                  />
                  <label htmlFor="portfolio-upload" className="cursor-pointer">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                    ) : (
                      <>
                        <i className="fas fa-cloud-upload-alt text-4xl text-[#8b5cf6] mb-2"></i>
                        <div className="text-sm text-[#64748b]">Click to upload image</div>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#64748b] mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                  placeholder="e.g., Knotless Braids"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#64748b] mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                  placeholder="Describe this work..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                  >
                    <option value="gallery">Gallery</option>
                    <option value="before-after">Before/After</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">Client Name</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">Service</label>
                  <input
                    type="text"
                    value={formData.serviceName}
                    onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                    placeholder="e.g., Box Braids"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                    placeholder="braids, natural hair"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 rounded border-[#e2e8f0] text-[#8b5cf6] focus:ring-[#8b5cf6]"
                  id="featured"
                />
                <label htmlFor="featured" className="text-sm font-semibold text-[#64748b]">Feature this item</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="flex-1 px-4 py-3 border-2 border-[#e2e8f0] rounded-xl font-bold text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>Uploading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus mr-2"></i>Add Item
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && portfolioItems.filter(item => item.category === "gallery").length > 0 && (
        <div
          className="fixed inset-0 bg-black/95 z-[3000] flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/20 text-white text-xl flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute top-1/2 -translate-y-1/2 left-4 w-12 h-12 rounded-full bg-white/20 text-white text-xl flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <div className="flex flex-col items-center gap-4 max-w-4xl">
            <img
              src={portfolioItems.filter(item => item.category === "gallery")[currentImageIndex]?.imageUrl}
              alt="Portfolio"
              className="max-h-[70vh] rounded-xl object-contain"
            />
            <div className="text-white text-center">
              <h3 className="font-bold text-xl mb-2">{portfolioItems.filter(item => item.category === "gallery")[currentImageIndex]?.title}</h3>
              <p className="opacity-90">{portfolioItems.filter(item => item.category === "gallery")[currentImageIndex]?.clientName}</p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute top-1/2 -translate-y-1/2 right-4 w-12 h-12 rounded-full bg-white/20 text-white text-xl flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-[3000] bg-[#0f172a] text-white px-5 py-4 rounded-xl shadow-xl flex items-center gap-3 min-w-[280px] animate-fadeIn">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              toastType === "success" ? "bg-[#10b981]/20 text-[#10b981]" : "bg-[#3b82f6]/20 text-[#3b82f6]"
            }`}
          >
            <i className={`fas fa-${toastType === "success" ? "check-circle" : "info-circle"}`}></i>
          </div>
          <div className="flex-1 text-sm">{toastMessage}</div>
          <button onClick={() => setShowToast(false)} className="text-white/70 hover:text-white">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
    </div>
  );
}
