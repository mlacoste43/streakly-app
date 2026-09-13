-- Sample data for local development, mirrors what the old in-memory store had.
-- Run after schema.sql:  psql -d streakly -f db/seed.sql

INSERT INTO users (id, first_name, username) VALUES
  (1, 'Ты', 'timofey_streaks'),
  (2, 'Маша', 'masha'),
  (3, 'Костя', 'kostya'),
  (4, 'Дима', 'dima'),
  (5, 'Лена', 'lena'),
  (6, 'Аня', 'anya')
ON CONFLICT (id) DO NOTHING;

INSERT INTO habits (id, owner_id, title, icon, type, frequency, break_rule, deadline_hours, days, record) VALUES
  (1, 1, 'Утренняя зарядка', 'run', 'solo', 'daily', 'personal', NULL, 12, 19),
  (2, 1, 'Английский 15 мин', 'language', 'duo', 'daily', 'all', NULL, 34, 41),
  (3, 1, 'Читать 20 страниц', 'book', 'solo', 'daily', 'personal', 3, 7, 15),
  (4, 1, 'Утренний забег', 'users', 'team', 'daily', 'all', NULL, 21, 21)
ON CONFLICT (id) DO NOTHING;

SELECT setval('habits_id_seq', (SELECT MAX(id) FROM habits));

INSERT INTO habit_members (habit_id, user_id) VALUES
  (1, 1),
  (2, 1), (2, 6),
  (3, 1),
  (4, 1), (4, 2), (4, 3), (4, 4), (4, 5)
ON CONFLICT DO NOTHING;

-- today's check-ins for the team habit, so the team screen has something to show
INSERT INTO check_ins (habit_id, user_id, checkin_date) VALUES
  (4, 1, CURRENT_DATE),
  (4, 2, CURRENT_DATE),
  (4, 3, CURRENT_DATE),
  (4, 5, CURRENT_DATE)
ON CONFLICT DO NOTHING;
