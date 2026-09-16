import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock } from "lucide-react";

export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? "PM" : "AM";
  const hr12 = hr % 12 || 12;
  return `${hr12}:${m} ${ampm}`;
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export default function CalendarGrid({
  slots = [],
  mode = "student",
  studentId,
  onSlotClick,
  onDayClick,
  selectedIds,
  onToggleSlot,
}) {
  const [viewDate, setViewDate] = useState(new Date(2026, 6, 1));
  const [expandedDay, setExpandedDay] = useState(null);
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();
  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0);
  const monthLabel = monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const totalDays = monthEnd.getDate();
  const firstDay = new Date(monthStart);
  firstDay.setHours(0, 0, 0, 0);
  const leadingDays = firstDay.getDay();

  const days = [];
  for (let i = 0; i < leadingDays; i++) {
    const d = new Date(firstDay);
    d.setDate(firstDay.getDate() - (leadingDays - i));
    days.push(d);
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(new Date(currentYear, currentMonth, i));
  }
  const trailingDays = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= trailingDays; i++) {
    days.push(new Date(currentYear, currentMonth + 1, i));
  }

  const slotsByDate = {};
  slots.forEach((s) => {
    if (!slotsByDate[s.slot_date]) slotsByDate[s.slot_date] = [];
    slotsByDate[s.slot_date].push(s);
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button
          onClick={() => setViewDate(new Date(currentYear, currentMonth - 1, 1))}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-bold text-[#1E2A4A] text-center">{monthLabel}</h3>
        <button
          onClick={() => setViewDate(new Date(currentYear, currentMonth + 1, 1))}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200" /> Open slot
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> Pending request
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-100 border border-blue-200" /> Confirmed
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const key = formatDate(day);
              const daySlots = (slotsByDate[key] || []).sort((a, b) =>
                a.start_time.localeCompare(b.start_time)
              );
              const isToday = formatDate(new Date()) === key;
              const col = idx % 7;
              const isExpanded = expandedDay === key;
              return (
                <div
                  key={key}
                  className={`min-h-[140px] border-b border-r border-gray-100 p-2 ${
                    col === 0 ? 'border-l' : ''
                  } ${mode === 'admin' ? 'cursor-pointer hover:bg-blue-50/40' : ''} ${isExpanded ? 'bg-blue-50/40' : ''}`}
                  onClick={mode === 'admin' ? () => {
                    setExpandedDay(isExpanded ? null : key);
                    onDayClick?.(key);
                  } : undefined}
                >
                  <div
                    className={`text-xs font-semibold mb-1.5 flex items-center justify-center w-6 h-6 ${
                      isToday
                        ? 'rounded-full bg-[#1E2A4A] text-white'
                        : 'text-gray-600'
                    }`}
                  >
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {daySlots.map((slot) => {
                      const mine = slot.student_id === studentId;
                      const visible = mode === 'admin' ? true : slot.status === 'open' || mine;
                      if (!visible) return null;
                      const isSelected = selectedIds?.has(slot.id);
                      const selectable = mode === 'student' && slot.status === 'open';
                      let cls;
                      if (slot.status === 'open') {
                        cls = isSelected
                          ? 'bg-[#1E2A4A] text-white border border-[#1E2A4A]'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100';
                      } else if (slot.status === 'pending') {
                        cls = 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200';
                      } else {
                        cls = 'bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200';
                      }
                      const startLabel = formatTime(slot.start_time);
                      const endLabel = slot.end_time ? formatTime(slot.end_time) : '';
                      return (
                        <div
                          key={slot.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedDay(key);
                            if (selectable) onToggleSlot?.(slot);
                            else onSlotClick?.(slot);
                          }}
                          className={`text-[11px] px-1.5 py-1 rounded border cursor-pointer transition-colors ${cls} ${isExpanded ? 'min-h-[44px]' : ''}`}
                        >
                          <div className="font-semibold">{startLabel}{endLabel ? ` - ${endLabel}` : ''}</div>
                          {isExpanded && mode === 'admin' && slot.status !== 'open' && slot.student_name && (
                            <div className="mt-0.5 truncate text-[10px] opacity-80">{slot.student_name}</div>
                          )}
                          {isExpanded && mode === 'student' && slot.status === 'pending' && mine && (
                            <div className="mt-0.5 text-[9px] font-semibold uppercase">pending</div>
                          )}
                        </div>
                      );
                    })}
                    {mode === 'admin' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedDay(key);
                          onDayClick?.(key);
                        }}
                        className="text-[11px] text-gray-400 hover:text-[#1E2A4A] flex items-center gap-0.5 mt-0.5"
                      >
                        <Plus className="w-2.5 h-2.5" /> Add slot
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
