package coursework.taskboard.service.stats;

import coursework.taskboard.dto.stats.DailyGoalDto;
import coursework.taskboard.model.reward.DailyReward;
import coursework.taskboard.model.user.User;
import coursework.taskboard.model.user.UserLocale;
import coursework.taskboard.repository.reward.DailyRewardRepository;
import coursework.taskboard.repository.task.TaskRepository;
import coursework.taskboard.repository.user.UserLocaleRepository;
import coursework.taskboard.service.shop.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Ежедневная цель: 10 закрытых задач = полноценный день.
 *
 * Награда привязана к статусу дня, а не к числу кликов по дереву:
 *   good (3+)        — 25 листьев
 *   excellent (6+)   — 50 листьев
 *   legendary (10+)  — 100 листьев
 *
 * Награду можно забрать один раз за локальную дату пользователя. Строка
 * user_daily_rewards + synchronized-claim делают повторный клик безопасным.
 */
@Service
@RequiredArgsConstructor
public class DailyGoalService {

    public static final int TARGET = 10;
    public static final int GOOD_AT = 3;
    public static final int EXCELLENT_AT = 6;
    public static final int LEGENDARY_AT = 10;

    public static final int GOOD_REWARD = 25;
    public static final int EXCELLENT_REWARD = 50;
    public static final int LEGENDARY_REWARD = 100;

    private static final String TIER_NONE = "none";
    private static final String TIER_GOOD = "good";
    private static final String TIER_EXCELLENT = "excellent";
    private static final String TIER_LEGENDARY = "legendary";
    private static final String DEFAULT_TIMEZONE = "Europe/Moscow";

    private final TaskRepository taskRepository;
    private final DailyRewardRepository dailyRewardRepository;
    private final UserLocaleRepository userLocaleRepository;
    private final ShopService shopService;

    @Transactional(readOnly = true)
    public DailyGoalDto getDailyGoal(User user) {
        LocalDate date = currentDate(user);
        long done = countDone(user, date);
        DailyReward saved = dailyRewardRepository
                .findByUserIdAndRewardDate(user.getId(), date)
                .orElse(null);
        return toDto(date, done, saved);
    }

    /**
     * Забрать награду. synchronized — простая защита от двойного клика в
     * пределах одного инстанса; unique (user_id, reward_date) страхует
     * на уровне БД. Если строка уже есть — возвращаем её и НЕ начисляем
     * листья повторно.
     */
    @Transactional
    public synchronized DailyGoalDto claimDailyGoal(User user) {
        LocalDate date = currentDate(user);

        DailyReward saved = dailyRewardRepository
                .findByUserIdAndRewardDate(user.getId(), date)
                .orElse(null);
        if (saved != null) {
            return toDto(date, countDone(user, date), saved);
        }

        long done = countDone(user, date);
        String tier = tierFor(done);
        int reward = rewardFor(tier);

        // До «Хорошего дня» награды нет — claim ничего не начисляет.
        if (reward <= 0) {
            return toDto(date, done, null);
        }

        DailyReward created = dailyRewardRepository.save(DailyReward.builder()
                .user(user)
                .rewardDate(date)
                .tasksDone((int) Math.min(Integer.MAX_VALUE, done))
                .tier(tier)
                .leavesAwarded(reward)
                .claimedAt(LocalDateTime.now())
                .build());

        shopService.addLeaves(user, reward);

        return toDto(date, done, created);
    }

    // ============================================================
    // Внутренние
    // ============================================================

    private long countDone(User user, LocalDate date) {
        LocalDateTime from = date.atStartOfDay();
        LocalDateTime to = date.plusDays(1).atStartOfDay();
        return taskRepository.countCompletedByOwnerBetween(user.getId(), from, to);
    }

    private DailyGoalDto toDto(LocalDate date, long done, DailyReward saved) {
        String tier = tierFor(done);
        String nextTier = nextTierFor(done);
        Integer nextTierAt = nextTier == null ? null : thresholdFor(nextTier);
        int reward = rewardFor(tier);

        return DailyGoalDto.builder()
                .date(date.toString())
                .done(done)
                .target(TARGET)
                .goodAt(GOOD_AT)
                .excellentAt(EXCELLENT_AT)
                .legendaryAt(LEGENDARY_AT)
                .tier(tier)
                .nextTier(nextTier)
                .nextTierAt(nextTierAt)
                .rewardLeaves(reward)
                .claimed(saved != null)
                .claimedAt(saved != null ? saved.getClaimedAt() : null)
                .canClaim(saved == null && reward > 0)
                .build();
    }

    private String tierFor(long done) {
        if (done >= LEGENDARY_AT) return TIER_LEGENDARY;
        if (done >= EXCELLENT_AT) return TIER_EXCELLENT;
        if (done >= GOOD_AT) return TIER_GOOD;
        return TIER_NONE;
    }

    private String nextTierFor(long done) {
        if (done < GOOD_AT) return TIER_GOOD;
        if (done < EXCELLENT_AT) return TIER_EXCELLENT;
        if (done < LEGENDARY_AT) return TIER_LEGENDARY;
        return null;
    }

    private int thresholdFor(String tier) {
        return switch (tier) {
            case TIER_GOOD -> GOOD_AT;
            case TIER_EXCELLENT -> EXCELLENT_AT;
            case TIER_LEGENDARY -> LEGENDARY_AT;
            default -> 0;
        };
    }

    private int rewardFor(String tier) {
        return switch (tier) {
            case TIER_GOOD -> GOOD_REWARD;
            case TIER_EXCELLENT -> EXCELLENT_REWARD;
            case TIER_LEGENDARY -> LEGENDARY_REWARD;
            default -> 0;
        };
    }

    private LocalDate currentDate(User user) {
        return LocalDate.now(zoneFor(user));
    }

    private ZoneId zoneFor(User user) {
        String timezone = userLocaleRepository.findById(user.getId())
                .map(UserLocale::getTimezone)
                .orElse(DEFAULT_TIMEZONE);
        try {
            return ZoneId.of(timezone);
        } catch (DateTimeException | NullPointerException ex) {
            return ZoneId.of(DEFAULT_TIMEZONE);
        }
    }
}
