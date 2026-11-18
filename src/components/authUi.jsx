import { C, FONTS, RADIUS } from "../theme";
import { DishArt } from "./art";
import { HeroTitle } from "./ui";
import { SCENES, photoUrl } from "../lib/photos";

// Shared chrome for the signed-out screens (sign in / sign up / password reset).

export const authInputStyle = {};   // fields take their look from .sr-field

export const authLabelStyle = {
  display: "block", fontSize: 13, fontWeight: 500,
  color: C.textSub, marginBottom: 6,
};

// Three polaroids from the cookbook, tucked under the headline.
const SHELF = [
  ["breakfast", "Masala Dosa"],
  ["lunch", "Vegetable Biryani"],
  ["tea time", "Masala Chai"],
];

// The opening page: a table of food photographed from above, fading into
// the linen, with the promise on the left and the form on a paper card.
export const AuthShell = ({ children }) => (
  <div className="auth-wrap">
    <div className="auth-bg" aria-hidden="true">
      <img src={photoUrl(SCENES.signin, 2200)} alt="" />
    </div>
    <div className="auth-top">
      <span className="wordmark" style={{ cursor: "default" }}>Season<span className="sub">home kitchen</span></span>
    </div>

    <div className="auth-poster">
      <div className="eyebrow">the week's cooking, sorted</div>
      <HeroTitle className="auth-title" lines={["Eat well,", { em: true, text: "plan less." }]} />
      <p className="hero-sub" style={{ marginTop: 0, fontSize: 18, maxWidth: "40ch" }}>
        Plan the week's menu, keep track of what's on your shelves, and let
        the market list and the macros write themselves.
      </p>
      <div className="auth-shelf" aria-hidden="true">
        {SHELF.map(([meal, name], i) => (
          <div key={name} className="pola" style={{ "--i": i }}>
            <div className="ph"><DishArt dish={{ name }} size={130} round={false} /></div>
            <div className="meal">{meal}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="auth-card rise">
      {children}
    </div>
  </div>
);

export const AuthNotice = ({ tone = "error", children }) => (
  <div role={tone === "error" ? "alert" : "status"} style={{
    background: tone === "error" ? "var(--c2-soft)" : "var(--c4-soft)",
    borderRadius: 6, padding: "12px 16px",
    fontSize: 14, color: tone === "error" ? C.error : C.success,
  }}>
    {children}
  </div>
);

export const AuthButton = ({ loading, children, ...rest }) => (
  <button
    {...rest}
    disabled={loading}
    className="sr-press sr-btn sr-btn-primary"
    style={{ width: "100%", padding: "14px 0", fontSize: 16, marginTop: 6 }}
  >
    {children}
  </button>
);

export const AuthLink = ({ children, style = {}, ...rest }) => (
  <button
    type="button"
    {...rest}
    style={{
      background: "none", border: "none", padding: 0,
      color: C.text, fontSize: 13, fontWeight: 600,
      textDecoration: "underline", textUnderlineOffset: 3,
      fontFamily: FONTS.body, cursor: "pointer",
      ...style,
    }}
  >
    {children}
  </button>
);
