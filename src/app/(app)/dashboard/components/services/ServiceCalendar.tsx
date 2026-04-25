export default function ServiceCalendar() {
  const days = Array.from({ length: 35 }, (_, i) => i + 29);
  const bookingsOnDays = [2, 3, 5, 7, 9, 13, 16, 19, 22, 26];
  const today = 1;

  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] p-4 md:p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-[#1e293b] flex items-center gap-2">
          <i className="fas fa-calendar text-[#3b82f6]"></i>
          April 2026
        </h3>
        <div className="flex gap-2">
          <button className="text-[#64748b] hover:text-[#8b5cf6]">
            <i className="fas fa-chevron-left"></i>
          </button>
          <button className="text-[#64748b] hover:text-[#8b5cf6]">
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="text-xs font-bold text-[#64748b] py-1">{day}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const hasBooking = bookingsOnDays.includes(day);
          const isToday = day === today;
          const isEmpty = day > 30;
          
          return (
            <div
              key={day}
              className={`
                aspect-square flex items-center justify-center text-sm font-semibold rounded-lg cursor-pointer transition-all
                ${isEmpty ? "invisible" : ""}
                ${isToday ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white" : ""}
                ${hasBooking && !isToday ? "bg-[rgba(139,92,246,0.1)] text-[#8b5cf6] relative" : ""}
                ${!isToday && !hasBooking ? "text-[#64748b] hover:bg-[#f1f5f9]" : ""}
              `}
            >
              {day}
              {hasBooking && !isToday && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#ef4444] rounded-full"></span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-[#e2e8f0] flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#8b5cf6]"></span>
          <span className="text-[#64748b]">Has booking</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
          <span className="text-[#64748b]">Pending</span>
        </div>
      </div>
    </div>
  );
}