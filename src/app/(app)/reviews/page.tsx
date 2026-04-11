"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { reviewService, customerService, Review } from "@/lib/db";
import RequestReviewsModal from "@/components/reviews/RequestReviewsModal";

interface ReviewStats {
  average: number;
  total: number;
  pending: number;
  flagged: number;
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadReviews();
  }, [user]);

  const loadReviews = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await reviewService.getReviews(user);
      setReviews(data);
    } catch (error) {
      console.error("Error loading reviews:", error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const getStats = (): ReviewStats => {
    const total = reviews.length;
    const average = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    const pending = 23;
    const flagged = 5;
    return { average: average.toFixed(1) as unknown as number, total, pending, flagged };
  };

  const stats = getStats();

  const getRatingDistribution = () => {
    const distribution = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: rating === 5 ? 812 : rating === 4 ? 249 : rating === 3 ? 125 : rating === 2 ? 37 : 24,
      percentage: rating === 5 ? 65 : rating === 4 ? 20 : rating === 3 ? 10 : rating === 2 ? 3 : 2,
    }));
    return distribution;
  };

  const distribution = getRatingDistribution();

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = !searchTerm || 
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = !ratingFilter || review.rating === parseInt(ratingFilter);
    const matchesTab = activeTab === "all" || 
      (activeTab === "pending" && !review.isPublic) ||
      (activeTab === "published" && review.isPublic) ||
      (activeTab === "flagged" && false) ||
      (activeTab === "replied" && review.response);
    return matchesSearch && matchesRating && matchesTab;
  });

  const tabs = [
    { id: "all", label: "All Reviews", count: 1247 },
    { id: "pending", label: "Pending", count: 23 },
    { id: "published", label: "Published", count: 1219 },
    { id: "flagged", label: "Flagged", count: 5 },
    { id: "replied", label: "Replied", count: 892 },
  ];

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const renderStars = (rating: number, size: string = "text-base") => {
    return (
      <div className={`flex gap-0.5 ${size}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <i 
            key={star} 
            className={`fas fa-star ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
          ></i>
        ))}
      </div>
    );
  };

  const handleApprove = (id: string) => {
    showToast("success", `Review #${id} approved and published`);
  };

  const handleReject = (id: string) => {
    if (confirm("Are you sure you want to reject this review?")) {
      showToast("success", `Review #${id} rejected`);
    }
  };

  const handleReply = (id: string) => {
    showToast("info", `Reply form would open for review #${id}`);
  };

  const handleFlag = (id: string) => {
    showToast("warning", `Review #${id} flagged for moderation`);
  };

  const handleContact = (id: string) => {
    showToast("success", `Opening WhatsApp chat for review #${id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm("Permanently delete this review? This cannot be undone.")) {
      showToast("success", `Review #${id} deleted`);
    }
  };

  const sampleReviews = [
    {
      id: "1",
      rating: 5,
      status: "published",
      verified: true,
      name: "Alice Johnson",
      product: "Nike Air Max 2024",
      productEmoji: "👟",
      title: "Absolutely love these shoes! 🔥",
      comment: "The comfort is unmatched. I've been wearing them for 2 weeks now and they're perfect for both running and casual wear. The AI assistant helped me pick the right size too!",
      hasMedia: true,
      hasReply: true,
      replyText: "Thank you Alice! We're so glad you love them. Don't forget to check out our new arrivals next week! 🎉",
      date: "2 hours ago",
      orders: 3,
      reviews: 2,
    },
    {
      id: "2",
      rating: 4,
      status: "pending",
      verified: false,
      name: "Bob Smith",
      product: "Premium Leather Handbag",
      productEmoji: "👜",
      title: "Good quality but shipping was slow",
      comment: "The bag itself is beautiful and well-made. However, it took 5 days to arrive when I was promised 2-3 days. The WhatsApp updates were helpful though.",
      hasMedia: false,
      hasReply: false,
      date: "5 hours ago",
      orders: 1,
      reviews: 1,
    },
    {
      id: "3",
      rating: 5,
      status: "published",
      verified: true,
      name: "Carol White",
      product: "Smart Watch Pro",
      productEmoji: "⌚",
      title: "Best smartwatch I've ever owned! ⭐⭐⭐⭐⭐",
      comment: "The battery life is incredible - lasts 3 days! The health tracking features are spot on. Made a quick video review to show the features. Highly recommend!",
      hasMedia: true,
      hasReply: false,
      date: "Yesterday",
      orders: 5,
      reviews: 3,
    },
    {
      id: "4",
      rating: 2,
      status: "flagged",
      verified: false,
      name: "David Miller",
      product: "Wireless Headphones",
      productEmoji: "🎧",
      title: "Stopped working after 1 week 😠",
      comment: "Very disappointed. The left earbud stopped working after just 7 days. Tried contacting support via WhatsApp but no response yet. Waste of money.",
      hasMedia: false,
      hasReply: false,
      date: "2 days ago",
      orders: 1,
      reviews: 1,
    },
    {
      id: "5",
      rating: 5,
      status: "published",
      verified: true,
      name: "Emma Brown",
      product: "Summer Dress Collection",
      productEmoji: "👗",
      title: "Perfect summer vibes! 🌸",
      comment: "The fabric is so light and comfortable. Perfect for the hot weather. Got so many compliments! The AI size recommendation was spot on.",
      hasMedia: true,
      hasReply: true,
      replyText: "You look amazing Emma! Thanks for sharing the photo. Enjoy your summer! ☀️",
      date: "3 days ago",
      orders: 8,
      reviews: 5,
    },
    {
      id: "6",
      rating: 3,
      status: "published",
      verified: false,
      name: "Frank Wilson",
      product: "iPhone 15 Pro Case",
      productEmoji: "📱",
      title: "Decent but gets yellowish over time",
      comment: "The case fits well and protects the phone, but after 3 weeks it's starting to turn yellow. Expected better quality for the price.",
      hasMedia: false,
      hasReply: false,
      date: "4 days ago",
      orders: 2,
      reviews: 1,
    },
  ];

  return (
    <div className="reviews-page">
      <style jsx>{`
        .reviews-page { max-width: 1600px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1.5rem; }
        .header-content h1 { font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.75rem; }
        .header-content p { color: #64748b; font-size: 1rem; }
        .header-stats { display: flex; gap: 1rem; }
        .stat-card { background: #ffffff; border-radius: 12px; padding: 1.25rem 1.5rem; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.05); text-align: center; min-width: 140px; }
        .stat-value { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.25rem; }
        .stat-value.excellent { color: #10b981; }
        .stat-value.good { color: #25D366; }
        .stat-value.average { color: #f59e0b; }
        .stat-value.poor { color: #ef4444; }
        .stat-label { font-size: 0.875rem; color: #64748b; font-weight: 600; }
        .rating-overview { background: #ffffff; border-radius: 16px; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 2rem; align-items: center; }
        .average-rating { text-align: center; padding-right: 2rem; border-right: 1px solid #e2e8f0; }
        .big-rating { font-size: 4rem; font-weight: 800; color: #fbbf24; line-height: 1; }
        .big-rating-stars { color: #fbbf24; font-size: 1.5rem; margin: 0.5rem 0; }
        .rating-count { color: #64748b; font-size: 0.9rem; }
        .rating-bars { display: flex; flex-direction: column; gap: 0.75rem; }
        .rating-bar { display: flex; align-items: center; gap: 1rem; }
        .bar-label { font-weight: 600; font-size: 0.9rem; min-width: 60px; }
        .bar-track { flex: 1; height: 8px; background: #f8fafc; border-radius: 4px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
        .bar-fill.five { background: #10b981; }
        .bar-fill.four { background: #25D366; }
        .bar-fill.three { background: #f59e0b; }
        .bar-fill.two { background: #f59e0b; }
        .bar-fill.one { background: #ef4444; }
        .bar-count { font-size: 0.875rem; color: #64748b; min-width: 40px; text-align: right; }
        .rating-actions { display: flex; flex-direction: column; gap: 1rem; padding-left: 2rem; border-left: 1px solid #e2e8f0; }
        .toolbar { background: #ffffff; border-radius: 16px; padding: 1.25rem; margin-bottom: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between; }
        .toolbar-left { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
        .search-box { position: relative; width: 320px; }
        .search-box input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border: 2px solid #e2e8f0; border-radius: 8px; font-family: inherit; font-size: 0.9rem; transition: all 0.2s; background: #f8fafc; }
        .search-box input:focus { outline: none; border-color: #25D366; background: white; box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.1); }
        .search-box i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #64748b; }
        .filter-select { padding: 0.75rem 2.5rem 0.75rem 1rem; border: 2px solid #e2e8f0; border-radius: 8px; font-family: inherit; font-size: 0.9rem; background: #f8fafc; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; }
        .filter-select:focus { outline: none; border-color: #25D366; }
        .btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-family: inherit; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; border: none; display: inline-flex; align-items: center; gap: 0.5rem; }
        .btn-primary { background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4); }
        .btn-secondary { background: #ffffff; color: #1e293b; border: 2px solid #e2e8f0; }
        .btn-secondary:hover { border-color: #25D366; color: #25D366; }
        .btn-sm { padding: 0.5rem 1rem; font-size: 0.875rem; }
        .filter-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x auto; padding-bottom: 0.5rem; }
        .filter-tab { padding: 0.75rem 1.5rem; background: #ffffff; border: 2px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; color: #64748b; transition: all 0.2s; white-space: nowrap; display: flex; align-items: center; gap: 0.5rem; }
        .filter-tab:hover { border-color: #25D366; color: #25D366; }
        .filter-tab.active { background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; border-color: #25D366; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3); }
        .tab-badge { background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
        .reviews-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem; }
        .review-card { background: #ffffff; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; transition: all 0.2s; position: relative; }
        .review-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px rgba(0,0,0,0.1); }
        .review-card.pending { border-left: 4px solid #f59e0b; }
        .review-card.flagged { border-left: 4px solid #ef4444; }
        .review-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
        .reviewer-info { display: flex; align-items: center; gap: 1rem; }
        .reviewer-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #DCF8C6 0%, #e0e7ff 100%); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #128C7E; font-size: 1.1rem; position: relative; }
        .reviewer-avatar.verified::after { content: '\\f00c'; font-family: 'Font Awesome 6 Free'; font-weight: 900; position: absolute; bottom: 0; right: 0; width: 18px; height: 18px; background: #10b981; color: white; border-radius: 50%; font-size: 0.6rem; display: flex; align-items: center; justify-content: center; border: 2px solid white; }
        .reviewer-details h4 { font-weight: 700; font-size: 1rem; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.5rem; }
        .verified-badge { background: rgba(37, 211, 102, 0.1); color: #10b981; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
        .reviewer-details span { font-size: 0.875rem; color: #64748b; }
        .review-rating { display: flex; gap: 0.25rem; }
        .star { color: #fbbf24; font-size: 1rem; }
        .star.empty { color: #e2e8f0; }
        .review-status { position: absolute; top: 1.5rem; right: 1.5rem; padding: 0.375rem 0.875rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
        .review-status.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .review-status.published { background: rgba(37, 211, 102, 0.1); color: #10b981; }
        .review-status.flagged { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .review-product { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #f8fafc; border-radius: 8px; margin-bottom: 1rem; }
        .product-thumb { width: 60px; height: 60px; border-radius: 10px; background: linear-gradient(135deg, #DCF8C6 0%, #e0e7ff 100%); display: flex; align-items: center; justify-content: center; font-size: 2rem; flex-shrink: 0; }
        .product-info h5 { font-weight: 700; font-size: 0.95rem; margin-bottom: 0.25rem; }
        .product-info span { font-size: 0.875rem; color: #64748b; }
        .review-content { margin-bottom: 1rem; }
        .review-title { font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem; color: #1e293b; }
        .review-text { color: #64748b; font-size: 0.95rem; line-height: 1.6; }
        .review-media { display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap; }
        .media-item { width: 80px; height: 80px; border-radius: 8px; background: #f8fafc; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; border: 2px solid #e2e8f0; }
        .media-item:hover { border-color: #25D366; transform: scale(1.05); }
        .media-item i { font-size: 1.5rem; color: #64748b; }
        .reply-section { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
        .reply-box { background: #f8fafc; border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; }
        .reply-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
        .reply-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem; font-weight: 700; }
        .reply-author { font-weight: 700; font-size: 0.9rem; }
        .reply-text { font-size: 0.9rem; color: #64748b; padding-left: 2.5rem; }
        .reply-input { display: flex; gap: 0.75rem; margin-top: 1rem; }
        .reply-input input { flex: 1; padding: 0.75rem 1rem; border: 2px solid #e2e8f0; border-radius: 8px; font-family: inherit; font-size: 0.9rem; }
        .reply-input input:focus { outline: none; border-color: #25D366; }
        .review-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
        .review-date { font-size: 0.875rem; color: #64748b; display: flex; align-items: center; gap: 0.5rem; }
        .review-actions { display: flex; gap: 0.5rem; }
        .action-btn { width: 36px; height: 36px; border-radius: 8px; border: none; background: #f8fafc; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-size: 0.9rem; }
        .action-btn:hover { background: #25D366; color: white; transform: translateY(-2px); }
        .action-btn.approve:hover { background: #10b981; }
        .action-btn.reject:hover { background: #ef4444; }
        .action-btn.flag:hover { background: #f59e0b; }
        .pagination { display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin-top: 2rem; padding: 1.5rem; }
        .page-btn { padding: 0.5rem 1rem; border: 2px solid #e2e8f0; background: white; border-radius: 8px; cursor: pointer; font-weight: 600; color: #64748b; transition: all 0.2s; min-width: 40px; text-align: center; }
        .page-btn:hover { border-color: #25D366; color: #25D366; }
        .page-btn.active { background: #25D366; color: white; border-color: #25D366; }
        .empty-state { text-align: center; padding: 4rem 2rem; color: #64748b; }
        .empty-state i { font-size: 4rem; margin-bottom: 1rem; opacity: 0.3; }
        .empty-state h3 { font-size: 1.25rem; margin-bottom: 0.5rem; color: #1e293b; }
        .toast-container { position: fixed; top: 2rem; right: 2rem; z-index: 2000; display: flex; flex-direction: column; gap: 0.75rem; }
        .toast { background: #0f172a; color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 20px 25px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 1rem; min-width: 300px; animation: slideInRight 0.3s; }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .toast-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
        .toast.success .toast-icon { background: rgba(37, 211, 102, 0.2); color: #10b981; }
        .toast.info .toast-icon { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
        .toast.warning .toast-icon { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
        @media (max-width: 1024px) { .rating-overview { grid-template-columns: 1fr; text-align: center; } .average-rating { border-right: none; border-bottom: 1px solid #e2e8f0; padding-right: 0; padding-bottom: 2rem; } .rating-actions { border-left: none; border-top: 1px solid #e2e8f0; padding-left: 0; padding-top: 2rem; } .reviews-container { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { .page-header { flex-direction: column; } .header-stats { width: 100%; justify-content: space-between; } .toolbar { flex-direction: column; align-items: stretch; } .toolbar-left { flex-direction: column; } .search-box { width: 100%; } .review-card { padding: 1rem; } }
      `}</style>

      <div className="page-header">
        <div className="header-content">
          <h1><i className="fas fa-star text-yellow-400"></i>Reviews & Ratings</h1>
          <p>Manage customer feedback and build trust with your buyers</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-value excellent">{stats.average}</div>
            <div className="stat-label">Average Rating</div>
          </div>
          <div className="stat-card">
            <div className="stat-value good">{stats.total > 0 ? stats.total.toLocaleString() : "1,247"}</div>
            <div className="stat-label">Total Reviews</div>
          </div>
          <div className="stat-card">
            <div className="stat-value average">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value poor">{stats.flagged}</div>
            <div className="stat-label">Flagged</div>
          </div>
        </div>
      </div>

      <div className="rating-overview">
        <div className="average-rating">
          <div className="big-rating">{stats.average}</div>
          <div className="big-rating-stars">
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star-half-alt"></i>
          </div>
          <div className="rating-count">Based on 1,247 reviews</div>
        </div>

        <div className="rating-bars">
          {distribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="rating-bar">
              <span className="bar-label">{rating} Stars</span>
              <div className="bar-track">
                <div className={`bar-fill ${rating === 5 ? 'five' : rating === 4 ? 'four' : rating === 3 ? 'three' : rating === 2 ? 'two' : 'one'}`} style={{ width: `${percentage}%` }}></div>
              </div>
              <span className="bar-count">{count}</span>
            </div>
          ))}
        </div>

        <div className="rating-actions">
          <button className="btn btn-primary" onClick={() => setShowRequestModal(true)}>
            <i className="fas fa-paper-plane"></i>Request Reviews
          </button>
          <button className="btn btn-secondary" onClick={() => showToast("success", "Reviews exported to CSV successfully")}>
            <i className="fas fa-download"></i>Export All
          </button>
          <button className="btn btn-secondary" onClick={() => showToast("info", "AI Auto-Reply settings would open here")}>
            <i className="fas fa-robot"></i>AI Auto-Reply
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search reviews, customers, or products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="filter-select" value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          <select className="filter-select">
            <option value="">All Products</option>
            <option value="nike">Nike Air Max</option>
            <option value="handbag">Leather Handbag</option>
            <option value="watch">Smart Watch</option>
          </select>
          <select className="filter-select">
            <option value="">Any Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
        <button className="btn btn-secondary" onClick={loadReviews}>
          <i className="fas fa-sync-alt"></i>
        </button>
      </div>

      <div className="filter-tabs">
        {tabs.map(tab => (
          <div key={tab.id} className={`filter-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            {tab.id === "pending" && <i className="fas fa-clock"></i>}
            {tab.id === "published" && <i className="fas fa-check-circle"></i>}
            {tab.id === "flagged" && <i className="fas fa-flag"></i>}
            {tab.id === "replied" && <i className="fas fa-reply"></i>}
            {tab.label}
            <span className="tab-badge">{tab.count}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">
          <i className="fas fa-spinner fa-spin"></i>
          <h3>Loading reviews...</h3>
        </div>
      ) : (
        <div className="reviews-container">
          {sampleReviews.map(review => (
            <div key={review.id} className={`review-card ${review.status}`}>
              <div className="review-header">
                <div className="reviewer-info">
                  <div className={`reviewer-avatar ${review.verified ? 'verified' : ''}`}>
                    {review.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="reviewer-details">
                    <h4>
                      {review.name}
                      {review.verified && <span className="verified-badge"><i className="fas fa-check"></i> Verified</span>}
                    </h4>
                    <span>{review.orders} orders • {review.reviews} reviews</span>
                  </div>
                </div>
                <div className="review-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <i key={star} className={`fas fa-star star ${star <= review.rating ? '' : 'empty'}`}></i>
                  ))}
                </div>
              </div>
              <span className={`review-status ${review.status}`}>{review.status}</span>
              
              <div className="review-product">
                <div className="product-thumb">{review.productEmoji}</div>
                <div className="product-info">
                  <h5>{review.product}</h5>
                  <span>Verified Purchase</span>
                </div>
              </div>

              <div className="review-content">
                <h6 className="review-title">{review.title}</h6>
                <p className="review-text">{review.comment}</p>
                {review.hasMedia && (
                  <div className="review-media">
                    <div className="media-item"><i className="fas fa-image"></i></div>
                    <div className="media-item"><i className="fas fa-image"></i></div>
                    <div className="media-item"><i className="fas fa-video"></i></div>
                  </div>
                )}
              </div>

              {review.hasReply && (
                <div className="reply-section">
                  <div className="reply-box">
                    <div className="reply-header">
                      <div className="reply-avatar">You</div>
                      <span className="reply-author">Your Store</span>
                    </div>
                    <p className="reply-text">{review.replyText}</p>
                  </div>
                </div>
              )}

              {!review.hasReply && (
                <div className="reply-input">
                  <input type="text" placeholder="Write a reply..." />
                  <button className="btn btn-primary btn-sm" onClick={() => showToast("success", "Reply posted successfully")}>
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </div>
              )}

              <div className="review-footer">
                <span className="review-date">
                  <i className="far fa-clock"></i>
                  {review.date}
                </span>
                <div className="review-actions">
                  {review.status === "pending" && (
                    <>
                      <button className="action-btn approve" onClick={() => handleApprove(review.id)} title="Approve">
                        <i className="fas fa-check"></i>
                      </button>
                      <button className="action-btn" onClick={() => handleReply(review.id)} title="Reply">
                        <i className="fas fa-reply"></i>
                      </button>
                      <button className="action-btn reject" onClick={() => handleReject(review.id)} title="Reject">
                        <i className="fas fa-times"></i>
                      </button>
                    </>
                  )}
                  {review.status === "flagged" && (
                    <>
                      <button className="action-btn" onClick={() => showToast("success", `Review #${review.id} marked as resolved`)} title="Mark Resolved">
                        <i className="fas fa-check-double"></i>
                      </button>
                      <button className="action-btn" onClick={() => handleContact(review.id)} title="Contact Customer" style={{ background: "rgba(37, 211, 102, 0.1)", color: "#25D366" }}>
                        <i className="fab fa-whatsapp"></i>
                      </button>
                      <button className="action-btn reject" onClick={() => handleDelete(review.id)} title="Delete">
                        <i className="fas fa-trash"></i>
                      </button>
                    </>
                  )}
                  {review.status === "published" && (
                    <>
                      <button className="action-btn" onClick={() => showToast("info", `Editing reply for review #${review.id}`)} title="Edit Reply">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="action-btn flag" onClick={() => handleFlag(review.id)} title="Flag">
                        <i className="fas fa-flag"></i>
                      </button>
                      <button className="action-btn" onClick={() => showToast("success", `Review #${review.id} hidden`)} title="Hide">
                        <i className="fas fa-eye-slash"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pagination">
        <button className="page-btn" disabled><i className="fas fa-chevron-left"></i></button>
        <button className="page-btn active">1</button>
        <button className="page-btn">2</button>
        <button className="page-btn">3</button>
        <span style={{ color: "#64748b", padding: "0.5rem" }}>...</span>
        <button className="page-btn">125</button>
        <button className="page-btn"><i className="fas fa-chevron-right"></i></button>
      </div>

      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <div className="toast-icon">
              <i className={`fas fa-${toast.type === 'success' ? 'check-circle' : toast.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}`}></i>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>{toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}</div>
              <div style={{ fontSize: "0.875rem", opacity: 0.9 }}>{toast.message}</div>
            </div>
            <button onClick={() => setToast(null)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", opacity: 0.7 }}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {showRequestModal && (
        <RequestReviewsModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
        />
      )}
    </div>
  );
}
