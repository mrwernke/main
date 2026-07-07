import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  ListChecks,
  CalendarDays,
  Users,
  ClipboardList,
  UserCheck,
  Settings,
  BookOpen,
  LogIn,
  Home as HomeIcon,
  Lock,
  LockOpen,
  LogOut,
  CheckCircle2,
  Mail,
} from "lucide-react";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useSession } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { TEST_LABELS } from "@/lib/config";

const publicNav = [
  { label: "Welcome", path: "/", icon: HomeIcon },
  { label: "Login", path: "/login", icon: LogIn },
  { label: "New Account", path: "/register", icon: UserCheck },
  { label: "Resources", path: "/resources", icon: BookOpen },
];

export default function Sidebar({ onClose }) {
  const { user, logout } = useSession();
  const location = useLocation();
  const [takenTests, setTakenTests] = useState([]);
  const [tutorEmail, setTutorEmail] = useState("");

  useEffect(() => {
    if (user?.role === "student") {
      base44.entities.TestResult.filter({ student_id: user.id }, "-created_date", 50)
        .then((r) => setTakenTests(r.map((x) => x.test_number)))
        .catch(() => setTakenTests([]));
    } else {
      setTakenTests([]);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    getSettings()
      .then((s) => setTutorEmail(s.tutor_email || ""))
      .catch(() => {});
  }, []);

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  let nav = tutorEmail
    ? [...publicNav, { label: "Email Tutor", href: `mailto:${tutorEmail}`, icon: Mail }]
    : publicNav;
  let greeting = null;

  if (user?.role === "student") {
    const unlocked = { 1: user.test1_unlocked, 2: user.test2_unlocked, 3: user.test3_unlocked };
    greeting = `Welcome ${user.first_name} ${user.last_name}`;
    nav = [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, exact: true },
      { label: TEST_LABELS[1], path: "/test/1", icon: FileText, locked: !unlocked[1], taken: takenTests.includes(1) },
      { label: TEST_LABELS[2], path: "/test/2", icon: FileText, locked: !unlocked[2], taken: takenTests.includes(2) },
      { label: TEST_LABELS[3], path: "/test/3", icon: FileText, locked: !unlocked[3], taken: takenTests.includes(3) },
      { label: "Practice Questions", path: "/practice", icon: ListChecks },
      { label: "Calendar", path: "/calendar", icon: CalendarDays },
    ];
  } else if (user?.role === "admin") {
    nav = [
      { label: "Dashboard", path: "/admin", icon: LayoutDashboard, exact: true },
      { label: "Student Database", path: "/admin/students", icon: Users },
      { label: "Calendar", path: "/admin/calendar", icon: CalendarDays },
      { label: "Approvals", path: "/admin/approvals", icon: UserCheck },
     { label: "Practice Questions", path: "/admin/questions" }
      { label: "Test 1", path: "/admin/tests/1", icon: FileText },
      { label: "Test 2", path: "/admin/tests/2", icon: FileText },
      { label: "Test 3", path: "/admin/tests/3", icon: FileText },
      { label: "Settings", path: "/admin/settings", icon: Settings },
    ];
  }

  const handleNav = () => onClose?.();

  return (
    <aside className="w-60 bg-[#1E2A4A] text-white flex flex-col h-full overflow-hidden">
      <nav className="flex-1 flex flex-col py-4 px-3 space-y-1">
        {greeting && (
          <div className="px-3 py-2 mb-3 text-sm font-semibold text-white border-b border-white/10 pb-3">
            {greeting}
          </div>
        )}
        {nav.map((item) => {
          const Icon = item.icon;
          if (item.href) {
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleNav}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
              </a>
            );
          }
          const active = item.exact ? isActive(item.path) && location.pathname === item.path : isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNav}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-white/15 text-white" : "text-white/70 hover:text-white hover:bg-white/10"
              } ${item.locked ? "opacity-60" : ""}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.taken ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : item.locked ? (
                <Lock className="w-3.5 h-3.5 text-white/50" />
              ) : item.path?.startsWith("/test/") ? (
                <LockOpen className="w-3.5 h-3.5 text-sky-300" />
              ) : null}
            </Link>
          );
        })}
        {user && (
          <div className="mt-auto pt-3 border-t border-white/10 space-y-1">
            <button
              onClick={() => {
                logout();
                onClose?.();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Log out
            </button>
            {user && tutorEmail && (
              <a
                href={`mailto:${tutorEmail}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleNav}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Mail className="w-4 h-4" /> Email Tutor
              </a>
            )}
          </div>
        )}
      </nav>
    </aside>
  );
}


