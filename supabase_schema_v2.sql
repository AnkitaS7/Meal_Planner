-- ============================================================
--  MISE EN PLACE — Supabase Database Schema  (v2)
--
--  Run this entire script once in the Supabase SQL Editor.
--  Requires Supabase Auth to be enabled (auth.users must exist).
--
--  Change log vs v1:
--    CRITICAL  #1  profiles.handle — removed redundant inline UNIQUE;
--                  only the case-insensitive index remains.
--    CRITICAL  #2  RLS INSERT policies now use WITH CHECK, not USING.
--    CRITICAL  #3  handle_new_user() — handle collision guard added.
--    CRITICAL  #4  SECURITY DEFINER functions now include SET search_path.
--    CRITICAL  #5  meal_plans — replaced week_start+day_of_week with
--                  a single plan_date DATE column; helper view derives week.
--    MEDIUM    #6  nutrient_targets — CHECK on nutrient_name and unit.
--    MEDIUM    #7  shopping_item_source enum removed; source column dropped
--                  (all persisted items are manual by definition).
--    MEDIUM    #8  dish_ingredients — UNIQUE (dish_id, ingredient_name, type).
--    MEDIUM    #9  dishes.tags — GIN index added.
--    MEDIUM   #10  profiles.dietary_prefs — GIN index added.
--    MEDIUM   #11  dish_ingredients — created_at column added.
--    MEDIUM   #12  GRANT statements added for anon / authenticated roles.
--    MEDIUM   #13  Views annotated WITH (security_invoker = true).
--    MINOR    #14  display_color — hex format CHECK constraint added.
--    MINOR    #15  youtube_url — format CHECK constraint added.
--    MINOR    #16  COMMENT ON TABLE added for all 8 tables.
-- ============================================================


-- ============================================================
--  SECTION 1: ENUM TYPES
--  Only enums whose values are truly fixed forever.
--  Soft-configurable lists (categories, units) are kept as
--  CHECK constraints so they can be changed without DDL locks.
-- ============================================================

CREATE TYPE meal_slot AS ENUM (
  'Breakfast', 'Lunch', 'Dinner', 'Snack'
);

-- day_of_week removed — plan_date DATE replaces week_start + day (fix #5)

CREATE TYPE dish_category AS ENUM (
  'Breakfast', 'Lunch', 'Dinner', 'Snack',
  'Main', 'Soup', 'Salad', 'Side', 'Dessert'
);

CREATE TYPE pantry_category AS ENUM (
  'Produce', 'Dairy', 'Grains', 'Pantry',
  'Bakery', 'Meat', 'Seafood', 'Spices', 'Frozen'
);

CREATE TYPE pantry_unit AS ENUM (
  'g', 'kg', 'ml', 'L', 'pcs', 'loaf',
  'cartons', 'tbsp', 'tsp', 'cups', 'bunch'
);

CREATE TYPE dietary_preference AS ENUM (
  'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free',
  'Nut-free', 'Keto', 'Paleo', 'Halal', 'Kosher'
);

CREATE TYPE ingredient_type AS ENUM ('required', 'optional');

-- shopping_item_source enum removed (fix #7):
-- All persisted shopping items are user-created (manual).
-- Auto-derived items are computed at query time and never written.


-- ============================================================
--  SECTION 2: SHARED TRIGGER — updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public, pg_temp          -- fix #4: prevent search_path hijack
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- ============================================================
--  SECTION 3: PROFILES
-- ============================================================

CREATE TABLE profiles (
  id                UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT        NOT NULL,
  -- Fix #1: inline UNIQUE removed. The case-insensitive unique index below
  -- is the sole uniqueness enforcer, preventing both "Aria" and "aria"
  -- from co-existing without a redundant case-sensitive duplicate.
  handle            TEXT        NOT NULL,
  avatar_initials   VARCHAR(4)  NOT NULL DEFAULT 'AA',   -- VARCHAR(4) handles multi-byte chars
  avatar_url        TEXT,
  bio               TEXT,
  dietary_prefs     dietary_preference[]  NOT NULL DEFAULT '{}',
  follower_count    INT         NOT NULL DEFAULT 0 CHECK (follower_count  >= 0),
  following_count   INT         NOT NULL DEFAULT 0 CHECK (following_count >= 0),
  -- Settings
  notif_email       BOOLEAN     NOT NULL DEFAULT TRUE,
  public_profile    BOOLEAN     NOT NULL DEFAULT TRUE,
  nutrition_track   BOOLEAN     NOT NULL DEFAULT TRUE,
  weekly_digest     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE profiles IS
  'One row per auth user. Extends auth.users with app-level identity, social counts, and settings.';
COMMENT ON COLUMN profiles.handle IS
  'Unique @handle, e.g. "@aria.cooks". Uniqueness enforced case-insensitively by idx_profiles_handle.';
COMMENT ON COLUMN profiles.follower_count IS
  'Denormalised. Maintained by triggers on user_follows. Use GREATEST(n-1,0) on delete to avoid underflow.';

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Fix #1: sole uniqueness index — case-insensitive, replaces inline UNIQUE.
CREATE UNIQUE INDEX idx_profiles_handle ON profiles (LOWER(handle));

-- Fix #10: GIN index for dietary preference queries ("find all vegan users").
CREATE INDEX idx_profiles_dietary_prefs ON profiles USING GIN (dietary_prefs);


-- ============================================================
--  SECTION 4: NUTRIENT TARGETS
-- ============================================================

CREATE TABLE nutrient_targets (
  id             BIGSERIAL    PRIMARY KEY,
  user_id        UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Fix #6: constrain nutrient_name and unit to known valid values.
  nutrient_name  TEXT         NOT NULL
                   CHECK (nutrient_name IN ('Calories', 'Protein', 'Carbs', 'Fat', 'Fiber')),
  target_value   NUMERIC(8,2) NOT NULL CHECK (target_value > 0),
  unit           TEXT         NOT NULL
                   CHECK (unit IN ('kcal', 'g')),
  -- Fix #14: enforce valid 6-digit hex colour string.
  display_color  CHAR(7)      NOT NULL DEFAULT '#6B8F71'
                   CHECK (display_color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order     SMALLINT     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, nutrient_name)
);

COMMENT ON TABLE nutrient_targets IS
  'Per-user daily macro/micro goals. Seeded automatically on signup by handle_new_user().';

CREATE TRIGGER trg_nutrient_targets_updated_at
  BEFORE UPDATE ON nutrient_targets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_nutrient_targets_user ON nutrient_targets (user_id);


-- ============================================================
--  SECTION 5: DISHES
-- ============================================================

CREATE TABLE dishes (
  id             BIGSERIAL      PRIMARY KEY,
  user_id        UUID           NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name           TEXT           NOT NULL,
  category       dish_category  NOT NULL,
  cook_time_min  SMALLINT       NOT NULL DEFAULT 30 CHECK (cook_time_min > 0),
  servings       SMALLINT       NOT NULL DEFAULT 2  CHECK (servings > 0),
  tags           TEXT[]         NOT NULL DEFAULT '{}',
  img_emoji      TEXT           NOT NULL DEFAULT '🍽',
  recipe_text    TEXT,
  -- Fix #15: youtube_url must be a valid https URL or empty string.
  youtube_url    TEXT           CHECK (
                   youtube_url IS NULL
                   OR youtube_url = ''
                   OR youtube_url ~ '^https?://'
                 ),
  cal            NUMERIC(7,2)   NOT NULL DEFAULT 0 CHECK (cal        >= 0),
  protein_g      NUMERIC(6,2)   NOT NULL DEFAULT 0 CHECK (protein_g  >= 0),
  carbs_g        NUMERIC(6,2)   NOT NULL DEFAULT 0 CHECK (carbs_g    >= 0),
  fat_g          NUMERIC(6,2)   NOT NULL DEFAULT 0 CHECK (fat_g      >= 0),
  fiber_g        NUMERIC(6,2)   NOT NULL DEFAULT 0 CHECK (fiber_g    >= 0),
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE dishes IS
  'User recipe database. Nutritional values are stored per serving. Ingredients live in dish_ingredients.';
COMMENT ON COLUMN dishes.tags IS
  'Free-form tags e.g. {"vegan","gluten-free"}. Filtered via GIN index. Stored lowercase by convention.';

CREATE TRIGGER trg_dishes_updated_at
  BEFORE UPDATE ON dishes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_dishes_user_id  ON dishes (user_id);
CREATE INDEX idx_dishes_category ON dishes (user_id, category);
-- Fix #9: GIN index on tags array enables fast WHERE tags @> '{"vegan"}' queries.
CREATE INDEX idx_dishes_tags     ON dishes USING GIN (tags);
-- Full-text search on dish name (stored as a generated tsvector for best performance).
CREATE INDEX idx_dishes_fts      ON dishes USING GIN (to_tsvector('english', name));


-- ============================================================
--  SECTION 6: DISH INGREDIENTS
-- ============================================================

CREATE TABLE dish_ingredients (
  id              BIGSERIAL        PRIMARY KEY,
  dish_id         BIGINT           NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  ingredient_name TEXT             NOT NULL,
  type            ingredient_type  NOT NULL DEFAULT 'required',
  sort_order      SMALLINT         NOT NULL DEFAULT 0,
  -- Fix #11: created_at added for consistency with all other tables.
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  -- Fix #8: prevent duplicate ingredient rows on the same dish.
  UNIQUE (dish_id, ingredient_name, type)
);

COMMENT ON TABLE dish_ingredients IS
  'Required and optional ingredients for a dish. Split from dishes for indexed pantry-matching.';
COMMENT ON COLUMN dish_ingredients.type IS
  '"required" ingredients drive shopping list generation. "optional" appear as suggestions.';

CREATE INDEX idx_dish_ingredients_dish    ON dish_ingredients (dish_id);
CREATE INDEX idx_dish_ingredients_type    ON dish_ingredients (dish_id, type);
-- Case-insensitive ingredient name index for fast pantry ↔ ingredient matching.
CREATE INDEX idx_dish_ingredients_name_lc ON dish_ingredients (LOWER(ingredient_name));


-- ============================================================
--  SECTION 7: PANTRY ITEMS
-- ============================================================

CREATE TABLE pantry_items (
  id             BIGSERIAL        PRIMARY KEY,
  user_id        UUID             NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name           TEXT             NOT NULL,
  quantity       NUMERIC(10,3)    NOT NULL CHECK (quantity >= 0),
  unit           pantry_unit      NOT NULL DEFAULT 'g',
  category       pantry_category  NOT NULL DEFAULT 'Pantry',
  expiry_date    DATE,
  created_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE pantry_items IS
  'Per-user pantry inventory. expiry_date drives urgency labels in the UI (expired/urgent/soon/ok).';

CREATE TRIGGER trg_pantry_items_updated_at
  BEFORE UPDATE ON pantry_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_pantry_user_id  ON pantry_items (user_id);
CREATE INDEX idx_pantry_category ON pantry_items (user_id, category);
CREATE INDEX idx_pantry_expiry   ON pantry_items (user_id, expiry_date)
  WHERE expiry_date IS NOT NULL;          -- partial index: skip NULL-expiry rows
-- Case-insensitive name index for O(log n) pantry ↔ ingredient matching.
CREATE INDEX idx_pantry_name_lc  ON pantry_items (user_id, LOWER(name));


-- ============================================================
--  SECTION 8: MEAL PLANS
--
--  Fix #5: Replaced (week_start DATE, day day_of_week) with a
--  single plan_date DATE.  The old design stored the same date
--  twice — once as the Monday anchor and once as an enum offset —
--  forcing both columns to stay in sync and making queries
--  awkward.  With plan_date, the week is simply:
--    DATE_TRUNC('week', plan_date)::DATE
-- ============================================================

CREATE TABLE meal_plans (
  id          BIGSERIAL   PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Single source of truth for the date. Week derived as DATE_TRUNC('week', plan_date).
  plan_date   DATE        NOT NULL,
  meal_slot   meal_slot   NOT NULL,
  dish_id     BIGINT      REFERENCES dishes(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One dish per slot per date per user.
  UNIQUE (user_id, plan_date, meal_slot)
);

COMMENT ON TABLE meal_plans IS
  'Weekly meal grid. One row per (user, date, slot). Week is derived: DATE_TRUNC(''week'', plan_date).';
COMMENT ON COLUMN meal_plans.dish_id IS
  'NULL means the slot is empty. ON DELETE SET NULL preserves the slot row when a dish is deleted.';

CREATE TRIGGER trg_meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Primary access pattern: fetch one user's week.
CREATE INDEX idx_meal_plans_user_week ON meal_plans
  (user_id, DATE_TRUNC('week', plan_date));
CREATE INDEX idx_meal_plans_dish_id   ON meal_plans (dish_id);


-- ============================================================
--  SECTION 9: USER FOLLOWS
-- ============================================================

CREATE TABLE user_follows (
  follower_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT chk_no_self_follow CHECK (follower_id <> following_id)
);

COMMENT ON TABLE user_follows IS
  'Social follow graph. INSERT/DELETE triggers keep follower_count/following_count in sync on profiles.';

CREATE INDEX idx_follows_follower  ON user_follows (follower_id);
CREATE INDEX idx_follows_following ON user_follows (following_id);

-- Trigger: increment counters on follow.
CREATE OR REPLACE FUNCTION trg_follows_insert_fn()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public, pg_temp          -- fix #4
AS $$
BEGIN
  UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  UPDATE profiles SET follower_count  = follower_count  + 1 WHERE id = NEW.following_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_follows_insert
  AFTER INSERT ON user_follows
  FOR EACH ROW EXECUTE FUNCTION trg_follows_insert_fn();

-- Trigger: decrement counters on unfollow. GREATEST guards against underflow.
CREATE OR REPLACE FUNCTION trg_follows_delete_fn()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public, pg_temp          -- fix #4
AS $$
BEGIN
  UPDATE profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
  UPDATE profiles SET follower_count  = GREATEST(follower_count  - 1, 0) WHERE id = OLD.following_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_follows_delete
  AFTER DELETE ON user_follows
  FOR EACH ROW EXECUTE FUNCTION trg_follows_delete_fn();


-- ============================================================
--  SECTION 10: SHOPPING LIST ITEMS
--
--  Fix #7: source column removed. All persisted items are
--  user-created. Auto-derived items (meal plan ↔ pantry diff)
--  are computed at query time and never stored.
-- ============================================================

CREATE TABLE shopping_list_items (
  id           BIGSERIAL   PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  is_checked   BOOLEAN     NOT NULL DEFAULT FALSE,
  -- Optional link back to the dish that prompted this item.
  dish_id      BIGINT      REFERENCES dishes(id) ON DELETE SET NULL,
  -- week_start ties manual items to a specific week's plan.
  week_start   DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE shopping_list_items IS
  'Manually added shopping items only. Auto-derived items are computed via v_shopping_needed, not stored.';

CREATE TRIGGER trg_shopping_updated_at
  BEFORE UPDATE ON shopping_list_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_shopping_user_week ON shopping_list_items (user_id, week_start);


-- ============================================================
--  SECTION 11: AUTO-PROVISION ON SIGNUP
--
--  Fix #3: Added handle-collision guard — appends a 4-digit
--          random suffix and retries on unique violation.
--  Fix #4: SET search_path = public, pg_temp on all functions.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp          -- fix #4: prevent search_path injection
AS $$
DECLARE
  v_name    TEXT;
  v_handle  TEXT;
  v_initials TEXT;
  v_attempt INT := 0;
BEGIN
  v_name    := COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1));
  v_handle  := '@' || LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9_]', '_', 'g'));
  v_initials := UPPER(LEFT(v_name, 2));

  -- Fix #3: retry up to 5 times with a random 4-digit suffix on handle collision.
  LOOP
    BEGIN
      INSERT INTO profiles (id, name, handle, avatar_initials)
      VALUES (NEW.id, v_name, v_handle, v_initials);
      EXIT;   -- success — leave the loop
    EXCEPTION WHEN unique_violation THEN
      v_attempt := v_attempt + 1;
      IF v_attempt >= 5 THEN
        RAISE EXCEPTION 'Could not generate a unique handle for user % after 5 attempts', NEW.id;
      END IF;
      -- Append / replace suffix with new 4-digit random number.
      v_handle := REGEXP_REPLACE(v_handle, '_[0-9]+$', '')
                  || '_' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
    END;
  END LOOP;

  -- Seed default daily nutrient targets.
  INSERT INTO nutrient_targets
    (user_id, nutrient_name, target_value, unit, display_color, sort_order)
  VALUES
    (NEW.id, 'Calories', 2000, 'kcal', '#D4724A', 1),
    (NEW.id, 'Protein',    80, 'g',    '#6B8F71', 2),
    (NEW.id, 'Carbs',     250, 'g',    '#C9A84C', 3),
    (NEW.id, 'Fat',        70, 'g',    '#9B7EBD', 4),
    (NEW.id, 'Fiber',      35, 'g',    '#4AADBC', 5);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================
--  SECTION 12: ROW LEVEL SECURITY (RLS)
--
--  Fix #2: INSERT policies now use WITH CHECK (not USING).
--  Fix #12: GRANT statements added after policies so PostgREST
--           can reach tables via the anon / authenticated roles.
-- ============================================================

ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrient_targets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE dish_ingredients    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows        ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;


-- ── profiles ──────────────────────────────────────────────
CREATE POLICY "profiles: select public or own"
  ON profiles FOR SELECT
  USING (public_profile = TRUE OR id = auth.uid());

-- Fix #2: INSERT must use WITH CHECK.
CREATE POLICY "profiles: insert own"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles: update own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles: delete own"
  ON profiles FOR DELETE
  USING (id = auth.uid());


-- ── nutrient_targets ──────────────────────────────────────
CREATE POLICY "nutrient_targets: select own"
  ON nutrient_targets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "nutrient_targets: insert own"
  ON nutrient_targets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "nutrient_targets: update own"
  ON nutrient_targets FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "nutrient_targets: delete own"
  ON nutrient_targets FOR DELETE
  USING (user_id = auth.uid());


-- ── dishes ────────────────────────────────────────────────
-- All authenticated users can read dishes (social "View Dishes").
CREATE POLICY "dishes: select authenticated"
  ON dishes FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "dishes: insert own"
  ON dishes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "dishes: update own"
  ON dishes FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "dishes: delete own"
  ON dishes FOR DELETE
  USING (user_id = auth.uid());


-- ── dish_ingredients ──────────────────────────────────────
-- Readable by all authenticated users (same visibility as parent dish).
CREATE POLICY "dish_ingredients: select authenticated"
  ON dish_ingredients FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "dish_ingredients: write own"
  ON dish_ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dishes
      WHERE dishes.id = dish_ingredients.dish_id
        AND dishes.user_id = auth.uid()
    )
  );

CREATE POLICY "dish_ingredients: update own"
  ON dish_ingredients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dishes
      WHERE dishes.id = dish_ingredients.dish_id
        AND dishes.user_id = auth.uid()
    )
  );

CREATE POLICY "dish_ingredients: delete own"
  ON dish_ingredients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dishes
      WHERE dishes.id = dish_ingredients.dish_id
        AND dishes.user_id = auth.uid()
    )
  );


-- ── pantry_items ──────────────────────────────────────────
CREATE POLICY "pantry_items: select own"
  ON pantry_items FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "pantry_items: insert own"
  ON pantry_items FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "pantry_items: update own"
  ON pantry_items FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "pantry_items: delete own"
  ON pantry_items FOR DELETE
  USING (user_id = auth.uid());


-- ── meal_plans ────────────────────────────────────────────
CREATE POLICY "meal_plans: select own"
  ON meal_plans FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "meal_plans: insert own"
  ON meal_plans FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "meal_plans: update own"
  ON meal_plans FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "meal_plans: delete own"
  ON meal_plans FOR DELETE
  USING (user_id = auth.uid());


-- ── user_follows ──────────────────────────────────────────
-- All authenticated users can read the follow graph (for social counts + "is following" state).
CREATE POLICY "user_follows: select authenticated"
  ON user_follows FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "user_follows: insert own"
  ON user_follows FOR INSERT
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "user_follows: delete own"
  ON user_follows FOR DELETE
  USING (follower_id = auth.uid());


-- ── shopping_list_items ───────────────────────────────────
CREATE POLICY "shopping_list_items: select own"
  ON shopping_list_items FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "shopping_list_items: insert own"
  ON shopping_list_items FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "shopping_list_items: update own"
  ON shopping_list_items FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "shopping_list_items: delete own"
  ON shopping_list_items FOR DELETE
  USING (user_id = auth.uid());


-- ── Fix #12: GRANT to Supabase roles ─────────────────────
-- Without these, PostgREST returns 403 even with correct RLS.
-- 'anon' covers unauthenticated requests (e.g. public profile reads).
-- 'authenticated' covers all logged-in users.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT                         ON profiles            TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles            TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON nutrient_targets    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON dishes              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON dish_ingredients    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pantry_items        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON meal_plans          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_follows        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON shopping_list_items TO authenticated;

-- Grant sequence usage so BIGSERIAL columns can auto-increment.
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;


-- ============================================================
--  SECTION 13: VIEWS
--
--  Fix #13: WITH (security_invoker = true) makes RLS apply using
--  the calling user's identity, not the view owner's.
--  This is the safe default and must be explicit.
-- ============================================================

-- v_dish_full — dish with ingredients pre-aggregated.
CREATE VIEW v_dish_full
  WITH (security_invoker = true)
AS
SELECT
  d.*,
  COALESCE(
    ARRAY_AGG(di.ingredient_name ORDER BY di.sort_order)
      FILTER (WHERE di.type = 'required'),
    '{}'
  ) AS req_ingredients,
  COALESCE(
    ARRAY_AGG(di.ingredient_name ORDER BY di.sort_order)
      FILTER (WHERE di.type = 'optional'),
    '{}'
  ) AS opt_ingredients
FROM dishes d
LEFT JOIN dish_ingredients di ON di.dish_id = d.id
GROUP BY d.id;

COMMENT ON VIEW v_dish_full IS
  'Dishes with ingredients aggregated into arrays. Use for single-query dish detail fetches.';


-- v_pantry_expiry_status — pantry items with UI urgency label.
CREATE VIEW v_pantry_expiry_status
  WITH (security_invoker = true)
AS
SELECT
  *,
  CASE
    WHEN expiry_date IS NULL              THEN 'no_date'
    WHEN expiry_date < CURRENT_DATE       THEN 'expired'
    WHEN expiry_date < CURRENT_DATE + 3   THEN 'urgent'
    WHEN expiry_date < CURRENT_DATE + 7   THEN 'soon'
    ELSE                                       'ok'
  END AS expiry_status,
  -- Days until expiry as a convenience column (negative = already expired).
  (expiry_date - CURRENT_DATE) AS days_until_expiry
FROM pantry_items;

COMMENT ON VIEW v_pantry_expiry_status IS
  'Pantry items with a computed expiry_status and days_until_expiry. Mirrors UI urgency logic.';


-- v_weekly_plan — meal plan joined to dish details for a week view.
-- Fix #5: uses plan_date; week_start derived inline.
CREATE VIEW v_weekly_plan
  WITH (security_invoker = true)
AS
SELECT
  mp.user_id,
  DATE_TRUNC('week', mp.plan_date)::DATE  AS week_start,
  mp.plan_date,
  TO_CHAR(mp.plan_date, 'Dy')             AS day_label,   -- 'Mon', 'Tue', …
  mp.meal_slot,
  d.id          AS dish_id,
  d.name        AS dish_name,
  d.img_emoji,
  d.cal,
  d.protein_g,
  d.carbs_g,
  d.fat_g,
  d.fiber_g
FROM meal_plans mp
LEFT JOIN dishes d ON d.id = mp.dish_id;

COMMENT ON VIEW v_weekly_plan IS
  'Meal plan joined to dish details. week_start and day_label are derived from plan_date.';


-- v_shopping_needed — computes the auto-derived "items to buy" list.
-- This view replaces the concept of storing auto shopping items in the DB.
-- Fix #7: auto-derived items are queried, never persisted.
CREATE VIEW v_shopping_needed
  WITH (security_invoker = true)
AS
SELECT
  di.ingredient_name,
  di.type,
  d.id   AS dish_id,
  d.name AS dish_name,
  mp.plan_date,
  DATE_TRUNC('week', mp.plan_date)::DATE AS week_start,
  mp.user_id,
  -- in_pantry = TRUE means the item does NOT need to be bought.
  EXISTS (
    SELECT 1 FROM pantry_items pi
    WHERE pi.user_id = mp.user_id
      AND LOWER(pi.name) = LOWER(di.ingredient_name)
  ) AS in_pantry
FROM meal_plans mp
JOIN dishes d             ON d.id  = mp.dish_id
JOIN dish_ingredients di  ON di.dish_id = d.id
WHERE mp.dish_id IS NOT NULL;

COMMENT ON VIEW v_shopping_needed IS
  'Auto-derived shopping list. Join with WHERE in_pantry = FALSE to get items still needed to buy.';


-- Grant view access.
GRANT SELECT ON v_dish_full             TO authenticated;
GRANT SELECT ON v_pantry_expiry_status  TO authenticated;
GRANT SELECT ON v_weekly_plan           TO authenticated;
GRANT SELECT ON v_shopping_needed       TO authenticated;


-- ============================================================
--  DONE.
--
--  Tables (8):
--    profiles              — user identity, social counts, settings
--    nutrient_targets      — per-user daily macro goals
--    dishes                — recipe / dish database
--    dish_ingredients      — required / optional ingredients
--    pantry_items          — pantry inventory with expiry
--    meal_plans            — weekly meal grid (plan_date based)
--    user_follows          — social follow graph
--    shopping_list_items   — user-created manual shopping items
--
--  Views (4):
--    v_dish_full           — dish + aggregated ingredients
--    v_pantry_expiry_status — pantry + urgency label
--    v_weekly_plan         — meal plan + dish details
--    v_shopping_needed     — auto-derived shopping list
-- ============================================================
