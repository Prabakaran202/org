import { useState, useEffect, useRef } from "react";

const SCAN_TYPES = [
  { id: "username", label: "Username", icon: "◉", placeholder: "e.g. Ramesh12938475", desc: "Social media bot & identity analysis" },
  { id: "domain", label: "Domain / URL", icon: "⬡", placeholder: "e.g. fakenews-site.com", desc: "Domain reputation & fake news check" },
  { id: "ip", label: "IP Address", icon: "◈", placeholder: "e.g. 192.168.1.1", desc: "Network intelligence & geolocation" },
  { id: "text", label: "News / Text", icon: "≡", placeholder: "Paste suspicious news or claim here...", desc: "Fact-check & misinformation detection" },
];

const TAMIL_TIPS = [
  "ஒரு செய்தி பரவும்போது, முதலில் ஆதாரத்தை கேளுங்கள்.",
  "Bot கணக்குகளில் பெரும்பாலும் profile photo இருக்காது.",
  "Fact-check செய்ய Alt News, Boom Live பயன்படுத்துங்கள்.",
  "URL-ல் typo இருந்தால் அது fake site ஆக இருக்கலாம்.",
  "ஒரே நேரத்தில் நூறு கமெண்ட்கள் போட்டால் அது Bot.",
];

function TerminalText({ text, speed = 18 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text]);
  return (
    <span>
      {displayed}
      {!done && <span className="cursor-blink">█</span>}
    </span>
  );
}

function ScanResult({ result, loading }) {
  const sections = result ? parseSections(result) : [];
  return (
    <div className="result-panel">
      {loading && (
        <div className="loading-block">
          <div className="scan-line" />
          <p className="loading-text">
            <TerminalText text="[ SCANNING... ANALYZING... CROSS-REFERENCING OSINT SOURCES ]" speed={22} />
          </p>
        </div>
      )}
      {!loading && result && (
        <div className="result-content">
          <div className="result-header">
            <span className="result-badge">▶ SCAN COMPLETE</span>
            <span className="result-time">{new Date().toLocaleTimeString()}</span>
          </div>
          {sections.map((s, i) => (
            <div key={i} className={`result-section threat-${s.level}`}>
              <div className="section-label">{s.icon} {s.title}</div>
              <div className="section-body">{s.body}</div>
            </div>
          ))}
        </div>
      )}
      {!loading && !result && (
        <div className="empty-state">
          <div className="grid-bg" />
          <p className="empty-text">[ AWAITING TARGET INPUT ]</p>
          <p className="empty-sub">Enter a username, domain, IP, or news text to begin OSINT analysis</p>
        </div>
      )}
    </div>
  );
}

function parseSections(text) {
  const lines = text.split("\n").filter(Boolean);
  const sections = [];
  let current = null;
  for (const line of lines) {
    if (line.startsWith("##")) {
      if (current) sections.push(current);
      const title = line.replace(/^##\s*/, "").replace(/\*\*/g, "").trim();
      const level = title.toLowerCase().includes("high") || title.toLowerCase().includes("danger") || title.toLowerCase().includes("fake") ? "high"
        : title.toLowerCase().includes("medium") || title.toLowerCase().includes("suspicious") ? "medium"
        : title.toLowerCase().includes("safe") || title.toLowerCase().includes("legit") ? "safe"
        : "neutral";
      const icon = level === "high" ? "⚠" : level === "medium" ? "◎" : level === "safe" ? "✓" : "◉";
      current = { title, body: "", level, icon };
    } else if (current) {
      current.body += line.replace(/\*\*/g, "") + "\n";
    } else {
      if (!sections.length) sections.push({ title: "INTELLIGENCE REPORT", body: "", level: "neutral", icon: "◉" });
      sections[0].body += line.replace(/\*\*/g, "") + "\n";
    }
  }
  if (current) sections.push(current);
  return sections.length ? sections : [{ title: "ANALYSIS", body: text.replace(/\*\*/g, ""), level: "neutral", icon: "◉" }];
}

export default function OSINTDashboard() {
  const [scanType, setScanType] = useState("username");
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tipIdx, setTipIdx] = useState(0);
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTipIdx(i => (i + 1) % TAMIL_TIPS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const currentType = SCAN_TYPES.find(t => t.id === scanType);

  const buildPrompt = () => {
    const prompts = {
      username: `You are an OSINT (Open Source Intelligence) analyst. Analyze this social media username for bot/fake account indicators: "${input}"

Provide a structured report with these sections:
## BOT PROBABILITY SCORE
Rate from 0-100% with reasoning. Consider: numeric suffixes, no spaces in name, suspicious patterns.

## ACCOUNT RED FLAGS
List specific indicators that suggest this might be a bot or fake account.

## BOT DETECTION SIGNALS
Explain what patterns (timing, copy-paste behavior, no DP, mass following) to look for.

## VERDICT
Clear conclusion: LIKELY BOT / LIKELY REAL / SUSPICIOUS - with confidence level.

## RECOMMENDED ACTIONS
What should a normal person do if they encounter this account?

Keep it factual, structured, and useful for a Tamil Nadu social media user. Use simple English.`,

      domain: `You are a cybersecurity OSINT analyst. Analyze this domain/URL for fake news, misinformation, or malicious activity: "${input}"

## DOMAIN THREAT LEVEL
HIGH / MEDIUM / LOW - with reasoning

## FAKE NEWS INDICATORS  
Does this domain typically spread misinformation? Known patterns?

## TECHNICAL RED FLAGS
URL structure issues, typosquatting, suspicious TLD, age indicators.

## FACT-CHECK RESOURCES
Which Indian fact-checking sites (Alt News, Boom Live, FactCrescendo) would be relevant?

## VERDICT
Safe to visit / SUSPICIOUS / DANGEROUS

## HOW TO VERIFY
Steps a normal user can take to verify content from this source.`,

      ip: `You are a network OSINT analyst. Provide intelligence on this IP address: "${input}"

## GEOLOCATION & ISP
Likely location, ISP, and network type (based on general knowledge).

## THREAT INDICATORS
Known associations with spam, bots, or malicious activity patterns.

## NETWORK INTEL
What this IP range typically represents (residential, datacenter, VPN, etc.)

## BOT NETWORK RISK
Could this be part of a bot farm or coordinated inauthentic behavior network?

## VERDICT
CLEAN / SUSPICIOUS / HIGH RISK

## OSINT TOOLS TO USE
Recommend specific free OSINT tools (Shodan, SpiderFoot, etc.) for deeper analysis.`,

      text: `You are a fact-checking OSINT analyst specializing in Indian misinformation. Analyze this news/text for authenticity: 

"${input}"

## MISINFORMATION SCORE
Rate 0-100% likelihood of being fake/misleading with reasoning.

## RED FLAGS DETECTED
Specific phrases, claims, or patterns that indicate misinformation.

## EMOTIONAL MANIPULATION TACTICS
What fear/anger/outrage triggers are being used (if any)?

## FACT-CHECK STATUS
Based on known misinformation patterns, is this claim likely TRUE / FALSE / MISLEADING / UNVERIFIED?

## VERIFICATION STEPS
Exact steps to verify this claim using Alt News, Boom Live, Google Fact Check.

## TAMIL CONTEXT
Any specific relevance to Tamil Nadu / Tamil social media misinformation patterns?

## VERDICT
Clear conclusion with confidence level.`
    };
    return prompts[scanType];
  };

  const runScan = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: buildPrompt() }],
        }),
      });

      const data = await response.json();
      const fullText = data.content
        .map(item => item.type === "text" ? item.text : "")
        .filter(Boolean)
        .join("\n");

      setResult(fullText || "No analysis returned.");
      setHistory(h => [{ type: scanType, input: input.slice(0, 40), time: new Date().toLocaleTimeString() }, ...h.slice(0, 4)]);
    } catch (e) {
      setError("SCAN FAILED: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .dashboard {
          min-height: 100vh;
          background: #030810;
          color: #a0e4b0;
          font-family: 'Share Tech Mono', monospace;
          position: relative;
          overflow-x: hidden;
        }

        .dashboard::before {
          content: '';
          position: fixed;
          inset: 0;
          background: 
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,255,100,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(0,100,255,0.05) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        .scanlines {
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,255,80,0.015) 2px,
            rgba(0,255,80,0.015) 4px
          );
          pointer-events: none;
          z-index: 1;
        }

        .container {
          position: relative;
          z-index: 2;
          max-width: 900px;
          margin: 0 auto;
          padding: 20px 16px;
        }

        .header {
          text-align: center;
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(0,255,80,0.2);
        }

        .header-badge {
          font-size: 10px;
          letter-spacing: 4px;
          color: #00ff52;
          opacity: 0.6;
          margin-bottom: 8px;
        }

        .header-title {
          font-family: 'Orbitron', monospace;
          font-size: clamp(22px, 5vw, 36px);
          font-weight: 900;
          color: #00ff52;
          text-shadow: 0 0 20px rgba(0,255,82,0.4), 0 0 60px rgba(0,255,82,0.1);
          letter-spacing: 3px;
        }

        .header-sub {
          font-size: 11px;
          color: rgba(160,228,176,0.5);
          letter-spacing: 2px;
          margin-top: 6px;
        }

        .tip-bar {
          background: rgba(0,255,82,0.05);
          border: 1px solid rgba(0,255,82,0.15);
          border-left: 3px solid #00ff52;
          padding: 8px 14px;
          font-size: 11px;
          color: rgba(160,228,176,0.7);
          margin-bottom: 20px;
          font-family: 'Exo 2', sans-serif;
          transition: all 0.5s;
        }

        .tip-label { color: #00ff52; font-family: 'Share Tech Mono', monospace; }

        .scan-types {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }

        @media (min-width: 600px) {
          .scan-types { grid-template-columns: repeat(4, 1fr); }
        }

        .type-btn {
          background: rgba(0,255,82,0.03);
          border: 1px solid rgba(0,255,82,0.15);
          color: rgba(160,228,176,0.6);
          padding: 10px 8px;
          cursor: pointer;
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          text-align: center;
          transition: all 0.2s;
          letter-spacing: 1px;
        }

        .type-btn:hover {
          border-color: rgba(0,255,82,0.4);
          color: #00ff52;
          background: rgba(0,255,82,0.07);
        }

        .type-btn.active {
          border-color: #00ff52;
          color: #00ff52;
          background: rgba(0,255,82,0.1);
          box-shadow: 0 0 12px rgba(0,255,82,0.15), inset 0 0 12px rgba(0,255,82,0.05);
        }

        .type-icon { font-size: 16px; display: block; margin-bottom: 4px; }

        .input-section {
          background: rgba(0,255,82,0.03);
          border: 1px solid rgba(0,255,82,0.2);
          padding: 16px;
          margin-bottom: 16px;
        }

        .input-label {
          font-size: 10px;
          letter-spacing: 3px;
          color: #00ff52;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .input-desc {
          font-size: 10px;
          color: rgba(160,228,176,0.4);
          letter-spacing: 1px;
        }

        .target-input {
          width: 100%;
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(0,255,82,0.25);
          color: #a0e4b0;
          padding: 12px 14px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 13px;
          outline: none;
          resize: vertical;
          min-height: 48px;
          transition: border-color 0.2s;
        }

        .target-input:focus {
          border-color: #00ff52;
          box-shadow: 0 0 0 1px rgba(0,255,82,0.2);
        }

        .target-input::placeholder { color: rgba(160,228,176,0.25); }

        .scan-btn {
          width: 100%;
          background: rgba(0,255,82,0.08);
          border: 1px solid #00ff52;
          color: #00ff52;
          padding: 14px;
          font-family: 'Orbitron', monospace;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 4px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 16px;
          text-transform: uppercase;
        }

        .scan-btn:hover:not(:disabled) {
          background: rgba(0,255,82,0.15);
          box-shadow: 0 0 20px rgba(0,255,82,0.25);
        }

        .scan-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .result-panel {
          min-height: 300px;
          border: 1px solid rgba(0,255,82,0.15);
          background: rgba(0,0,0,0.3);
        }

        .loading-block {
          padding: 40px 20px;
          text-align: center;
        }

        .scan-line {
          height: 2px;
          background: linear-gradient(90deg, transparent, #00ff52, transparent);
          animation: scan 1.5s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .loading-text {
          font-size: 11px;
          color: #00ff52;
          letter-spacing: 1px;
        }

        .cursor-blink {
          animation: blink 0.7s steps(1) infinite;
        }

        @keyframes blink {
          50% { opacity: 0; }
        }

        .result-content { padding: 16px; }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(0,255,82,0.15);
        }

        .result-badge {
          font-size: 10px;
          letter-spacing: 3px;
          color: #00ff52;
        }

        .result-time {
          font-size: 10px;
          color: rgba(160,228,176,0.4);
        }

        .result-section {
          margin-bottom: 14px;
          padding: 12px;
          border-left: 2px solid;
        }

        .result-section.threat-high { border-color: #ff4444; background: rgba(255,68,68,0.04); }
        .result-section.threat-medium { border-color: #ffaa00; background: rgba(255,170,0,0.04); }
        .result-section.threat-safe { border-color: #00ff52; background: rgba(0,255,82,0.04); }
        .result-section.threat-neutral { border-color: rgba(0,255,82,0.3); }

        .section-label {
          font-size: 11px;
          letter-spacing: 2px;
          margin-bottom: 8px;
          font-weight: bold;
        }

        .threat-high .section-label { color: #ff6666; }
        .threat-medium .section-label { color: #ffbb33; }
        .threat-safe .section-label { color: #00ff52; }
        .threat-neutral .section-label { color: #a0e4b0; }

        .section-body {
          font-size: 12px;
          line-height: 1.7;
          color: rgba(160,228,176,0.8);
          font-family: 'Exo 2', sans-serif;
          white-space: pre-wrap;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          position: relative;
          overflow: hidden;
        }

        .grid-bg {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(0,255,82,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,82,0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .empty-text {
          font-size: 13px;
          letter-spacing: 4px;
          color: rgba(0,255,82,0.4);
          position: relative;
        }

        .empty-sub {
          font-size: 10px;
          color: rgba(160,228,176,0.25);
          margin-top: 8px;
          text-align: center;
          position: relative;
          font-family: 'Exo 2', sans-serif;
          max-width: 300px;
          line-height: 1.6;
        }

        .error-msg {
          padding: 16px;
          color: #ff6666;
          font-size: 12px;
          border-left: 2px solid #ff4444;
          background: rgba(255,68,68,0.05);
          margin: 16px;
        }

        .history-bar {
          margin-top: 16px;
          padding: 12px;
          background: rgba(0,255,82,0.02);
          border: 1px solid rgba(0,255,82,0.08);
        }

        .history-label {
          font-size: 9px;
          letter-spacing: 3px;
          color: rgba(0,255,82,0.4);
          margin-bottom: 8px;
        }

        .history-items {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .history-item {
          font-size: 10px;
          padding: 4px 8px;
          border: 1px solid rgba(0,255,82,0.15);
          color: rgba(160,228,176,0.5);
          cursor: pointer;
          transition: all 0.2s;
        }

        .history-item:hover {
          border-color: rgba(0,255,82,0.35);
          color: #a0e4b0;
        }

        .footer {
          text-align: center;
          margin-top: 24px;
          font-size: 9px;
          letter-spacing: 2px;
          color: rgba(160,228,176,0.2);
        }
      `}</style>

      <div className="scanlines" />

      <div className="container">
        <div className="header">
          <div className="header-badge">◈ OPEN SOURCE INTELLIGENCE ◈</div>
          <div className="header-title">OSINT DASHBOARD</div>
          <div className="header-sub">BOT DETECTION • FAKE NEWS • NETWORK INTEL • FACT-CHECK</div>
        </div>

        <div className="tip-bar">
          <span className="tip-label">[TIP] </span>
          {TAMIL_TIPS[tipIdx]}
        </div>

        <div className="scan-types">
          {SCAN_TYPES.map(t => (
            <button
              key={t.id}
              className={`type-btn ${scanType === t.id ? "active" : ""}`}
              onClick={() => { setScanType(t.id); setInput(""); setResult(null); }}
            >
              <span className="type-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="input-section">
          <div className="input-label">
            <span>◉ TARGET INPUT — {currentType.label.toUpperCase()}</span>
            <span className="input-desc">{currentType.desc}</span>
          </div>
          {scanType === "text" ? (
            <textarea
              ref={inputRef}
              className="target-input"
              placeholder={currentType.placeholder}
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={4}
            />
          ) : (
            <input
              ref={inputRef}
              className="target-input"
              placeholder={currentType.placeholder}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && runScan()}
            />
          )}
        </div>

        <button
          className="scan-btn"
          onClick={runScan}
          disabled={loading || !input.trim()}
        >
          {loading ? "[ SCANNING... ]" : "[ INITIATE OSINT SCAN ]"}
        </button>

        {error && <div className="error-msg">⚠ {error}</div>}

        <ScanResult result={result} loading={loading} />

        {history.length > 0 && (
          <div className="history-bar">
            <div className="history-label">◎ SCAN HISTORY</div>
            <div className="history-items">
              {history.map((h, i) => (
                <div key={i} className="history-item">
                  [{h.type}] {h.input}... {h.time}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="footer">
          ◈ POWERED BY CLAUDE AI + WEB SEARCH ◈ OSINT ANALYSIS TOOL ◈ BDH ◈
        </div>
      </div>
    </div>
  );
}
