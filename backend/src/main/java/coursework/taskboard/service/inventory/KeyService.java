package coursework.taskboard.service.inventory;

import coursework.taskboard.model.inventory.UserInventory;
import coursework.taskboard.model.inventory.UserKeyGrant;
import coursework.taskboard.model.user.User;
import coursework.taskboard.model.user.UserLocale;
import coursework.taskboard.repository.inventory.UserInventoryRepository;
import coursework.taskboard.repository.inventory.UserKeyGrantRepository;
import coursework.taskboard.repository.task.TaskRepository;
import coursework.taskboard.repository.user.UserLocaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Ключи от сундуков.
 *
 * Ключ — расходуемый предмет инвентаря (item_code = forest_key), а не валюта.
 * За каждые 15 выполненных задач за локальный день начисляется один ключ:
 * 15 → 1, 30 → 2, 45 → 3 и т.д. Недельного лимита нет.
 *
 * Повторные запросы безопасны: факт выдачи фиксируется в user_key_grants
 * с уникальностью (user_id, grant_date, milestone), а syncKeys просто
 * пропускает уже выданные milestone.
 */
@Service
@RequiredArgsConstructor
public class KeyService {

    public static final String FOREST_KEY = "forest_key";
    public static final int KEY_GOAL = 15;

    private static final String DEFAULT_TIMEZONE = "Europe/Moscow";

    private final TaskRepository taskRepository;
    private final UserLocaleRepository userLocaleRepository;
    private final UserInventoryRepository userInventoryRepository;
    private final UserKeyGrantRepository userKeyGrantRepository;

    /**
     * Доначислить ключи за все достигнутые milestone текущего локального дня.
     *
     * synchronized — защита от параллельных GET: в пределах инстанса выдача
     * идёт последовательно, а unique-констрейнт страхует на уровне БД.
     */
    @Transactional
    public synchronized void syncKeys(User user) {
        LocalDate date = currentDate(user);
        long done = countDone(user, date);
        int achievedMilestones = (int) (done / KEY_GOAL);
        if (achievedMilestones <= 0) return;

        Set<Integer> granted = userKeyGrantRepository
                .findByUserIdAndGrantDate(user.getId(), date)
                .stream()
                .map(UserKeyGrant::getMilestone)
                .collect(Collectors.toSet());

        int newKeys = 0;
        for (int i = 1; i <= achievedMilestones; i++) {
            int milestone = i * KEY_GOAL;
            if (granted.contains(milestone)) continue;

            userKeyGrantRepository.save(UserKeyGrant.builder()
                    .user(user)
                    .grantDate(date)
                    .milestone(milestone)
                    .grantedAt(LocalDateTime.now())
                    .build());
            newKeys++;
        }

        if (newKeys > 0) {
            addKeys(user, newKeys);
        }
    }

    @Transactional(readOnly = true)
    public int getKeys(User user) {
        return userInventoryRepository.findByUserIdAndItemCode(user.getId(), FOREST_KEY)
                .map(UserInventory::getQuantity)
                .orElse(0);
    }

    /** Сколько задач закрыто за сегодня (в локальной таймзоне пользователя). */
    @Transactional(readOnly = true)
    public long countDoneToday(User user) {
        return countDone(user, currentDate(user));
    }

    /** Прогресс внутри текущего шага: 0..14. */
    @Transactional(readOnly = true)
    public int progressToNextKey(User user) {
        return (int) (countDoneToday(user) % KEY_GOAL);
    }

    /** Списать один ключ. Бросает исключение, если ключей нет. */
    @Transactional
    public void spendKey(User user) {
        UserInventory inventory = userInventoryRepository
                .findByUserIdAndItemCode(user.getId(), FOREST_KEY)
                .orElseThrow(() -> new IllegalArgumentException("Не хватает ключей"));
        if (inventory.getQuantity() == null || inventory.getQuantity() <= 0) {
            throw new IllegalArgumentException("Не хватает ключей");
        }
        inventory.setQuantity(inventory.getQuantity() - 1);
        userInventoryRepository.save(inventory);
    }

    // ============================================================
    // Внутренние
    // ============================================================

    /** Начислить ключи (в т.ч. купленные за листья). */
    @Transactional
    public void addKeys(User user, int amount) {
        if (amount <= 0) return;
        UserInventory inventory = userInventoryRepository
                .findByUserIdAndItemCode(user.getId(), FOREST_KEY)
                .orElseGet(() -> UserInventory.builder()
                        .user(user)
                        .itemCode(FOREST_KEY)
                        .quantity(0)
                        .build());
        int current = inventory.getQuantity() == null ? 0 : inventory.getQuantity();
        inventory.setQuantity(current + amount);
        userInventoryRepository.save(inventory);
    }

    private long countDone(User user, LocalDate date) {
        LocalDateTime from = date.atStartOfDay();
        LocalDateTime to = date.plusDays(1).atStartOfDay();
        return taskRepository.countCompletedByOwnerBetween(user.getId(), from, to);
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
