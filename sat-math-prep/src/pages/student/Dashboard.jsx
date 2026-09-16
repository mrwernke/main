import { useState, useEffect } from "react";
import { useSession } from "@/lib/session";
import { base44 } from "@/api/base44Client";
import { TEST_LABELS } from "@/lib/config";
import TopicBars from "@/components/TopicBars";
import { TrendingUp, CalendarDays, Award, Clock, Video } from "lucide-react";
import { formatDate, formatTime } from "@/components/CalendarGrid";

export default function Dashboard() {
  const { user } = useSession();
  const [results, setResults] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [r, s] = await Promise.all([
          base44.entities.TestResult.filter({ student_id: user.id }, "-created_date", 100),
          base44.entities.CalendarSlot.filter({ student_id: user.id, status: "booked" }, "slot_date", 100),
        ]);
        setResults(r);
        setSlots(s);
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id]);

  const today = formatDate(new Date());
  const upcoming = slots
    .filter((s) => s.slot_date >= today)
    .sort((a, b) => (a.slot_date + a.start_time).localeCompare(b.slot_date + b.start_time));

  const distinctTopics = new Set();
  results.forEach((r) => {
    if (!r.topic_breakdown) return;
    Object.keys(r.topic_breakdown).forEach((t) => distinctTopics.add(t));
  });

  const bestScore = results.length ? Math.max(...results.map((r) => r.score || 0)) : null;

  if (loading) {
    return <div className="p-10 text-center text-gray-400">Loadingâ€¦</div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1E2A4A]">
          Hi {user.first_name}! ðŸ‘‹
        </h2>
        <p className="text-gray-500">Here's your SAT Math prep overview.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <Award className="w-5 h-5 text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-[#1E2A4A]">
            {bestScore ?? "â€”"}
          </p>
          <p className="text-sm text-gray-500">Best Score</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <TrendingUp className="w-5 h-5 text-emerald-500 mb-2" />
          <p className="text-2xl font-bold text-[#1E2A4A]">{results.length}</p>
          <p className="text-sm text-gray-500">Tests Taken</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <CalendarDays className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-[#1E2A4A]">{upcoming.length}</p>
          <p className="text-sm text-gray-500">Upcoming Sessions</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <Clock className="w-5 h-5 text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-[#1E2A4A]">
            {distinctTopics.size}
          </p>
          <p className="text-sm text-gray-500">Topics Practiced</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold text-[#1E2A4A] mb-3">Test Results</h3>
          {results.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm shadow-sm">
              You haven't taken any tests yet. Pick a test from the sidebar to begin.
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#1E2A4A]">
                        {TEST_LABELS[r.test_number] || `Test ${r.test_number}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {r.correct_count}/{r.total_questions} correct
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#1E2A4A]">{r.score}</p>
                      <p className="text-xs text-gray-400">/ 800</p>
                    </div>
                  </div>
                  <TopicBars breakdown={r.topic_breakdown} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-bold text-[#1E2A4A] mb-3">Upcoming Sessions</h3>
          {upcoming.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm shadow-sm">
              No upcoming sessions yet. Request a slot from the Calendar.
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-[#1E2A4A]">
                      {new Date(s.slot_date + "T00:00").toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatTime(s.start_time)}
                      {s.end_time ? ` â€“ ${formatTime(s.end_time)}` : ""}
                    </p>
                  </div>
                  {s.zoom_link ? (
                    <a
                      href={s.zoom_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-[#1E2A4A] font-medium hover:underline"
                    >
                      <Video className="w-4 h-4" /> Join
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Awaiting Zoom link</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
