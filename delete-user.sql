-- Mevcut kullanıcıyı sil (email ile)
DELETE FROM users WHERE email = 'yesilkendir@gmail.com';

-- Veya username ile
DELETE FROM users WHERE username = 'yesilkendir';

-- Tüm kullanıcıları listele (kontrol için)
SELECT id, email, username, name, created_at FROM users;
