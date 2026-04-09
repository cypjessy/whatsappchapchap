"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { reviewService, customerService, Review } from "@/lib/db";

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [newReview, setNewReview] = useState({
    customerId: "",
    orderId: "",
    productId: "",
    rating: 5,
    comment: "",
    isPublic: true,
  });

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [reviewsData, customersData] = await Promise.all([
        reviewService.getReviews(user),
        customerService.getCustomers(user),
      ]);
      setReviews(reviewsData);
      setCustomers(customersData);
    } catch (error) {
      console.error("Error loading reviews data:", error);
      setReviews([]);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const createReview = async () => {
    if (!user) return;
    if (!newReview.customerId || !newReview.comment) {
      alert("Please select a customer and add a comment");
      return;
    }

    try {
      const customer = getCustomerById(newReview.customerId);
      if (!customer) {
        alert("Customer not found");
        return;
      }

      const reviewData = {
        ...newReview,
        customerName: customer.name,
        orderId: newReview.orderId || "manual-review",
        productId: newReview.productId || undefined,
      };

      await reviewService.createReview(user, reviewData);
      loadData();
      setShowModal(false);
      setNewReview({
        customerId: "",
        orderId: "",
        productId: "",
        rating: 5,
        comment: "",
        isPublic: true,
      });
    } catch (error) {
      console.error("Error creating review:", error);
      alert("Error creating review");
    }
  };

  const updateReviewResponse = async (reviewId: string, response: string) => {
    if (!user) return;

    try {
      await reviewService.updateReview(user, reviewId, { response });
      loadData();
    } catch (error) {
      console.error("Error updating review response:", error);
      alert("Error updating review response");
    }
  };

  const toggleReviewVisibility = async (reviewId: string, isPublic: boolean) => {
    if (!user) return;

    try {
      await reviewService.updateReview(user, reviewId, { isPublic });
      loadData();
    } catch (error) {
      console.error("Error updating review visibility:", error);
      alert("Error updating review visibility");
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      await reviewService.deleteReview(user, reviewId);
      loadData();
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Error deleting review");
    }
  };

  const getCustomerById = (customerId: string) => {
    return customers.find(customer => customer.id === customerId);
  };

  const renderStars = (rating: number, interactive = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange && onChange(star)}
            className={`text-lg ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            <i className="fas fa-star"></i>
          </button>
        ))}
      </div>
    );
  };

  const getRatingStats = () => {
    const total = reviews.length;
    const average = total > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / total : 0;
    const distribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: reviews.filter(review => review.rating === rating).length,
      percentage: total > 0 ? (reviews.filter(review => review.rating === rating).length / total) * 100 : 0,
    }));

    return { total, average, distribution };
  };

  const filteredReviews = reviews.filter(review => {
    if (activeTab === "all") return true;
    if (activeTab === "public") return review.isPublic;
    if (activeTab === "private") return !review.isPublic;
    return review.rating === parseInt(activeTab);
  });

  const tabs = [
    { id: "all", label: "All Reviews", count: reviews.length },
    { id: "5", label: "5 Stars", count: reviews.filter(r => r.rating === 5).length },
    { id: "4", label: "4 Stars", count: reviews.filter(r => r.rating === 4).length },
    { id: "3", label: "3 Stars", count: reviews.filter(r => r.rating === 3).length },
    { id: "2", label: "2 Stars", count: reviews.filter(r => r.rating === 2).length },
    { id: "1", label: "1 Star", count: reviews.filter(r => r.rating === 1).length },
    { id: "public", label: "Public", count: reviews.filter(r => r.isPublic).length },
    { id: "private", label: "Private", count: reviews.filter(r => !r.isPublic).length },
  ];

  const stats = getRatingStats();

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-star text-[#25D366]"></i>Customer Reviews
          </h1>
          <p className="text-[#64748b]">Manage and respond to customer reviews</p>
        </div>
        <button 
          className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus mr-2"></i>Add Review
        </button>
      </div>

      {/* Rating Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
          <div className="text-center">
            <div className="text-4xl font-extrabold text-[#1e293b] mb-2">{stats.average.toFixed(1)}</div>
            <div className="flex justify-center mb-2">
              {renderStars(Math.round(stats.average))}
            </div>
            <p className="text-sm text-[#64748b]">Average Rating</p>
            <p className="text-xs text-[#64748b] mt-1">Based on {stats.total} reviews</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
          <h4 className="font-bold text-[#1e293b] mb-4">Rating Distribution</h4>
          <div className="space-y-3">
            {stats.distribution.reverse().map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm font-semibold">{rating}</span>
                  <i className="fas fa-star text-yellow-400 text-xs"></i>
                </div>
                <div className="flex-1 bg-[#f1f5f9] rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-[#64748b] w-8">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
          <h4 className="font-bold text-[#1e293b] mb-4">Quick Stats</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-[#64748b]">Total Reviews</span>
              <span className="font-semibold">{stats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#64748b]">Public Reviews</span>
              <span className="font-semibold">{reviews.filter(r => r.isPublic).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#64748b]">5-Star Reviews</span>
              <span className="font-semibold">{reviews.filter(r => r.rating === 5).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#64748b]">Response Rate</span>
              <span className="font-semibold">
                {stats.total > 0 ? Math.round((reviews.filter(r => r.response).length / stats.total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`px-5 py-3 rounded-full font-semibold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white" 
                : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#25D366]"
            }`}
          >
            {tab.label}
            <span className="px-2 py-0.5 rounded-full text-xs bg-white/20">{tab.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#64748b]">Loading reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#e2e8f0]">
          <div className="w-16 h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-star text-2xl text-[#64748b]"></i>
          </div>
          <h4 className="font-bold text-[#1e293b] mb-2">No reviews yet</h4>
          <p className="text-sm text-[#64748b]">Customer reviews will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map(review => {
            const customer = getCustomerById(review.customerId);
            
            return (
              <div key={review.id} className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:shadow-lg transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white font-bold">
                        {customer?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h3 className="font-bold text-[#1e293b]">{customer?.name || 'Unknown Customer'}</h3>
                        <p className="text-sm text-[#64748b]">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      {renderStars(review.rating)}
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        review.isPublic ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                      }`}>
                        {review.isPublic ? "Public" : "Private"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg"
                      onClick={() => toggleReviewVisibility(review.id, !review.isPublic)}
                    >
                      <i className={`fas ${review.isPublic ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                    <button 
                      className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg"
                      onClick={() => deleteReview(review.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-[#64748b] leading-relaxed">{review.comment}</p>
                </div>

                {review.response ? (
                  <div className="bg-[#f8fafc] rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fas fa-reply text-[#25D366]"></i>
                      <span className="text-sm font-bold text-[#1e293b]">Your Response</span>
                    </div>
                    <p className="text-sm text-[#64748b]">{review.response}</p>
                  </div>
                ) : (
                  <div className="mb-4">
                    <textarea
                      placeholder="Write a response..."
                      className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366] resize-none"
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          const response = (e.target as HTMLTextAreaElement).value.trim();
                          if (response) {
                            updateReviewResponse(review.id, response);
                            (e.target as HTMLTextAreaElement).value = '';
                          }
                        }
                      }}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  {!review.response && (
                    <button className="flex-1 py-2 bg-[#25D366] text-white rounded-lg font-semibold text-sm hover:bg-[#128C7E]">
                      Respond
                    </button>
                  )}
                  <button className="flex-1 py-2 bg-[#f1f5f9] text-[#64748b] rounded-lg font-semibold text-sm hover:bg-[#e2e8f0]">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Review Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-[500px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-center">
              <h2 className="text-xl font-extrabold">Add Customer Review</h2>
              <button className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Customer *</label>
                  <select 
                    value={newReview.customerId} 
                    onChange={(e) => setNewReview(prev => ({ ...prev, customerId: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]"
                  >
                    <option value="">Select a customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Order ID (Optional)</label>
                  <input 
                    type="text" 
                    value={newReview.orderId} 
                    onChange={(e) => setNewReview(prev => ({ ...prev, orderId: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" 
                    placeholder="Order ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Rating *</label>
                  <div className="flex items-center gap-4">
                    {renderStars(newReview.rating, true, (rating) => setNewReview(prev => ({ ...prev, rating })))}
                    <span className="text-sm text-[#64748b]">{newReview.rating} out of 5 stars</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Review Comment *</label>
                  <textarea 
                    value={newReview.comment} 
                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366] resize-none" 
                    placeholder="Enter the customer's review..."
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="isPublic"
                    checked={newReview.isPublic} 
                    onChange={(e) => setNewReview(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="w-4 h-4 text-[#25D366] border-[#e2e8f0] rounded focus:ring-[#25D366]"
                  />
                  <label htmlFor="isPublic" className="text-sm font-bold text-[#1e293b]">Make this review public</label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#e2e8f0] flex justify-end gap-3">
              <button 
                className="px-6 py-2 bg-[#f1f5f9] text-[#64748b] rounded-xl font-semibold text-sm hover:bg-[#e2e8f0]" 
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-6 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg" 
                onClick={createReview}
              >
                Add Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}