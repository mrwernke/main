import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Users, FileText, ClipboardList, CalendarDays, UserCheck, Settings, ArrowRight, Loader2 } from "lucide-react";

const sections = [
  { label: "Student Database", desc: "View and manage all student records, results, and sessions.", path: "/admin/students", icon: Users },
  { label: "Calendar", desc: "Manage your available session slots and bookings.", path: "/admin/calendar", icon: CalendarDays },
  { label: "Approvals", desc: "Approve or reject pending student account requests.", path: "/admin/approvals", icon: UserCheck },
  { label: "Question Database", desc: "Manage the master list and assign questions to practice or tests.", path: "/admin/questions", icon: ClipboardList },
  { label: "Test 1", desc: "Review questions assigned to Test 1.", path: "/admin/tests/1", icon: FileText },
  { label: "Test 2", desc: "Review questions assigned to Test 2.", path: "/admin/tests/2", icon: FileText },
  { label: "Test 3", desc: "Review questions assigned to Test 3.", path: "/admin/tests/3", icon: FileText },
  { label: "Settings", desc: "Configure your tutor email and Zoom room link.", path: "/admin/settings", icon: Settings },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, pending: 0, questions: 0, sessions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [students, pending, questions, slots] = await Promise.all([
          base44.entities.Student.filter({ approval_status: "approved" }, undefined, 500),
          base44.entities.Student.filter({ approval_status: "pending" }, undefined, 500),
          base44.entities.Question.list(undefined, 500),
          base44.entities.CalendarSlot.filter({ status: "booked" }, undefined, 500),
        ]);
        setStats({
          students: students.length,
          pending: pending.length,
          questions: questions.length,
          sessions: slots.length,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1E2A4A]">Admin Dashboard</h2>
        <p className="text-gray-500">Manage your SAT Math Prep platform.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Students", value: stats.students },
            { label: "Pending Approvals", value: stats.pending, highlight: stats.pending > 0 },
            { label: "Total Questions", value: stats.questions },
            { label: "Booked Sessions", value: stats.sessions },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className={`text-3xl font-bold ${s.highlight ? "text-amber-500" : "text-[#1E2A4A]"}`}>
                {s.value}
              </p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.path}
              to={s.path}
              className="group bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-[#1E2A4A]/30 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#1E2A4A]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#1E2A4A] flex items-center gap-1">
                    {s.label}
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#1E2A4A] transition-colors" />
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">{s.desc}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
