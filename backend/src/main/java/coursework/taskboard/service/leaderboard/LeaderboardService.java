package coursework.taskboard.service.leaderboard;

import coursework.taskboard.dto.leaderboard.*;
import coursework.taskboard.dto.social.SocialUserDto;
import coursework.taskboard.model.shop.UserCurrency;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.achievement.UserAchievementRepository;
import coursework.taskboard.repository.shop.*;
import coursework.taskboard.repository.task.TaskRepository;
import coursework.taskboard.repository.user.UserRepository;
import coursework.taskboard.service.social.SocialProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Лидерборд по всем пользователям.
 *
 * Категории считаются из уже существующих данных:
 *   streak        — дни подряд с закрытыми задачами (та же логика, что в профиле);
 *   tasks         — всего закрыто задач;
 *   leaves_earned — всего заработано листьев (накопительный счётчик);
 *   leaves_spent  — всего потрачено листьев;
 *   chests        — открыто сундуков;
 *   collection    — предметов коллекции (аватарки/рамки/деревья/акценты);
 *   achievements  — получено достижений.
 */
@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final UserRepository userRepository;
    private final UserCurrencyRepository userCurrencyRepository;
    private final TaskRepository taskRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserAvatarRepository userAvatarRepository;
    private final UserFrameRepository userFrameRepository;
    private final UserTreeSkinRepository userTreeSkinRepository;
    private final UserAccentRepository userAccentRepository;
    private final SocialProfileService socialProfileService;

    @Transactional(readOnly = true)
    public LeaderboardDto getLeaderboard(User viewer) {
        List<User> users = userRepository.findAll();
        Map<Long, Stats> stats = new HashMap<>();
        for (User u : users) {
            stats.put(u.getId(), statsFor(u));
        }

        List<LeaderboardCategoryDto> categories = List.of(
                category("streak", "Стрик дней", "🔥",
                        "Сколько дней подряд вы закрывали задачи — дерево растёт каждый день.",
                        "дней", users, stats, Stats::streak, viewer),
                category("tasks", "Закрытые задачи", "✅",
                        "Общее число выполненных задач за всё время.",
                        "задач", users, stats, Stats::tasks, viewer),
                category("leaves_earned", "Собрано листьев", "🍃",
                        "Сколько листьев заработано за всё время — задачи, награды и сундуки.",
                        "листьев", users, stats, Stats::leavesEarned, viewer),
                category("leaves_spent", "Потрачено листьев", "🛍️",
                        "Листья, потраченные на покупки, ключи и сундуки.",
                        "листьев", users, stats, Stats::leavesSpent, viewer),
                category("chests", "Открыто сундуков", "🧰",
                        "Лесные сундуки и сундуки странника, открытые за всё время.",
                        "сундуков", users, stats, Stats::chests, viewer),
                category("collection", "Коллекция", "🎒",
                        "Сколько предметов собрано: аватарки, рамки, деревья и акценты.",
                        "предметов", users, stats, Stats::collection, viewer),
                category("achievements", "Достижения", "🏆",
                        "Сколько достижений открыто.",
                        "достижений", users, stats, Stats::achievements, viewer)
        );

        return LeaderboardDto.builder()
                .categories(categories)
                .totalUsers(users.size())
                .build();
    }

    private LeaderboardCategoryDto category(String code, String title, String icon,
                                            String description, String unit,
                                            List<User> users,
                                            Map<Long, Stats> stats,
                                            java.util.function.ToLongFunction<Stats> getter,
                                            User viewer) {
        List<User> sorted = new ArrayList<>(users);
        sorted.sort(Comparator
                .comparingLong((User u) -> getter.applyAsLong(
                        stats.getOrDefault(u.getId(), Stats.EMPTY)))
                .reversed()
                .thenComparing(User::getUsername, String.CASE_INSENSITIVE_ORDER));

        List<LeaderboardEntryDto> entries = new ArrayList<>();
        int rank = 0;
        long previous = Long.MIN_VALUE;
        for (int i = 0; i < sorted.size(); i++) {
            User u = sorted.get(i);
            long value = getter.applyAsLong(stats.getOrDefault(u.getId(), Stats.EMPTY));
            if (value != previous) {
                rank = i + 1;
                previous = value;
            }
            SocialUserDto social = socialProfileService.toSocialUser(u);
            entries.add(LeaderboardEntryDto.builder()
                    .rank(rank)
                    .user(social)
                    .value(value)
                    .me(u.getId().equals(viewer.getId()))
                    .build());
        }

        return LeaderboardCategoryDto.builder()
                .code(code)
                .title(title)
                .description(description)
                .icon(icon)
                .unit(unit)
                .entries(entries)
                .build();
    }

    private Stats statsFor(User user) {
        UserCurrency currency = userCurrencyRepository.findById(user.getId()).orElse(null);
        int collection = userAvatarRepository.findByUserId(user.getId()).size()
                + userFrameRepository.findByUserId(user.getId()).size()
                + userTreeSkinRepository.findByUserId(user.getId()).size()
                + userAccentRepository.findByUserId(user.getId()).size();

        return new Stats(
                socialProfileService.streakFor(user),
                taskRepository.countDoneByOwner(user.getId()),
                currency == null || currency.getTotalEarned() == null ? 0 : currency.getTotalEarned(),
                currency == null || currency.getTotalSpent() == null ? 0 : currency.getTotalSpent(),
                currency == null || currency.getChestsOpened() == null ? 0 : currency.getChestsOpened(),
                collection,
                (int) userAchievementRepository.countByUserId(user.getId())
        );
    }

    private record Stats(int streak, long tasks, long leavesEarned, long leavesSpent,
                         long chests, long collection, long achievements) {
        static final Stats EMPTY = new Stats(0, 0, 0, 0, 0, 0, 0);
    }
}
