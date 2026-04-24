import { useState } from "react";
import { C, FONTS, RADIUS, SHADOW } from "../theme";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [mode, setMode]         = useState("signin"); // "signin" | "signup"
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [info, setInfo]         = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setInfo("Account created! Check your email to confirm, then sign in.");
        setMode("signin");
      }
    }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%",
    border: `1.5px solid ${C.border}`,
    borderRadius: RADIUS.md,
    padding: "11px 14px",
    fontSize: 14,
    color: C.text,
    fontFamily: FONTS.body,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block", fontSize: 12, fontWeight: 600,
    color: C.textSub, marginBottom: 6, letterSpacing: 0.4,
    textTransform: "uppercase",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: RADIUS.xl,
        boxShadow: SHADOW.lg,
        padding: "48px 40px",
        width: "100%",
        maxWidth: 400,
      }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            fontFamily: FONTS.display, fontSize: 28, fontWeight: 700,
            color: C.text, letterSpacing: -0.5,
          }}>
            Mise en Place
          </div>
          <div style={{
            fontSize: 13, color: C.textMuted, marginTop: 4,
            letterSpacing: 1.5, textTransform: "uppercase",
          }}>
            Meal Planner
          </div>
        </div>

        {/* Mode tabs */}
        <div style={{
          display: "flex", background: C.bg, borderRadius: RADIUS.md,
          padding: 4, marginBottom: 28,
        }}>
          {[["signin", "Sign In"], ["signup", "Sign Up"]].map(([m, label]) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); setInfo(""); }}
              style={{
                flex: 1, padding: "9px 0", border: "none",
                borderRadius: RADIUS.sm,
                background: mode === m ? "#fff" : "transparent",
                color: mode === m ? C.text : C.textMuted,
                fontWeight: mode === m ? 600 : 400,
                fontSize: 14, cursor: "pointer",
                fontFamily: FONTS.body,
                boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.18s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              required placeholder="you@example.com"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              required placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: RADIUS.md, padding: "10px 14px",
              fontSize: 13, color: C.error,
            }}>
              {error}
            </div>
          )}

          {info && (
            <div style={{
              background: "#F0FDF4", border: "1px solid #BBF7D0",
              borderRadius: RADIUS.md, padding: "10px 14px",
              fontSize: 13, color: C.success,
            }}>
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? C.border : C.accent,
              color: "#fff", border: "none",
              borderRadius: RADIUS.md, padding: "13px 0",
              fontSize: 15, fontWeight: 600,
              fontFamily: FONTS.body,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 4, transition: "background 0.18s",
            }}
          >
            {loading ? (mode === "signin" ? "Signing in…" : "Creating account…") : (mode === "signin" ? "Sign In" : "Create Account")}
          </button>
        </form>
      </div>
    </div>
  );
}
