import { useState } from "react";
import { C, FONTS } from "../theme";
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
          <h2 style={{ fontFamily: FONTS.display, fontWeight: 400, fontSize: 32, letterSpacing: "-0.015em", color: C.head, lineHeight: 1.1, marginBottom: 12 }}>
            Reset your password
          </h2>
          <div style={{ fontSize: 15, color: C.textSub, lineHeight: 1.5 }}>
            Enter your email and we'll send you a link to set a new password.
          </div>
        </div>
      ) : (
        /* The headline says which mode you're in; the chips switch it */
        <div style={{ marginBottom: 28 }}>
          <h2 style={{
            fontFamily: FONTS.display, fontWeight: 400, fontSize: 36, letterSpacing: "-0.015em", lineHeight: 1.1,
            color: C.head, marginBottom: 20,
          }}>
            {mode === "signin" ? "Welcome back." : "Pull up a chair."}
          </h2>
          <div role="tablist" className="chip-row">
            {[["signin", "Sign In"], ["signup", "Sign Up"]].map(([m, label]) => (
              <button
                key={m} type="button" role="tab" aria-selected={mode === m}
                className={`chip${mode === m ? " on" : ""}`}
                onClick={() => switchMode(m)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <label style={authLabelStyle}>Email</label>
          <input
            type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            required placeholder="you@example.com"
            className="sr-field" style={authInputStyle}
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
              className="sr-field" style={authInputStyle}
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
