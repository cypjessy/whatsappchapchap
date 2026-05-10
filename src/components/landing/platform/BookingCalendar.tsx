"use client";

import { useState } from 'react';

interface Appointment {
  time: string;
  client: string;
  service: string;
}

interface BookingCalendarProps {
  bookedDays?: number[];
  appointments?: Appointment[];
}

export default function BookingCalendar({ bookedDays = [], appointments = [] }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const isBooked = (day: number) => bookedDays.includes(day);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[0.72rem] text-[var(--muted)]">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <div className="flex gap-1 text-[0.62rem] text-[var(--muted)]">
          <div className="w-[18px] h-[18px] bg-[rgba(139,92,246,0.15)] rounded"></div>
          <span>Booked</span>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-[3px]">
        {['M','T','W','T','F','S','S'].map(day => (
          <div key={day} className="aspect-square flex items-center justify-center text-[0.68rem] text-[var(--faint)]">{day}</div>
        ))}
        {/* Map actual days here */}
        {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => i + 1).map(day => (
          <div 
            key={day} 
            className={`aspect-square flex items-center justify-center text-[0.68rem] rounded cursor-pointer transition-all ${isBooked(day) ? 'bg-[rgba(139,92,246,0.15)] text-[var(--purple)] font-semibold' : 'hover:bg-[var(--elevated)]'}`}
          >
            {day}
          </div>
        ))}
      </div>
      
      {appointments.length > 0 && (
        <div className="mt-3 p-2 bg-[var(--elevated)] border border-[var(--border)] border-l-[3px] border-l-[var(--purple)] rounded text-[0.75rem] flex items-center gap-2">
          <span className="text-[var(--purple)] font-semibold">{appointments[0].time}</span>
          <span>{appointments[0].client} · {appointments[0].service}</span>
        </div>
      )}
    </div>
  );
}
