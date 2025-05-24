-- Kullanıcı tablosu
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT
);

-- Proje tablosu
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id INTEGER NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Görev tablosu
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  user_id INTEGER NOT NULL,
  project_id INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TIMESTAMP,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Demo kullanıcı oluşturma
INSERT INTO users (username, password, full_name)
VALUES ('ermak', 'ermak', 'Demo User')
ON CONFLICT (username) DO NOTHING;

-- Kullanıcı ID'sini alın ve örnek projeler ve görevler oluşturun
DO $$
DECLARE
  demo_user_id INTEGER;
  project1_id INTEGER;
  project2_id INTEGER;
  project3_id INTEGER;
BEGIN
  SELECT id INTO demo_user_id FROM users WHERE username = 'ermak';

  -- Demo projeler oluşturma
  INSERT INTO projects (name, description, user_id, color)
  VALUES ('İş Görevleri', 'Profesyonel görevler ve son tarihler', demo_user_id, '#6366f1')
  RETURNING id INTO project1_id;

  INSERT INTO projects (name, description, user_id, color)
  VALUES ('Kişisel', 'Kişisel işler ve görevler', demo_user_id, '#10b981')
  RETURNING id INTO project2_id;

  INSERT INTO projects (name, description, user_id, color)
  VALUES ('Öğrenme', 'Eğitim hedefleri ve kurslar', demo_user_id, '#f59e0b')
  RETURNING id INTO project3_id;

  -- Demo görevler oluşturma
  INSERT INTO tasks (title, description, user_id, project_id, priority, due_date)
  VALUES 
    ('Raporu tamamla', 'Haftalık raporu hazırla ve gönder', demo_user_id, project1_id, 'high', NOW() + INTERVAL '2 day'),
    ('Toplantı notları', 'Toplantı notlarını düzenle ve paylaş', demo_user_id, project1_id, 'medium', NOW() + INTERVAL '1 day'),
    ('Spor salonu', 'Spor salonuna git', demo_user_id, project2_id, 'low', NOW() + INTERVAL '3 day'),
    ('Alışveriş', 'Haftalık alışverişi yap', demo_user_id, project2_id, 'medium', NOW() + INTERVAL '1 day'),
    ('Kurs videoları', 'Eğitim videolarını izle', demo_user_id, project3_id, 'medium', NOW() + INTERVAL '5 day');
END $$;