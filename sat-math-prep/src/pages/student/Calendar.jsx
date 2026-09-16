import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useSession } from "@/lib/session";
import CalendarGrid, { formatDate, formatTime } from "@/components/CalendarGrid";
import { NOTIFY_EMAIL } from "@/lib/config";
import Modal from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Video, CalendarDays, Loader2, Clock } from "lucide-react";

export default function StudentCalendar() {
  const { user } = useSession();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState(() => new Set());
  const [viewing, setViewing] = useState(null);
  const [busy, setBusy] = useState(false);

  const fetchSlots = async () => {
    setLoading(true);
    const all = await base44.entities.CalendarSlot.list(undefined, 500);
    setSlots(all);
    setLoading(false);
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const toggleSlot = (slot) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(slot.id)) next.delete(slot.id);
      else next.add(slot.id);
      return next;
    });
  };

  const clearSelection = () => setSelection(new Set());

  const requestSelected = async () => {
    setBusy(true);
    try {
      const ids = Array.from(selection);
      const requested = slots.filter((s) => selection.has(s.id));
      await Promise.all(
        ids.map((id) =>
          base44.entities.CalendarSlot.update(id, {
            status: "pending",
            student_id: user.id,
            student_name: `${user.first_name} ${user.last_name}`,
            zoom_link: null,
          })
        )
      );
      setSelection(new Set());
      try {
        const details = requested
          .map(
            (s) =>
              `${formatDate(new Date(s.slot_date + "T00:00"))} at ${formatTime(s.start_time)}${s.end_time ? ` â€“ ${formatTime(s.end_time)}` : ""}`
          )
          .join("\n");
        await base44.integrations.Core.SendEmail({
          from_name: "Math SAT Prep",
          to: NOTIFY_EMAIL,
          subject: "New Session Request",
          body: `${user.first_name} ${user.last_name} requested the following tutoring session(s):\n\n${details}\n\nReview pending requests in your admin dashboard.`,
        });
      } catch {
        /* ignore email errors */
      }
      await fetchSlots();
    } finally {
      setBusy(false);
    }
  };

  const selectedSlots = slots.filter((s) => selection.has(s.id));
  const mineViewing = viewing && viewing.student_id === user.id;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-[#1E2A4A] mb-1 flex items-center gap-2">
          <CalendarDays className="w-6 h-6" /> Session Calendar
        </h2>
        <p className="text-gray-500 text-sm">
          Select one or more open slots to request a session. Your request will be reviewed by your
          tutor and confirmed before it's finalized. Slots are in 15-minute increments.
        </p>
      </div>

      {selectedSlots.length > 0 && (
        <div className="mb-4 bg-white rounded-xl border border-gray-200 shadow-sm p-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-[#1E2A4A]">
                {selectedSlots.length} slot{selectedSlots.length > 1 ? "s" : ""} selected
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedSlots
                  .slice(0, 3)
                  .map(
                    (s) =>
                      `${new Date(s.slot_date + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${formatTime(s.start_time)}`
                  )
                  .join(" Â· ")}
                {selectedSlots.length > 3 && ` +${selectedSlots.length - 3} more`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={clearSelection} disabled={busy}>
                Clear
              </Button>
              <Button onClick={requestSelected} disabled={busy}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request Slots"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-10">Loading calendarâ€¦</div>
      ) : (
        <CalendarGrid
          slots={slots}
          mode="student"
          studentId={user.id}
          selectedIds={selection}
          onToggleSlot={toggleSlot}
          onSlotClick={(s) => setViewing(s)}
        />
      )}

      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200" /> Open slot
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> Pending approval
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-100 border border-blue-200" /> Confirmed
        </span>
      </div>

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.status === "booked" ? "Your Session" : "Pending Request"}
      >
        {viewing && mineViewing && (
          <div>
            <p className="text-lg font-semibold text-[#1E2A4A] mb-1">
              {new Date(viewing.slot_date + "T00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-gray-500 mb-5">
              {formatTime(viewing.start_time)}
              {viewing.end_time ? ` â€“ ${formatTime(viewing.end_time)}` : ""}
            </p>

            {viewing.status === "pending" ? (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600" />
                <p className="text-sm text-amber-800">
                  This session is awaiting your tutor's approval. You'll see it confirmed here once
                  it's approved.
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center gap-3">
                <Video className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">Session confirmed</p>
                  <a
                    href={viewing.zoom_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#1E2A4A] hover:underline break-all"
                  >
                    {viewing.zoom_link || "Zoom link"}
                  </a>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-4">
              Need to change a session? Email your tutor directly from the sidebar.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
