import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";

function App() {
  const [enteredApp, setEnteredApp] = useState(false);

  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1100;

  if (enteredApp) {
    return <Dashboard />;
  }

  return (
    <div style={pageStyle}>
      <div style={siteShellStyle(isMobile)}>
        <nav style={navStyle(isMobile)}>
          <div style={brandStyle}>HabitFlow</div>

          <div style={navLinksStyle(isMobile)}>
            <span style={navTagStyle}>Full-Stack Habit Tracker</span>
          </div>
        </nav>

        <section style={heroWrapperStyle(isTablet, isMobile)}>
          <div style={heroContentStyle}>
            <p style={eyebrowStyle}>FULL-STACK PRODUCTIVITY PLATFORM</p>
            <h1 style={titleStyle(isTablet, isMobile)}>Build better habits with HabitFlow.</h1>
            <p style={subtitleStyle(isTablet, isMobile)}>
              Track routines, build streaks, visualize consistency with charts and
              heatmaps, and stay accountable through a modern productivity dashboard.
            </p>

            <div style={buttonRowStyle(isMobile)}>
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

            <div style={statsRowStyle(isTablet, isMobile)}>
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

          <div style={previewCardStyle(isMobile)}>
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
        </section>

        <section style={featuresSectionStyle}>
          <div style={featureSectionHeaderStyle}>
            <p style={featureSectionEyebrowStyle}>WHY HABITFLOW</p>
            <h2 style={featureSectionTitleStyle(isMobile)}>Everything you need to stay consistent.</h2>
            <p style={featureSectionTextStyle(isMobile)}>
              HabitFlow combines secure authentication, productivity tracking, and
              visual analytics into one focused full-stack application.
            </p>
          </div>

          <div style={featureGridStyle(isTablet, isMobile)}>
            <div style={featureCardStyle}>
              <div style={featureIconStyle}>🔐</div>
              <h3 style={featureCardTitleStyle}>Secure access</h3>
              <p style={featureCardTextStyle}>
                Login with email, Google OAuth, or continue as a guest for a fast demo experience.
              </p>
            </div>

            <div style={featureCardStyle}>
              <div style={featureIconStyle}>🔥</div>
              <h3 style={featureCardTitleStyle}>Streak tracking</h3>
              <p style={featureCardTextStyle}>
                Build momentum with daily completions, streak counters, and habit consistency feedback.
              </p>
            </div>

            <div style={featureCardStyle}>
              <div style={featureIconStyle}>📈</div>
              <h3 style={featureCardTitleStyle}>Analytics dashboard</h3>
              <p style={featureCardTextStyle}>
                Understand your performance through weekly progress charts, summaries, and activity insights.
              </p>
            </div>

            <div style={featureCardStyle}>
              <div style={featureIconStyle}>🗓️</div>
              <h3 style={featureCardTitleStyle}>Heatmap history</h3>
              <p style={featureCardTextStyle}>
                Visualize long-term consistency with a GitHub-style activity heatmap for habits.
              </p>
            </div>
          </div>
        </section>


        <footer style={footerStyle}>
          HabitFlow © {new Date().getFullYear()} — Built by Safeer Ahmad
        </footer>
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
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "0",
  margin: "0",
  overflowY: "auto",
  overflowX: "hidden",
  background:
    "radial-gradient(circle at top left, rgba(139,92,246,0.22), transparent 24%), radial-gradient(circle at top right, rgba(59,130,246,0.12), transparent 22%), linear-gradient(135deg, #151937 0%, #091224 58%, #030712 100%)",
};

const siteShellStyle = (isMobile) => ({
  width: "100%",
  maxWidth: "1560px",
  padding: isMobile ? "16px 14px 32px" : "24px 32px 48px",
  margin: "0 auto",
  display: "grid",
  gap: isMobile ? "18px" : "26px",
});

const navStyle = (isMobile) => ({
  display: "flex",
  flexDirection: isMobile ? "column" : "row",
  alignItems: isMobile ? "stretch" : "center",
  justifyContent: "space-between",
  gap: isMobile ? "12px" : "20px",
  padding: isMobile ? "14px 16px" : "16px 20px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
});

const brandStyle = {
  color: "#f8fafc",
  fontSize: "22px",
  fontWeight: 800,
  letterSpacing: "-0.4px",
};

const navLinksStyle = (isMobile) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: isMobile ? "center" : "flex-start",
  gap: "14px",
  flexWrap: "wrap",
});

const navTagStyle = {
  color: "#cbd5e1",
  fontSize: "14px",
  fontWeight: 600,
  padding: "10px 14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const heroWrapperStyle = (isTablet, isMobile) => ({
  width: "100%",
  display: "grid",
  gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "1.2fr 0.9fr",
  gap: isMobile ? "24px" : isTablet ? "28px" : "36px",
  alignItems: "center",
  padding: "12px 0 0",
  margin: "0 auto",
});

const heroContentStyle = {
  display: "grid",
  gap: "22px",
};

const featuresSectionStyle = {
  display: "grid",
  gap: "24px",
  paddingTop: "10px",
};

const featureSectionHeaderStyle = {
  display: "grid",
  gap: "10px",
  maxWidth: "820px",
};

const featureSectionEyebrowStyle = {
  margin: 0,
  color: "#c4b5fd",
  fontWeight: 700,
  fontSize: "13px",
  letterSpacing: "1.8px",
};

const featureSectionTitleStyle = (isMobile) => ({
  margin: 0,
  fontSize: isMobile ? "34px" : "42px",
  lineHeight: 1.08,
  color: "#f8fafc",
  fontWeight: 800,
  letterSpacing: "-1px",
});

const featureSectionTextStyle = (isMobile) => ({
  margin: 0,
  color: "#cbd5e1",
  fontSize: isMobile ? "16px" : "18px",
  lineHeight: 1.7,
});

const featureGridStyle = (isTablet, isMobile) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
  gap: "16px",
});

const featureCardStyle = {
  borderRadius: "20px",
  padding: "22px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 16px 36px rgba(0,0,0,0.18)",
};

const featureIconStyle = {
  fontSize: "24px",
  marginBottom: "12px",
};

const featureCardTitleStyle = {
  margin: "0 0 8px 0",
  color: "#f8fafc",
  fontSize: "20px",
  fontWeight: 700,
};

const featureCardTextStyle = {
  margin: 0,
  color: "#cbd5e1",
  fontSize: "15px",
  lineHeight: 1.7,
};

const eyebrowStyle = {
  margin: 0,
  color: "#c4b5fd",
  fontWeight: 700,
  fontSize: "14px",
  letterSpacing: "1.8px",
};

const titleStyle = (isTablet, isMobile) => ({
  margin: 0,
  fontSize: isMobile ? "48px" : isTablet ? "64px" : "88px",
  lineHeight: 1,
  color: "#f8fafc",
  fontWeight: 800,
  letterSpacing: isMobile ? "-1px" : "-2px",
});

const subtitleStyle = (isTablet, isMobile) => ({
  margin: 0,
  maxWidth: "760px",
  color: "#cbd5e1",
  fontSize: isMobile ? "18px" : isTablet ? "20px" : "24px",
  lineHeight: 1.75,
});

const buttonRowStyle = (isMobile) => ({
  display: "flex",
  flexDirection: isMobile ? "column" : "row",
  gap: "14px",
  alignItems: isMobile ? "stretch" : "center",
  flexWrap: "wrap",
});

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

const statsRowStyle = (isTablet, isMobile) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(3, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))",
  gap: "14px",
  marginTop: "10px",
});

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

const previewCardStyle = (isMobile) => ({
  borderRadius: "24px",
  overflow: "hidden",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 20px 50px rgba(0,0,0,0.22)",
  backdropFilter: "blur(12px)",
  width: "100%",
  maxWidth: isMobile ? "100%" : "unset",
});

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


const footerStyle = {
  textAlign: "center",
  color: "#94a3b8",
  fontSize: "13px",
  paddingBottom: "8px",
};

export default App;