package coursework.taskboard.config;

import coursework.taskboard.model.achievement.Achievement;
import coursework.taskboard.model.consts.Accent;
import coursework.taskboard.model.consts.MimeType;
import coursework.taskboard.model.consts.StatusCategory;
import coursework.taskboard.model.shop.AccentSkin;
import coursework.taskboard.model.shop.Avatar;
import coursework.taskboard.model.shop.Frame;
import coursework.taskboard.model.shop.TreeSkin;
import coursework.taskboard.model.template.Guide;
import coursework.taskboard.model.template.GuideTask;
import coursework.taskboard.repository.achievement.AchievementRepository;
import coursework.taskboard.repository.consts.*;
import coursework.taskboard.repository.shop.AccentSkinRepository;
import coursework.taskboard.repository.shop.AvatarRepository;
import coursework.taskboard.repository.shop.FrameRepository;
import coursework.taskboard.repository.shop.TreeSkinRepository;
import coursework.taskboard.repository.template.GuideRepository;
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
    private final GuideRepository guideRepository;

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
        initGuides();
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
    //
    // reward — листья. Масштаб согласован с 027-profile-social-and-economy.yaml
    // и с ценами магазина (топовый предмет = 5000):
    //   первый день    — 30–100
    //   первая неделя  — 250–800 (в сумме ~5600, хватает на топ)
    //   длинный хвост  — 1500–2000
    // Доход без ачивок: 30 листьев за задачу (до 12/день) + 150 за каждые
    // 10 закрытых задач.
    // ============================================================
    private void initAchievements() {
        if (achievementRepository.count() > 0) return;
        achievementRepository.saveAll(List.of(
                ach("FIRST_TASK",     "🌱 Росток",            "Закрыта первая задача",                          "🌱", "green",  "TASKS_DONE_TOTAL",   1,   10,  100,  null,   null),
                ach("TEN_TASKS",      "🌿 Первые шаги",        "Закрыто 10 задач",                               "🌿", "green",  "TASKS_DONE_TOTAL",   10,  20,  250,  null,   null),
                ach("FIFTY_TASKS",    "🌳 Полтинник",          "Закрыто 50 задач",                               "🌳", "green",  "TASKS_DONE_TOTAL",   50,  30,  700,  null,   null),
                ach("HUNDRED_TASKS",  "🏆 Сотня",              "Закрыто 100 задач",                              "🏆", "amber",  "TASKS_DONE_TOTAL",   100, 40,  1500, "ACCENT", "forest"),
                ach("FIVE_HUNDRED",   "🚀 Пятьсот",            "Закрыто 500 задач",                              "🚀", "purple", "TASKS_DONE_TOTAL",   500, 50,  2000, "FRAME",  "oak"),
                ach("MARATHON_10",    "⚡ Марафонец",          "10 задач за один день",                          "⚡", "amber",  "TASKS_DONE_DAY",     10,  60,  300,  null,   null),
                ach("FIRE_25",        "🔥 Огонь",              "25 задач за один день",                          "🔥", "red",    "TASKS_DONE_DAY",     25,  70,  800,  null,   null),
                ach("WEEK_STREAK",    "📅 Стабильность",       "Задачи закрывались 7 дней подряд",               "📅", "blue",   "STREAK_DAYS",        7,   80,  400,  null,   null),
                ach("MONTH_STREAK",   "💪 Дисциплина",         "30 дней подряд с закрытыми задачами",            "💪", "purple", "STREAK_DAYS",        30,  90,  1500, "FRAME",  "pulse"),
                ach("FIVE_BOARDS",    "📋 Хранитель досок",    "Создано 5 досок",                                "📋", "blue",   "BOARDS_CREATED",     5,   100, 250,  null,   null),
                ach("TEN_PROJECTS",   "🗂️ Стратег",            "Создано 10 проектов",                            "🗂️", "indigo", "PROJECTS_CREATED",   10,  110, 400,  null,   null),
                ach("COVER_SET",      "🎨 Оформитель",         "У доски установлена обложка",                    "🎨", "pink",   "BOARD_COVER_SET",    1,   120, 100,  null,   null),
                ach("FIRST_EXPIRED",  "⏰ Первый просроченный", "Первая просроченная задача. Ничего страшного!",  "⏰", "slate",  "EXPIRED_FIRST",      1,   130, 30,   null,   null),
                ach("DEBTOR",         "💀 Должник",            "10 просроченных задач",                          "💀", "maroon", "EXPIRED_TOTAL",      10,  140, 60,   null,   null),
                ach("ON_TIME_10",     "🎯 В срок",             "10 задач закрыто до дедлайна",                   "🎯", "teal",   "ON_TIME_TOTAL",      10,  150, 300,  null,   null),
                ach("NIGHT_OWL",      "🦉 Ночной сторож",      "Задача закрыта после 23:00",                     "🦉", "violet", "NIGHT_TASK",         1,   160, 100,  null,   null),
                ach("TREE_YOUNG",     "🌸 Сакура цветёт",      "Дерево выросло до стадии «молодое»",             "🌸", "pink",   "TREE_STAGE",         1,   170, 300,  null,   null),
                ach("TREE_MATURE",    "🌳 Могучий дуб",        "Дерево выросло до стадии «взрослое»",            "🌳", "green",  "TREE_STAGE",         2,   180, 600,  "TREE",  "oak"),
                ach("TREE_HARVEST",   "🍎 Урожай",             "Взрослое дерево и 100 закрытых задач",           "🍎", "red",    "TREE_HARVEST",       1,   190, 1500, "TREE",  "cherry"),
                ach("DUCK",           "🦆 Утка-программист",   "Задача с текстом «утка»",                        "🦆", "yellow", "TEXT_CONTAINS",      1,   200, 50,   null,   null),
                ach("NINJA",          "🥷 Ниндзя",             "5 задач за 10 минут",                            "🥷", "slate",  "NINJA_10MIN",        1,   210, 300,  null,   null),
                ach("CLEAN_WEEK",     "🧹 Чистюля",            "Неделя без просроченных задач",                  "🧹", "mint",   "CLEAN_WEEK",         1,   220, 500,  null,   null),
                ach("JOKER",          "🎭 Шутник",             "Задача со словом «лол» или «:D»",                "🎭", "magenta","TEXT_CONTAINS",      1,   230, 50,   null,   null),
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
        // Цены согласованы с 021-shop-economy-rebalance.yaml.
        // Ориентир: за первые 3 дня активный пользователь набирает ~600–700
        // листьев, значит 600 — «первая серьёзная покупка», 2000–2500 — топ.
        treeSkinRepository.saveAll(List.of(
                treeSkin("birch",  "Берёза",  "Стройная белоствольная берёза", 40,   10),
                treeSkin("oak",    "Дуб",     "Могучий вековой дуб",           100,  20),
                treeSkin("palm",   "Пальма",  "Тропическая пальма",            400,  30),
                treeSkin("apple",  "Яблоня",  "Яблоня с красными плодами",     600,  40),
                treeSkin("cherry", "Вишня",   "Цветущая вишня",                1200, 50),
                treeSkin("sakura", "Сакура",  "Нежная цветущая сакура",        2000, 60),
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
    // GUIDES — встроенные гайды на неделю и месяц
    // ============================================================
    private void initGuides() {
        if (guideRepository.countByIsSystemTrue() > 0) return;

        Guide week = Guide.builder()
                .owner(null)
                .isSystem(true)
                .title("Неделя ясности")
                .subtitle("7 дней, чтобы разобрать завалы и войти в рабочий ритм")
                .description("Мягкий недельный сценарий: сначала навести порядок в делах, "
                        + "затем — глубокая работа и восстановление. Подойдёт, если неделя "
                        + "начинается хаотично и хочется вернуть контроль без перегрузки.")
                .periodType("WEEK")
                .accent("teal")
                .emoji("🗓️")
                .build();

        week.getTasks().add(gt(week, 0, 0, "Спланировать неделю",
                "Выделите 20–30 минут утром: что действительно важно на этой неделе?",
                3, 30, "Выписать все задачи и идеи", "Выбрать 3 главные цели", "Забронировать время в календаре"));
        week.getTasks().add(gt(week, 1, 0, "Разобрать входящие",
                "Почта, мессенджеры, заметки — всё, что накопилось за выходные. "
                        + "Цель: ноль непрочитанных в рабочем чате.", 2, 40,
                "Ответить на срочные сообщения", "Отписаться от лишних рассылок", "Разложить заметки по проектам"));
        week.getTasks().add(gt(week, 2, 1, "Блок глубокой работы",
                "90 минут без уведомлений над одной главной задачей. Телефон — в другой комнате.",
                3, 90, "Выключить уведомления", "Поставить таймер на 90 минут", "Записать результат"));
        week.getTasks().add(gt(week, 3, 1, "Короткая тренировка или прогулка",
                "20–30 минут движения. Это не про спорт, а про перезагрузку головы.", 1, 30));
        week.getTasks().add(gt(week, 4, 2, "Закрыть три мелкие задачи",
                "Соберите мелкие дела до 15 минут и закройте их одним блоком.", 2, 60,
                "Найти три задачи из бэклога", "Сделать их подряд", "Отметить выполненное"));
        week.getTasks().add(gt(week, 5, 3, "Ревью середины недели",
                "Проверьте прогресс по трём целям. Что идёт по плану, а что пора упростить?", 2, 20,
                "Сверить цели и сделанное", "Перенести лишнее", "Выбрать фокус на оставшиеся дни"));
        week.getTasks().add(gt(week, 6, 4, "Доделать одну важную задачу",
                "Никаких новых начинаний — только довести до конца то, что уже в работе.", 3, 90));
        week.getTasks().add(gt(week, 7, 5, "Убрать рабочее место",
                "5–10 минут порядка снижают трение на следующей неделе.", 1, 15,
                "Убрать бумаги", "Закрыть лишние вкладки", "Подготовить стол к понедельнику"));
        week.getTasks().add(gt(week, 8, 5, "Час без экранов",
                "Книга, прогулка, разговор — что угодно, но без телефона.", 1, 60));
        week.getTasks().add(gt(week, 9, 6, "Подвести итоги недели",
                "Что получилось? Что забрало больше сил, чем ожидалось? Что меняем?", 2, 25,
                "Выписать три победы", "Отметить, что не сделано и почему", "Наметить фокус на следующую неделю"));
        week.getTasks().add(gt(week, 10, 6, "Подготовиться к понедельнику",
                "Пять минут: выбрать первую задачу следующей недели и записать её.", 1, 10));
        guideRepository.save(week);

        Guide month = Guide.builder()
                .owner(null)
                .isSystem(true)
                .title("Месяц больших целей")
                .subtitle("4 недели: от формулировки цели до первого измеримого результата")
                .description("Гайд для тех, кто хочет сдвинуть одну большую цель с места, "
                        + "а не распыляться на десять. Каждую неделю — своя тема: "
                        + "намерение, разгон, глубина и закрепление результата.")
                .periodType("MONTH")
                .accent("purple")
                .emoji("🚀")
                .build();

        month.getTasks().add(gt(month, 0, 0, "Сформулировать цель месяца",
                "Одна цель, которую можно проверить в конце месяца. Не «стать лучше», "
                        + "а «сдать проект», «пробежать 10 км», «запустить лендинг».", 3, 40,
                "Записать цель одной фразой", "Определить измеримый результат", "Спросить себя: зачем это мне"));
        month.getTasks().add(gt(month, 1, 1, "Провести аудит времени",
                "Три дня наблюдений за тем, куда уходит время. Без оценок — только факты.", 2, 20,
                "Выбрать способ фиксации", "Записывать дела 3 дня", "Найти два «пожирателя времени»"));
        month.getTasks().add(gt(month, 2, 2, "Разложить цель на этапы",
                "Разбейте месяц на четыре недельных результата. Каждый должен быть виден снаружи.", 3, 45,
                "Выписать 4 промежуточных результата", "Назначить дату каждому", "Убрать лишние шаги"));
        month.getTasks().add(gt(month, 3, 4, "Создать ритуал старта",
                "Маленькое действие, с которого начинается каждый рабочий день "
                        + "(например, 10 минут планирования).", 2, 15));
        month.getTasks().add(gt(month, 4, 6, "Первый спринт: 3 дня фокуса",
                "Три дня по 60–90 минут только на главную цель. Остальное — по остаточному принципу.",
                3, 90, "Очистить календарь", "Работать блоками", "Записывать прогресс"));
        month.getTasks().add(gt(month, 5, 7, "Недельное ревью №1",
                "Что сработало? Где вы сорвались? Скорректируйте план, а не вините себя.", 2, 25,
                "Сверить результат недели с планом", "Убрать один лишний шаг", "Выбрать фокус следующей недели"));
        month.getTasks().add(gt(month, 6, 9, "Убрать одно препятствие",
                "Найдите главную причину, по которой цель буксует, и устраните её.", 3, 60,
                "Сформулировать препятствие", "Придумать три решения", "Сделать самое дешёвое из них"));
        month.getTasks().add(gt(month, 7, 11, "Спросить обратную связь",
                "Покажите промежуточный результат человеку, который разбирается в теме.", 2, 30,
                "Выбрать человека", "Отправить результат", "Записать три замечания"));
        month.getTasks().add(gt(month, 8, 13, "Половина пути: честная проверка",
                "Середина месяца. Сравните факт с планом и решите: ускоряемся или упрощаем.", 3, 30,
                "Посчитать сделанное", "Сравнить с планом", "Принять одно решение"));
        month.getTasks().add(gt(month, 9, 15, "Углубиться в главное",
                "Один день без мелких задач. Только то, что приближает к результату.", 3, 120));
        month.getTasks().add(gt(month, 10, 17, "Ревью №2 и разгрузка",
                "Проверьте список дел: что можно не делать вообще? Уберите лишнее.", 2, 25,
                "Просмотреть бэклог", "Удалить или отложить лишнее", "Оставить три задачи"));
        month.getTasks().add(gt(month, 11, 19, "Собрать черновик результата",
                "Даже если не готово — соберите версию, которую можно показать.", 3, 90));
        month.getTasks().add(gt(month, 12, 21, "Финальная полировка",
                "Последние штрихи: проверьте детали, которые заметит другой человек.", 2, 60,
                "Пройтись по чек-листу", "Исправить три главные шероховатости", "Показать результат"));
        month.getTasks().add(gt(month, 13, 23, "Публично закрыть цель",
                "Расскажите о результате: пост, сообщение, презентация. Фиксация важна.", 2, 30));
        month.getTasks().add(gt(month, 14, 25, "Разобрать выводы",
                "Что помогло, что мешало, что заберём в следующий месяц.", 2, 30,
                "Выписать три вывода", "Сохранить рабочие приёмы", "Выбрать цель на следующий месяц"));
        month.getTasks().add(gt(month, 15, 27, "План восстановления",
                "После рывка нужен отдых. Запланируйте день без задач и экранов.", 1, 15));
        guideRepository.save(month);
    }

    private GuideTask gt(Guide guide, int position, int dayOffset, String title,
                         String description, int priority, Integer minutes, String... subtasks) {
        return GuideTask.builder()
                .guide(guide)
                .position(position)
                .dayOffset(dayOffset)
                .title(title)
                .description(description)
                .priority((short) priority)
                .statusCategoryCode("ACTIVE")
                .estimatedMinutes(minutes)
                .subtasksText(subtasks == null ? "" : String.join("\n", subtasks))
                .build();
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