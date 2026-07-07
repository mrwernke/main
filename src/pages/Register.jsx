import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function Register() {
  const { register } = useSession();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    school: "",
    grade: "9",
    email: "",
    phone: "",
    parent_first_name: "",
    parent_last_name: "",
    parent_email: "",
    parent_phone: "",
    username: "",
    password: "",
    psat_grade10_math: "",
    psat_grade11_math: "",
    sat_count: 0,
    sat_attempts: [],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const setSatCount = (n) =>
    setForm((f) => {
      const cur = f.sat_attempts || [];
      const next = [];
      for (let i = 0; i < n; i++) next.push(cur[i] || { month: "", year: "2025", math_score: "" });
      return { ...f, sat_count: n, sat_attempts: next };
    });

  const updateSat = (i, field, value) =>
    setForm((f) => {
      const next = [...f.sat_attempts];
      next[i] = { ...next[i], [field]: value };
      return { ...f, sat_attempts: next };
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { sat_count, ...rest } = form;
      const sat_attempts = (rest.sat_attempts || []).map((a) => ({
        month: a.month,
        year: a.year,
        math_score: a.math_score === "" ? null : Number(a.math_score),
      }));
      await register({
        ...rest,
        psat_grade10_math: rest.psat_grade10_math === "" ? null : Number(rest.psat_grade10_math),
        psat_grade11_math: rest.psat_grade11_math === "" ? null : Number(rest.psat_grade11_math),
        sat_attempts,
      });
      setDone(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="p-6 md:p-10 max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-[#1E2A4A] mb-2">Request Submitted</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your account request has been sent to your tutor for approval. You'll be able to log
            in once it's approved. We'll let you know by email.
          </p>
          <Button onClick={() => navigate("/login")} className="w-full">
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  const field = (name, label, type = "text", required = true) => (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={form[name]}
        onChange={(e) => update(name, e.target.value)}
        required={required}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1E2A4A] outline-none"
      />
    </div>
  );

  return (
    <div className="p-6 md:p-10 max-w-lg mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h2 className="text-xl font-bold text-[#1E2A4A] mb-1">Create New Account</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-[#1E2A4A] mb-3">Student Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {field("first_name", "Student First Name")}
              {field("last_name", "Student Last Name")}
            </div>
            {field("school", "School")}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Grade *</label>
              <select
                value={form.grade}
                onChange={(e) => update("grade", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1E2A4A] outline-none bg-white"
              >
                {["9", "10", "11", "12"].map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </div>
            {field("email", "Student Email Address", "email")}
            {field("phone", "Student Phone Number", "tel")}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#1E2A4A] mb-3">Parent / Guardian Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {field("parent_first_name", "Parent First Name")}
              {field("parent_last_name", "Parent Last Name")}
            </div>
            {field("parent_email", "Parent Email Address", "email")}
            {field("parent_phone", "Parent Phone Number", "tel")}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#1E2A4A] mb-1">Prior Testing Results</h3>
            <p className="text-xs text-gray-400 mb-3">Help your tutor understand your starting point.</p>

            <h4 className="text-sm font-medium text-gray-600 mb-2">PSAT Math Scores</h4>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              {[
                { key: "psat_grade10_math", label: "PSAT 10" },
                { key: "psat_grade11_math", label: "PSAT 11" },
              ].map((p) => (
                <div key={p.key} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5">
                  <span className="text-sm font-medium text-gray-700">{p.label}</span>
                  <input
                    type="number"
                    min="0"
                    max="760"
                    value={form[p.key]}
                    onChange={(e) => update(p.key, e.target.value)}
                    placeholder="e.g. 600"
                    className="w-28 px-2 py-1 rounded-md border border-gray-200 focus:border-[#1E2A4A] outline-none text-sm text-right"
                  />
                </div>
              ))}
            </div>

            <h4 className="text-sm font-medium text-gray-600 mb-2">SAT Math Scores</h4>
            <div className="mb-3">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">How many times have you taken the SAT?</label>
              <select
                value={form.sat_count}
                onChange={(e) => setSatCount(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1E2A4A] outline-none bg-white"
              >
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            {form.sat_attempts.length > 0 && (
              <div className="space-y-3">
                {form.sat_attempts.map((a, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 p-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">SAT Attempt {i + 1}</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Month</label>
                        <select
                          value={a.month}
                          onChange={(e) => updateSat(i, "month", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#1E2A4A] outline-none bg-white text-sm"
                        >
                          <option value="">Selectâ€¦</option>
                          {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Year</label>
                        <select
                          value={a.year}
                          onChange={(e) => updateSat(i, "year", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#1E2A4A] outline-none bg-white text-sm"
                        >
                          {["2024", "2025", "2026", "2027"].map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Math Score</label>
                        <input
                          type="number"
                          min="200"
                          max="800"
                          value={a.math_score}
                          onChange={(e) => updateSat(i, "math_score", e.target.value)}
                          placeholder="e.g. 650"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#1E2A4A] outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#1E2A4A] mb-3">Account Credentials</h3>
            {field("username", "Username")}
            {field("password", "Password", "password")}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Request"}
          </Button>
          <p className="text-sm text-gray-500 text-center mt-3">
            Your tutor must approve your account before you can log in.
          </p>
        </form>
        <div className="mt-5 pt-5 border-t border-gray-100">
          <Link to="/login" className="text-sm text-[#1E2A4A] font-medium hover:underline">
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
