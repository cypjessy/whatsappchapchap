"use client";

import { useState } from "react";

export default function HelpPage() {
  const [faqOpen, setFaqOpen] = useState<string | null>("faq1");

  const categories = [
    { id: "getting-started", title: "Getting Started", desc: "Learn the basics of setting up your WhatsApp Chap Chap store and making your first sale.", icon: "fa-rocket", count: 12, color: "text-[#25D366]", bg: "bg-[rgba(37,211,102,0.1)]" },
    { id: "whatsapp", title: "WhatsApp Integration", desc: "Connect your WhatsApp Business API, configure webhooks, and manage conversations.", icon: "fa-whatsapp", count: 8, color: "text-[#3b82f6]", bg: "bg-[rgba(59,130,246,0.1)]" },
    { id: "ai", title: "AI Assistant", desc: "Configure your AI sales assistant, set up auto-replies, and train your chatbot.", icon: "fa-robot", count: 15, color: "text-[#8b5cf6]", bg: "bg-[rgba(139,92,246,0.1)]" },
    { id: "orders", title: "Orders & Payments", desc: "Manage orders, process payments, handle refunds, and track deliveries.", icon: "fa-shopping-bag", count: 10, color: "text-[#f59e0b]", bg: "bg-[rgba(245,158,11,0.1)]" },
    { id: "products", title: "Products & Inventory", desc: "Add products, manage stock levels, set up categories, and handle variants.", icon: "fa-box", count: 9, color: "text-[#ec4899]", bg: "bg-[rgba(236,72,153,0.1)]" },
    { id: "billing", title: "Account & Billing", desc: "Manage your subscription, update payment methods, and configure team access.", icon: "fa-cog", count: 6, color: "text-[#10b981]", bg: "bg-[rgba(16,185,129,0.1)]" },
  ];

  const popularArticles = [
    { title: "How to Connect WhatsApp Business API", desc: "Step-by-step guide to connecting your WhatsApp number and verifying your business.", icon: "fa-whatsapp", views: "12.5k", read: "5 min" },
    { title: "Setting Up AI Auto-Replies", desc: "Configure your AI assistant to automatically respond to common customer queries.", icon: "fa-robot", views: "8.3k", read: "7 min" },
    { title: "Managing M-Pesa Payments", desc: "Complete guide to setting up and managing M-Pesa payments for your orders.", icon: "fa-mobile-alt", views: "6.7k", read: "4 min" },
    { title: "Bulk Order Processing Guide", desc: "Learn how to process multiple orders efficiently using bulk actions and automation.", icon: "fa-tasks", views: "5.2k", read: "6 min" },
  ];

  const videos = [
    { title: "Getting Started with Chap Chap", desc: "Complete walkthrough for new users setting up their first store.", duration: "12:34", views: "45.2k", rating: "98%", color: "from-[#25D366] to-[#128C7E]" },
    { title: "AI Assistant Full Setup", desc: "Learn how to train and configure your AI sales assistant for maximum conversions.", duration: "08:45", views: "32.1k", rating: "96%", color: "from-[#8b5cf6] to-[#7c3aed]" },
    { title: "Advanced Order Management", desc: "Master the orders dashboard with bulk actions, filters, and automation.", duration: "15:20", views: "28.7k", rating: "94%", color: "from-[#f59e0b] to-[#d97706]" },
  ];

  const faqs = [
    { id: "faq1", question: "How do I connect my WhatsApp Business number?", answer: "Connecting your WhatsApp Business number is simple: Go to Settings → WhatsApp Integration, Click \"Connect WhatsApp\", Enter your business phone number, Verify via SMS or voice call, Complete the WhatsApp Business API setup. Once connected, you can start receiving orders directly through WhatsApp messages." },
    { id: "faq2", question: "What payment methods are supported?", answer: "WhatsApp Chap Chap supports multiple payment methods popular in Africa: M-Pesa (Kenya's most popular mobile money), Bank Transfer (direct bank deposits), Cash on Delivery (pay when you receive), Card Payments (Visa, Mastercard via Stripe). You can enable or disable payment methods in your Business Settings." },
    { id: "faq3", question: "How does the AI Assistant work?", answer: "Our AI Assistant uses advanced natural language processing to: Automatically respond to customer inquiries 24/7, Detect order intent and guide customers through purchasing, Answer FAQs about products, pricing, and delivery, Escalate complex issues to human agents when needed, Learn from your responses to improve over time. The AI can be trained with your specific product catalog and business policies." },
    { id: "faq4", question: "Can I use Chap Chap without the AI features?", answer: "Yes! While our AI Assistant is a powerful feature, you can use Chap Chap in manual mode: Receive all WhatsApp messages in your dashboard, Manually respond to customers, Use our order management tools without automation, Enable AI features only when you're ready. Many sellers start with manual mode and gradually enable AI as they grow comfortable." },
    { id: "faq5", question: "How do I handle returns and refunds?", answer: "Our platform provides comprehensive return and refund management: Customers can request returns via WhatsApp, AI Assistant can pre-qualify return requests, Process full or partial refunds from the Orders page, Track return status and inventory restocking, Generate return labels for shipping partners. Set your return policy in Business Settings → Policies." },
  ];

  const toggleFaq = (id: string) => {
    setFaqOpen(faqOpen === id ? null : id);
  };

  return (
    <div className="animate-fadeIn">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#25D366] to-[#128C7E] py-16 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <h1 className="text-4xl font-extrabold mb-4">How can we help you?</h1>
          <p className="text-xl mb-8 opacity-90">Find answers, tutorials, and expert support for WhatsApp Chap Chap</p>
          
          <div className="relative max-w-xl mx-auto mb-8">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b] text-xl"></i>
            <input type="text" placeholder="Search for answers..." className="w-full pl-12 pr-20 py-5 rounded-2xl text-lg shadow-lg focus:outline-none focus:translate-y-[-2px] focus:shadow-xl" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#f8fafc] px-3 py-1 rounded-lg text-sm font-semibold text-[#64748b]">⌘K</span>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-6 py-3 bg-white/20 border border-white/30 rounded-full text-white font-semibold hover:bg-white hover:text-[#25D366] transition-all">
              <i className="fas fa-rocket mr-2"></i>Getting Started
            </button>
            <button className="px-6 py-3 bg-white/20 border border-white/30 rounded-full text-white font-semibold hover:bg-white hover:text-[#25D366] transition-all">
              <i className="fab fa-whatsapp mr-2"></i>WhatsApp Setup
            </button>
            <button className="px-6 py-3 bg-white/20 border border-white/30 rounded-full text-white font-semibold hover:bg-white hover:text-[#25D366] transition-all">
              <i className="fas fa-robot mr-2"></i>AI Assistant
            </button>
            <button className="px-6 py-3 bg-white/20 border border-white/30 rounded-full text-white font-semibold hover:bg-white hover:text-[#25D366] transition-all">
              <i className="fas fa-credit-card mr-2"></i>Payments
            </button>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Categories */}
        <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-3">
          <i className="fas fa-th-large text-[#25D366]"></i>Browse by Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {categories.map((cat, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 shadow-md border border-[#e2e8f0] hover:border-[#25D366] hover:translate-y-[-5px] hover:shadow-lg transition-all cursor-pointer group">
              <div className={`w-14 h-14 rounded-xl ${cat.bg} flex items-center justify-center text-2xl mb-4 ${cat.color}`}>
                <i className={`fas ${cat.icon}`}></i>
              </div>
              <h3 className="text-xl font-bold mb-2">{cat.title}</h3>
              <p className="text-[#64748b] mb-4">{cat.desc}</p>
              <div className="text-sm font-semibold text-[#64748b] flex items-center gap-2">
                <i className="fas fa-file-alt text-[#25D366]"></i>
                {cat.count} Articles
              </div>
            </div>
          ))}
        </div>

        {/* Popular Articles */}
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-3">
            <i className="fas fa-fire text-[#f59e0b]"></i>Popular Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popularArticles.map((article, idx) => (
              <div key={idx} className="bg-white rounded-xl p-5 border border-[#e2e8f0] flex items-start gap-4 hover:border-[#25D366] hover:shadow-md transition-all cursor-pointer">
                <div className="w-12 h-12 bg-[#f8fafc] rounded-lg flex items-center justify-center text-xl text-[#25D366] shrink-0">
                  <i className={`fas ${article.icon}`}></i>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold mb-2">{article.title}</h4>
                  <p className="text-sm text-[#64748b] mb-2">{article.desc}</p>
                  <div className="flex gap-4 text-xs text-[#64748b]">
                    <span><i className="fas fa-eye mr-1"></i>{article.views} views</span>
                    <span><i className="fas fa-clock mr-1"></i>{article.read} read</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Support Options */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-2xl p-6 text-center shadow-md border border-[#e2e8f0] hover:translate-y-[-5px] hover:shadow-lg transition-all">
            <div className="w-20 h-20 bg-[#f8fafc] rounded-full flex items-center justify-center text-3xl mx-auto mb-4 text-[#25D366]">
              <i className="fas fa-comments"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">Live Chat Support</h3>
            <p className="text-[#64748b] mb-4">Chat with our support team in real-time. Average response time: 2 minutes.</p>
            <button className="px-6 py-3 bg-[#f8fafc] rounded-xl font-semibold hover:bg-[#25D366] hover:text-white transition-all">
              <i className="fas fa-comment-dots mr-2"></i>Start Chat
            </button>
          </div>

          <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-2xl p-6 text-center shadow-lg hover:translate-y-[-5px] transition-all">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              <i className="fab fa-whatsapp"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">WhatsApp Support</h3>
            <p className="opacity-90 mb-4">Get help directly on WhatsApp. Message us for quick assistance with your store.</p>
            <button className="px-6 py-3 bg-white text-[#25D366] rounded-xl font-semibold hover:translate-y-[-2px] hover:shadow-lg transition-all">
              <i className="fab fa-whatsapp mr-2"></i>Message Us
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center shadow-md border border-[#e2e8f0] hover:translate-y-[-5px] hover:shadow-lg transition-all">
            <div className="w-20 h-20 bg-[#f8fafc] rounded-full flex items-center justify-center text-3xl mx-auto mb-4 text-[#25D366]">
              <i className="fas fa-envelope"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">Email Support</h3>
            <p className="text-[#64748b] mb-4">Send us a detailed inquiry. We typically respond within 24 hours.</p>
            <button className="px-6 py-3 bg-[#f8fafc] rounded-xl font-semibold hover:bg-[#25D366] hover:text-white transition-all">
              <i className="fas fa-paper-plane mr-2"></i>Send Email
            </button>
          </div>
        </section>

        {/* Video Tutorials */}
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-3">
            <i className="fas fa-play-circle text-[#ef4444]"></i>Video Tutorials
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {videos.map((video, idx) => (
              <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-md border border-[#e2e8f0] hover:translate-y-[-5px] hover:shadow-lg transition-all">
                <div className={`h-40 bg-gradient-to-br ${video.color} flex items-center justify-center relative`}>
                  <i className="fas fa-play-circle text-white text-5xl opacity-80"></i>
                  <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                    {video.duration}
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-lg mb-2">{video.title}</h4>
                  <p className="text-sm text-[#64748b] mb-3">{video.desc}</p>
                  <div className="flex justify-between text-sm text-[#64748b]">
                    <span><i className="fas fa-eye mr-1"></i>{video.views} views</span>
                    <span><i className="fas fa-thumbs-up mr-1"></i>{video.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl font-extrabold mb-6 text-center flex items-center justify-center gap-3">
            <i className="fas fa-question-circle text-[#3b82f6]"></i>Frequently Asked Questions
          </h2>
          
          {faqs.map((faq) => (
            <div key={faq.id} className={`bg-white rounded-xl mb-3 border border-[#e2e8f0] overflow-hidden ${faqOpen === faq.id ? 'border-[#25D366]' : ''}`}>
              <div onClick={() => toggleFaq(faq.id)} className="p-5 flex justify-between items-center cursor-pointer hover:bg-[#f8fafc] transition-all">
                <span className="font-bold">{faq.question}</span>
                <i className={`fas fa-chevron-down text-[#25D366] transition-transform ${faqOpen === faq.id ? 'rotate-180' : ''}`}></i>
              </div>
              <div className={`overflow-hidden transition-all ${faqOpen === faq.id ? 'max-h-40' : 'max-h-0'}`}>
                <div className="px-5 pb-5 text-[#64748b]">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Community Section */}
        <section className="bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe] rounded-2xl p-10 text-center mb-16">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md text-4xl">
            👥
          </div>
          <h2 className="text-3xl font-extrabold mb-4">Join Our Seller Community</h2>
          <p className="text-[#64748b] text-lg max-w-xl mx-auto mb-6">Connect with 10,000+ sellers, share tips, and get advice from successful Chap Chap users.</p>
          <div className="flex justify-center gap-12 mb-6">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-[#25D366]">10k+</div>
              <div className="text-[#64748b]">Active Sellers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-[#25D366]">500+</div>
              <div className="text-[#64748b]">Daily Tips</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-[#25D366]">50+</div>
              <div className="text-[#64748b]">Expert Mentors</div>
            </div>
          </div>
          <button className="px-8 py-4 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-bold text-lg hover:translate-y-[-2px] hover:shadow-lg transition-all">
            <i className="fas fa-users mr-2"></i>Join Community
          </button>
        </section>
      </div>

      {/* Mini Footer */}
      <footer className="bg-[#0f172a] text-white py-10 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-extrabold mb-4">Chap<span className="text-[#25D366]">Chap</span></h3>
            <p className="text-white/70">The complete WhatsApp commerce platform for African businesses.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <div className="space-y-2 text-white/70"><a href="#" className="block hover:text-[#25D366]">Features</a></div>
            <div className="space-y-2 text-white/70"><a href="#" className="block hover:text-[#25D366]">Pricing</a></div>
            <div className="space-y-2 text-white/70"><a href="#" className="block hover:text-[#25D366]">Integrations</a></div>
          </div>
          <div>
            <h4 className="font-bold mb-4">Resources</h4>
            <div className="space-y-2 text-white/70"><a href="#" className="block hover:text-[#25D366]">Blog</a></div>
            <div className="space-y-2 text-white/70"><a href="#" className="block hover:text-[#25D366]">Tutorials</a></div>
            <div className="space-y-2 text-white/70"><a href="#" className="block hover:text-[#25D366]">Webinars</a></div>
          </div>
          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <div className="space-y-2 text-white/70"><a href="#" className="block hover:text-[#25D366]">About Us</a></div>
            <div className="space-y-2 text-white/70"><a href="#" className="block hover:text-[#25D366]">Contact</a></div>
            <div className="space-y-2 text-white/70"><a href="#" className="block hover:text-[#25D366]">Partners</a></div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-white/60 text-sm">
          <p>&copy; 2026 WhatsApp Chap Chap. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-[#25D366]">Privacy Policy</a>
            <a href="#" className="hover:text-[#25D366]">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}