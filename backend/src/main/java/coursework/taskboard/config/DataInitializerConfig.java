package coursework.taskboard.config;

import coursework.taskboard.model.achievement.Achievement;
import coursework.taskboard.model.consts.Accent;
import coursework.taskboard.model.consts.MimeType;
import coursework.taskboard.model.consts.StatusCategory;
import coursework.taskboard.model.shop.Avatar;
import coursework.taskboard.model.shop.Frame;
import coursework.taskboard.model.shop.TreeSkin;
import coursework.taskboard.repository.achievement.AchievementRepository;
import coursework.taskboard.repository.consts.*;
import coursework.taskboard.repository.shop.AvatarRepository;
import coursework.taskboard.repository.shop.FrameRepository;
import coursework.taskboard.repository.shop.TreeSkinRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializerConfig implements CommandLineRunner {

    private final AccentRepository accentRepository;
    private final StatusCategoryRepository statusCategoryRepository;
    private final MimeTypeRepository mimeTypeRepository;
    private final AchievementRepository achievementRepository;
    private final AvatarRepository avatarRepository;
    private final FrameRepository frameRepository;
    private final TreeSkinRepository treeSkinRepository;

    @Override
    public void run(String... args) {
        initAccents();
        initStatusCategories();
        initMimeTypes();
        initAchievements();
        initAvatars();
        initFrames();
        initTreeSkins();
    }

    // ============================================================
    // ACCENTS
    // ============================================================
    private void initAccents() {
        if (accentRepository.count() > 0) return;
        accentRepository.saveAll(List.of(
                Accent.builder().code("blue").label("Синий").build(),
                Accent.builder().code("indigo").label("Индиго").build(),
                Accent.builder().code("violet").label("Фиолетовый").build(),
                Accent.builder().code("purple").label("Пурпурный").build(),
                Accent.builder().code("pink").label("Розовый").build(),
                Accent.builder().code("magenta").label("Пурпурно-розовый").build(),
                Accent.builder().code("red").label("Красный").build(),
                Accent.builder().code("coral").label("Коралловый").build(),
                Accent.builder().code("orange").label("Оранжевый").build(),
                Accent.builder().code("amber").label("Янтарный").build(),
                Accent.builder().code("yellow").label("Жёлтый").build(),
                Accent.builder().code("lime").label("Лаймовый").build(),
                Accent.builder().code("green").label("Зелёный").build(),
                Accent.builder().code("mint").label("Мятный").build(),
                Accent.builder().code("teal").label("Бирюзовый").build(),
                Accent.builder().code("cyan").label("Голубой").build(),
                Accent.builder().code("sky").label("Небесный").build(),
                Accent.builder().code("navy").label("Тёмно-синий").build(),
                Accent.builder().code("maroon").label("Бордовый").build(),
                Accent.builder().code("olive").label("Оливковый").build(),
                Accent.builder().code("brown").label("Коричневый").build(),
                Accent.builder().code("gray").label("Серый").build(),
                Accent.builder().code("slate").label("Тёмно-серый").build()
        ));
    }

    // ============================================================
    // STATUS CATEGORIES
    // ============================================================
    private void initStatusCategories() {
        if (statusCategoryRepository.count() > 0) return;
        statusCategoryRepository.saveAll(List.of(
                StatusCategory.builder().code("ACTIVE").label("Активные").sortOrder(1).isFinal(false).build(),
                StatusCategory.builder().code("FROZEN").label("Отложенные").sortOrder(2).isFinal(false).build(),
                StatusCategory.builder().code("DONE").label("Выполненные").sortOrder(3).isFinal(true).build(),
                StatusCategory.builder().code("EXPIRED").label("Просроченные").sortOrder(4).isFinal(true).build(),
                StatusCategory.builder().code("CANCELLED").label("Отменённые").sortOrder(5).isFinal(true).build(),
                StatusCategory.builder().code("ARCHIVED").label("Архив").sortOrder(6).isFinal(true).build()
        ));
    }

    // ============================================================
    // MIME TYPES
    // ============================================================
    private void initMimeTypes() {
        if (mimeTypeRepository.count() > 0) return;
        mimeTypeRepository.saveAll(List.of(
                MimeType.builder().code("image/jpeg").build(),
                MimeType.builder().code("image/png").build(),
                MimeType.builder().code("image/gif").build(),
                MimeType.builder().code("image/webp").build(),
                MimeType.builder().code("image/svg+xml").build(),
                MimeType.builder().code("application/pdf").build(),
                MimeType.builder().code("application/msword").build(),
                MimeType.builder().code("application/vnd.openxmlformats-officedocument.wordprocessingml.document").build(),
                MimeType.builder().code("application/vnd.ms-excel").build(),
                MimeType.builder().code("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet").build(),
                MimeType.builder().code("text/plain").build(),
                MimeType.builder().code("text/csv").build(),
                MimeType.builder().code("text/markdown").build(),
                MimeType.builder().code("application/zip").build(),
                MimeType.builder().code("application/x-7z-compressed").build(),
                MimeType.builder().code("application/x-rar-compressed").build()
        ));
    }

    // ============================================================
    // ACHIEVEMENTS
    // ============================================================
    private void initAchievements() {
        if (achievementRepository.count() > 0) return;
        achievementRepository.saveAll(List.of(
                ach("FIRST_TASK",     "🌱 Росток",            "Закрыта первая задача",                          "🌱", "green",  "TASKS_DONE_TOTAL",   1,   10,  5),
                ach("TEN_TASKS",      "🌿 Первые шаги",        "Закрыто 10 задач",                               "🌿", "green",  "TASKS_DONE_TOTAL",   10,  20,  10),
                ach("FIFTY_TASKS",    "🌳 Полтинник",          "Закрыто 50 задач",                               "🌳", "green",  "TASKS_DONE_TOTAL",   50,  30,  25),
                ach("HUNDRED_TASKS",  "🏆 Сотня",              "Закрыто 100 задач",                              "🏆", "amber",  "TASKS_DONE_TOTAL",   100, 40,  50),
                ach("FIVE_HUNDRED",   "🚀 Пятьсот",            "Закрыто 500 задач",                              "🚀", "purple", "TASKS_DONE_TOTAL",   500, 50,  200),
                ach("MARATHON_10",    "⚡ Марафонец",          "10 задач за один день",                          "⚡", "amber",  "TASKS_DONE_DAY",     10,  60,  15),
                ach("FIRE_25",        "🔥 Огонь",              "25 задач за один день",                          "🔥", "red",    "TASKS_DONE_DAY",     25,  70,  40),
                ach("WEEK_STREAK",    "📅 Стабильность",       "Задачи закрывались 7 дней подряд",               "📅", "blue",   "STREAK_DAYS",        7,   80,  30),
                ach("MONTH_STREAK",   "💪 Дисциплина",         "30 дней подряд с закрытыми задачами",            "💪", "purple", "STREAK_DAYS",        30,  90,  100),
                ach("FIVE_BOARDS",    "📋 Хранитель досок",    "Создано 5 досок",                                "📋", "blue",   "BOARDS_CREATED",     5,   100, 20),
                ach("TEN_PROJECTS",   "🗂️ Стратег",            "Создано 10 проектов",                            "🗂️", "indigo", "PROJECTS_CREATED",   10,  110, 40),
                ach("COVER_SET",      "🎨 Оформитель",         "У доски установлена обложка",                    "🎨", "pink",   "BOARD_COVER_SET",    1,   120, 10),
                ach("FIRST_EXPIRED",  "⏰ Первый просроченный", "Первая просроченная задача. Ничего страшного!",  "⏰", "slate",  "EXPIRED_FIRST",      1,   130, 1),
                ach("DEBTOR",         "💀 Должник",            "10 просроченных задач",                          "💀", "maroon", "EXPIRED_TOTAL",      10,  140, 5),
                ach("ON_TIME_10",     "🎯 В срок",             "10 задач закрыто до дедлайна",                   "🎯", "teal",   "ON_TIME_TOTAL",      10,  150, 30),
                ach("NIGHT_OWL",      "🦉 Ночной сторож",      "Задача закрыта после 23:00",                     "🦉", "violet", "NIGHT_TASK",         1,   160, 10),
                ach("TREE_YOUNG",     "🌸 Сакура цветёт",      "Дерево выросло до стадии «молодое»",             "🌸", "pink",   "TREE_STAGE",         1,   170, 20),
                ach("TREE_MATURE",    "🌳 Могучий дуб",        "Дерево выросло до стадии «взрослое»",            "🌳", "green",  "TREE_STAGE",         2,   180, 50),
                ach("TREE_HARVEST",   "🍎 Урожай",             "Взрослое дерево и 100 закрытых задач",           "🍎", "red",    "TREE_HARVEST",       1,   190, 75),
                ach("DUCK",           "🦆 Утка-программист",   "Задача с текстом «утка»",                        "🦆", "yellow", "TEXT_CONTAINS",      1,   200, 5),
                ach("NINJA",          "🥷 Ниндзя",             "5 задач за 10 минут",                            "🥷", "slate",  "NINJA_10MIN",        1,   210, 20),
                ach("CLEAN_WEEK",     "🧹 Чистюля",            "Неделя без просроченных задач",                  "🧹", "mint",   "CLEAN_WEEK",         1,   220, 30),
                ach("JOKER",          "🎭 Шутник",             "Задача со словом «лол» или «:D»",                "🎭", "magenta","TEXT_CONTAINS",      1,   230, 5),
                ach("XMAS_TREE",      "🎄 Новый год!",         "Ёлка полностью наряжена и гирлянда горит",       "🎄", "red",    "XMAS_TREE_DONE",     1,   240, 100)
        ));
    }

    // ============================================================
    // AVATARS
    // ============================================================
    private void initAvatars() {
        if (avatarRepository.count() > 0) return;

        avatarRepository.saveAll(List.of(
                // === Растровые картинки из frontend/public/avatars/*.jpeg ===
                avatar("anime-1",       "Аянокоджи Киетака",        "Аниме",         "/avatars/anime-1.jpg",       10,   10),
                avatar("anime-2",       "Аля",       "Аниме",        "/avatars/anime-2.jpg",       10,   20),
                avatar("anime-3",       "Сон Джин Ву",     "Аниме",        "/avatars/anime-3.jpg",       15,   30),
                avatar("anime-4",       "Леви Аккерман",     "Аниме",           "/avatars/anime-4.jpg",       15,   40),
                avatar("anime-5",       "Фрирен",          "Аниме",        "/avatars/anime-5.jpg",       20,   50),
                avatar("anime-6",       "Макима",    "Аниме", "/avatars/anime-6.jpg",       20,   60),
                avatar("anime-7",       "Дендзи",     "Аниме",        "/avatars/anime-7.jpg",       25,   70),
                avatar("anime-8",       "Хошино Ай",    "Аниме",     "/avatars/anime-8.jpg",       25,   80),
                avatar("cat-pilot",     "Кот-пилот",           "Мем",            "/avatars/cat-pilot.jpg",     150,  90),
                avatar("genshin-1",     "Чиби-скирк",             "Геншин",        "/avatars/genshin-1.jpg",     30,   100),
                avatar("moon-sea",      "Лунное море",         "Пейзаж",         "/avatars/moon-sea.jpg",      50,   110),
                avatar("mountain",      "Горы и озеро",        "Пейзаж",         "/avatars/mountain.jpg",      75,   120),
                avatar("sakura-moon",   "Сакура и луна",       "Пейзаж",         "/avatars/sakura-moon.jpg",   100,  130),
                avatar("sunset-beach",  "Закат на пляже",      "Пейзаж",         "/avatars/sunset-beach.jpg",  50,   140),
                avatar("zzz-1",         "Хосими Мияби",      "Зенлесс",          "/avatars/zzz-1.jpg",         30,   150),
                avatar("zzz-2",         "Укинами Юдзуха","Зенлесс",          "/avatars/zzz-2.jpg",         30,   160),

                // === SVG-аватарки (без imageUrl, рисуются в SvgAvatars.jsx) ===
                avatar("a-wizard",      "Волшебник",        "Маг",           null, 20,  200),
                avatar("a-devil",       "Демон",            "Огонь",         null, 20,  210),
                avatar("a-viking",      "Викинг",           "Скандинав",     null, 25,  220),
                avatar("a-unicorn",     "Единорог",         "Радуга",        null, 30,  230),
                avatar("a-pizza",       "Пицца",            "Еда",           null, 15,  240),
                avatar("a-bear",        "Медведь",          "Лес",           null, 20,  250),
                avatar("a-lightning",   "Молния",           "Энергия",       null, 25,  260),
                avatar("a-sunflower",   "Подсолнух",        "Цветок",        null, 20,  270),
                avatar("a-rocket",      "Ракета",           "Космос",        null, 30,  280),
                avatar("a-soccer",      "Футбол",           "Спорт",         null, 20,  290),
                avatar("a-ninja",       "Ниндзя",           "Тень",          null, 30,  300),
                avatar("a-skull",       "Скелет",           "Хэллоуин",      null, 35,  310),
                avatar("a-shark",       "Акула",            "Океан",         null, 40,  320),
                avatar("a-leprechaun",  "Лепрекон",         "Ирландия",      null, 45,  330),
                avatar("a-queen",       "Королева",         "Карты",         null, 40,  340),
                avatar("a-potion",      "Зелье",            "Алхимия",       null, 50,  350),
                avatar("a-pirate",      "Пират",            "Море",          null, 35,  360),
                avatar("a-gargoyle",    "Гаргулья",         "Камень",        null, 45,  370),
                avatar("a-paper",       "Самолётик",        "Детство",       null, 30,  380),
                avatar("a-reaper",      "Жнец",             "Смерть",        null, 50,  390),
                avatar("a-pink-mon",    "Розовый монстр",   "Милый",         null, 40,  400),
                avatar("a-mummy",       "Мумия",            "Египет",        null, 35,  410),
                avatar("a-board",       "Шахматы",          "Игра",          null, 30,  420),
                avatar("a-lama",        "Лама",             "Животное",      null, 35,  430),
                avatar("a-ghost",       "Призрак",          "Мистика",       null, 30,  440),
                avatar("a-squirrel",    "Белка",            "Лес",           null, 25,  450),
                avatar("a-donkey",      "Осёл",             "Ферма",         null, 25,  460),
                avatar("a-dog",         "Собака",           "Домашний",      null, 25,  470),
                avatar("a-raccoon",     "Енот",             "Ночь",          null, 30,  480),
                avatar("a-cupcake",     "Капкейк",          "Сладкий",       null, 30,  490),
                avatar("a-piggy",       "Свинка",           "Ферма",         null, 25,  500),
                avatar("a-penguin",     "Пингвин",          "Антарктика",    null, 30,  510),
                avatar("a-astronaut",   "Космонавт",        "Космос",        null, 40,  520),
                avatar("a-burger",      "Бургер",           "Еда",           null, 25,  530),
                avatar("a-bee",         "Пчела",            "Мёд",           null, 25,  540),
                avatar("a-zombie",      "Зомби",            "Хэллоуин",      null, 35,  550),
                avatar("a-alien",       "Пришелец",         "Космос",        null, 35,  560),
                avatar("a-pirate2",     "Пират в шляпе",    "Аниме",         null, 40,  570),
                avatar("a-hook",        "Крюк",             "Пират",         null, 40,  580),
                avatar("a-clown",       "Клоун",            "Цирк",          null, 30,  590)
        ));
    }

    // ============================================================
    // FRAMES
    // ============================================================
    private void initFrames() {
        if (frameRepository.count() > 0) return;
        frameRepository.saveAll(List.of(
                frame("none",     "Без рамки",   "Обычная аватарка",             "",                0,    10),
                frame("wood",     "Дерево",      "Тёплая деревянная рамка",      "frame--wood",     10,   20),
                frame("silver",   "Серебро",     "Серебристая тонкая рамка",     "frame--silver",   25,   30),
                frame("gold",     "Золото",      "Классическая золотая рамка",   "frame--gold",     50,   40),
                frame("neon",     "Неон",        "Светящаяся неоновая рамка",    "frame--neon",     75,   50),
                frame("sakura",   "Сакура",      "Розовая рамка с лепестками",   "frame--sakura",   100,  60),
                frame("emerald",  "Изумруд",     "Зелёная рамка с блеском",      "frame--emerald",  150,  70),
                frame("royal",    "Королевская", "Роскошь с золотом и фиолетом", "frame--royal",    300,  80),
                frame("cosmic",   "Космос",      "Звёздная анимированная рамка", "frame--cosmic",   500,  90),
                frame("rainbow",  "Радуга",      "Переливающаяся рамка",         "frame--rainbow",  1000, 100)
        ));
    }

    // ============================================================
    // TREE SKINS
    // ============================================================
    private void initTreeSkins() {
        if (treeSkinRepository.count() > 0) return;
        treeSkinRepository.saveAll(List.of(
                skin("apple",   "Яблоня",  "Яблоня с плодами",             "apple",   0,    10),
                skin("palm",    "Пальма",  "Тропическая пальма",           "palm",    0,    20),
                skin("birch",   "Берёза",  "Стройная белая берёза",        "birch",   100,  30),
                skin("sakura",  "Сакура",  "Классическая японская сакура", "sakura",  200,  40),
                skin("neon",    "Неон",    "Дерево из неоновых огней",     "neon",    400,  50),
                skin("crystal", "Кристалл","Кристаллическое дерево",       "crystal", 600,  60),
                skin("xmas",    "Ёлка",    "Новогодняя ёлка: наряжается",  "xmas",    1000, 70)
        ));
    }

    // ============================================================
    // HELPERS
    // ============================================================
    private Achievement ach(String code, String title, String description, String icon,
                            String accent, String conditionType, int threshold,
                            int sortOrder, int reward) {
        return Achievement.builder()
                .code(code).title(title).description(description).icon(icon)
                .accentCode(accent).conditionType(conditionType)
                .threshold(threshold).sortOrder(sortOrder).reward(reward)
                .build();
    }

    private Avatar avatar(String code, String title, String description,
                          String imageUrl, int price, int sortOrder) {
        return Avatar.builder()
                .code(code)
                .title(title)
                .description(description)
                .imageUrl(imageUrl)
                .price(price)
                .sortOrder(sortOrder)
                .build();
    }

    private Frame frame(String code, String title, String description, String cssClass,
                        int price, int sortOrder) {
        return Frame.builder()
                .code(code).title(title).description(description)
                .cssClass(cssClass).price(price).sortOrder(sortOrder)
                .build();
    }

    private TreeSkin skin(String code, String title, String description, String cssClass,
                          int price, int sortOrder) {
        return TreeSkin.builder()
                .code(code).title(title).description(description)
                .price(price).sortOrder(sortOrder)
                .build();
    }
}