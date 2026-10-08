package coursework.taskboard.config;

import coursework.taskboard.model.achievement.Achievement;
import coursework.taskboard.model.consts.Accent;
import coursework.taskboard.model.consts.MimeType;
import coursework.taskboard.model.consts.StatusCategory;
import coursework.taskboard.model.shop.AccentSkin;
import coursework.taskboard.model.shop.Avatar;
import coursework.taskboard.model.shop.Frame;
import coursework.taskboard.model.shop.TreeSkin;
import coursework.taskboard.repository.achievement.AchievementRepository;
import coursework.taskboard.repository.consts.*;
import coursework.taskboard.repository.shop.AccentSkinRepository;
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
    private final AccentSkinRepository accentSkinRepository;

    @Override
    public void run(String... args) {
        initAccents();
        initStatusCategories();
        initMimeTypes();
        initAchievements();
        initAvatars();
        initFrames();
        initTreeSkins();
        initAccentSkins();
    }

    // ============================================================
    // ACCENTS (справочник общих цветов для UI)
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
    // AVATARS — оставим как было (не меняем)
    // ============================================================
    private void initAvatars() {
        if (avatarRepository.count() > 0) return;
        // ... оставляем существующий код
    }

    // ============================================================
    // FRAMES — оставим как было (не меняем)
    // ============================================================
    private void initFrames() {
        if (frameRepository.count() > 0) return;
        // ... оставляем существующий код
    }

    // ============================================================
    // TREE SKINS — оставим как было (не меняем)
    // ============================================================
    private void initTreeSkins() {
        if (treeSkinRepository.count() > 0) return;
        // ... оставляем существующий код
    }

    // ============================================================
    // ACCENT SKINS — цветовые схемы, которые покупаются в магазине
    // ============================================================
    private void initAccentSkins() {
        if (accentSkinRepository.count() > 0) return;
        accentSkinRepository.saveAll(List.of(
                // Базовые
                skin("blue",    "Синий",       "Классический синий",           30,  10),
                skin("green",   "Зелёный",     "Свежий зелёный",               30,  20),
                skin("red",     "Красный",     "Яркий красный",                30,  30),
                skin("purple",  "Пурпурный",   "Насыщенный пурпур",            40,  40),
                skin("orange",  "Оранжевый",   "Тёплый оранжевый",             40,  50),
                skin("pink",    "Розовый",     "Мягкий розовый",               40,  60),
                skin("teal",    "Бирюзовый",   "Морской бирюзовый",            50,  70),
                skin("indigo",  "Индиго",      "Глубокий индиго",              50,  80),

                // Средние
                skin("violet",  "Фиолетовый",  "Яркий фиолетовый",             75,  90),
                skin("magenta", "Маджента",    "Кричащая маджента",            75,  100),
                skin("coral",   "Коралловый",  "Тёплый коралл",                75,  110),
                skin("amber",   "Янтарный",    "Золотисто-янтарный",           75,  120),
                skin("mint",    "Мятный",      "Прохладный мятный",            75,  130),
                skin("cyan",    "Голубой",     "Небесно-голубой",              75,  140),
                skin("lime",    "Лаймовый",    "Кислотный лайм",               75,  150),

                // Дорогие
                skin("navy",    "Тёмно-синий", "Глубокий тёмно-синий",         150, 160),
                skin("maroon",  "Бордовый",    "Тёмный бордовый",              150, 170),
                skin("olive",   "Оливковый",   "Спокойный оливковый",          150, 180),
                skin("brown",   "Коричневый",  "Землистый коричневый",         150, 190),
                skin("slate",   "Графит",      "Строгий графит",               150, 200),

                // Редкие
                skin("sunset",  "Закат",       "Оранжево-розовый градиент",    300, 210),
                skin("ocean",   "Океан",       "Сине-бирюзовый градиент",      300, 220),
                skin("forest",  "Лес",         "Зелёно-оливковый градиент",    300, 230),
                skin("neon",    "Неон",        "Розово-голубое свечение",      500, 240),
                skin("gold",    "Золото",      "Роскошный золотой",            500, 250)
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

    private AccentSkin skin(String code, String title, String description,
                            int price, int sortOrder) {
        return AccentSkin.builder()
                .code(code)
                .title(title)
                .description(description)
                .price(price)
                .sortOrder(sortOrder)
                .build();
    }
}