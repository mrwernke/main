import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { ADMIN_USERNAME, ADMIN_PASSWORD, NOTIFY_EMAIL } from "./config";
import { getSettings } from "./settings";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const stored = localStorage.getItem("sat_session");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const settings = await getSettings();
    const adminUser = settings.admin_username || ADMIN_USERNAME;
    const adminPass = settings.admin_password || ADMIN_PASSWORD;
    if (username === adminUser && password === adminPass) {
      const session = { role: "admin", username: adminUser };
      localStorage.setItem("sat_session", JSON.stringify(session));
      setUser(session);
      return { session };
    }

    const students = await base44.entities.Student.filter({ username, password });
    if (!students.length) throw new Error("Invalid username or password");
    const student = students[0];
    if (student.approval_status === "pending") {
      throw new Error("Your account is awaiting tutor approval.");
    }
    if (student.approval_status === "rejected") {
      throw new Error("Your account request was not approved.");
    }
    const session = { role: "student", ...student };
    localStorage.setItem("sat_session", JSON.stringify(session));
    setUser(session);
    return { session };
  };

  const refreshStudent = useCallback(async () => {
    if (user?.role !== "student") return user;
    const updated = await base44.entities.Student.get(user.id);
    const session = { role: "student", ...updated };
    localStorage.setItem("sat_session", JSON.stringify(session));
    setUser(session);
    return session;
  }, [user]);

  const register = async (data) => {
    const existing = await base44.entities.Student.filter({ username: data.username });
    if (existing.length) throw new Error("Username already taken");
    const student = await base44.entities.Student.create({
      ...data,
      approval_status: "pending",
      test1_unlocked: false,
      test2_unlocked: false,
      test3_unlocked: false,
    });
    const settings = await getSettings();
    const subject = "New Student Account Request";
    const body = `A new student has requested an account:\n\nStudent: ${data.first_name} ${data.last_name}\nSchool: ${data.school}\nGrade: ${data.grade}\nUsername: ${data.username}\nStudent Email: ${data.email}\nStudent Phone: ${data.phone}\n\nParent: ${data.parent_first_name} ${data.parent_last_name}\nParent Email: ${data.parent_email}\nParent Phone: ${data.parent_phone}\n\nLog in to your admin dashboard to approve or reject this request.`;
    const recipients = [settings.tutor_email, NOTIFY_EMAIL].filter(Boolean);
    try {
      await Promise.all(
        recipients.map((to) =>
          base44.integrations.Core.SendEmail({ from_name: "Math SAT Prep", to, subject, body }).catch(() => {})
        )
      );
    } catch {
      /* ignore email errors */
    }
    return student;
  };

  const logout = () => {
    localStorage.removeItem("sat_session");
    setUser(null);
  };

  return (
    <SessionContext.Provider
      value={{ user, loading, login, register, logout, refreshStudent }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}