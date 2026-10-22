-- ============================================================
-- 033 — каталог магазина, экспортированный из рабочей БД.
--
-- Данные идемпотентны: вставка выполняется только если записи
-- с таким code ещё нет. ID берутся из sequence, поэтому
-- существующие записи и их связи не затрагиваются.
--
-- Этот changeset должен выполняться ДО DataInitializerConfig:
-- тогда инициализатор увидит непустые таблицы и не перезапишет
-- каталог своими дефолтами.
-- ============================================================

-- ---------- Категории аватаров ----------
INSERT INTO avatar_categories (id, code, title, sort_order)
SELECT nextval(pg_get_serial_sequence('avatar_categories', 'id')), 'anime', 'Аниме', 10
WHERE NOT EXISTS (SELECT 1 FROM avatar_categories WHERE code = 'anime');
INSERT INTO avatar_categories (id, code, title, sort_order)
SELECT nextval(pg_get_serial_sequence('avatar_categories', 'id')), 'genshin', 'Геншин', 20
WHERE NOT EXISTS (SELECT 1 FROM avatar_categories WHERE code = 'genshin');
INSERT INTO avatar_categories (id, code, title, sort_order)
SELECT nextval(pg_get_serial_sequence('avatar_categories', 'id')), 'pixel', 'Пиксель-арт', 30
WHERE NOT EXISTS (SELECT 1 FROM avatar_categories WHERE code = 'pixel');
INSERT INTO avatar_categories (id, code, title, sort_order)
SELECT nextval(pg_get_serial_sequence('avatar_categories', 'id')), 'abstract', 'Абстракция', 40
WHERE NOT EXISTS (SELECT 1 FROM avatar_categories WHERE code = 'abstract');
INSERT INTO avatar_categories (id, code, title, sort_order)
SELECT nextval(pg_get_serial_sequence('avatar_categories', 'id')), '', 'Зенлесс', 50
WHERE NOT EXISTS (SELECT 1 FROM avatar_categories WHERE code = '' AND title = 'Зенлесс');
INSERT INTO avatar_categories (id, code, title, sort_order)
SELECT nextval(pg_get_serial_sequence('avatar_categories', 'id')), 'пейзаж', 'Пейзаж', 60
WHERE NOT EXISTS (SELECT 1 FROM avatar_categories WHERE code = 'пейзаж');
INSERT INTO avatar_categories (id, code, title, sort_order)
SELECT nextval(pg_get_serial_sequence('avatar_categories', 'id')), 'characters', 'Персонажи', 70
WHERE NOT EXISTS (SELECT 1 FROM avatar_categories WHERE code = 'characters');

-- ---------- Категории рамок ----------
INSERT INTO frame_categories (id, code, title, sort_order)
SELECT nextval(pg_get_serial_sequence('frame_categories', 'id')), 'classic', 'Классика', 10
WHERE NOT EXISTS (SELECT 1 FROM frame_categories WHERE code = 'classic');
INSERT INTO frame_categories (id, code, title, sort_order)
SELECT nextval(pg_get_serial_sequence('frame_categories', 'id')), 'glow', 'Свечение', 20
WHERE NOT EXISTS (SELECT 1 FROM frame_categories WHERE code = 'glow');
INSERT INTO frame_categories (id, code, title, sort_order)
SELECT nextval(pg_get_serial_sequence('frame_categories', 'id')), 'nature', 'Природа', 30
WHERE NOT EXISTS (SELECT 1 FROM frame_categories WHERE code = 'nature');
INSERT INTO frame_categories (id, code, title, sort_order)
SELECT nextval(pg_get_serial_sequence('frame_categories', 'id')), 'special', 'Особые', 40
WHERE NOT EXISTS (SELECT 1 FROM frame_categories WHERE code = 'special');

-- ---------- Категории акцентов ----------
INSERT INTO accent_categories (id, code, title, sort_order)
SELECT nextval(pg_get_serial_sequence('accent_categories', 'id')), 'solid', 'Однотонные', 10
WHERE NOT EXISTS (SELECT 1 FROM accent_categories WHERE code = 'solid');
INSERT INTO accent_categories (id, code, title, sort_order)
SELECT nextval(pg_get_serial_sequence('accent_categories', 'id')), 'gradient', 'Градиентные', 20
WHERE NOT EXISTS (SELECT 1 FROM accent_categories WHERE code = 'gradient');
INSERT INTO accent_categories (id, code, title, sort_order)
SELECT nextval(pg_get_serial_sequence('accent_categories', 'id')), 'rare', 'Редкие', 30
WHERE NOT EXISTS (SELECT 1 FROM accent_categories WHERE code = 'rare');

-- ---------- Категории деревьев ----------
INSERT INTO tree_categories (id, code, title, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_categories', 'id')), 'classic', 'Классические', 10
WHERE NOT EXISTS (SELECT 1 FROM tree_categories WHERE code = 'classic');
INSERT INTO tree_categories (id, code, title, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_categories', 'id')), 'fruit', 'Плодовые', 20
WHERE NOT EXISTS (SELECT 1 FROM tree_categories WHERE code = 'fruit');
INSERT INTO tree_categories (id, code, title, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_categories', 'id')), 'exotic', 'Экзотические', 30
WHERE NOT EXISTS (SELECT 1 FROM tree_categories WHERE code = 'exotic');
INSERT INTO tree_categories (id, code, title, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_categories', 'id')), 'conifer', 'Хвойные', 40
WHERE NOT EXISTS (SELECT 1 FROM tree_categories WHERE code = 'conifer');
INSERT INTO tree_categories (id, code, title, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_categories', 'id')), 'blossom', 'Цветущие', 50
WHERE NOT EXISTS (SELECT 1 FROM tree_categories WHERE code = 'blossom');
INSERT INTO tree_categories (id, code, title, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_categories', 'id')), 'fantasy', 'Фантазийные', 60
WHERE NOT EXISTS (SELECT 1 FROM tree_categories WHERE code = 'fantasy');

-- ---------- Аватары ----------
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'anime-1', 'Аянокоджи Киетака', 'Манипулятор-кукловод', NULL, NULL, 2000, 10, '/avatars/anime-1.jpg', (SELECT id FROM avatar_categories WHERE code = 'anime' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'anime-1');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'anime-2', 'Аля', 'Аниме', NULL, NULL, 2000, 20, '/avatars/anime-2.jpg', (SELECT id FROM avatar_categories WHERE code = 'anime' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'anime-2');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'anime-3', 'Сон Джин Ву', 'Exchange...', NULL, NULL, 1200, 30, '/avatars/anime-3.jpg', (SELECT id FROM avatar_categories WHERE code = 'anime' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'anime-3');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'anime-4', 'Леви Аккерман', 'Аниме', NULL, NULL, 1200, 40, '/avatars/anime-4.jpg', (SELECT id FROM avatar_categories WHERE code = 'anime' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'anime-4');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'anime-5', 'Фрирен', 'Аниме', NULL, NULL, 1200, 50, '/avatars/anime-5.jpg', (SELECT id FROM avatar_categories WHERE code = 'anime' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'anime-5');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'anime-6', 'Макима', 'Аниме', NULL, NULL, 1200, 60, '/avatars/anime-6.jpg', (SELECT id FROM avatar_categories WHERE code = 'anime' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'anime-6');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'anime-7', 'Дендзи', 'Аниме', NULL, NULL, 1200, 70, '/avatars/anime-7.jpg', (SELECT id FROM avatar_categories WHERE code = 'anime' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'anime-7');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'anime-8', 'Хошино Ай', 'Аниме', NULL, NULL, 2000, 80, '/avatars/anime-8.jpg', (SELECT id FROM avatar_categories WHERE code = 'anime' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'anime-8');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'cat-pilot', 'Кот-пилот', 'Мем', NULL, NULL, 1200, 120, '/avatars/cat-pilot.jpg', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'cat-pilot');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'genshin-1', 'Чиби-скирк', 'Геншин', NULL, NULL, 300, 90, '/avatars/genshin-1.jpg', (SELECT id FROM avatar_categories WHERE code = 'genshin' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'genshin-1');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'moon-sea', 'Лунное море', 'Пейзаж', NULL, NULL, 150, 100, '/avatars/moon-sea.jpg', NULL, 200
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'moon-sea');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'mountain', 'Горы и озеро', 'Пейзаж', NULL, NULL, 300, 110, '/avatars/mountain.jpg', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'mountain');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'sakura-moon', 'Сакура и луна', 'Пейзаж', NULL, NULL, 300, 130, '/avatars/sakura-moon.jpg', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'sakura-moon');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'sunset-beach', 'Закат на пляже', 'Пейзаж', NULL, NULL, 300, 140, '/avatars/sunset-beach.jpg', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'sunset-beach');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'zzz-1', 'Хосими Мияби', 'Зенлесс', NULL, NULL, 300, 150, '/avatars/zzz-1.jpg', (SELECT id FROM avatar_categories WHERE code = '' AND title = 'Зенлесс' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'zzz-1');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'zzz-2', 'Укинами Юдзуха', 'Зенлесс', NULL, NULL, 300, 160, '/avatars/zzz-2.jpg', (SELECT id FROM avatar_categories WHERE code = '' AND title = 'Зенлесс' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'zzz-2');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-wizard', 'Волшебник', 'Маг', NULL, NULL, 300, 200, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-wizard');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-devil', 'Демон', 'Огонь', NULL, NULL, 300, 210, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-devil');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-viking', 'Викинг', 'Скандинав', NULL, NULL, 300, 220, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-viking');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-unicorn', 'Единорог', 'Радуга', NULL, NULL, 300, 230, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-unicorn');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-pizza', 'Пицца', 'Еда', NULL, NULL, 300, 240, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-pizza');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-bear', 'Медведь', 'Лес', NULL, NULL, 300, 250, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-bear');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-lightning', 'Молния', 'Энергия', NULL, NULL, 300, 260, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-lightning');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-sunflower', 'Подсолнух', 'Цветок', NULL, NULL, 300, 270, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-sunflower');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-rocket', 'Ракета', 'Космос', NULL, NULL, 300, 280, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-rocket');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-soccer', 'Футбол', 'Спорт', NULL, NULL, 300, 290, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-soccer');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-ninja', 'Ниндзя', 'Тень', NULL, NULL, 300, 300, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-ninja');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-skull', 'Скелет', 'Хэллоуин', NULL, NULL, 300, 310, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-skull');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-shark', 'Акула', 'Океан', NULL, NULL, 300, 320, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-shark');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-leprechaun', 'Лепрекон', 'Ирландия', NULL, NULL, 300, 330, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-leprechaun');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-queen', 'Королева', 'Карты', NULL, NULL, 300, 340, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-queen');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-potion', 'Зелье', 'Алхимия', NULL, NULL, 300, 350, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-potion');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-pirate', 'Пират', 'Море', NULL, NULL, 300, 360, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-pirate');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-gargoyle', 'Гаргулья', 'Камень', NULL, NULL, 300, 370, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-gargoyle');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-paper', 'Самолётик', 'Детство', NULL, NULL, 300, 380, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-paper');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-reaper', 'Жнец', 'Смерть', NULL, NULL, 300, 390, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-reaper');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-pink-mon', 'Розовый монстр', 'Милый', NULL, NULL, 300, 400, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-pink-mon');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-mummy', 'Мумия', 'Египет', NULL, NULL, 300, 410, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-mummy');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-board', 'Шахматы', 'Игра', NULL, NULL, 300, 420, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-board');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-lama', 'Лама', 'Животное', NULL, NULL, 300, 430, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-lama');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-ghost', 'Призрак', 'Мистика', NULL, NULL, 300, 440, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-ghost');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-squirrel', 'Белка', 'Лес', NULL, NULL, 300, 450, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-squirrel');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-donkey', 'Осёл', 'Ферма', NULL, NULL, 300, 460, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-donkey');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-dog', 'Собака', 'Домашний', NULL, NULL, 300, 470, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-dog');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-raccoon', 'Енот', 'Ночь', NULL, NULL, 300, 480, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-raccoon');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-cupcake', 'Капкейк', 'Сладкий', NULL, NULL, 300, 490, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-cupcake');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-piggy', 'Свинка', 'Ферма', NULL, NULL, 300, 500, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-piggy');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-penguin', 'Пингвин', 'Антарктика', NULL, NULL, 300, 510, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-penguin');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-astronaut', 'Космонавт', 'Космос', NULL, NULL, 300, 520, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-astronaut');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-burger', 'Бургер', 'Еда', NULL, NULL, 300, 530, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-burger');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-bee', 'Пчела', 'Мёд', NULL, NULL, 300, 540, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-bee');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-zombie', 'Зомби', 'Хэллоуин', NULL, NULL, 300, 550, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-zombie');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-alien', 'Пришелец', 'Космос', NULL, NULL, 300, 560, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-alien');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-pirate2', 'Пират в шляпе', 'Аниме', NULL, NULL, 300, 570, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-pirate2');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-hook', 'Крюк', 'Пират', NULL, NULL, 300, 580, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-hook');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-clown', 'Клоун', 'Цирк', NULL, NULL, 300, 590, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-clown');
INSERT INTO avatars (id, code, title, description, emoji, css_class, price, sort_order, image_url, category_id, old_price)
SELECT nextval(pg_get_serial_sequence('avatars', 'id')), 'a-8ab7b714', 'Эвелин', '', NULL, NULL, 2000, 0, '/avatars/a-8ab7b714.jpg', NULL, 5000
WHERE NOT EXISTS (SELECT 1 FROM avatars WHERE code = 'a-8ab7b714');

-- ---------- Рамки ----------
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'none', 'Без рамки', 'Обычная аватарка без рамки', '', 0, 0, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'none');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'wood', 'Деревянная', 'Тёплая деревянная рамка', 'frame--wood', 180, 10, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'wood');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'silver', 'Серебряная', 'Серебристая тонкая рамка', 'frame--silver', 180, 20, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'silver');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'gold', 'Золотая', 'Классическая золотая рамка', 'frame--gold', 1200, 30, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'gold');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'neon', 'Неоновая', 'Светящаяся неоновая рамка', 'frame--neon', 2000, 40, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'neon');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'sakura', 'Сакура', 'Розовая рамка с лепестками', 'frame--sakura', 350, 50, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'sakura');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'emerald', 'Изумрудная', 'Зелёная рамка с блеском', 'frame--emerald', 700, 60, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'emerald');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'royal', 'Королевская', 'Роскошная рамка с золотом и фиолетом', 'frame--royal', 1200, 70, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'royal');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'cosmic', 'Космическая', 'Анимированная звёздная рамка', 'frame--cosmic', 2500, 80, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'cosmic');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'paper', 'Бумага', 'Тёплая бежевая рамка', 'frame--paper', 40, 110, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'paper');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'carbon', 'Карбон', 'Чёрная текстура с блеском', 'frame--carbon', 700, 120, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'carbon');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'ice', 'Лёд', 'Голубоватая холодная рамка', 'frame--ice', 350, 130, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'ice');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'lava', 'Лава', 'Раскалённое красно-оранжевое свечение', 'frame--lava', 1200, 140, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'lava');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'galaxy', 'Галактика', 'Космос с мерцанием', 'frame--galaxy', 2500, 150, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'galaxy');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'honey', 'Мёд', 'Янтарная медовая рамка', 'frame--honey', 350, 160, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'honey');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'candy', 'Карамель', 'Полосатая яркая рамка', 'frame--candy', 1200, 170, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'candy');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'steel', 'Сталь', 'Металлическая серая рамка', 'frame--steel', 90, 180, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'steel');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'venom', 'Веном', 'Ядовитая зелёно-фиолетовая рамка', 'frame--venom', 1200, 190, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'venom');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'royal-blue', 'Сапфир', 'Синяя с золотом, королевская', 'frame--royal-blue', 1200, 200, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'royal-blue');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'frame--fire', 'Огонь', 'Живое пламя, пульсирует', 'frame--fire', 2000, 300, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'frame--fire');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'frame--thunder', 'Молния', 'Электрические разряды, мерцание', 'frame--thunder', 2000, 310, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'frame--thunder');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'frame--crystal', 'Кристалл', 'Холодное голубое сияние', 'frame--crystal', 2000, 320, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'frame--crystal');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'frame--matrix', 'Матрица', 'Зелёные цифры, киберпанк', 'frame--matrix', 2000, 330, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'frame--matrix');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'frame--pulse', 'Пульс', 'Красное сердцебиение', 'frame--pulse', 2000, 340, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'frame--pulse');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'frame--shadow', 'Тень', 'Чёрная с фиолетовым свечением', 'frame--shadow', 2000, 350, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'frame--shadow');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'frame--rose', 'Роза', 'Нежно-розовая, с шипами', 'frame--rose', 350, 360, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'frame--rose');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'frame--oak', 'Дуб', 'Натуральное дерево, тёплая', 'frame--oak', 1200, 370, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'frame--oak');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'frame--marble', 'Мрамор', 'Белая с серыми прожилками', 'frame--marble', 700, 380, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'frame--marble');
INSERT INTO frames (id, code, title, description, css_class, price, sort_order, image_url, hex_color, old_price)
SELECT nextval(pg_get_serial_sequence('frames', 'id')), 'frame--opal', 'Опал', 'Переливается перламутром', 'frame--opal', 5000, 390, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM frames WHERE code = 'frame--opal');

-- ---------- Акцентные скины ----------
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'blue', 'Синий', 'Классический синий', 0, 10, '#4c9aff', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'blue');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'green', 'Зелёный', 'Свежий зелёный', 60, 20, '#36b37e', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'green');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'red', 'Красный', 'Яркий красный', 60, 30, '#ff5630', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'red');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'purple', 'Пурпурный', 'Насыщенный пурпур', 60, 40, '#a45cd6', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'purple');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'orange', 'Оранжевый', 'Тёплый оранжевый', 60, 50, '#ffab00', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'orange');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'pink', 'Розовый', 'Мягкий розовый', 60, 60, '#ff78c4', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'pink');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'teal', 'Бирюзовый', 'Морской бирюзовый', 60, 70, '#00b8d9', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'teal');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'indigo', 'Индиго', 'Глубокий индиго', 60, 80, '#5e6cff', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'indigo');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'violet', 'Фиолетовый', 'Яркий фиолетовый', 60, 90, '#8f6ed5', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'violet');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'magenta', 'Маджента', 'Кричащая маджента', 60, 100, '#d16bdd', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'magenta');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'coral', 'Коралловый', 'Тёплый коралл', 60, 110, '#ff8f73', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'coral');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'amber', 'Янтарный', 'Золотисто-янтарный', 60, 120, '#ffc400', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'amber');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'mint', 'Мятный', 'Прохладный мятный', 60, 130, '#57d9a3', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'mint');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'cyan', 'Голубой', 'Небесно-голубой', 60, 140, '#00b8d9', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'cyan');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'lime', 'Лаймовый', 'Кислотный лайм', 60, 150, '#b3d400', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'lime');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'navy', 'Тёмно-синий', 'Глубокий тёмно-синий', 150, 160, '#0052cc', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'navy');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'maroon', 'Бордовый', 'Тёмный бордовый', 150, 170, '#ae2e24', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'maroon');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'olive', 'Оливковый', 'Спокойный оливковый', 150, 180, '#877700', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'olive');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'brown', 'Коричневый', 'Землистый коричневый', 150, 190, '#9e7c5a', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'brown');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'slate', 'Графит', 'Строгий графит', 150, 200, '#6b778c', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'slate');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'sunset', 'Закат', 'Оранжево-розовый градиент', 700, 210, '#ff8fae', '#ff78c4', true, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'sunset');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'ocean', 'Океан', 'Сине-бирюзовый градиент', 700, 220, '#0081d6', '#00f0ff', true, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'ocean');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'forest', 'Лес', 'Зелёно-оливковый градиент', 700, 230, '#5a9f3a', '#a8c93c', true, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'forest');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'neon', 'Неон', 'Розово-голубое свечение', 700, 240, '#b100ff', '#00f5ff', true, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'neon');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'gold', 'Золото', 'Роскошный золотой', 700, 250, '#d4a017', '#d4a017', true, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'gold');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'crimson', 'Малиновый', 'Глубокий насыщенный малиновый', 60, 300, '#A81E55', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'crimson');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'plum', 'Сливовый', 'Тёмно-фиолетовый сливовый', 60, 310, '#8e4585', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'plum');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'rust', 'Ржавый', 'Тёплый ржаво-коричневый', 60, 320, '#b7410e', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'rust');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'jade', 'Нефрит', 'Спокойный зелёный нефрит', 60, 330, '#00a86b', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'jade');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'sapphire', 'Сапфир', 'Глубокий синий сапфир', 60, 340, '#0f52ba', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'sapphire');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'aqua', 'Аквамарин', 'Светлый морской аквамарин', 60, 350, '#7fffd4', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'aqua');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'lavender', 'Лаванда', 'Нежный лавандовый', 60, 360, '#A995DE', NULL, false, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'lavender');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'sunburst', 'Солнечный', 'Оранжево-розовый закат', 700, 370, '#ff8c00', '#ff0080', true, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'sunburst');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'aurora', 'Сияние', 'Зелёно-голубое полярное сияние', 700, 380, '#00ff87', '#60efff', true, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'aurora');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'cosmic', 'Космос', 'Фиолетово-розовые туманности', 700, 390, '#7f00ff', '#e100ff', true, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'cosmic');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'meadow', 'Луговой', 'Травяной градиент с солнечной искрой', 350, 210, '#7ed957', '#c8f05a', true, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'meadow');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'dusk', 'Сумерки', 'Фиолетово-розовый закатный переход', 350, 220, '#5b2a86', '#ff7eb3', true, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'dusk');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'sherbet', 'Щербет', 'Абрикосовый градиент с малиновым', 350, 230, '#ff9f68', '#ff5f9e', true, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'sherbet');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'deepsea', 'Глубина', 'Тёмно-бирюзовый с лазурным свечением', 700, 240, '#0b3954', '#19d3c5', true, NULL, NULL, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'deepsea');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'rosegold', 'Розовое золото', 'Редкий металл: мягкий розово-золотой отсвет', 2500, 300, '#e6a596', '#ffd9c9', false, NULL, NULL, '#b76e79', true
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'rosegold');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'sapphire-metal', 'Сапфир-металл', 'Редкий металл: глубокая синева с бликом', 2500, 310, '#0f52ba', '#7fb2ff', false, NULL, NULL, '#041e42', true
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'sapphire-metal');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'onyx', 'Оникс', 'Редкий металл: чёрный камень с серым бликом', 2500, 320, '#1a1a1a', '#8c8c8c', false, NULL, NULL, '#000000', true
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'onyx');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'hologram', 'Голограмма', 'Редкий эффект: радужный блик по контуру', 4000, 330, '#00e5ff', '#ff00e5', false, NULL, NULL, '#ffd600', true
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'hologram');
INSERT INTO accent_skins (id, code, title, description, price, sort_order, hex_color, hex_color_secondary, is_gradient, image_url, old_price, hex_color_tertiary, is_rare)
SELECT nextval(pg_get_serial_sequence('accent_skins', 'id')), 'platinum', 'Платина', 'Редкий металл: холодный серебристый блеск', 1500, 340, '#e5e4e2', '#b8b8b8', false, NULL, NULL, '#7a7a7a', true
WHERE NOT EXISTS (SELECT 1 FROM accent_skins WHERE code = 'platinum');

-- ---------- Скины деревьев ----------
INSERT INTO tree_skins (id, code, title, description, price, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_skins', 'id')), 'apple', 'Яблоня', 'Яблоня с красными плодами — базовое дерево', 600, 10
WHERE NOT EXISTS (SELECT 1 FROM tree_skins WHERE code = 'apple');
INSERT INTO tree_skins (id, code, title, description, price, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_skins', 'id')), 'birch', 'Берёза', 'Стройная белоствольная берёза', 40, 20
WHERE NOT EXISTS (SELECT 1 FROM tree_skins WHERE code = 'birch');
INSERT INTO tree_skins (id, code, title, description, price, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_skins', 'id')), 'palm', 'Пальма', 'Тропическая пальма', 400, 30
WHERE NOT EXISTS (SELECT 1 FROM tree_skins WHERE code = 'palm');
INSERT INTO tree_skins (id, code, title, description, price, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_skins', 'id')), 'eucalyptus', 'Эвкалипт', 'Ажурный эвкалипт с серо-голубыми листьями', 1500, 40
WHERE NOT EXISTS (SELECT 1 FROM tree_skins WHERE code = 'eucalyptus');
INSERT INTO tree_skins (id, code, title, description, price, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_skins', 'id')), 'orange', 'Апельсин', 'Цитрусовое дерево с оранжевыми плодами', 700, 50
WHERE NOT EXISTS (SELECT 1 FROM tree_skins WHERE code = 'orange');
INSERT INTO tree_skins (id, code, title, description, price, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_skins', 'id')), 'lemon', 'Лимон', 'Компактное дерево с яркими лимонами', 700, 60
WHERE NOT EXISTS (SELECT 1 FROM tree_skins WHERE code = 'lemon');
INSERT INTO tree_skins (id, code, title, description, price, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_skins', 'id')), 'mango', 'Манго', 'Тропическое дерево с яркими плодами', 700, 70
WHERE NOT EXISTS (SELECT 1 FROM tree_skins WHERE code = 'mango');
INSERT INTO tree_skins (id, code, title, description, price, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_skins', 'id')), 'coconut', 'Кокос', 'Тропическая кокосовая пальма', 700, 80
WHERE NOT EXISTS (SELECT 1 FROM tree_skins WHERE code = 'coconut');
INSERT INTO tree_skins (id, code, title, description, price, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_skins', 'id')), 'oak', 'Дуб', 'Могучий вековой дуб', 100, 90
WHERE NOT EXISTS (SELECT 1 FROM tree_skins WHERE code = 'oak');
INSERT INTO tree_skins (id, code, title, description, price, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_skins', 'id')), 'maple', 'Клён', 'Осенний клён с красно-оранжевыми листьями', 150, 100
WHERE NOT EXISTS (SELECT 1 FROM tree_skins WHERE code = 'maple');
INSERT INTO tree_skins (id, code, title, description, price, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_skins', 'id')), 'willow', 'Ива', 'Плакучая ива с длинными свисающими ветвями', 200, 110
WHERE NOT EXISTS (SELECT 1 FROM tree_skins WHERE code = 'willow');
INSERT INTO tree_skins (id, code, title, description, price, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_skins', 'id')), 'banyan', 'Баньян', 'Величественный баньян с воздушными корнями', 800, 120
WHERE NOT EXISTS (SELECT 1 FROM tree_skins WHERE code = 'banyan');
INSERT INTO tree_skins (id, code, title, description, price, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_skins', 'id')), 'cypress', 'Кипарис', 'Стройный тёмный кипарис', 800, 130
WHERE NOT EXISTS (SELECT 1 FROM tree_skins WHERE code = 'cypress');
INSERT INTO tree_skins (id, code, title, description, price, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_skins', 'id')), 'fir', 'Пихта', 'Строгая тёмная пихта', 1500, 140
WHERE NOT EXISTS (SELECT 1 FROM tree_skins WHERE code = 'fir');
INSERT INTO tree_skins (id, code, title, description, price, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_skins', 'id')), 'xmas', 'Ёлка', 'Новогодняя ёлка с игрушками', 4000, 150
WHERE NOT EXISTS (SELECT 1 FROM tree_skins WHERE code = 'xmas');
INSERT INTO tree_skins (id, code, title, description, price, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_skins', 'id')), 'sakura', 'Сакура', 'Нежная цветущая сакура', 2000, 160
WHERE NOT EXISTS (SELECT 1 FROM tree_skins WHERE code = 'sakura');
INSERT INTO tree_skins (id, code, title, description, price, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_skins', 'id')), 'cherry', 'Вишня', 'Цветущая вишня, нежные лепестки', 1200, 170
WHERE NOT EXISTS (SELECT 1 FROM tree_skins WHERE code = 'cherry');
INSERT INTO tree_skins (id, code, title, description, price, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_skins', 'id')), 'jacaranda', 'Джакаранда', 'Ажурное дерево с фиолетовыми цветами', 1500, 180
WHERE NOT EXISTS (SELECT 1 FROM tree_skins WHERE code = 'jacaranda');
INSERT INTO tree_skins (id, code, title, description, price, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_skins', 'id')), 'neon', 'Неон-дерево', 'Киберпанк-дерево из неоновых огней', 2500, 190
WHERE NOT EXISTS (SELECT 1 FROM tree_skins WHERE code = 'neon');
INSERT INTO tree_skins (id, code, title, description, price, sort_order)
SELECT nextval(pg_get_serial_sequence('tree_skins', 'id')), 'crystal', 'Кристалл', 'Древо из чистейших кристаллов', 2500, 200
WHERE NOT EXISTS (SELECT 1 FROM tree_skins WHERE code = 'crystal');

-- ---------- Фоны профиля ----------
INSERT INTO profile_backgrounds (id, code, title, description, image_url, css_class, price, old_price, sort_order)
SELECT nextval(pg_get_serial_sequence('profile_backgrounds', 'id')), 'aurora', 'Аврора', 'Классическое северное сияние TaskBoard', NULL, 'aurora', 0, NULL, 10
WHERE NOT EXISTS (SELECT 1 FROM profile_backgrounds WHERE code = 'aurora');
INSERT INTO profile_backgrounds (id, code, title, description, image_url, css_class, price, old_price, sort_order)
SELECT nextval(pg_get_serial_sequence('profile_backgrounds', 'id')), 'sunset', 'Закат', 'Тёплый вечерний градиент', NULL, 'sunset', 0, NULL, 20
WHERE NOT EXISTS (SELECT 1 FROM profile_backgrounds WHERE code = 'sunset');
INSERT INTO profile_backgrounds (id, code, title, description, image_url, css_class, price, old_price, sort_order)
SELECT nextval(pg_get_serial_sequence('profile_backgrounds', 'id')), 'ocean', 'Океан', 'Глубина и спокойствие моря', NULL, 'ocean', 0, NULL, 30
WHERE NOT EXISTS (SELECT 1 FROM profile_backgrounds WHERE code = 'ocean');
INSERT INTO profile_backgrounds (id, code, title, description, image_url, css_class, price, old_price, sort_order)
SELECT nextval(pg_get_serial_sequence('profile_backgrounds', 'id')), 'forest', 'Лес', 'Зелёная прохлада', NULL, 'forest', 0, NULL, 40
WHERE NOT EXISTS (SELECT 1 FROM profile_backgrounds WHERE code = 'forest');
INSERT INTO profile_backgrounds (id, code, title, description, image_url, css_class, price, old_price, sort_order)
SELECT nextval(pg_get_serial_sequence('profile_backgrounds', 'id')), 'neon', 'Неон', 'Ночной город в фиолетовых огнях', NULL, 'neon', 0, NULL, 50
WHERE NOT EXISTS (SELECT 1 FROM profile_backgrounds WHERE code = 'neon');
INSERT INTO profile_backgrounds (id, code, title, description, image_url, css_class, price, old_price, sort_order)
SELECT nextval(pg_get_serial_sequence('profile_backgrounds', 'id')), 'ember', 'Угли', 'Тлеющий костёр', NULL, 'ember', 0, NULL, 60
WHERE NOT EXISTS (SELECT 1 FROM profile_backgrounds WHERE code = 'ember');
INSERT INTO profile_backgrounds (id, code, title, description, image_url, css_class, price, old_price, sort_order)
SELECT nextval(pg_get_serial_sequence('profile_backgrounds', 'id')), 'candy', 'Карамель', 'Сладкий розовый градиент', NULL, 'candy', 0, NULL, 70
WHERE NOT EXISTS (SELECT 1 FROM profile_backgrounds WHERE code = 'candy');
INSERT INTO profile_backgrounds (id, code, title, description, image_url, css_class, price, old_price, sort_order)
SELECT nextval(pg_get_serial_sequence('profile_backgrounds', 'id')), 'midnight', 'Полночь', 'Тихий тёмно-синий фон', NULL, 'midnight', 0, NULL, 80
WHERE NOT EXISTS (SELECT 1 FROM profile_backgrounds WHERE code = 'midnight');
INSERT INTO profile_backgrounds (id, code, title, description, image_url, css_class, price, old_price, sort_order)
SELECT nextval(pg_get_serial_sequence('profile_backgrounds', 'id')), 'rose', 'Розовый кварц', 'Нежный минеральный градиент', NULL, 'rose', 350, NULL, 90
WHERE NOT EXISTS (SELECT 1 FROM profile_backgrounds WHERE code = 'rose');
INSERT INTO profile_backgrounds (id, code, title, description, image_url, css_class, price, old_price, sort_order)
SELECT nextval(pg_get_serial_sequence('profile_backgrounds', 'id')), 'mint', 'Мятный бриз', 'Свежий зелёно-голубой фон', NULL, 'mint', 450, NULL, 100
WHERE NOT EXISTS (SELECT 1 FROM profile_backgrounds WHERE code = 'mint');
INSERT INTO profile_backgrounds (id, code, title, description, image_url, css_class, price, old_price, sort_order)
SELECT nextval(pg_get_serial_sequence('profile_backgrounds', 'id')), 'gold', 'Золотая осень', 'Тёплые оттенки сентября', NULL, 'gold', 800, NULL, 110
WHERE NOT EXISTS (SELECT 1 FROM profile_backgrounds WHERE code = 'gold');
INSERT INTO profile_backgrounds (id, code, title, description, image_url, css_class, price, old_price, sort_order)
SELECT nextval(pg_get_serial_sequence('profile_backgrounds', 'id')), 'galaxy', 'Галактика', 'Звёздная бездна для смелых профилей', NULL, 'galaxy', 1500, NULL, 120
WHERE NOT EXISTS (SELECT 1 FROM profile_backgrounds WHERE code = 'galaxy');
INSERT INTO profile_backgrounds (id, code, title, description, image_url, css_class, price, old_price, sort_order)
SELECT nextval(pg_get_serial_sequence('profile_backgrounds', 'id')), 'bg-2a91ef39', 'Тест', '', '/backgrounds/bg-2a91ef39.jpg', NULL, 2, 2, 0
WHERE NOT EXISTS (SELECT 1 FROM profile_backgrounds WHERE code = 'bg-2a91ef39');

-- ---------- Связи аватаров с категориями ----------
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'anime-1' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'anime' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'anime-2' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'anime' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'anime-3' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'anime' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'anime-4' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'anime' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'anime-5' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'anime' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'anime-6' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'anime' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'anime-7' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'anime' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'anime-8' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'anime' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'cat-pilot' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'genshin-1' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'genshin' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'moon-sea' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'пейзаж' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'mountain' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'пейзаж' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'sakura-moon' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'пейзаж' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'sunset-beach' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'пейзаж' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'zzz-1' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'anime' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'zzz-1' AND c.id = (SELECT id FROM avatar_categories WHERE code = '' AND title = 'Зенлесс' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'zzz-2' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'anime' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'zzz-2' AND c.id = (SELECT id FROM avatar_categories WHERE code = '' AND title = 'Зенлесс' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-wizard' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-devil' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-viking' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-unicorn' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-pizza' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-bear' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-lightning' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-sunflower' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-rocket' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-soccer' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-ninja' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-skull' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-shark' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-leprechaun' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-queen' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-potion' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-pirate' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-gargoyle' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-paper' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-reaper' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-pink-mon' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-mummy' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-board' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-lama' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-ghost' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-squirrel' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-donkey' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-dog' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-raccoon' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-cupcake' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-piggy' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-penguin' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-astronaut' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-burger' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-bee' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-zombie' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-alien' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-pirate2' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-hook' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-clown' AND c.id = (SELECT id FROM avatar_categories WHERE code = 'characters' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);
INSERT INTO avatar_category_links (avatar_id, category_id)
SELECT a.id, c.id FROM avatars a, avatar_categories c
WHERE a.code = 'a-8ab7b714' AND c.id = (SELECT id FROM avatar_categories WHERE code = '' AND title = 'Зенлесс' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM avatar_category_links l WHERE l.avatar_id = a.id AND l.category_id = c.id);

-- ---------- Связи рамок с категориями ----------
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'wood' AND c.code = 'classic'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'silver' AND c.code = 'classic'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'gold' AND c.code = 'special'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'neon' AND c.code = 'glow'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'sakura' AND c.code = 'nature'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'emerald' AND c.code = 'nature'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'royal' AND c.code = 'special'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'cosmic' AND c.code = 'special'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'paper' AND c.code = 'classic'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'carbon' AND c.code = 'classic'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'ice' AND c.code = 'glow'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'lava' AND c.code = 'glow'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'galaxy' AND c.code = 'glow'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'honey' AND c.code = 'nature'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'candy' AND c.code = 'nature'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'steel' AND c.code = 'classic'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'venom' AND c.code = 'special'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'royal-blue' AND c.code = 'special'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'frame--fire' AND c.code = 'glow'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'frame--thunder' AND c.code = 'glow'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'frame--crystal' AND c.code = 'glow'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'frame--matrix' AND c.code = 'glow'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'frame--pulse' AND c.code = 'glow'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'frame--shadow' AND c.code = 'special'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'frame--rose' AND c.code = 'nature'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'frame--oak' AND c.code = 'nature'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'frame--marble' AND c.code = 'classic'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);
INSERT INTO frame_category_links (frame_id, category_id)
SELECT f.id, c.id FROM frames f, frame_categories c
WHERE f.code = 'frame--opal' AND c.code = 'special'
  AND NOT EXISTS (SELECT 1 FROM frame_category_links l WHERE l.frame_id = f.id AND l.category_id = c.id);

-- ---------- Связи акцентов с категориями ----------
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'blue' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'green' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'red' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'purple' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'orange' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'pink' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'teal' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'indigo' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'violet' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'magenta' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'coral' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'amber' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'mint' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'cyan' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'lime' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'navy' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'maroon' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'olive' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'brown' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'slate' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'sunset' AND c.code = 'gradient'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'ocean' AND c.code = 'gradient'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'forest' AND c.code = 'gradient'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'neon' AND c.code = 'gradient'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'gold' AND c.code = 'gradient'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'crimson' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'plum' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'rust' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'jade' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'sapphire' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'aqua' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'lavender' AND c.code = 'solid'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'sunburst' AND c.code = 'gradient'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'aurora' AND c.code = 'gradient'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'cosmic' AND c.code = 'gradient'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'meadow' AND c.code = 'gradient'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'dusk' AND c.code = 'gradient'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'sherbet' AND c.code = 'gradient'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'deepsea' AND c.code = 'gradient'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'rosegold' AND c.code = 'rare'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'sapphire-metal' AND c.code = 'rare'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'onyx' AND c.code = 'rare'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'hologram' AND c.code = 'rare'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);
INSERT INTO accent_category_links (accent_skin_id, category_id)
SELECT s.id, c.id FROM accent_skins s, accent_categories c
WHERE s.code = 'platinum' AND c.code = 'rare'
  AND NOT EXISTS (SELECT 1 FROM accent_category_links l WHERE l.accent_skin_id = s.id AND l.category_id = c.id);

-- ---------- Связи деревьев с категориями ----------
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'apple' AND c.code = 'fruit'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'birch' AND c.code = 'classic'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'palm' AND c.code = 'exotic'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'eucalyptus' AND c.code = 'exotic'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'orange' AND c.code = 'fruit'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'orange' AND c.code = 'exotic'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'lemon' AND c.code = 'fruit'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'lemon' AND c.code = 'exotic'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'mango' AND c.code = 'fruit'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'mango' AND c.code = 'exotic'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'coconut' AND c.code = 'exotic'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'oak' AND c.code = 'classic'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'maple' AND c.code = 'classic'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'willow' AND c.code = 'classic'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'banyan' AND c.code = 'exotic'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'cypress' AND c.code = 'conifer'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'fir' AND c.code = 'conifer'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'xmas' AND c.code = 'conifer'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'xmas' AND c.code = 'fantasy'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'sakura' AND c.code = 'blossom'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'cherry' AND c.code = 'fruit'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'cherry' AND c.code = 'blossom'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'jacaranda' AND c.code = 'blossom'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'neon' AND c.code = 'fantasy'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);
INSERT INTO tree_category_links (tree_skin_id, category_id)
SELECT t.id, c.id FROM tree_skins t, tree_categories c
WHERE t.code = 'crystal' AND c.code = 'fantasy'
  AND NOT EXISTS (SELECT 1 FROM tree_category_links l WHERE l.tree_skin_id = t.id AND l.category_id = c.id);

-- ---------- Еженедельный подарок (актуальная неделя на момент экспорта) ----------
INSERT INTO weekly_reward_configs (id, week_start, item_type, item_code, enabled, created_at)
SELECT nextval(pg_get_serial_sequence('weekly_reward_configs', 'id')), DATE '2026-10-19', 'AVATAR', 'cat-pilot', true, now()
WHERE NOT EXISTS (SELECT 1 FROM weekly_reward_configs WHERE week_start = DATE '2026-10-19');

