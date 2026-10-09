-- Optional performance index. Not run by the installer.
-- Use your normal migration process.
CREATE INDEX IF NOT EXISTS idx_check_ins_user_date_habit ON check_ins(user_id, checkin_date, habit_id);
