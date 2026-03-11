import { useState } from "react";
import Dashboard from "./pages/Dashboard";

function App() {
  const [enteredApp, setEnteredApp] = useState(false);

  if (enteredApp) {
    return <Dashboard />;
  }

  return (
    <div style={pageStyle}>
      <div style={heroWrapperStyle}>
        <div style={heroContentStyle}>
          <p style={eyebrowStyle}>FULL-STACK PRODUCTIVITY PLATFORM</p>
          <h1 style={titleStyle}>Build better habits with HabitFlow.</h1>
          <p style={subtitleStyle}>
            Track routines, build streaks, visualize consistency with charts and
            heatmaps, and stay accountable through a modern productivity dashboard.
          </p>

          <div style={buttonRowStyle}>
            <button style={primaryButtonStyle} onClick={() => setEnteredApp(true)}>
              Launch App
            </button>

            <a
              href="https://github.com/safeerahmad12/habitflow"
              target="_blank"
              rel="noreferrer"
              style={secondaryLinkStyle}
            >
              View GitHub
            </a>
          </div>

          <div style={statsRowStyle}>
            <div style={statCardStyle}>
              <strong style={statValueStyle}>JWT + OAuth</strong>
              <span style={statLabelStyle}>Secure Authentication</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statValueStyle}>Charts + Heatmap</strong>
              <span style={statLabelStyle}>Visual Analytics</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statValueStyle}>FastAPI + React</strong>
              <span style={statLabelStyle}>Full-Stack Architecture</span>
            </div>
          </div>
        </div>

        <div style={previewCardStyle}>
          <div style={previewHeaderStyle}>
            <span style={previewDotPink} />
            <span style={previewDotYellow} />
            <span style={previewDotGreen} />
          </div>

          <div style={previewBodyStyle}>
            <p style={previewLabelStyle}>What HabitFlow offers</p>

            <div style={featureListStyle}>
              <div style={featureItemStyle}>🔥 Habit streak tracking</div>
              <div style={featureItemStyle}>📊 Weekly analytics dashboard</div>
              <div style={featureItemStyle}>🗓️ Activity heatmap</div>
              <div style={featureItemStyle}>🔐 Email, Google, and guest login</div>
              <div style={featureItemStyle}>🧠 AI-style insights</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  position: "fixed",
  inset: 0,
  width: "100vw",
  minHeight: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0",
  margin: "0",
  overflowY: "auto",
  overflowX: "hidden",
  background:
    "radial-gradient(circle at top left, rgba(139,92,246,0.22), transparent 24%), radial-gradient(circle at top right, rgba(59,130,246,0.12), transparent 22%), linear-gradient(135deg, #151937 0%, #091224 58%, #030712 100%)",
};

const heroWrapperStyle = {
  width: "100%",
  maxWidth: "1560px",
  display: "grid",
  gridTemplateColumns: "1.2fr 0.9fr",
  gap: "36px",
  alignItems: "center",
  padding: "28px 32px",
  margin: "0 auto",
};

const heroContentStyle = {
  display: "grid",
  gap: "22px",
};

const eyebrowStyle = {
  margin: 0,
  color: "#c4b5fd",
  fontWeight: 700,
  fontSize: "14px",
  letterSpacing: "1.8px",
};

const titleStyle = {
  margin: 0,
  fontSize: "88px",
  lineHeight: 1,
  color: "#f8fafc",
  fontWeight: 800,
  letterSpacing: "-2px",
};

const subtitleStyle = {
  margin: 0,
  maxWidth: "760px",
  color: "#cbd5e1",
  fontSize: "24px",
  lineHeight: 1.75,
};

const buttonRowStyle = {
  display: "flex",
  gap: "14px",
  alignItems: "center",
  flexWrap: "wrap",
};

const primaryButtonStyle = {
  border: "none",
  borderRadius: "14px",
  padding: "16px 22px",
  fontSize: "16px",
  fontWeight: 700,
  color: "#fff",
  background: "linear-gradient(135deg, #f472b6, #fb7185)",
  cursor: "pointer",
  boxShadow: "0 14px 28px rgba(244,114,182,0.22)",
};

const secondaryLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  borderRadius: "14px",
  padding: "15px 22px",
  fontSize: "16px",
  fontWeight: 700,
  color: "#e2e8f0",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.05)",
};

const statsRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "14px",
  marginTop: "10px",
};

const statCardStyle = {
  borderRadius: "18px",
  padding: "18px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(10px)",
};

const statValueStyle = {
  display: "block",
  color: "#f8fafc",
  fontSize: "18px",
  marginBottom: "6px",
};

const statLabelStyle = {
  color: "#94a3b8",
  fontSize: "14px",
};

const previewCardStyle = {
  borderRadius: "24px",
  overflow: "hidden",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 20px 50px rgba(0,0,0,0.22)",
  backdropFilter: "blur(12px)",
};

const previewHeaderStyle = {
  display: "flex",
  gap: "8px",
  padding: "16px 18px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const previewDotPink = {
  width: "11px",
  height: "11px",
  borderRadius: "999px",
  background: "#fb7185",
};

const previewDotYellow = {
  width: "11px",
  height: "11px",
  borderRadius: "999px",
  background: "#fbbf24",
};

const previewDotGreen = {
  width: "11px",
  height: "11px",
  borderRadius: "999px",
  background: "#34d399",
};

const previewBodyStyle = {
  padding: "24px",
};

const previewLabelStyle = {
  margin: "0 0 14px 0",
  color: "#f8fafc",
  fontSize: "18px",
  fontWeight: 700,
};

const featureListStyle = {
  display: "grid",
  gap: "12px",
};

const featureItemStyle = {
  color: "#e2e8f0",
  fontSize: "15px",
  lineHeight: 1.5,
  padding: "14px 16px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
};

export default App;