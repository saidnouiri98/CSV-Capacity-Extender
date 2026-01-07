
import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
}

export const CustomDatePicker: React.FC<DatePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize viewDate based on value if present
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      setViewDate(new Date(y, m - 1, d));
    }
  }, [value]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const formatDateToYYYYMMDD = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateClick = (day: number) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(formatDateToYYYYMMDD(selected));
    setIsOpen(false);
  };

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(formatDateToYYYYMMDD(new Date()));
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const renderDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    // Previous month filler
    const prevMonthDays = daysInMonth(year, month - 1);
    for (let i = startDay - 1; i >= 0; i--) {
      days.push(
        <div key={`prev-${i}`} className="h-8 w-8 flex items-center justify-center text-slate-300 text-xs cursor-default">
          {prevMonthDays - i}
        </div>
      );
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      let isSelected = false;
      if (value) {
        const [vY, vM, vD] = value.split('-').map(Number);
        isSelected = vY === year && vM === month + 1 && vD === i;
      }
      
      days.push(
        <button
          key={i}
          onClick={(e) => { e.stopPropagation(); handleDateClick(i); }}
          className={`h-8 w-8 flex items-center justify-center text-xs rounded-md transition-all ${
            isSelected 
              ? 'bg-blue-600 text-white font-bold' 
              : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
          }`}
        >
          {i}
        </button>
      );
    }

    return days;
  };

  const getDisplayValue = () => {
    if (!value) return 'Select target date...';
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString();
  };

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-white transition-all group"
      >
        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
        <span className={`text-sm ${value ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
          {getDisplayValue()}
        </span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden w-72 animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-blue-600 px-4 py-3 flex items-center justify-between text-white">
            <span className="font-semibold text-sm">Select Date</span>
            <div className="bg-white/20 p-1 rounded-md">
                <CalendarIcon className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-400" />
              </button>
              <h3 className="font-bold text-slate-700 text-sm">
                {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
              </h3>
              <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="h-8 w-8 flex items-center justify-center text-[10px] uppercase font-bold text-slate-400 tracking-tighter">
                  {day}
                </div>
              ))}
              {renderDays()}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                 <div className="w-4 h-4 rounded-full border border-slate-200 flex items-center justify-center">
                    <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
                 </div>
                 <span className="text-[10px] font-bold uppercase">12:00 AM</span>
              </div>
              <div className="flex gap-3">
                <button onClick={handleToday} className="text-[10px] font-bold text-blue-600 hover:underline uppercase">Today</button>
                <button onClick={handleClear} className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase">Clear</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
