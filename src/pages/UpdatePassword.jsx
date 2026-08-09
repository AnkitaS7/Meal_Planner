import { useState, useEffect } from "react";
import { C } from "../theme";
import { supabase } from "../lib/supabase";
import {
  AuthShell, AuthNotice, AuthButton, AuthLink,
  authInputStyle, authLabelStyle,
} from "../components/authUi";

const MIN_LENGTH = 8;

/**
 * Shown when the user arrives from a password-reset email. Supabase has already
 * exchanged the link for a short-lived recovery session by this point, so all
 * that's left is to write the new password onto that session.
 *
 * onDone() hands control back to App — either into the app (password changed,
 * the recovery session is a real session) or back to the login screen.
 */
export default function UpdatePassword({ onDone }) {
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [done, setDone]           = useState(false);
  const [linkValid, setLinkValid] = useState(null); // null = still checking

  // A recovery link that has expired or was already used leaves us with no
  // session at all; say so rather than failing on submit.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLinkValid(Boolean(session));
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < MIN_LENGTH) {
      setError(`Password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) setError(error.message);
    else setDone(true);
  };

  const backToSignIn = async () => {
    await supabase.auth.signOut();
    onDone();
  };

  if (linkValid === null) {
    return (
      <AuthShell>
        <div style={{ textAlign: "center", fontSize: 14, color: C.textMuted, position: "relative" }}>
          Checking your reset link…
        </div>
      </AuthShell>
    );
  }

  if (!linkValid) {
    return (
      <AuthShell>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative" }}>
          <AuthNotice tone="error">
            This password reset link is invalid or has expired. Request a new one from the sign-in screen.
          </AuthNotice>
          <AuthButton type="button" onClick={onDone}>Back to Sign In</AuthButton>
        </div>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative" }}>
          <AuthNotice tone="success">
            Your password has been updated.
          </AuthNotice>
          <AuthButton type="button" onClick={onDone}>Continue to Season</AuthButton>
          <div style={{ textAlign: "center" }}>
            <AuthLink onClick={backToSignIn}>Sign in again instead</AuthLink>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div style={{ marginBottom: 24, position: "relative" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>
          Choose a new password
        </div>
        <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
          Must be at least {MIN_LENGTH} characters.
        </div>
      </div>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={authLabelStyle}>New Password</label>
          <input
            type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            required placeholder="••••••••"
            autoComplete="new-password"
            style={authInputStyle}
          />
        </div>

        <div>
          <label style={authLabelStyle}>Confirm Password</label>
          <input
            type="password" value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required placeholder="••••••••"
            autoComplete="new-password"
            style={authInputStyle}
          />
        </div>

        {error && <AuthNotice tone="error">{error}</AuthNotice>}

        <AuthButton type="submit" loading={loading}>
          {loading ? "Updating…" : "Update Password"}
        </AuthButton>
      </form>

      <div style={{ textAlign: "center", marginTop: 18, position: "relative" }}>
        <AuthLink onClick={backToSignIn}>Cancel</AuthLink>
      </div>
    </AuthShell>
  );
}
