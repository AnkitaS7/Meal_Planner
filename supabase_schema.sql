-- ============================================================
--  MISE EN PLACE — Supabase Database Schema
--  Run this entire script in the Supabase SQL Editor.
--  Supabase Auth handles authentication; this schema builds
--  on top of auth.users for all app-level data.
-- ============================================================


-- ============================================================
--  SECTION 1: ENUM TYPES
-- ============================================================

CREATE TYPE meal_slot AS ENUM (
  'Breakfast', 'Lunch', 'Dinner', 'Snack'
);

CREATE TYPE day_of_week AS ENUM (
  'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
);

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

CREATE TYPE shopping_item_source AS ENUM ('auto', 'manual');


-- ============================================================
--  SECTION 2: HELPER — updated_at auto-trigger
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- ============================================================
--  SECTION 3: PROFILES
--  One row per auth user. Extended identity & social counts.
--  follower_count / following_count are maintained by triggers
--  on user_follows (see Section 9).
-- ============================================================

CREATE TABLE profiles (
  id                UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT        NOT NULL,
  handle            TEXT        NOT NULL UNIQUE,          -- e.g. "@aria.cooks"
  avatar_initials   CHAR(2)     NOT NULL DEFAULT 'AA',    -- 2-letter fallback avatar
  avatar_url        TEXT,                                 -- optional uploaded photo URL
  bio               TEXT,
  dietary_prefs     dietary_preference[]  NOT NULL DEFAULT '{}',
  follower_count    INT         NOT NULL DEFAULT 0 CHECK (follower_count  >= 0),
  following_count   INT         NOT NULL DEFAULT 0 CHECK (following_count >= 0),
  -- Settings toggles (Profile page)
  notif_email       BOOLEAN     NOT NULL DEFAULT TRUE,
  public_profile    BOOLEAN     NOT NULL DEFAULT TRUE,
  nutrition_track   BOOLEAN     NOT NULL DEFAULT TRUE,
  weekly_digest     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Fast handle look-up (login / @mention search)
CREATE UNIQUE INDEX idx_profiles_handle ON profiles (LOWER(handle));


-- ============================================================
--  SECTION 4: NUTRIENT TARGETS
--  Per-user daily macro/micro goals shown on the Nutrients page.
--  Seeded with sensible defaults on profile creation (see trigger
--  at bottom of this file).
-- ============================================================

CREATE TABLE nutrient_targets (
  id             BIGSERIAL   PRIMARY KEY,
  user_id        UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nutrient_name  TEXT        NOT NULL,   -- 'Calories', 'Protein', 'Carbs', 'Fat', 'Fiber'
  target_value   NUMERIC(8,2) NOT NULL CHECK (target_value > 0),
  unit           TEXT        NOT NULL,   -- 'kcal', 'g'
  display_color  CHAR(7)     NOT NULL DEFAULT '#6B8F71',  -- hex e.g. "#D4724A"
  sort_order     SMALLINT    NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, nutrient_name)
);

CREATE TRIGGER trg_nutrient_targets_updated_at
  BEFORE UPDATE ON nutrient_targets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_nutrient_targets_user ON nutrient_targets (user_id);


-- ============================================================
--  SECTION 5: DISHES
--  The core recipe/dish database. Each dish belongs to one user.
-- ============================================================

CREATE TABLE dishes (
  id             BIGSERIAL      PRIMARY KEY,
  user_id        UUID           NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name           TEXT           NOT NULL,
  category       dish_category  NOT NULL,
  cook_time_min  SMALLINT       NOT NULL DEFAULT 30 CHECK (cook_time_min > 0),
  servings       SMALLINT       NOT NULL DEFAULT 2  CHECK (servings > 0),
  tags           TEXT[]         NOT NULL DEFAULT '{}',  -- ['vegan', 'gluten-free', …]
  img_emoji      TEXT           NOT NULL DEFAULT '🍽',
  recipe_text    TEXT,
  youtube_url    TEXT,
  -- Nutritional info per serving
  cal            NUMERIC(7,2)   NOT NULL DEFAULT 0 CHECK (cal    >= 0),
  protein_g      NUMERIC(6,2)   NOT NULL DEFAULT 0 CHECK (protein_g >= 0),
  carbs_g        NUMERIC(6,2)   NOT NULL DEFAULT 0 CHECK (carbs_g   >= 0),
  fat_g          NUMERIC(6,2)   NOT NULL DEFAULT 0 CHECK (fat_g     >= 0),
  fiber_g        NUMERIC(6,2)   NOT NULL DEFAULT 0 CHECK (fiber_g   >= 0),
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_dishes_updated_at
  BEFORE UPDATE ON dishes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Queries: all dishes by user, filter by category, full-text search
CREATE INDEX idx_dishes_user_id  ON dishes (user_id);
CREATE INDEX idx_dishes_category ON dishes (user_id, category);
CREATE INDEX idx_dishes_fts      ON dishes USING GIN (to_tsvector('english', name));


-- ============================================================
--  SECTION 6: DISH INGREDIENTS
--  Separate rows for required vs optional ingredients so they
--  can be queried independently for shopping list generation
--  and pantry matching.
-- ============================================================

CREATE TABLE dish_ingredients (
  id              BIGSERIAL        PRIMARY KEY,
  dish_id         BIGINT           NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  ingredient_name TEXT             NOT NULL,
  type            ingredient_type  NOT NULL DEFAULT 'required',
  sort_order      SMALLINT         NOT NULL DEFAULT 0
);

CREATE INDEX idx_dish_ingredients_dish    ON dish_ingredients (dish_id);
CREATE INDEX idx_dish_ingredients_type    ON dish_ingredients (dish_id, type);
-- Lower-case index for pantry matching (case-insensitive comparison)
CREATE INDEX idx_dish_ingredients_name_lc ON dish_ingredients (LOWER(ingredient_name));


-- ============================================================
--  SECTION 7: PANTRY ITEMS
--  Per-user pantry inventory. Expiry date drives colour-coded
--  urgency labels in the UI.
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

CREATE TRIGGER trg_pantry_items_updated_at
  BEFORE UPDATE ON pantry_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_pantry_user_id    ON pantry_items (user_id);
CREATE INDEX idx_pantry_category   ON pantry_items (user_id, category);
CREATE INDEX idx_pantry_expiry     ON pantry_items (user_id, expiry_date);
-- Lower-case index for O(log n) pantry ↔ ingredient matching
CREATE INDEX idx_pantry_name_lc    ON pantry_items (user_id, LOWER(name));


-- ============================================================
--  SECTION 8: MEAL PLANS
--  One row per meal slot per day per week per user.
--  week_start is always a Monday (enforced by CHECK).
-- ============================================================

CREATE TABLE meal_plans (
  id             BIGSERIAL    PRIMARY KEY,
  user_id        UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start     DATE         NOT NULL,   -- always a Monday
  day            day_of_week  NOT NULL,
  meal_slot      meal_slot    NOT NULL,
  dish_id        BIGINT       REFERENCES dishes(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  -- Only one dish per slot per day per week per user
  UNIQUE (user_id, week_start, day, meal_slot),
  -- Ensure week_start is always a Monday (DOW = 1 in PostgreSQL)
  CONSTRAINT chk_week_start_is_monday CHECK (EXTRACT(DOW FROM week_start) = 1)
);

CREATE TRIGGER trg_meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_meal_plans_user_week ON meal_plans (user_id, week_start);
CREATE INDEX idx_meal_plans_dish_id   ON meal_plans (dish_id);


-- ============================================================
--  SECTION 9: USER FOLLOWS
--  Tracks who follows whom (social feature).
--  Triggers keep follower_count / following_count in sync.
-- ============================================================

CREATE TABLE user_follows (
  follower_id  UUID  NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID  NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  -- Can't follow yourself
  CONSTRAINT chk_no_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX idx_follows_follower  ON user_follows (follower_id);
CREATE INDEX idx_follows_following ON user_follows (following_id);

-- Trigger: increment counters on INSERT
CREATE OR REPLACE FUNCTION trg_follows_insert_fn()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  UPDATE profiles SET follower_count  = follower_count  + 1 WHERE id = NEW.following_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_follows_insert
  AFTER INSERT ON user_follows
  FOR EACH ROW EXECUTE FUNCTION trg_follows_insert_fn();

-- Trigger: decrement counters on DELETE
CREATE OR REPLACE FUNCTION trg_follows_delete_fn()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
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
--  Stores user-added manual items only.
--  Auto-derived items (from meal plan ↔ pantry diff) are
--  computed at query time — no need to persist them.
-- ============================================================

CREATE TABLE shopping_list_items (
  id           BIGSERIAL             PRIMARY KEY,
  user_id      UUID                  NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         TEXT                  NOT NULL,
  is_checked   BOOLEAN               NOT NULL DEFAULT FALSE,
  source       shopping_item_source  NOT NULL DEFAULT 'manual',
  -- Optional: link back to the dish that generated this item (for auto items)
  dish_id      BIGINT                REFERENCES dishes(id) ON DELETE SET NULL,
  week_start   DATE,
  created_at   TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_shopping_updated_at
  BEFORE UPDATE ON shopping_list_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_shopping_user_week ON shopping_list_items (user_id, week_start);


-- ============================================================
--  SECTION 11: AUTO-PROVISION NEW USER DATA
--  When Supabase Auth creates a new user, automatically:
--    1. Insert a skeleton profile row
--    2. Seed the 5 default nutrient targets
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- 1. Create profile (name falls back to email prefix if not supplied)
  INSERT INTO profiles (id, name, handle, avatar_initials)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    '@' || LOWER(REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', '_')),
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 2))
  );

  -- 2. Seed default daily nutrient targets
  INSERT INTO nutrient_targets (user_id, nutrient_name, target_value, unit, display_color, sort_order)
  VALUES
    (NEW.id, 'Calories', 2000,  'kcal', '#D4724A', 1),
    (NEW.id, 'Protein',    80,  'g',    '#6B8F71', 2),
    (NEW.id, 'Carbs',     250,  'g',    '#C9A84C', 3),
    (NEW.id, 'Fat',        70,  'g',    '#9B7EBD', 4),
    (NEW.id, 'Fiber',      35,  'g',    '#4AADBC', 5);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================
--  SECTION 12: ROW LEVEL SECURITY (RLS)
--  All tables are private-by-default. Each user can only
--  read and write their own rows.
--  user_follows has an additional public-read policy so the
--  social/discover feature can show follower counts.
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
-- Public profiles are readable by all authenticated users
-- (needed for social / discover).
CREATE POLICY "profiles: public read"
  ON profiles FOR SELECT
  USING (public_profile = TRUE OR id = auth.uid());

CREATE POLICY "profiles: owner write"
  ON profiles FOR ALL
  USING (id = auth.uid());

-- ── nutrient_targets ──────────────────────────────────────
CREATE POLICY "nutrient_targets: owner only"
  ON nutrient_targets FOR ALL
  USING (user_id = auth.uid());

-- ── dishes ────────────────────────────────────────────────
-- Dish list is readable by all authenticated users so that
-- social "View Dishes" feature works across accounts.
CREATE POLICY "dishes: authenticated read"
  ON dishes FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "dishes: owner write"
  ON dishes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "dishes: owner update"
  ON dishes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "dishes: owner delete"
  ON dishes FOR DELETE
  USING (user_id = auth.uid());

-- ── dish_ingredients ──────────────────────────────────────
-- Readable by anyone who can read the parent dish.
CREATE POLICY "dish_ingredients: authenticated read"
  ON dish_ingredients FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "dish_ingredients: owner write"
  ON dish_ingredients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM dishes
      WHERE dishes.id = dish_ingredients.dish_id
        AND dishes.user_id = auth.uid()
    )
  );

-- ── pantry_items ──────────────────────────────────────────
CREATE POLICY "pantry_items: owner only"
  ON pantry_items FOR ALL
  USING (user_id = auth.uid());

-- ── meal_plans ────────────────────────────────────────────
CREATE POLICY "meal_plans: owner only"
  ON meal_plans FOR ALL
  USING (user_id = auth.uid());

-- ── user_follows ──────────────────────────────────────────
-- Anyone authenticated can read follows (for follower counts
-- and "is following" state in the discover feed).
CREATE POLICY "user_follows: authenticated read"
  ON user_follows FOR SELECT
  TO authenticated
  USING (TRUE);

-- Only the follower themselves can insert / delete their own follows.
CREATE POLICY "user_follows: follower insert"
  ON user_follows FOR INSERT
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "user_follows: follower delete"
  ON user_follows FOR DELETE
  USING (follower_id = auth.uid());

-- ── shopping_list_items ───────────────────────────────────
CREATE POLICY "shopping_list_items: owner only"
  ON shopping_list_items FOR ALL
  USING (user_id = auth.uid());


-- ============================================================
--  SECTION 13: USEFUL VIEWS
-- ============================================================

-- v_dish_full — dishes with their ingredients pre-aggregated
-- so the frontend can fetch everything in one query.
CREATE VIEW v_dish_full AS
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

-- v_pantry_expiry_status — adds a computed urgency label
-- mirroring the UI colour logic (expired / urgent / soon / ok).
CREATE VIEW v_pantry_expiry_status AS
SELECT
  *,
  CASE
    WHEN expiry_date IS NULL             THEN 'no_date'
    WHEN expiry_date < CURRENT_DATE      THEN 'expired'
    WHEN expiry_date < CURRENT_DATE + 3  THEN 'urgent'
    WHEN expiry_date < CURRENT_DATE + 7  THEN 'soon'
    ELSE                                      'ok'
  END AS expiry_status
FROM pantry_items;

-- v_weekly_plan — joins meal_plan → dish for a full week view.
CREATE VIEW v_weekly_plan AS
SELECT
  mp.user_id,
  mp.week_start,
  mp.day,
  mp.meal_slot,
  d.id           AS dish_id,
  d.name         AS dish_name,
  d.img_emoji,
  d.cal,
  d.protein_g,
  d.carbs_g,
  d.fat_g,
  d.fiber_g
FROM meal_plans mp
LEFT JOIN dishes d ON d.id = mp.dish_id;


-- ============================================================
--  DONE.
--  Table summary:
--    profiles            — user identity & settings
--    nutrient_targets    — per-user daily macro goals
--    dishes              — recipe database
--    dish_ingredients    — required / optional ingredients
--    pantry_items        — pantry inventory
--    meal_plans          — weekly meal grid
--    user_follows        — social follow graph
--    shopping_list_items — manual shopping list items
-- ============================================================
