import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// The client strips the auth fragment from the URL as soon as it trades it for
// a session, so the "did the user arrive from a reset email?" answer has to be
// read here — synchronously, before that async handoff runs. The
// PASSWORD_RECOVERY auth event covers the code-exchange flow, where no
// fragment is present.
export const arrivedFromRecoveryLink =
  new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
