package coursework.taskboard.service.shop;

import coursework.taskboard.dto.shop.WeeklyGiftDto;
import coursework.taskboard.model.reward.UserWeeklyReward;
import coursework.taskboard.model.reward.WeeklyRewardConfig;
import coursework.taskboard.model.user.User;
import coursework.taskboard.model.user.UserLocale;
import coursework.taskboard.repository.reward.UserWeeklyRewardRepository;
import coursework.taskboard.repository.reward.WeeklyRewardConfigRepository;
import coursework.taskboard.repository.task.TaskRepository;
import coursework.taskboard.repository.user.UserLocaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.Optional;

/**
 * Бесплатный скин недели.
 *
 * Каждую неделю (с понедельника) в магазине появляется подарок, который
 * администратор назначает заранее. Чтобы забрать скин, нужно закрыть
 * 5 задач в течение этой же недели. Claim идемпотентен: строка
 * user_weekly_rewards с уникальной парой (user_id, week_start) не даёт
 * получить один и тот же подарок дважды.
 */
@Service
@RequiredArgsConstructor
public class WeeklyRewardService {

    public static final int REQUIRED_TASKS = 5;

    private static final String DEFAULT_TIMEZONE = "Europe/Moscow";

    private final WeeklyRewardConfigRepository configRepository;
    private final UserWeeklyRewardRepository userRewardRepository;
    private final TaskRepository taskRepository;
    private final UserLocaleRepository userLocaleRepository;
    private final ShopItemInfoService itemInfoService;

    @Transactional(readOnly = true)
    public WeeklyGiftDto getWeeklyGift(User user) {
        LocalDate weekStart = currentWeekStart(user);
        return build(user, weekStart);
    }

    @Transactional
    public synchronized WeeklyGiftDto claim(User user) {
        LocalDate weekStart = currentWeekStart(user);

        UserWeeklyReward saved = userRewardRepository
                .findByUserIdAndWeekStart(user.getId(), weekStart)
                .orElse(null);
        if (saved != null) {
            return build(user, weekStart);
        }

        WeeklyRewardConfig config = configRepository.findByWeekStart(weekStart)
                .filter(c -> Boolean.TRUE.equals(c.getEnabled()))
                .orElse(null);
        if (config == null) {
            throw new IllegalArgumentException("На эту неделю подарок не настроен");
        }
        if (itemInfoService.resolve(config.getItemType(), config.getItemCode()) == null) {
            throw new IllegalArgumentException("Предмет подарка не найден");
        }

        long done = countDone(user, weekStart);
        if (done < REQUIRED_TASKS) {
            throw new IllegalArgumentException(
                    "Нужно закрыть " + REQUIRED_TASKS + " задач за неделю");
        }

        itemInfoService.grant(user, config.getItemType(), config.getItemCode());

        userRewardRepository.save(UserWeeklyReward.builder()
                .user(user)
                .weekStart(weekStart)
                .itemType(config.getItemType())
                .itemCode(config.getItemCode())
                .claimedAt(LocalDateTime.now())
                .build());

        return build(user, weekStart);
    }

    // ============================================================
    // Внутренние
    // ============================================================

    private WeeklyGiftDto build(User user, LocalDate weekStart) {
        long done = countDone(user, weekStart);
        Optional<WeeklyRewardConfig> configOpt = configRepository.findByWeekStart(weekStart);

        WeeklyRewardConfig config = configOpt
                .filter(c -> Boolean.TRUE.equals(c.getEnabled()))
                .orElse(null);
        ShopItemInfoService.ItemInfo item = config == null ? null
                : itemInfoService.resolve(config.getItemType(), config.getItemCode());

        boolean existsConfig = configOpt.isPresent() && item != null;
        boolean enabled = configOpt.map(c -> Boolean.TRUE.equals(c.getEnabled())).orElse(false);

        UserWeeklyReward claimed = userRewardRepository
                .findByUserIdAndWeekStart(user.getId(), weekStart)
                .orElse(null);

        boolean owned = item != null
                && itemInfoService.isOwned(user, config.getItemType(), config.getItemCode());
        boolean canClaim = existsConfig
                && enabled
                && claimed == null
                && done >= REQUIRED_TASKS;

        String state;
        if (claimed != null) state = "claimed";
        else if (canClaim) state = "claimable";
        else if (existsConfig && enabled) state = "locked";
        else state = "none";

        return WeeklyGiftDto.builder()
                .configured(existsConfig)
                .enabled(enabled)
                .weekStart(weekStart.toString())
                .weekEnd(weekStart.plusDays(6).toString())
                .itemType(item != null ? item.type() : null)
                .itemCode(item != null ? item.code() : null)
                .itemId(item != null ? item.id() : null)
                .title(item != null ? item.title() : null)
                .description(item != null ? item.description() : null)
                .imageUrl(item != null ? item.imageUrl() : null)
                .emoji(item != null ? item.emoji() : null)
                .cssClass(item != null ? item.cssClass() : null)
                .hexColor(item != null ? item.hexColor() : null)
                .hexColorSecondary(item != null ? item.hexColorSecondary() : null)
                .hexColorTertiary(item != null ? item.hexColorTertiary() : null)
                .isGradient(item != null && item.isGradient())
                .isRare(item != null && item.isRare())
                .price(item != null ? item.price() : null)
                .requiredTasks(REQUIRED_TASKS)
                .doneTasks(done)
                .state(state)
                .canClaim(canClaim)
                .claimed(claimed != null)
                .claimedAt(claimed != null ? claimed.getClaimedAt() : null)
                .owned(owned)
                .build();
    }

    private long countDone(User user, LocalDate weekStart) {
        LocalDateTime from = weekStart.atStartOfDay();
        LocalDateTime to = weekStart.plusDays(7).atStartOfDay();
        return taskRepository.countCompletedByOwnerBetween(user.getId(), from, to);
    }

    private LocalDate currentWeekStart(User user) {
        return LocalDate.now(zoneFor(user))
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
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
