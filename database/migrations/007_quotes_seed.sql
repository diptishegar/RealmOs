-- ============================================================
-- Migration 007 – Bold Quotes Seed
-- Replaces the basic seed with discipline + dark romance quotes
-- ============================================================

-- Clear the basic seed so we don't duplicate
DELETE FROM quotes;

-- ============================================================
-- DISCIPLINE — no excuses, just results
-- ============================================================
INSERT INTO quotes (text, author, category) VALUES
  ('No one is coming to save you. Get up.', NULL, 'discipline'),
  ('You can have results or excuses. Not both.', NULL, 'discipline'),
  ('Do it for the version of you that thought it was impossible.', NULL, 'discipline'),
  ('Your future self is watching you right now through your memories. Make it good.', NULL, 'discipline'),
  ('The pain of discipline weighs ounces. The pain of regret weighs tons.', NULL, 'discipline'),
  ('Don''t get comfortable. You haven''t arrived yet.', NULL, 'discipline'),
  ('Every version of you that gave up is why you''re still here — but not why you''ll win.', NULL, 'discipline'),
  ('She doesn''t wait for motivation. She moves and the motivation follows.', NULL, 'discipline'),
  ('Train like the girl you want to become already exists. Because she does.', NULL, 'discipline'),
  ('Soft hours produce hard years. Hard hours produce a soft life.', NULL, 'discipline'),
  ('You are not tired. You are uninspired. Fix that.', NULL, 'discipline'),
  ('It''s supposed to be hard. That''s why it counts.', NULL, 'discipline'),
  ('Discipline is the highest form of self-love.', NULL, 'discipline'),
  ('Earn the version of yourself you keep daydreaming about.', NULL, 'discipline'),
  ('The girl who logs her meals, sleeps 8 hours, and trains anyway? She''s not lucky. She''s consistent.', NULL, 'discipline'),

-- ============================================================
-- DARK ROMANCE — beautiful, fierce, a little dangerous
-- ============================================================
  ('She was darkness and wildfire and something magnificent.', NULL, 'dark-romance'),
  ('There is a fire in her. Loved correctly, she warms your whole home. Touched wrong, she burns it to the ground.', NULL, 'dark-romance'),
  ('She wore her darkness like a crown.', NULL, 'dark-romance'),
  ('I am not the girl you save. I am the girl you survive.', NULL, 'dark-romance'),
  ('She is soft until she needs to be a sword.', NULL, 'dark-romance'),
  ('Dangerous and lovely — a contradiction she never cared to resolve.', NULL, 'dark-romance'),
  ('Wild and dark and worth every scar.', NULL, 'dark-romance'),
  ('She had a galaxy inside her. Stars and black holes both.', NULL, 'dark-romance'),
  ('Her soul was too deep to explore and too dark to understand.', NULL, 'dark-romance'),
  ('She was the kind of woman who had seen too much to be afraid of anything.', NULL, 'dark-romance'),
  ('I am made of stardust and fury.', NULL, 'dark-romance'),
  ('She was chaos and beauty intertwined.', NULL, 'dark-romance'),
  ('She is a storm with skin. You will not predict her.', NULL, 'dark-romance'),
  ('There''s something about her — the way she carries herself. She is a universe.', NULL, 'dark-romance'),
  ('She bled poetry and exhaled storms.', NULL, 'dark-romance'),

-- ============================================================
-- POWER — queen energy
-- ============================================================
  ('She remembered who she was and the game changed.', 'Lalah Delia', 'power'),
  ('Glow differently. No competition.', NULL, 'power'),
  ('Your vibe is your superpower.', NULL, 'power'),
  ('She is clothed in strength and dignity.', 'Proverbs 31:25', 'power'),
  ('She is not for everyone. That is the point.', NULL, 'power'),
  ('Be so magnetic they can''t look away.', NULL, 'power'),
  ('Let her sleep. When she wakes, she will move mountains.', NULL, 'power'),
  ('She is not a phase. She is a force.', NULL, 'power'),

-- ============================================================
-- SELF-LOVE — because you are the main character
-- ============================================================
  ('You are enough. A thousand times enough.', NULL, 'self-love'),
  ('The secret is to fall in love with yourself first.', NULL, 'self-love'),
  ('You deserve the love you keep trying to give everyone else.', NULL, 'self-love'),
  ('She is a mess of gorgeous chaos and she is enough.', NULL, 'self-love'),
  ('Make yourself a priority. Not an option.', NULL, 'self-love'),
  ('You glow differently when you are actually happy.', NULL, 'self-love');
