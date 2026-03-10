-- ============================================================
--  MISE EN PLACE — Mock Data Seed Script
--
--  Run this in the Supabase SQL Editor (runs as postgres role,
--  which has permission to write directly to auth.users).
--
--  Inserts:
--    7 users  (1 primary + 6 social community users)
--    6 dishes (all owned by primary user Aria)
--   38 dish ingredients (required + optional)
--   12 pantry items
--   12 meal plan entries (Mon–Wed of current week)
--    4 user follows (Aria follows 3 users; 2 users follow Aria)
--    3 shopping list items (manual extras)
--
--  Strategy:
--    1. Insert into auth.users  → on_auth_user_created trigger
--       fires automatically and creates profiles + nutrient_targets
--    2. UPDATE profiles to set correct names, handles, bios, etc.
--    3. INSERT dishes, ingredients, pantry, meal_plans, follows,
--       shopping items.
--
--  Safe to re-run: wrapped in a transaction that rolls back fully
--  on any error. To wipe and reseed, run the teardown block at
--  the bottom first.
-- ============================================================

BEGIN;

-- ============================================================
--  STEP 1: DECLARE FIXED UUIDs
--  Using fixed UUIDs makes the script reproducible and allows
--  all foreign-key references to be written inline.
-- ============================================================

DO $$ BEGIN
  -- Verify no users already exist with these IDs to prevent
  -- accidental double-seeding.
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE id IN (
      'aaaaaaaa-0001-0001-0001-000000000001',
      'aaaaaaaa-0002-0002-0002-000000000002',
      'aaaaaaaa-0003-0003-0003-000000000003',
      'aaaaaaaa-0004-0004-0004-000000000004',
      'aaaaaaaa-0005-0005-0005-000000000005',
      'aaaaaaaa-0006-0006-0006-000000000006',
      'aaaaaaaa-0007-0007-0007-000000000007'
    )
  ) THEN
    RAISE EXCEPTION
      'Mock users already exist. Run the teardown block at the '
      'bottom of this file first, then re-run.';
  END IF;
END $$;


-- ============================================================
--  STEP 2: CREATE AUTH USERS
--  Inserting here fires the on_auth_user_created trigger which
--  auto-creates the profiles row and seeds nutrient_targets.
--  We override those defaults in STEP 3.
-- ============================================================

INSERT INTO auth.users (
  id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, aud, role
)
VALUES
  -- Primary user
  (
    'aaaaaaaa-0001-0001-0001-000000000001',
    'aria@miseonplace.app',
    crypt('MockPass123!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"name": "Aria Fontaine"}'::jsonb,
    'authenticated', 'authenticated'
  ),
  -- Social community users
  (
    'aaaaaaaa-0002-0002-0002-000000000002',
    'marco@miseonplace.app',
    crypt('MockPass123!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"name": "Marco Delgado"}'::jsonb,
    'authenticated', 'authenticated'
  ),
  (
    'aaaaaaaa-0003-0003-0003-000000000003',
    'priya@miseonplace.app',
    crypt('MockPass123!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"name": "Priya Sharma"}'::jsonb,
    'authenticated', 'authenticated'
  ),
  (
    'aaaaaaaa-0004-0004-0004-000000000004',
    'lena@miseonplace.app',
    crypt('MockPass123!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"name": "Lena Fischer"}'::jsonb,
    'authenticated', 'authenticated'
  ),
  (
    'aaaaaaaa-0005-0005-0005-000000000005',
    'james@miseonplace.app',
    crypt('MockPass123!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"name": "James Okafor"}'::jsonb,
    'authenticated', 'authenticated'
  ),
  (
    'aaaaaaaa-0006-0006-0006-000000000006',
    'sofia@miseonplace.app',
    crypt('MockPass123!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"name": "Sofía Reyes"}'::jsonb,
    'authenticated', 'authenticated'
  ),
  (
    'aaaaaaaa-0007-0007-0007-000000000007',
    'kira@miseonplace.app',
    crypt('MockPass123!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"name": "Kira Tanaka"}'::jsonb,
    'authenticated', 'authenticated'
  );

-- ============================================================
--  STEP 3: UPDATE PROFILES
--  The trigger created skeleton rows. We now set the correct
--  handles, bios, avatars, dietary prefs, and social counts.
--  Follower/following counts will be set by triggers in STEP 7,
--  but we pre-set them here for the social community users
--  who won't have follows inserted (they are already established
--  cooks with existing audiences).
-- ============================================================

UPDATE profiles SET
  name             = 'Aria Fontaine',
  handle           = '@aria.cooks',
  avatar_initials  = 'AF',
  bio              = 'Plant-forward cooking enthusiast • Home chef • Nutrition nerd',
  dietary_prefs    = ARRAY['Vegetarian','Gluten-free']::dietary_preference[],
  public_profile   = TRUE,
  nutrition_track  = TRUE,
  notif_email      = TRUE,
  weekly_digest    = FALSE
WHERE id = 'aaaaaaaa-0001-0001-0001-000000000001';

UPDATE profiles SET
  name             = 'Marco Delgado',
  handle           = '@marco.eats',
  avatar_initials  = 'MD',
  bio              = 'Street food lover and breakfast obsessive. Madrid → NYC.',
  dietary_prefs    = ARRAY[]::dietary_preference[],
  follower_count   = 1204,
  following_count  = 312,
  public_profile   = TRUE
WHERE id = 'aaaaaaaa-0002-0002-0002-000000000002';

UPDATE profiles SET
  name             = 'Priya Sharma',
  handle           = '@priyacooks',
  avatar_initials  = 'PS',
  bio              = 'Bringing South Asian flavours to everyday cooking. Food writer & recipe developer.',
  dietary_prefs    = ARRAY['Vegetarian']::dietary_preference[],
  follower_count   = 3891,
  following_count  = 204,
  public_profile   = TRUE
WHERE id = 'aaaaaaaa-0003-0003-0003-000000000003';

UPDATE profiles SET
  name             = 'Lena Fischer',
  handle           = '@lenaf',
  avatar_initials  = 'LF',
  bio              = 'Pastry chef by training, home cook by heart. Berlin.',
  dietary_prefs    = ARRAY[]::dietary_preference[],
  follower_count   = 672,
  following_count  = 189,
  public_profile   = TRUE
WHERE id = 'aaaaaaaa-0004-0004-0004-000000000004';

UPDATE profiles SET
  name             = 'James Okafor',
  handle           = '@jameskitchen',
  avatar_initials  = 'JO',
  bio              = 'West African cuisine, reimagined. Lagos → London.',
  dietary_prefs    = ARRAY[]::dietary_preference[],
  follower_count   = 289,
  following_count  = 97,
  public_profile   = TRUE
WHERE id = 'aaaaaaaa-0005-0005-0005-000000000005';

UPDATE profiles SET
  name             = 'Sofía Reyes',
  handle           = '@sofiaeats',
  avatar_initials  = 'SR',
  bio              = 'Taco Tuesdays every day. Mexican home cooking & street food.',
  dietary_prefs    = ARRAY[]::dietary_preference[],
  follower_count   = 5021,
  following_count  = 431,
  public_profile   = TRUE
WHERE id = 'aaaaaaaa-0006-0006-0006-000000000006';

UPDATE profiles SET
  name             = 'Kira Tanaka',
  handle           = '@kiracooks',
  avatar_initials  = 'KT',
  bio              = 'Japanese home cooking. Ramen, ramen, and more ramen.',
  dietary_prefs    = ARRAY['Dairy-free']::dietary_preference[],
  follower_count   = 988,
  following_count  = 267,
  public_profile   = TRUE
WHERE id = 'aaaaaaaa-0007-0007-0007-000000000007';


-- ============================================================
--  STEP 4: UPDATE NUTRIENT TARGETS FOR PRIMARY USER
--  Trigger seeded defaults (2000/80/250/70/35). Aria's actual
--  targets are slightly adjusted for her activity level.
-- ============================================================

UPDATE nutrient_targets SET target_value = 1950 WHERE user_id = 'aaaaaaaa-0001-0001-0001-000000000001' AND nutrient_name = 'Calories';
UPDATE nutrient_targets SET target_value = 75   WHERE user_id = 'aaaaaaaa-0001-0001-0001-000000000001' AND nutrient_name = 'Protein';
UPDATE nutrient_targets SET target_value = 240  WHERE user_id = 'aaaaaaaa-0001-0001-0001-000000000001' AND nutrient_name = 'Carbs';
UPDATE nutrient_targets SET target_value = 65   WHERE user_id = 'aaaaaaaa-0001-0001-0001-000000000001' AND nutrient_name = 'Fat';
UPDATE nutrient_targets SET target_value = 32   WHERE user_id = 'aaaaaaaa-0001-0001-0001-000000000001' AND nutrient_name = 'Fiber';


-- ============================================================
--  STEP 5: DISHES  (all owned by Aria)
--  NOTE: total_time_min is a GENERATED ALWAYS AS column —
--  do NOT include it in the INSERT column list. PostgreSQL
--  computes it automatically from prep_time_min + cook_time_min.
-- ============================================================

INSERT INTO dishes (
  id, user_id,
  name, category, prep_time_min, cook_time_min, servings,
  tags, img_emoji, recipe_text, youtube_url,
  cal, protein_g, carbs_g, fat_g, fiber_g
)
VALUES

  -- Dish 1: Roasted Tomato Bisque
  (
    1,
    'aaaaaaaa-0001-0001-0001-000000000001',
    'Roasted Tomato Bisque',
    'Soup',
    10, 35, 4,
    ARRAY['vegan','gluten-free'],
    '🍅',
    'Roast roma tomatoes and garlic at 400°F for 25 min until caramelised. '
    'Transfer to blender with vegetable broth, blend until smooth. '
    'Pour into pot, stir in heavy cream and fresh basil. '
    'Season generously with salt, pepper and a pinch of sugar.',
    NULL,
    210, 5, 28, 9, 4
  ),

  -- Dish 2: Mushroom Risotto
  (
    2,
    'aaaaaaaa-0001-0001-0001-000000000001',
    'Mushroom Risotto',
    'Main',
    15, 45, 2,
    ARRAY['vegetarian','gluten-free'],
    '🍄',
    'Sauté shallots in butter until translucent. Add arborio rice, toast 2 min. '
    'Deglaze with white wine. Add warm vegetable broth one ladle at a time, '
    'stirring continuously until absorbed. Fold in sautéed mushrooms and parmesan. '
    'Rest 2 min before serving.',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    520, 14, 72, 16, 3
  ),

  -- Dish 3: Avocado Toast Deluxe
  (
    3,
    'aaaaaaaa-0001-0001-0001-000000000001',
    'Avocado Toast Deluxe',
    'Breakfast',
    10, 0, 1,
    ARRAY['vegan'],
    '🥑',
    'Toast sourdough until golden. Mash ripe avocado with lemon juice, sea salt '
    'and black pepper. Spread generously on toast. Finish with chili flakes, '
    'microgreens and a drizzle of olive oil.',
    NULL,
    340, 9, 31, 22, 9
  ),

  -- Dish 4: Greek Salad Bowl
  (
    4,
    'aaaaaaaa-0001-0001-0001-000000000001',
    'Greek Salad Bowl',
    'Salad',
    15, 0, 2,
    ARRAY['vegetarian','gluten-free'],
    '🥗',
    'Chop cucumber, cherry tomatoes, bell pepper and red onion into chunky pieces. '
    'Add kalamata olives and generous cubes of feta. Dress with extra-virgin olive oil, '
    'red wine vinegar, dried oregano, salt and pepper.',
    NULL,
    280, 8, 18, 21, 4
  ),

  -- Dish 5: Lemon Herb Quinoa
  (
    5,
    'aaaaaaaa-0001-0001-0001-000000000001',
    'Lemon Herb Quinoa',
    'Side',
    5, 20, 3,
    ARRAY['vegan','gluten-free'],
    '🌾',
    'Rinse quinoa thoroughly. Cook in vegetable broth (1:2 ratio) for 15 min, covered. '
    'Fluff with fork and cool slightly. Toss with lemon zest, lemon juice, olive oil, '
    'fresh parsley and mint. Season to taste.',
    NULL,
    185, 7, 32, 5, 4
  ),

  -- Dish 6: Shakshuka
  (
    6,
    'aaaaaaaa-0001-0001-0001-000000000001',
    'Shakshuka',
    'Breakfast',
    10, 25, 2,
    ARRAY['vegetarian','gluten-free'],
    '🍳',
    'Sauté onion and red pepper in olive oil. Add garlic, cumin, paprika and chilli. '
    'Pour in crushed tomatoes, simmer 10 min. Make wells, crack in eggs. '
    'Cover and cook until whites are set. Garnish with feta and parsley.',
    NULL,
    290, 16, 22, 14, 5
  );

-- Reset the sequence so future inserts don't clash with our explicit IDs.
SELECT setval('dishes_id_seq', (SELECT MAX(id) FROM dishes));


-- ============================================================
--  STEP 6: DISH INGREDIENTS
--  type: 'required' | 'optional'   (ingredient_type enum)
--  sort_order determines display order in the UI.
-- ============================================================

INSERT INTO dish_ingredients (dish_id, ingredient_name, type, sort_order) VALUES

  -- ── Roasted Tomato Bisque (id=1) ──────────────────────
  (1, 'Roma tomatoes',    'required', 1),
  (1, 'Vegetable broth',  'required', 2),
  (1, 'Garlic',           'required', 3),
  (1, 'Heavy cream',      'required', 4),
  (1, 'Fresh basil',      'optional', 1),
  (1, 'Parmesan',         'optional', 2),

  -- ── Mushroom Risotto (id=2) ───────────────────────────
  (2, 'Arborio rice',     'required', 1),
  (2, 'Mixed mushrooms',  'required', 2),
  (2, 'Parmesan',         'required', 3),
  (2, 'White wine',       'required', 4),
  (2, 'Shallots',         'required', 5),
  (2, 'Vegetable broth',  'required', 6),
  (2, 'Truffle oil',      'optional', 1),
  (2, 'Fresh thyme',      'optional', 2),

  -- ── Avocado Toast Deluxe (id=3) ───────────────────────
  (3, 'Sourdough bread',          'required', 1),
  (3, 'Avocado',                  'required', 2),
  (3, 'Lemon',                    'required', 3),
  (3, 'Microgreens',              'optional', 1),
  (3, 'Chili flakes',             'optional', 2),
  (3, 'Everything bagel seasoning','optional', 3),

  -- ── Greek Salad Bowl (id=4) ───────────────────────────
  (4, 'Cucumber',         'required', 1),
  (4, 'Cherry tomatoes',  'required', 2),
  (4, 'Feta cheese',      'required', 3),
  (4, 'Kalamata olives',  'required', 4),
  (4, 'Red onion',        'required', 5),
  (4, 'Bell pepper',      'optional', 1),
  (4, 'Fresh mint',       'optional', 2),

  -- ── Lemon Herb Quinoa (id=5) ──────────────────────────
  (5, 'Quinoa',           'required', 1),
  (5, 'Vegetable broth',  'required', 2),
  (5, 'Lemon',            'required', 3),
  (5, 'Fresh parsley',    'optional', 1),
  (5, 'Mint',             'optional', 2),
  (5, 'Pine nuts',        'optional', 3),

  -- ── Shakshuka (id=6) ──────────────────────────────────
  (6, 'Eggs',             'required', 1),
  (6, 'Crushed tomatoes', 'required', 2),
  (6, 'Red pepper',       'required', 3),
  (6, 'Onion',            'required', 4),
  (6, 'Garlic',           'required', 5),
  (6, 'Feta cheese',      'optional', 1),
  (6, 'Fresh parsley',    'optional', 2),
  (6, 'Chilli flakes',    'optional', 3);


-- ============================================================
--  STEP 7: PANTRY ITEMS  (Aria's pantry)
--  Expiry dates are set relative to 2026-03-09 (seed week).
--  A mix of ok / soon / urgent / expired items for UI testing.
-- ============================================================

INSERT INTO pantry_items (user_id, name, quantity, unit, category, expiry_date) VALUES

  ('aaaaaaaa-0001-0001-0001-000000000001', 'Arborio Rice',    500,  'g',       'Grains',  '2026-06-01'),  -- ok
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Parmesan',        150,  'g',       'Dairy',   '2026-03-20'),  -- ok
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Avocado',           3,  'pcs',     'Produce', '2026-03-12'),  -- soon (3 days)
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Sourdough bread',   1,  'loaf',    'Bakery',  '2026-03-10'),  -- urgent (1 day)
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Lemon',             6,  'pcs',     'Produce', '2026-03-25'),  -- ok
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Quinoa',          800,  'g',       'Grains',  '2026-08-01'),  -- ok
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Vegetable broth',   2,  'cartons', 'Pantry',  '2026-05-01'),  -- ok
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Feta cheese',     200,  'g',       'Dairy',   '2026-03-11'),  -- urgent (2 days)
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Kalamata olives', 180,  'g',       'Pantry',  '2026-06-01'),  -- ok
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Olive oil',       750,  'ml',      'Pantry',  '2027-01-01'),  -- ok
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Eggs',             12,  'pcs',     'Dairy',   '2026-03-07'),  -- expired (2 days ago)
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Garlic',            1,  'bunch',   'Produce', '2026-03-30'); -- ok


-- ============================================================
--  STEP 8: MEAL PLANS
--  Current week: Mon 2026-03-09 → Sun 2026-03-15.
--  Mirrors the INITIAL_PLAN from the frontend mockData.js.
-- ============================================================

INSERT INTO meal_plans (user_id, plan_date, meal_slot, dish_id) VALUES

  -- Monday 2026-03-09
  ('aaaaaaaa-0001-0001-0001-000000000001', '2026-03-09', 'Breakfast', 3),  -- Avocado Toast
  ('aaaaaaaa-0001-0001-0001-000000000001', '2026-03-09', 'Lunch',     4),  -- Greek Salad Bowl
  ('aaaaaaaa-0001-0001-0001-000000000001', '2026-03-09', 'Dinner',    2),  -- Mushroom Risotto
  -- Snack slot intentionally empty (no row = empty slot)

  -- Tuesday 2026-03-10
  ('aaaaaaaa-0001-0001-0001-000000000001', '2026-03-10', 'Lunch',     5),  -- Lemon Herb Quinoa
  ('aaaaaaaa-0001-0001-0001-000000000001', '2026-03-10', 'Dinner',    1),  -- Roasted Tomato Bisque

  -- Wednesday 2026-03-11
  ('aaaaaaaa-0001-0001-0001-000000000001', '2026-03-11', 'Breakfast', 3),  -- Avocado Toast
  ('aaaaaaaa-0001-0001-0001-000000000001', '2026-03-11', 'Snack',     4),  -- Greek Salad Bowl

  -- Thursday 2026-03-12
  ('aaaaaaaa-0001-0001-0001-000000000001', '2026-03-12', 'Breakfast', 6),  -- Shakshuka
  ('aaaaaaaa-0001-0001-0001-000000000001', '2026-03-12', 'Lunch',     5),  -- Lemon Herb Quinoa

  -- Friday 2026-03-13
  ('aaaaaaaa-0001-0001-0001-000000000001', '2026-03-13', 'Dinner',    2),  -- Mushroom Risotto

  -- Saturday 2026-03-14
  ('aaaaaaaa-0001-0001-0001-000000000001', '2026-03-14', 'Breakfast', 6),  -- Shakshuka
  ('aaaaaaaa-0001-0001-0001-000000000001', '2026-03-14', 'Lunch',     4);  -- Greek Salad Bowl


-- ============================================================
--  STEP 9: USER FOLLOWS
--  Aria (001) follows Marco, Priya, Kira.
--  Priya and Kira follow Aria back.
--  Triggers will automatically update follower_count and
--  following_count on all affected profiles.
-- ============================================================

INSERT INTO user_follows (follower_id, following_id) VALUES
  -- Aria follows 3 community users
  ('aaaaaaaa-0001-0001-0001-000000000001', 'aaaaaaaa-0002-0002-0002-000000000002'),  -- → Marco
  ('aaaaaaaa-0001-0001-0001-000000000001', 'aaaaaaaa-0003-0003-0003-000000000003'),  -- → Priya
  ('aaaaaaaa-0001-0001-0001-000000000001', 'aaaaaaaa-0007-0007-0007-000000000007'),  -- → Kira

  -- Priya and Kira follow Aria back
  ('aaaaaaaa-0003-0003-0003-000000000003', 'aaaaaaaa-0001-0001-0001-000000000001'),  -- Priya → Aria
  ('aaaaaaaa-0007-0007-0007-000000000007', 'aaaaaaaa-0001-0001-0001-000000000001');  -- Kira  → Aria


-- ============================================================
--  STEP 10: SHOPPING LIST ITEMS  (Aria's manual extras)
--  Auto-derived items are not stored — they come from the
--  v_shopping_needed view at query time.
-- ============================================================

INSERT INTO shopping_list_items (user_id, name, is_checked, dish_id, week_start) VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Roma tomatoes',   FALSE, 1, '2026-03-09'),
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Mixed mushrooms',  FALSE, 2, '2026-03-09'),
  ('aaaaaaaa-0001-0001-0001-000000000001', 'White wine',       FALSE, 2, '2026-03-09');


-- ============================================================
--  STEP 11: VERIFY — quick sanity checks
-- ============================================================

DO $$ DECLARE
  v_users     INT;
  v_profiles  INT;
  v_dishes    INT;
  v_ingr      INT;
  v_pantry    INT;
  v_plans     INT;
  v_follows   INT;
  v_shopping  INT;
  v_targets   INT;
BEGIN
  SELECT COUNT(*) INTO v_users    FROM auth.users          WHERE id LIKE 'aaaaaaaa%';
  SELECT COUNT(*) INTO v_profiles FROM profiles             WHERE id LIKE 'aaaaaaaa%';
  SELECT COUNT(*) INTO v_dishes   FROM dishes               WHERE user_id = 'aaaaaaaa-0001-0001-0001-000000000001';
  SELECT COUNT(*) INTO v_ingr     FROM dish_ingredients     WHERE dish_id BETWEEN 1 AND 6;
  SELECT COUNT(*) INTO v_pantry   FROM pantry_items         WHERE user_id = 'aaaaaaaa-0001-0001-0001-000000000001';
  SELECT COUNT(*) INTO v_plans    FROM meal_plans           WHERE user_id = 'aaaaaaaa-0001-0001-0001-000000000001';
  SELECT COUNT(*) INTO v_follows  FROM user_follows         WHERE follower_id LIKE 'aaaaaaaa%' OR following_id LIKE 'aaaaaaaa%';
  SELECT COUNT(*) INTO v_shopping FROM shopping_list_items  WHERE user_id = 'aaaaaaaa-0001-0001-0001-000000000001';
  SELECT COUNT(*) INTO v_targets  FROM nutrient_targets     WHERE user_id = 'aaaaaaaa-0001-0001-0001-000000000001';

  RAISE NOTICE '─────────────────────────────────────';
  RAISE NOTICE 'Seed verification:';
  RAISE NOTICE '  auth.users        : % (expected 7)',  v_users;
  RAISE NOTICE '  profiles          : % (expected 7)',  v_profiles;
  RAISE NOTICE '  dishes            : % (expected 6)',  v_dishes;
  RAISE NOTICE '  dish_ingredients  : % (expected 38)', v_ingr;
  RAISE NOTICE '  pantry_items      : % (expected 12)', v_pantry;
  RAISE NOTICE '  meal_plans        : % (expected 12)', v_plans;
  RAISE NOTICE '  user_follows      : % (expected 5)',  v_follows;
  RAISE NOTICE '  shopping items    : % (expected 3)',  v_shopping;
  RAISE NOTICE '  nutrient_targets  : % (expected 5)',  v_targets;
  RAISE NOTICE '─────────────────────────────────────';

  IF v_users != 7 OR v_profiles != 7 OR v_dishes != 6 OR v_ingr != 41
  OR v_pantry != 12 OR v_plans != 12 OR v_follows != 5 OR v_shopping != 3
  OR v_targets != 5
  THEN
    RAISE EXCEPTION 'Seed verification FAILED — row counts do not match expected values.';
  END IF;

  RAISE NOTICE 'All counts match. Seed complete ✓';
END $$;


COMMIT;


-- ============================================================
--  TEARDOWN  (run this FIRST if you need to reseed from scratch)
--
--  Uncomment and run this block, then re-run the full seed script.
--  Cascade deletes handle all child rows automatically.
-- ============================================================

/*
DELETE FROM auth.users
WHERE id IN (
  'aaaaaaaa-0001-0001-0001-000000000001',
  'aaaaaaaa-0002-0002-0002-000000000002',
  'aaaaaaaa-0003-0003-0003-000000000003',
  'aaaaaaaa-0004-0004-0004-000000000004',
  'aaaaaaaa-0005-0005-0005-000000000005',
  'aaaaaaaa-0006-0006-0006-000000000006',
  'aaaaaaaa-0007-0007-0007-000000000007'
);
-- The ON DELETE CASCADE on profiles, dishes, pantry_items,
-- meal_plans, shopping_list_items, user_follows, and nutrient_targets
-- removes all child rows automatically.

-- Reset dish ID sequence to 0 after teardown.
SELECT setval('dishes_id_seq', 1, FALSE);
*/
