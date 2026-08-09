import { useState } from "react";
import { C, RADIUS, FONTS } from "../theme";
import { supabase } from "../lib/supabase";
import {
  AuthShell, AuthNotice, AuthButton, AuthLink,
  authInputStyle, authLabelStyle,
} from "../components/authUi";

// Where Supabase sends the user back to after they click the reset email.
// App.jsx picks the recovery session up from there and shows the update form.
const resetRedirect = () => `${window.location.origin}${window.location.pathname}`;

// Supabase's raw auth errors are aimed at developers; translate the ones a user
// can actually hit into something they can act on.
const friendlyError = (error) => {
  if (error.code === "over_email_send_rate_limit" || error.status === 429) {
    return "Too many emails requested just now. Wait a few minutes and try again — " +
           "if a link already reached your inbox, that one still works.";
  }
  if (error.code === "email_not_confirmed") {
    return "This email hasn't been confirmed yet. Use the confirmation link sent when the account was created.";
  }
  return error.message;
};

export default function Login() {
  const [mode, setMode]         = useState("signin"); // "signin" | "signup" | "forgot"
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [info, setInfo]         = useState("");

  const switchMode = (m) => { setMode(m); setError(""); setInfo(""); };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(friendlyError(error));
    } else if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(friendlyError(error));
      } else {
        setInfo("Account created! Check your email to confirm, then sign in.");
        setMode("signin");
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetRedirect(),
      });
      // Don't leak whether the address has an account — report the same thing
      // either way unless Supabase itself refused the request (e.g. rate limit).
      if (error) setError(friendlyError(error));
      else setInfo("If an account exists for that email, a password reset link is on its way.");
    }
    setLoading(false);
  };

  const buttonLabel = () => {
    if (loading) {
      return { signin: "Signing in…", signup: "Creating account…", forgot: "Sending link…" }[mode];
    }
    return { signin: "Sign In", signup: "Create Account", forgot: "Send Reset Link" }[mode];
  };

  return (
    <AuthShell>
      {mode === "forgot" ? (
        <div style={{ marginBottom: 24, position: "relative" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>
            Reset your password
          </div>
          <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
            Enter your email and we'll send you a link to set a new password.
          </div>
        </div>
      ) : (
        /* Mode tabs */
        <div style={{
          display: "flex", background: C.bg, borderRadius: RADIUS.md,
          padding: 4, marginBottom: 28,
        }}>
          {[["signin", "Sign In"], ["signup", "Sign Up"]].map(([m, label]) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              style={{
                flex: 1, padding: "9px 0", border: "none",
                borderRadius: RADIUS.sm,
                background: mode === m ? C.card : "transparent",
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
      )}

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={authLabelStyle}>Email</label>
          <input
            type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            required placeholder="you@example.com"
            style={authInputStyle}
          />
        </div>

        {mode !== "forgot" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <label style={authLabelStyle}>Password</label>
              {mode === "signin" && (
                <AuthLink onClick={() => switchMode("forgot")} style={{ marginBottom: 6 }}>
                  Forgot?
                </AuthLink>
              )}
            </div>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              required placeholder="••••••••"
              style={authInputStyle}
            />
          </div>
        )}

        {error && <AuthNotice tone="error">{error}</AuthNotice>}
        {info  && <AuthNotice tone="success">{info}</AuthNotice>}

        <AuthButton type="submit" loading={loading}>{buttonLabel()}</AuthButton>
      </form>

      {mode === "forgot" && (
        <div style={{ textAlign: "center", marginTop: 18, position: "relative" }}>
          <AuthLink onClick={() => switchMode("signin")}>Back to sign in</AuthLink>
        </div>
      )}
    </AuthShell>
  );
}
