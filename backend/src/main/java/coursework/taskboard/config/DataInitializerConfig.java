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

    // ============================================================
    // ACHIEVEMENTS
    // ============================================================
    private void initAchievements() {
        if (achievementRepository.count() > 0) return;
        achievementRepository.saveAll(List.of(
                ach("FIRST_TASK",     "🌱 Росток",            "Закрыта первая задача",                          "🌱", "green",  "TASKS_DONE_TOTAL",   1,   10,  50,   null,   null),
                ach("TEN_TASKS",      "🌿 Первые шаги",        "Закрыто 10 задач",                               "🌿", "green",  "TASKS_DONE_TOTAL",   10,  20,  200,  null,   null),
                ach("FIFTY_TASKS",    "🌳 Полтинник",          "Закрыто 50 задач",                               "🌳", "green",  "TASKS_DONE_TOTAL",   50,  30,  700,  null,   null),
                ach("HUNDRED_TASKS",  "🏆 Сотня",              "Закрыто 100 задач",                              "🏆", "amber",  "TASKS_DONE_TOTAL",   100, 40,  1500, "ACCENT", "forest"),
                ach("FIVE_HUNDRED",   "🚀 Пятьсот",            "Закрыто 500 задач",                              "🚀", "purple", "TASKS_DONE_TOTAL",   500, 50,  5000, "FRAME",  "oak"),
                ach("MARATHON_10",    "⚡ Марафонец",          "10 задач за один день",                          "⚡", "amber",  "TASKS_DONE_DAY",     10,  60,  300,  null,   null),
                ach("FIRE_25",        "🔥 Огонь",              "25 задач за один день",                          "🔥", "red",    "TASKS_DONE_DAY",     25,  70,  1000, null,   null),
                ach("WEEK_STREAK",    "📅 Стабильность",       "Задачи закрывались 7 дней подряд",               "📅", "blue",   "STREAK_DAYS",        7,   80,  500,  null,   null),
                ach("MONTH_STREAK",   "💪 Дисциплина",         "30 дней подряд с закрытыми задачами",            "💪", "purple", "STREAK_DAYS",        30,  90,  3000, "FRAME",  "pulse"),
                ach("FIVE_BOARDS",    "📋 Хранитель досок",    "Создано 5 досок",                                "📋", "blue",   "BOARDS_CREATED",     5,   100, 300,  null,   null),
                ach("TEN_PROJECTS",   "🗂️ Стратег",            "Создано 10 проектов",                            "🗂️", "indigo", "PROJECTS_CREATED",   10,  110, 600,  null,   null),
                ach("COVER_SET",      "🎨 Оформитель",         "У доски установлена обложка",                    "🎨", "pink",   "BOARD_COVER_SET",    1,   120, 100,  null,   null),
                ach("FIRST_EXPIRED",  "⏰ Первый просроченный", "Первая просроченная задача. Ничего страшного!",  "⏰", "slate",  "EXPIRED_FIRST",      1,   130, 20,   null,   null),
                ach("DEBTOR",         "💀 Должник",            "10 просроченных задач",                          "💀", "maroon", "EXPIRED_TOTAL",      10,  140, 50,   null,   null),
                ach("ON_TIME_10",     "🎯 В срок",             "10 задач закрыто до дедлайна",                   "🎯", "teal",   "ON_TIME_TOTAL",      10,  150, 400,  null,   null),
                ach("NIGHT_OWL",      "🦉 Ночной сторож",      "Задача закрыта после 23:00",                     "🦉", "violet", "NIGHT_TASK",         1,   160, 100,  null,   null),
                ach("TREE_YOUNG",     "🌸 Сакура цветёт",      "Дерево выросло до стадии «молодое»",             "🌸", "pink",   "TREE_STAGE",         1,   170, 250,  null,   null),
                ach("TREE_MATURE",    "🌳 Могучий дуб",        "Дерево выросло до стадии «взрослое»",            "🌳", "green",  "TREE_STAGE",         2,   180, 600,  "TREE",  "oak"),
                ach("TREE_HARVEST",   "🍎 Урожай",             "Взрослое дерево и 100 закрытых задач",           "🍎", "red",    "TREE_HARVEST",       1,   190, 1000, "TREE",  "cherry"),
                ach("DUCK",           "🦆 Утка-программист",   "Задача с текстом «утка»",                        "🦆", "yellow", "TEXT_CONTAINS",      1,   200, 30,   null,   null),
                ach("NINJA",          "🥷 Ниндзя",             "5 задач за 10 минут",                            "🥷", "slate",  "NINJA_10MIN",        1,   210, 300,  null,   null),
                ach("CLEAN_WEEK",     "🧹 Чистюля",            "Неделя без просроченных задач",                  "🧹", "mint",   "CLEAN_WEEK",         1,   220, 500,  null,   null),
                ach("JOKER",          "🎭 Шутник",             "Задача со словом «лол» или «:D»",                "🎭", "magenta","TEXT_CONTAINS",      1,   230, 30,   null,   null),
                ach("XMAS_TREE",      "🎄 Новый год!",         "Ёлка полностью наряжена и гирлянда горит",       "🎄", "red",    "XMAS_TREE_DONE",     1,   240, 2000, "TREE",  "xmas")
        ));
    }

    // ============================================================
    // AVATARS — оставим как было
    // ============================================================
    private void initAvatars() {
        if (avatarRepository.count() > 0) return;
        // ...
    }

    // ============================================================
    // FRAMES — оставим как было
    // ============================================================
    private void initFrames() {
        if (frameRepository.count() > 0) return;
        // ...
    }

    // ============================================================
    // TREE SKINS
    // ============================================================
    private void initTreeSkins() {
        if (treeSkinRepository.count() > 0) return;
        treeSkinRepository.saveAll(List.of(
                treeSkin("sakura", "Сакура",  "Нежная цветущая сакура",        2000, 10),
                treeSkin("birch",  "Берёза",  "Стройная белоствольная берёза", 200,  20),
                treeSkin("palm",   "Пальма",  "Тропическая пальма",            500,  30),
                treeSkin("apple",  "Яблоня",  "Яблоня с красными плодами",     1000, 40),
                treeSkin("oak",    "Дуб",     "Могучий вековой дуб",           2500, 50),
                treeSkin("cherry", "Вишня",   "Цветущая вишня",                1500, 60),
                treeSkin("xmas",   "Ёлка",    "Новогодняя ёлка",               4000, 70)
        ));
    }

    private TreeSkin treeSkin(String code, String title, String description,
                              int price, int sortOrder) {
        return TreeSkin.builder()
                .code(code)
                .title(title)
                .description(description)
                .price(price)
                .sortOrder(sortOrder)
                .build();
    }

    // ============================================================
    // ACCENT SKINS — оставим как было
    // ============================================================
    private void initAccentSkins() {
        if (accentSkinRepository.count() > 0) return;
        // ...
    }

    // ============================================================
    // HELPERS
    // ============================================================
    private Achievement ach(String code, String title, String description, String icon,
                            String accent, String conditionType, int threshold,
                            int sortOrder, int reward,
                            String rewardItemType, String rewardItemCode) {
        return Achievement.builder()
                .code(code).title(title).description(description).icon(icon)
                .accentCode(accent).conditionType(conditionType)
                .threshold(threshold).sortOrder(sortOrder).reward(reward)
                .rewardItemType(rewardItemType)
                .rewardItemCode(rewardItemCode)
                .build();
    }
}