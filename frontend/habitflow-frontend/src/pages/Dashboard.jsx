import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import { GoogleLogin } from "@react-oauth/google";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const emptyForm = {
  title: "",
  description: "",
  category: "",
  frequency: "",
};

const emptyAuthForm = {
  name: "",
  email: "",
  password: "",
  otp_code: "",
  reset_code: "",
  new_password: "",
};

const healthyRoutineTemplate = [
  {
    title: "Drink Water",
    description: "Drink enough water throughout the day",
    category: "Health",
    frequency: "Daily",
  },
  {
    title: "Morning Walk",
    description: "Take a short morning walk for energy",
    category: "Fitness",
    frequency: "Daily",
  },
  {
    title: "Read 10 Pages",
    description: "Read a few pages every day",
    category: "Study",
    frequency: "Daily",
  },
  {
    title: "Meditate",
    description: "Spend a few minutes calming your mind",
    category: "Personal",
    frequency: "Daily",
  },
  {
    title: "Plan Tomorrow",
    description: "Prepare a simple plan for the next day",
    category: "Productivity",
    frequency: "Daily",
  },
];
const buildHeatmapGrid = (heatmapData) => {
  const values = Array.isArray(heatmapData) ? heatmapData : [];
  const padded = [...values];

  while (padded.length < 35) {
    padded.unshift({ date: "", count: 0 });
  }

  const weeks = [];
  for (let i = 0; i < 35; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  return weeks;
};

const getCategoryConfig = (category) => {
  const value = (category || "").toLowerCase();

  if (value === "health") {
    return {
      label: "Health",
      background: "rgba(16,185,129,0.16)",
      color: "#86efac",
      border: "1px solid rgba(16,185,129,0.28)",
    };
  }

  if (value === "study") {
    return {
      label: "Study",
      background: "rgba(59,130,246,0.16)",
      color: "#93c5fd",
      border: "1px solid rgba(59,130,246,0.28)",
    };
  }

  if (value === "fitness") {
    return {
      label: "Fitness",
      background: "rgba(239,68,68,0.16)",
      color: "#fca5a5",
      border: "1px solid rgba(239,68,68,0.28)",
    };
  }

  if (value === "productivity") {
    return {
      label: "Productivity",
      background: "rgba(168,85,247,0.16)",
      color: "#d8b4fe",
      border: "1px solid rgba(168,85,247,0.28)",
    };
  }

  if (value === "personal") {
    return {
      label: "Personal",
      background: "rgba(245,158,11,0.16)",
      color: "#fcd34d",
      border: "1px solid rgba(245,158,11,0.28)",
    };
  }

  return {
    label: category || "General",
    background: "rgba(148,163,184,0.16)",
    color: "#cbd5e1",
    border: "1px solid rgba(148,163,184,0.28)",
  };
};
function Dashboard() {
  const [habits, setHabits] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [frequencyFilter, setFrequencyFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [weeklyChart, setWeeklyChart] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);

  const [authMode, setAuthMode] = useState("login");
  const [authData, setAuthData] = useState(emptyAuthForm);
  const [otpSent, setOtpSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  const [token, setToken] = useState(localStorage.getItem("habitflow_token") || "");
  const [userName, setUserName] = useState(
    localStorage.getItem("habitflow_user_name") || ""
  );
  const [userEmail, setUserEmail] = useState(
    localStorage.getItem("habitflow_user_email") || ""
  );

  const loadHabits = async () => {
    try {
      const [habitsRes, weeklyRes, heatmapRes] = await Promise.all([
        API.get("/habits/"),
        API.get("/habits/analytics/weekly"),
        API.get("/habits/analytics/heatmap"),
      ]);

      setHabits(Array.isArray(habitsRes.data) ? habitsRes.data : []);
      setWeeklyChart(Array.isArray(weeklyRes.data) ? weeklyRes.data : []);
      setHeatmapData(Array.isArray(heatmapRes.data) ? heatmapRes.data : []);
    } catch (error) {
      console.error("Error loading habits:", error);
      setMessage(error?.response?.data?.detail || "Failed to load habits.");
    }
  };

  useEffect(() => {
    if (token) {
      loadHabits();
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAuthChange = (e) => {
    const { name, value } = e.target;
    setAuthData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "email" ? { otp_code: "", reset_code: "" } : {}),
    }));

    if (name === "email") {
      setOtpSent(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const payload = {
        ...formData,
      };

      if (editingId) {
        await API.put(`/habits/${editingId}`, payload);
        setMessage("Habit updated successfully.");
      } else {
        await API.post("/habits/", payload);
        setMessage("Habit added successfully.");
      }

      resetForm();
      await loadHabits();
    } catch (error) {
      console.error("Error saving habit:", error);
      setMessage(error?.response?.data?.detail || "Failed to save habit.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setAuthLoading(true);

    try {
      const res = await API.post("/auth/login", {
        email: authData.email,
        password: authData.password,
      });

      localStorage.setItem("habitflow_token", res.data.access_token);
      localStorage.setItem("habitflow_user_name", res.data.user_name);
      localStorage.setItem("habitflow_user_email", res.data.user_email);

      setToken(res.data.access_token);
      setUserName(res.data.user_name);
      setUserEmail(res.data.user_email);
      setAuthData(emptyAuthForm);
      setOtpSent(false);
      setMessage("Login successful.");
    } catch (error) {
      console.error("Login error:", error);
      setMessage(error?.response?.data?.detail || "Login failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setMessage("");
    setAuthLoading(true);

    try {
      const res = await API.post("/auth/google-login", {
        token: credentialResponse.credential,
      });

      localStorage.setItem("habitflow_token", res.data.access_token);
      localStorage.setItem("habitflow_user_name", res.data.user_name);
      localStorage.setItem("habitflow_user_email", res.data.user_email);

      setToken(res.data.access_token);
      setUserName(res.data.user_name);
      setUserEmail(res.data.user_email);
      setAuthData(emptyAuthForm);
      setOtpSent(false);
      setForgotMode(false);
      setMessage("Google login successful.");
    } catch (error) {
      console.error("Google login error:", error);
      setMessage(error?.response?.data?.detail || "Google login failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setMessage("");
    setAuthLoading(true);

    try {
      const res = await API.post("/auth/guest-login");

      localStorage.setItem("habitflow_token", res.data.access_token);
      localStorage.setItem("habitflow_user_name", res.data.user_name);
      localStorage.setItem("habitflow_user_email", res.data.user_email);

      setToken(res.data.access_token);
      setUserName(res.data.user_name);
      setUserEmail(res.data.user_email);
      setAuthData(emptyAuthForm);
      setOtpSent(false);
      setForgotMode(false);
    } catch (error) {
      console.error("Guest login error:", error);
      setMessage(error?.response?.data?.detail || "Guest login failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    setAuthData(emptyAuthForm);
    setOtpSent(false);
    setForgotMode(false);
    setMessage("");
  };

  const handleSendOtp = async () => {
    if (!authData.email) {
      setMessage("Please enter your email first.");
      return;
    }

    setMessage("");
    setAuthLoading(true);

    try {
      const res = await API.post("/auth/send-otp", {
        email: authData.email,
      });

      setOtpSent(true);
      setMessage(res.data.message || "OTP sent successfully.");
    } catch (error) {
      console.error("Send OTP error:", error);
      setMessage(error?.response?.data?.detail || "Failed to send OTP.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setAuthLoading(true);

    try {
      const res = await API.post("/auth/verify-otp", {
        name: authData.name,
        email: authData.email,
        password: authData.password,
        otp_code: authData.otp_code,
      });

      localStorage.setItem("habitflow_token", res.data.access_token);
      localStorage.setItem("habitflow_user_name", res.data.user_name);
      localStorage.setItem("habitflow_user_email", res.data.user_email);

      setToken(res.data.access_token);
      setUserName(res.data.user_name);
      setUserEmail(res.data.user_email);
      setAuthData(emptyAuthForm);
      setOtpSent(false);
      setMessage("Account verified and created successfully.");
    } catch (error) {
      console.error("Verify OTP error:", error);
      setMessage(error?.response?.data?.detail || "OTP verification failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!authData.email) {
      setMessage("Please enter your email first.");
      return;
    }

    setMessage("");
    setAuthLoading(true);

    try {
      const res = await API.post("/auth/forgot-password", {
        email: authData.email,
      });

      setForgotMode(true);
      setMessage(res.data.message || "Password reset code sent to your email.");
    } catch (error) {
      console.error("Forgot password error:", error);
      setMessage(error?.response?.data?.detail || "Failed to send password reset code.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setAuthLoading(true);

    try {
      const res = await API.post("/auth/reset-password", {
        name: authData.name || "Reset User",
        email: authData.email,
        password: authData.new_password,
        otp_code: authData.reset_code,
      });

      setMessage(res.data.message || "Password reset successful. You can now log in.");
      setForgotMode(false);
      setAuthData((prev) => ({
        ...emptyAuthForm,
        email: prev.email,
      }));
      setAuthMode("login");
    } catch (error) {
      console.error("Reset password error:", error);
      setMessage(error?.response?.data?.detail || "Password reset failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("habitflow_token");
    localStorage.removeItem("habitflow_user_name");
    localStorage.removeItem("habitflow_user_email");

    setToken("");
    setUserName("");
    setUserEmail("");
    setHabits([]);
    setWeeklyChart([]);
    setHeatmapData([]);
    setFormData(emptyForm);
    setEditingId(null);
    setMessage("");
    setAuthData(emptyAuthForm);
    setOtpSent(false);
    setForgotMode(false);
  };

  const handleEdit = (habit) => {
    setFormData({
      title: habit.title || "",
      description: habit.description || "",
      category: habit.category || "",
      frequency: habit.frequency || "",
    });
    setEditingId(habit.id);
    setMessage("Editing selected habit.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (habitId) => {
    const confirmed = window.confirm("Delete this habit?");
    if (!confirmed) return;

    try {
      await API.delete(`/habits/${habitId}`);
      if (editingId === habitId) {
        resetForm();
      }
      setMessage("Habit deleted successfully.");
      await loadHabits();
    } catch (error) {
      console.error("Error deleting habit:", error);
      setMessage(error?.response?.data?.detail || "Failed to delete habit.");
    }
  };

  const handleCompleteToday = async (habitId) => {
    try {
      await API.post(`/habits/${habitId}/complete`);
      setMessage("Habit completed for today.");
      await loadHabits();
    } catch (error) {
      console.error("Error completing habit:", error);
      setMessage(error?.response?.data?.detail || "Failed to complete habit.");
    }
  };

  const handleUndoToday = async (habitId) => {
    try {
      await API.delete(`/habits/${habitId}/complete`);
      setMessage("Today's completion removed.");
      await loadHabits();
    } catch (error) {
      console.error("Error undoing completion:", error);
      setMessage(
        error?.response?.data?.detail || "Failed to undo today's completion."
      );
    }
  };

  const handleAddHealthyRoutine = async () => {
    try {
      for (const habit of healthyRoutineTemplate) {
        const alreadyExists = habits.some(
          (existingHabit) =>
            existingHabit.title?.toLowerCase() === habit.title.toLowerCase()
        );

        if (!alreadyExists) {
          await API.post("/habits/", {
            ...habit,
          });
        }
      }

      setMessage("Healthy routine template added.");
      await loadHabits();
    } catch (error) {
      console.error("Error adding healthy routine:", error);
      setMessage(
        error?.response?.data?.detail || "Failed to add healthy routine."
      );
    }
  };

  const categories = useMemo(() => {
    const values = [...new Set(habits.map((habit) => habit.category).filter(Boolean))];
    return ["All", ...values];
  }, [habits]);

  const frequencies = useMemo(() => {
    const values = [...new Set(habits.map((habit) => habit.frequency).filter(Boolean))];
    return ["All", ...values];
  }, [habits]);

  const filteredHabits = useMemo(() => {
    let result = [...habits];

    if (categoryFilter !== "All") {
      result = result.filter((habit) => habit.category === categoryFilter);
    }

    if (frequencyFilter !== "All") {
      result = result.filter((habit) => habit.frequency === frequencyFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (habit) =>
          habit.title?.toLowerCase().includes(q) ||
          habit.description?.toLowerCase().includes(q) ||
          habit.category?.toLowerCase().includes(q) ||
          habit.frequency?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [habits, categoryFilter, frequencyFilter, searchTerm]);

  const totalHabits = habits.length;
  const completedToday = habits.filter((habit) => habit.completed_today).length;
  const dailyHabits = habits.filter(
    (habit) => (habit.frequency || "").toLowerCase() === "daily"
  ).length;
  const weeklyHabits = habits.filter(
    (habit) => (habit.frequency || "").toLowerCase() === "weekly"
  ).length;
  const totalCompletions = habits.reduce(
    (sum, habit) => sum + (habit.total_completions || 0),
    0
  );
  const insightItems = useMemo(() => {
    if (!habits.length) {
      return [
        {
          title: "No habits yet",
          text: "Create your first habit to unlock AI-style progress insights.",
        },
      ];
    }

    const topStreakHabit = [...habits].sort(
      (a, b) => (b.current_streak || 0) - (a.current_streak || 0)
    )[0];

    const topCompletionHabit = [...habits].sort(
      (a, b) => (b.total_completions || 0) - (a.total_completions || 0)
    )[0];

    const completionRate = totalHabits
      ? Math.round((completedToday / totalHabits) * 100)
      : 0;

    const dailyRate = dailyHabits
      ? Math.round(
        (habits.filter(
          (habit) =>
            (habit.frequency || "").toLowerCase() === "daily" &&
            habit.completed_today
        ).length /
          dailyHabits) *
        100
      )
      : 0;

    const strongPerformerText = topStreakHabit
      ? `${topStreakHabit.title} is your strongest habit with a ${topStreakHabit.current_streak || 0}-day streak.`
      : "No strong performer detected yet.";

    const consistencyText =
      completionRate >= 80
        ? `Excellent consistency today. You completed ${completionRate}% of all tracked habits.`
        : completionRate >= 50
          ? `Good progress today. You completed ${completionRate}% of all tracked habits.`
          : `Your completion rate is ${completionRate}% today. Focus on one small win to build momentum.`;

    const dailyFocusText =
      dailyHabits > 0
        ? `You finished ${dailyRate}% of your daily habits today. Daily habits drive the biggest long-term streak gains.`
        : "You do not have daily habits yet. Add one simple daily habit to improve consistency insights.";

    const momentumText = topCompletionHabit
      ? `${topCompletionHabit.title} has been completed ${topCompletionHabit.total_completions || 0} times and is your highest-momentum habit.`
      : "No momentum insight available yet.";

    return [
      {
        title: "Strongest streak",
        text: strongPerformerText,
      },
      {
        title: "Daily consistency",
        text: consistencyText,
      },
      {
        title: "Focus recommendation",
        text: dailyFocusText,
      },
      {
        title: "Momentum signal",
        text: momentumText,
      },
    ];
  }, [habits, totalHabits, completedToday, dailyHabits]);
  const heatmapWeeks = useMemo(() => {
    return buildHeatmapGrid(heatmapData);
  }, [heatmapData]);

  if (!token) {
    return (
      <div style={shellStyle}>
        <div style={containerStyle}>
          <div style={heroCardStyle}>
            <div>
              <p style={eyebrowStyle}>PRODUCTIVITY SYSTEM</p>
              <h1 style={heroTitleStyle}>HabitFlow</h1>
              <p style={heroTextStyle}>
                Build better routines with streak tracking, smart insights, secure
                authentication, and a clean personal dashboard designed for daily use.
              </p>
            </div>

            <div style={authCardStyle}>
              <div style={authSwitchStyle}>
                <button
                  type="button"
                  onClick={() => switchAuthMode("login")}
                  style={{
                    ...authTabStyle,
                    ...(authMode === "login" ? authTabActiveStyle : {}),
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => switchAuthMode("register")}
                  style={{
                    ...authTabStyle,
                    ...(authMode === "register" ? authTabActiveStyle : {}),
                  }}
                >
                  Register
                </button>
              </div>

              {message && <div style={messageBoxStyle}>{message}</div>}

              <form
                onSubmit={
                  forgotMode
                    ? handleResetPassword
                    : authMode === "login"
                      ? handleLogin
                      : handleVerifyOtpAndRegister
                }
                style={formColumnStyle}
              >
                {authMode === "register" && !forgotMode && (
                  <input
                    type="text"
                    name="name"
                    placeholder="Full name"
                    value={authData.name}
                    onChange={handleAuthChange}
                    required
                    style={inputStyle}
                  />
                )}

                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={authData.email}
                  onChange={handleAuthChange}
                  required
                  style={inputStyle}
                />

                {!forgotMode && (
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={authData.password}
                    onChange={handleAuthChange}
                    required
                    style={inputStyle}
                  />
                )}

                {authMode === "register" && otpSent && !forgotMode && (
                  <input
                    type="text"
                    name="otp_code"
                    placeholder="Enter 6-digit OTP"
                    value={authData.otp_code}
                    onChange={handleAuthChange}
                    required
                    style={inputStyle}
                  />
                )}

                {forgotMode && (
                  <>
                    <input
                      type="text"
                      name="reset_code"
                      placeholder="Enter reset OTP"
                      value={authData.reset_code}
                      onChange={handleAuthChange}
                      required
                      style={inputStyle}
                    />
                    <input
                      type="password"
                      name="new_password"
                      placeholder="New password"
                      value={authData.new_password}
                      onChange={handleAuthChange}
                      required
                      style={inputStyle}
                    />
                  </>
                )}

                {authMode === "register" && !forgotMode && (
                  <button
                    type="button"
                    style={secondaryButtonStyle}
                    onClick={handleSendOtp}
                    disabled={authLoading}
                  >
                    {authLoading ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
                  </button>
                )}

                {authMode === "login" && !forgotMode && (
                  <button
                    type="button"
                    style={secondaryButtonStyle}
                    onClick={handleForgotPassword}
                    disabled={authLoading}
                  >
                    {authLoading ? "Sending..." : "Forgot Password"}
                  </button>
                )}

                <button type="submit" style={primaryButtonStyle} disabled={authLoading}>
                  {forgotMode
                    ? authLoading
                      ? "Resetting..."
                      : "Reset Password"
                    : authMode === "login"
                      ? authLoading
                        ? "Logging in..."
                        : "Login"
                      : authLoading
                        ? "Verifying..."
                        : "Verify & Create Account"}
                </button>

                {forgotMode && (
                  <button
                    type="button"
                    style={secondaryButtonStyle}
                    onClick={() => {
                      setForgotMode(false);
                      setMessage("");
                      setAuthData((prev) => ({
                        ...emptyAuthForm,
                        email: prev.email,
                      }));
                    }}
                  >
                    Back to Login
                  </button>
                )}
              </form>
              {authMode === "login" && !forgotMode && (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginTop: "12px",
                      marginBottom: "10px",
                    }}
                  >
                    <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
                    <span style={{ color: "#94a3b8", fontSize: "12px" }}>OR</span>
                    <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
                    <GoogleLogin
                      onSuccess={handleGoogleLogin}
                      onError={() => setMessage("Google login failed.")}
                    />
                  </div>
                  <button
                    type="button"
                    style={secondaryButtonStyle}
                    onClick={handleGuestLogin}
                    disabled={authLoading}
                  >
                    {authLoading ? "Entering..." : "Continue as Guest"}
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={footerStyle}>
            HabitFlow © {new Date().getFullYear()} — Built by Safeer Ahmad
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <div style={containerStyle}>
        <div style={heroCardStyle}>
          <div>
            <p style={eyebrowStyle}>PRODUCTIVITY SYSTEM</p>
            <h1 style={heroTitleStyle}>HabitFlow Dashboard</h1>
            <p style={heroTextStyle}>
              Build routines, manage habits, and track real daily consistency in
              your personal dashboard.
            </p>
          </div>

          <div style={authCardStyle}>
            <div style={accountHeaderStyle}>
              <div style={avatarStyle}>
                {(userName || "U").trim().charAt(0).toUpperCase()}
              </div>

              <div style={authStatusStyle}>
                <span style={accountLabelStyle}>Signed in as</span>
                <strong style={{ fontSize: "18px", color: "#f8fafc" }}>{userName}</strong>
                <span style={{ color: "#cbd5e1", fontSize: "14px" }}>{userEmail}</span>
              </div>
            </div>

            <button type="button" onClick={handleLogout} style={secondaryButtonStyle}>
              Logout
            </button>
          </div>
        </div>

        {message && <div style={messageBoxStyle}>{message}</div>}

        <div style={statsGridStyle}>
          <div
            style={statCardStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 18px 34px rgba(0,0,0,0.2)";
              e.currentTarget.style.borderColor = "rgba(167,139,250,0.28)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 16px 36px rgba(0,0,0,0.24)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            }}
          >
            <span style={statLabelStyle}>📚 Total Habits</span>
            <strong style={statValueStyle}>{totalHabits}</strong>
          </div>
          <div
            style={statCardStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 18px 34px rgba(0,0,0,0.2)";
              e.currentTarget.style.borderColor = "rgba(167,139,250,0.28)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 16px 36px rgba(0,0,0,0.24)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            }}
          >
            <span style={statLabelStyle}>✅ Completed Today</span>
            <strong style={statValueStyle}>{completedToday}</strong>
          </div>
          <div
            style={statCardStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 18px 34px rgba(0,0,0,0.2)";
              e.currentTarget.style.borderColor = "rgba(167,139,250,0.28)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 16px 36px rgba(0,0,0,0.24)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            }}
          >
            <span style={statLabelStyle}>📅 Daily Habits</span>
            <strong style={statValueStyle}>{dailyHabits}</strong>
          </div>
          <div
            style={statCardStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 18px 34px rgba(0,0,0,0.2)";
              e.currentTarget.style.borderColor = "rgba(167,139,250,0.28)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 16px 36px rgba(0,0,0,0.24)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            }}
          >
            <span style={statLabelStyle}>🗓️ Weekly Habits</span>
            <strong style={statValueStyle}>{weeklyHabits}</strong>
          </div>
          <div
            style={statCardStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 18px 34px rgba(0,0,0,0.2)";
              e.currentTarget.style.borderColor = "rgba(167,139,250,0.28)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 16px 36px rgba(0,0,0,0.24)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            }}
          >
            <span style={statLabelStyle}>🔥 Total Check-ins</span>
            <strong style={statValueStyle}>{totalCompletions}</strong>
          </div>
        </div>
        <div style={analyticsGridStyle}>
          <div
            style={panelStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 22px 42px rgba(0,0,0,0.22)";
              e.currentTarget.style.borderColor = "rgba(167,139,250,0.24)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 16px 36px rgba(0,0,0,0.24)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            }}
          >
            <div style={panelHeadStyle}>
              <h2 style={panelTitleStyle}>Weekly Progress</h2>
              <span style={{ color: "#cbd5e1", fontSize: "13px" }}>
                Last 7 days
              </span>
            </div>
            <div style={chartWrapperStyle}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" stroke="#cbd5e1" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#cbd5e1" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "12px",
                      color: "#f8fafc",
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            style={panelStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 22px 42px rgba(0,0,0,0.22)";
              e.currentTarget.style.borderColor = "rgba(167,139,250,0.24)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 16px 36px rgba(0,0,0,0.24)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            }}
          >
            <div style={panelHeadStyle}>
              <h2 style={panelTitleStyle}>AI Habit Insights</h2>
              <span style={{ color: "#cbd5e1", fontSize: "13px" }}>
                Live behavioral summary
              </span>
            </div>

            <div style={insightsGridStyle}>
              {insightItems.map((item, index) => (
                <div key={index} style={insightCardStyle}>
                  <p style={insightTitleStyle}>{item.title}</p>
                  <p style={insightTextStyle}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            style={panelStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 22px 42px rgba(0,0,0,0.22)";
              e.currentTarget.style.borderColor = "rgba(167,139,250,0.24)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 16px 36px rgba(0,0,0,0.24)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            }}
          >
            <div style={panelHeadStyle}>
              <h2 style={panelTitleStyle}>Habit Activity Heatmap</h2>
              <span style={{ color: "#cbd5e1", fontSize: "13px" }}>
                Last 5 weeks
              </span>
            </div>

            <div style={heatmapWrapperStyle}>
              <div style={{ width: "100%" }}>
                <div style={heatmapGridStyle}>
                  {heatmapWeeks.map((week, weekIndex) => (
                    <div key={weekIndex} style={heatmapColumnStyle}>
                      {week.map((day, dayIndex) => {
                        let bg = "rgba(255,255,255,0.12)";

                        if (day.count > 0 && day.count <= 1) bg = "#c084fc";
                        else if (day.count > 1 && day.count <= 2) bg = "#a855f7";
                        else if (day.count > 2 && day.count <= 4) bg = "#ec4899";
                        else if (day.count > 4) bg = "#f43f5e";

                        return (
                          <div
                            key={`${weekIndex}-${dayIndex}`}
                            title={day.date ? `${day.date} • ${day.count} completion(s)` : "No data"}
                            style={{
                              ...heatmapCellStyle,
                              background: bg,
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div style={heatmapLegendStyle}>
                  <span style={heatmapLegendTextStyle}>Less</span>
                  <span style={{ ...legendDotStyle, background: "rgba(255,255,255,0.12)" }} />
                  <span style={{ ...legendDotStyle, background: "#c084fc" }} />
                  <span style={{ ...legendDotStyle, background: "#a855f7" }} />
                  <span style={{ ...legendDotStyle, background: "#ec4899" }} />
                  <span style={{ ...legendDotStyle, background: "#f43f5e" }} />
                  <span style={heatmapLegendTextStyle}>More</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={mainGridStyle}>
          <div
            style={panelStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 22px 42px rgba(0,0,0,0.22)";
              e.currentTarget.style.borderColor = "rgba(167,139,250,0.24)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 16px 36px rgba(0,0,0,0.24)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            }}
          >
            <div style={panelHeadStyle}>
              <h2 style={panelTitleStyle}>
                {editingId ? "Edit Habit" : "Add New Habit"}
              </h2>

              <button
                type="button"
                onClick={handleAddHealthyRoutine}
                style={templateButtonStyle}
              >
                Start with healthy routine
              </button>
            </div>

            <form onSubmit={handleSubmit} style={formColumnStyle}>
              <input
                type="text"
                name="title"
                placeholder="Habit title"
                value={formData.title}
                onChange={handleChange}
                required
                style={inputStyle}
              />

              <input
                type="text"
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                style={inputStyle}
              />

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">Select category</option>
                <option value="Health">Health</option>
                <option value="Study">Study</option>
                <option value="Fitness">Fitness</option>
                <option value="Productivity">Productivity</option>
                <option value="Personal">Personal</option>
              </select>

              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">Select frequency</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
              </select>

              <div style={buttonRowStyle}>
                <button type="submit" style={primaryButtonStyle}>
                  {editingId ? "Update Habit" : "Add Habit"}
                </button>

                {editingId && (
                  <button type="button" onClick={resetForm} style={secondaryButtonStyle}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div
            style={panelStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 22px 42px rgba(0,0,0,0.22)";
              e.currentTarget.style.borderColor = "rgba(167,139,250,0.24)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 16px 36px rgba(0,0,0,0.24)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            }}
          >
            <div style={panelHeadStyle}>
              <h2 style={panelTitleStyle}>Your Habits</h2>
              <span style={{ color: "#cbd5e1", fontSize: "15px" }}>
                {filteredHabits.length} visible
              </span>
            </div>

            <div style={filterGridStyle}>
              <input
                type="text"
                placeholder="Search habits"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={inputStyle}
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={inputStyle}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={frequencyFilter}
                onChange={(e) => setFrequencyFilter(e.target.value)}
                style={inputStyle}
              >
                {frequencies.map((frequency) => (
                  <option key={frequency} value={frequency}>
                    {frequency}
                  </option>
                ))}
              </select>
            </div>

            {filteredHabits.length === 0 ? (
              <p style={{ color: "#cbd5e1" }}>No habits found.</p>
            ) : (
              <div style={habitListStyle}>
                {filteredHabits.map((habit) => {
                  const categoryConfig = getCategoryConfig(habit.category);
                  const streakTarget = 7;
                  const progressPercent = Math.min(
                    ((habit.current_streak || 0) / streakTarget) * 100,
                    100
                  );

                  return (
                    <div
                      key={habit.id}
                      style={habitCardStyle}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 16px 30px rgba(0,0,0,0.18)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div style={habitTopStyle}>
                        <h3 style={habitTitleStyle}>{habit.title}</h3>

                        {habit.completed_today ? (
                          <span style={completedBadgeStyle}>Completed Today</span>
                        ) : (
                          <span style={pendingBadgeStyle}>Pending Today</span>
                        )}
                      </div>

                      <p style={habitDescriptionStyle}>
                        {habit.description || "No description"}
                      </p>

                      <div style={metaTopRowStyle}>
                        <span
                          style={{
                            ...categoryBadgeStyle,
                            background: categoryConfig.background,
                            color: categoryConfig.color,
                            border: categoryConfig.border,
                          }}
                        >
                          {categoryConfig.label}
                        </span>

                        <div style={streakBadgeRowStyle}>
                          <span style={streakBadgeStyle}>🔥 {habit.current_streak || 0} day streak</span>
                          <span style={streakBadgeStyle}>🏆 Best {habit.longest_streak || 0}</span>
                        </div>
                      </div>

                      <div style={habitMetaStyle}>
                        <p><strong>Frequency:</strong> {habit.frequency || "Not set"}</p>
                        <p><strong>Total Completions:</strong> {habit.total_completions || 0}</p>
                      </div>

                      <div style={progressBlockStyle}>
                        <div style={progressLabelRowStyle}>
                          <span>7-day streak goal</span>
                          <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div style={progressTrackStyle}>
                          <div
                            style={{
                              ...progressFillStyle,
                              width: `${progressPercent}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div style={buttonRowStyle}>
                        {habit.completed_today ? (
                          <button
                            type="button"
                            onClick={() => handleUndoToday(habit.id)}
                            style={undoButtonStyle}
                          >
                            Undo Today
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCompleteToday(habit.id)}
                            style={completeButtonStyle}
                          >
                            Complete Today
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleEdit(habit)}
                          style={editButtonStyle}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(habit.id)}
                          style={deleteButtonStyle}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={footerStyle}>
          HabitFlow © {new Date().getFullYear()} — Built by Safeer Ahmad
        </div>

      </div>
    </div>
  );
}

/* ---------- styles ---------- */

const shellStyle = {
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "20px 20px 36px",
  background:
    "radial-gradient(circle at top left, rgba(139,92,246,0.22), transparent 24%), radial-gradient(circle at top right, rgba(59,130,246,0.12), transparent 22%), linear-gradient(135deg, #151937 0%, #091224 58%, #030712 100%)",
};

const containerStyle = {
  width: "100%",
  maxWidth: "1440px",
  margin: "0 auto",
};

const glassCardBase = {
  background: "rgba(15, 23, 42, 0.78)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
  boxShadow: "0 16px 36px rgba(0,0,0,0.24)",
};

const heroCardStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 420px",
  gap: "28px",
  alignItems: "center",
  minHeight: "0",
  padding: "28px 30px",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, rgba(8,15,35,0.96), rgba(6,13,30,0.92))",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 24px 60px rgba(0,0,0,0.26)",
  marginBottom: "16px",
};

const eyebrowStyle = {
  margin: "0 0 14px 0",
  fontSize: "14px",
  letterSpacing: "2px",
  fontWeight: 700,
  textTransform: "uppercase",
  color: "#c4b5fd",
};

const heroTitleStyle = {
  margin: "0 0 10px 0",
  fontSize: "54px",
  lineHeight: 1.02,
  fontWeight: 800,
  color: "#f8fafc",
  letterSpacing: "-1px",
};

const heroTextStyle = {
  margin: 0,
  maxWidth: "760px",
  fontSize: "18px",
  lineHeight: 1.75,
  color: "#cbd5e1",
};

const authCardStyle = {
  width: "100%",
  maxWidth: "420px",
  justifySelf: "end",
  padding: "18px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 16px 40px rgba(0,0,0,0.2)",
  backdropFilter: "blur(12px)",
  overflow: "hidden",
  boxSizing: "border-box",
};

const authSwitchStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  marginBottom: "18px",
};

const authTabStyle = {
  border: "none",
  borderRadius: "14px",
  padding: "14px 18px",
  fontSize: "16px",
  fontWeight: 700,
  color: "#e2e8f0",
  background: "rgba(255,255,255,0.07)",
  cursor: "pointer",
};

const authTabActiveStyle = {
  background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
  color: "#ffffff",
  boxShadow: "0 12px 24px rgba(236,72,153,0.2)",
};

const authStatusStyle = {
  display: "grid",
  gap: "4px",
  color: "#f8fafc",
};

const messageBoxStyle = {
  marginBottom: "14px",
  padding: "14px 16px",
  borderRadius: "14px",
  background: "rgba(91,33,182,0.22)",
  border: "1px solid rgba(167,139,250,0.22)",
  color: "#f5d0fe",
  fontSize: "14px",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "12px",
  marginBottom: "16px",
};

const analyticsGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.02fr 1.04fr 0.94fr",
  gap: "16px",
  marginBottom: "18px",
  alignItems: "stretch",
};

const insightsGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
};

const insightCardStyle = {
  borderRadius: "16px",
  padding: "16px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.07)",
  minHeight: "0",
};

const insightTitleStyle = {
  margin: "0 0 10px 0",
  fontSize: "12px",
  fontWeight: 800,
  color: "#d8b4fe",
  textTransform: "uppercase",
  letterSpacing: "0.8px",
};

const insightTextStyle = {
  margin: 0,
  fontSize: "15px",
  lineHeight: 1.65,
  color: "#e2e8f0",
};

const chartWrapperStyle = {
  width: "100%",
  height: "270px",
};

const heatmapWrapperStyle = {
  width: "100%",
  minHeight: "270px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const heatmapGridStyle = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "16px",
};

const heatmapColumnStyle = {
  display: "grid",
  gridTemplateRows: "repeat(7, 1fr)",
  gap: "10px",
};

const heatmapCellStyle = {
  width: "22px",
  height: "22px",
  borderRadius: "6px",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
  transition: "transform 0.15s ease",
};

const statCardStyle = {
  ...glassCardBase,
  borderRadius: "16px",
  padding: "16px 16px 18px",
  minHeight: "92px",
  transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
  cursor: "default",
};

const statLabelStyle = {
  display: "block",
  color: "#c4b5fd",
  fontSize: "12px",
  marginBottom: "10px",
  fontWeight: 700,
};

const statValueStyle = {
  fontSize: "36px",
  lineHeight: 1,
  fontWeight: 800,
  letterSpacing: "-0.8px",
  color: "#f8fafc",
};

const mainGridStyle = {
  display: "grid",
  gridTemplateColumns: "360px 1fr",
  gap: "16px",
  alignItems: "start",
};

const panelStyle = {
  ...glassCardBase,
  borderRadius: "18px",
  padding: "18px",
  overflow: "hidden",
  transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
};

const panelHeadStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "8px",
  marginBottom: "14px",
  flexWrap: "wrap",
};

const panelTitleStyle = {
  margin: 0,
  fontSize: "22px",
  fontWeight: 800,
  letterSpacing: "-0.4px",
  color: "#f8fafc",
};

const formColumnStyle = {
  display: "grid",
  gap: "14px",
  width: "100%",
};

const inputStyle = {
  width: "100%",
  maxWidth: "100%",
  padding: "15px 16px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  color: "#f8fafc",
  fontSize: "15px",
  outline: "none",
  boxSizing: "border-box",
};

const filterGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.6fr 1fr 1fr",
  gap: "10px",
  marginBottom: "14px",
};

const habitListStyle = {
  display: "grid",
  gap: "10px",
};

const habitCardStyle = {
  padding: "20px",
  borderRadius: "18px",
  background:
    "linear-gradient(135deg, rgba(37,99,235,0.16), rgba(168,85,247,0.12))",
  border: "1px solid rgba(255,255,255,0.08)",
  transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
};

const habitTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  alignItems: "center",
  marginBottom: "8px",
  flexWrap: "wrap",
};

const habitTitleStyle = {
  margin: 0,
  fontSize: "24px",
  lineHeight: 1.15,
  letterSpacing: "-0.3px",
  color: "#f8fafc",
};

const habitDescriptionStyle = {
  margin: "0 0 10px 0",
  color: "#dbeafe",
  fontSize: "15px",
  lineHeight: 1.55,
};

const habitMetaStyle = {
  display: "grid",
  gap: "4px",
  color: "#c7d2fe",
  fontSize: "14px",
  marginBottom: "12px",
};

const metaTopRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
  marginBottom: "10px",
};

const categoryBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 700,
};

const streakBadgeRowStyle = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap",
};

const streakBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 700,
  color: "#f8fafc",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const progressBlockStyle = {
  marginTop: "6px",
};

const progressLabelRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: "12px",
  color: "#cbd5e1",
  marginBottom: "6px",
};

const progressTrackStyle = {
  width: "100%",
  height: "10px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  overflow: "hidden",
};

const progressFillStyle = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
  transition: "width 0.25s ease",
};

const buttonRowStyle = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap",
  marginTop: "12px",
};

const primaryButtonStyle = {
  width: "100%",
  maxWidth: "100%",
  border: "none",
  borderRadius: "14px",
  padding: "15px 18px",
  fontSize: "16px",
  fontWeight: 700,
  color: "#ffffff",
  background: "linear-gradient(135deg, #f472b6, #fb7185)",
  cursor: "pointer",
  boxShadow: "0 14px 28px rgba(244,114,182,0.22)",
  boxSizing: "border-box",
};

const secondaryButtonStyle = {
  width: "100%",
  maxWidth: "100%",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "14px",
  padding: "14px 18px",
  fontSize: "15px",
  fontWeight: 700,
  color: "#e2e8f0",
  background: "rgba(255,255,255,0.05)",
  cursor: "pointer",
  boxSizing: "border-box",
};

const templateButtonStyle = {
  border: "none",
  borderRadius: "10px",
  padding: "9px 12px",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
  background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
  boxShadow: "0 8px 16px rgba(139,92,246,0.18)",
  fontSize: "12px",
};

const completeButtonStyle = {
  border: "none",
  borderRadius: "10px",
  padding: "9px 12px",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
  background: "linear-gradient(135deg, #10b981, #34d399)",
  fontSize: "12px",
};

const undoButtonStyle = {
  border: "none",
  borderRadius: "10px",
  padding: "9px 12px",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
  background: "linear-gradient(135deg, #475569, #64748b)",
  fontSize: "12px",
};

const editButtonStyle = {
  border: "none",
  borderRadius: "10px",
  padding: "9px 12px",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
  background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
  fontSize: "12px",
};

const deleteButtonStyle = {
  border: "none",
  borderRadius: "10px",
  padding: "9px 12px",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
  background: "linear-gradient(135deg, #ef4444, #fb7185)",
  fontSize: "12px",
};

const completedBadgeStyle = {
  background: "rgba(16,185,129,0.18)",
  color: "#86efac",
  padding: "5px 8px",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: 700,
  border: "1px solid rgba(16,185,129,0.25)",
};

const pendingBadgeStyle = {
  background: "rgba(249,115,22,0.18)",
  color: "#fdba74",
  padding: "5px 8px",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: 700,
  border: "1px solid rgba(249,115,22,0.25)",
};


const accountHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "14px",
};

const avatarStyle = {
  width: "44px",
  height: "44px",
  borderRadius: "999px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px",
  fontWeight: 800,
  color: "#ffffff",
  background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
  boxShadow: "0 12px 24px rgba(236,72,153,0.18)",
  flexShrink: 0,
};

const accountLabelStyle = {
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  color: "#94a3b8",
  fontWeight: 700,
};

const heatmapLegendStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  flexWrap: "wrap",
};

const heatmapLegendTextStyle = {
  fontSize: "12px",
  color: "#94a3b8",
};

const legendDotStyle = {
  width: "12px",
  height: "12px",
  borderRadius: "4px",
  border: "1px solid rgba(255,255,255,0.06)",
};

const footerStyle = {
  marginTop: "24px",
  textAlign: "center",
  fontSize: "13px",
  color: "#94a3b8",
  opacity: 0.8,
  paddingBottom: "8px",
};

export default Dashboard;