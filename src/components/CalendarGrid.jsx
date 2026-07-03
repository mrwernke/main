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
  const [block, setBlock] = useState(0);
  const maxBlock = 3;
  const today = startOfWeek(new Date());
  const blockStart = new Date(today);
  blockStart.setDate(blockStart.getDate() + block * 28);

  const days = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date(blockStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  const slotsByDate = {};
  slots.forEach((s) => {
    if (!slotsByDate[s.slot_date]) slotsByDate[s.slot_date] = [];
    slotsByDate[s.slot_date].push(s);
  });

  const monthLabel = blockStart.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button
          disabled={block === 0}
          onClick={() => setBlock((b) => b - 1)}
          className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-bold text-[#1E2A4A] text-center">{monthLabel}</h3>
        <button
          disabled={block >= maxBlock}
          onClick={() => setBlock((b) => b + 1)}
          className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
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
          return (
            <div
              key={key}
              className={`min-h-[120px] border-b border-r border-gray-100 p-2 ${
                col === 0 ? "border-l" : ""
              } ${mode === "admin" ? "cursor-pointer hover:bg-blue-50/40" : ""}`}
              onClick={mode === "admin" ? () => onDayClick?.(key) : undefined}
            >
              <div
                className={`text-xs font-semibold mb-1.5 flex items-center justify-center w-6 h-6 ${
                  isToday
                    ? "rounded-full bg-[#1E2A4A] text-white"
                    : "text-gray-600"
                }`}
              >
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {daySlots.map((slot) => {
                  const mine = slot.student_id === studentId;
                  const visible = mode === "admin" ? true : slot.status === "open" || mine;
                  if (!visible) return null;
                  const isSelected = selectedIds?.has(slot.id);
                  const selectable = mode === "student" && slot.status === "open";
                  let cls;
                  if (slot.status === "open") {
                    cls = isSelected
                      ? "bg-[#1E2A4A] text-white border border-[#1E2A4A]"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100";
                  } else if (slot.status === "pending") {
                    cls = "bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200";
                  } else {
                    cls = "bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200";
                  }
                  return (
                    <div
                      key={slot.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectable) onToggleSlot?.(slot);
                        else onSlotClick?.(slot);
                      }}
                      className={`text-[11px] px-1.5 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors ${cls}`}
                    >
                      <Clock className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{formatTime(slot.start_time)}</span>
                      {mode === "admin" && slot.status !== "open" && slot.student_name && (
                        <span className="truncate font-medium hidden lg:inline">
                          · {slot.student_name}
                        </span>
                      )}
                      {mode === "student" && slot.status === "pending" && mine && (
                        <span className="ml-auto text-[9px] font-semibold uppercase">pend</span>
                      )}
                    </div>
                  );
                })}
                {mode === "admin" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
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
  );
}