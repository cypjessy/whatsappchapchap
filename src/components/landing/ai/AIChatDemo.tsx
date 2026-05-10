"use client";

import { useState } from 'react';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  options?: string[];
}

interface AIMessageProps {
  message: ChatMessage;
}

function AIMessage({ message }: AIMessageProps) {
  const isBot = message.role === 'bot';
  
  return (
    <div className={`flex gap-2.5 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-[0.8rem] font-bold flex-shrink-0 ${isBot ? 'bg-gradient-to-r from-[var(--green)] to-[var(--purple)] text-white' : 'bg-[var(--elevated)]'}`}>
        {isBot ? 'AI' : '👤'}
      </div>
      <div className={`max-w-[75%] ${isBot ? '' : 'items-end'}`}>
        <div className={`p-2.5 rounded-2xl text-[0.82rem] leading-relaxed ${isBot ? 'bg-[var(--elevated)] border border-[var(--border)] rounded-bl-[4px]' : 'bg-gradient-to-r from-[#1a5c30] to-[var(--green)] text-white rounded-br-[4px]'}`}>
          <div dangerouslySetInnerHTML={{ __html: message.content }} />
        </div>
        {message.options && (
          <div className="flex gap-1.5 mt-2">
            {message.options.map(opt => (
              <button key={opt} className="px-2 py-1 border border-[rgba(37,211,102,0.35)] rounded-full text-[0.65rem] text-[var(--green)] bg-[rgba(37,211,102,0.06)]">
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface AIChatDemoProps {
  messages?: ChatMessage[];
}

export default function AIChatDemo({ messages = [] }: AIChatDemoProps) {
  const [chatMessages] = useState<ChatMessage[]>([
    { role: 'user', content: 'Ninataka kuona sneakers zenu 👟' },
    { role: 'bot', content: 'Habari! 🎉 Tuna sneakers za aina nyingi. Unapenda brand gani?' },
    { role: 'user', content: 'Nike, size 42' },
    { role: 'bot', content: 'Nike Air Max 270 — Size 42 ✅\n<strong>KSh 6,500</strong> | 3 colors available', options: ['⚫ Black', '⚪ White', '🔵 Navy'] },
    { role: 'user', content: 'White please! M-Pesa?' }
  ]);
  
  return (
    <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-[var(--r-xl)] overflow-hidden shadow-[var(--shadow-green)]">
      <div className="bg-[var(--elevated)] p-4 flex items-center gap-3 border-b border-[var(--border)]">
        <div className="w-2.5 h-2.5 rounded-full bg-[var(--green)] animate-pulse" />
        <div>
          <div className="text-[0.85rem] font-bold">Chap Chap AI</div>
          <div className="text-[0.7rem] text-[var(--green)]">Active on your store</div>
        </div>
        <div className="ml-auto text-[0.72rem] text-[var(--muted)]">Handling 8 chats</div>
      </div>
      
      <div className="p-5 flex flex-col gap-3 max-h-[400px] overflow-y-auto bg-gradient">
        {chatMessages.map((msg, i) => (
          <AIMessage key={i} message={msg} />
        ))}
      </div>
      
      <div className="px-5 py-4 flex flex-wrap gap-1.5 border-t border-[var(--border)]">
        {['Track my order', 'View catalog', 'Return policy'].map(sug => (
          <button key={sug} className="px-3 py-1.5 bg-[rgba(37,211,102,0.07)] border border-[rgba(37,211,102,0.2)] rounded-full text-[0.73rem] text-[var(--green)] hover:bg-[rgba(37,211,102,0.15)]">
            {sug}
          </button>
        ))}
      </div>
    </div>
  );
}
