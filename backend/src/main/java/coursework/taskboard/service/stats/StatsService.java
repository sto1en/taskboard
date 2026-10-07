package coursework.taskboard.service.stats;

import coursework.taskboard.dto.stats.*;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.task.TaskRepository;
import coursework.taskboard.repository.task.TaskScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final TaskRepository taskRepository;
    private final TaskScheduleRepository taskScheduleRepository;

    @Transactional(readOnly = true)
    public StatsDto getStats(String period, User user) {
        LocalDateTime from = calculateFrom(period);

        long total = taskRepository.countTotalByOwner(user.getId(), from);
        long done = taskRepository.countByCategoryByOwner(user.getId(), from, "DONE");
        long active = taskRepository.countByCategoryByOwner(user.getId(), from, "ACTIVE");
        long overdue = taskRepository.countByCategoryByOwner(user.getId(), from, "EXPIRED");
        long archived = taskRepository.countByCategoryByOwner(user.getId(), from, "ARCHIVED");
        long cancelled = taskRepository.countByCategoryByOwner(user.getId(), from, "CANCELLED");

        return StatsDto.builder()
                .period(period)
                .total(total)
                .done(done)
                .active(active)
                .overdue(overdue)
                .archived(archived)
                .cancelled(cancelled)
                .build();
    }

    /**
     * Всё для страницы статистики за один запрос: базовые цифры,
     * динамика по дням, распределение по статусам, топ тегов, нагрузка дня.
     */
    @Transactional(readOnly = true)
    public StatsOverviewDto getOverview(String period, User user) {
        LocalDateTime from = calculateFrom(period);
        LocalDateTime to = LocalDateTime.now();

        StatsDto base = getStats(period, user);

        List<DailyStatDto> daily = buildDaily(user, from, to);
        List<StatusSliceDto> byStatus = buildByStatus(user);
        List<TopTagDto> topTags = buildTopTags(user);

        // Нагрузка — за диапазон from..to
        List<DailyLoadDto> dailyLoad = buildDailyLoad(user, from, to);

        return StatsOverviewDto.builder()
                .period(period)
                .total(base.getTotal())
                .done(base.getDone())
                .active(base.getActive())
                .overdue(base.getOverdue())
                .archived(base.getArchived())
                .cancelled(base.getCancelled())
                .daily(daily)
                .byStatus(byStatus)
                .topTags(topTags)
                .dailyLoad(dailyLoad)
                .build();
    }

    // ============================================================
    // Нагрузка дня (для календаря — отдельный эндпоинт)
    // ============================================================
    @Transactional(readOnly = true)
    public List<DailyLoadDto> getDailyLoad(LocalDate from, LocalDate to, User user) {
        return buildDailyLoad(user, from.atStartOfDay(), to.plusDays(1).atStartOfDay());
    }

    // ============================================================
    // Внутренние
    // ============================================================

    private List<DailyStatDto> buildDaily(User user, LocalDateTime from, LocalDateTime to) {
        Map<String, Long> created = toCountMap(taskRepository.countCreatedByDay(user.getId(), from, to));
        Map<String, Long> done    = toCountMap(taskRepository.countDoneByDay(user.getId(), from, to));

        // Диапазон дат от from до to
        Map<String, DailyStatDto> byDate = new TreeMap<>();
        LocalDate fromD = from.toLocalDate();
        LocalDate toD = to.toLocalDate();
        for (LocalDate d = fromD; !d.isAfter(toD); d = d.plusDays(1)) {
            String key = d.toString();
            byDate.put(key, DailyStatDto.builder()
                    .date(key)
                    .created(created.getOrDefault(key, 0L))
                    .done(done.getOrDefault(key, 0L))
                    .overdue(0L)  // опционально
                    .build());
        }
        return new ArrayList<>(byDate.values());
    }

    private List<StatusSliceDto> buildByStatus(User user) {
        List<Object[]> rows = taskRepository.countByStatus(user.getId());
        List<StatusSliceDto> result = new ArrayList<>();
        for (Object[] r : rows) {
            Long statusId = (Long) r[0];
            String code = (String) r[1];
            String title = (String) r[2];
            String category = (String) r[3];
            long count = ((Number) r[4]).longValue();

            result.add(StatusSliceDto.builder()
                    .statusId(statusId)
                    .code(code)
                    .title(title)
                    .categoryCode(category)
                    .accentCode(defaultAccentForCategory(category))
                    .count(count)
                    .build());
        }
        return result;
    }

    private List<TopTagDto> buildTopTags(User user) {
        List<Object[]> rows = taskRepository.topTags(user.getId(), PageRequest.of(0, 8));
        List<TopTagDto> result = new ArrayList<>();
        for (Object[] r : rows) {
            Long id = (Long) r[0];
            String title = (String) r[1];
            long count = ((Number) r[2]).longValue();

            result.add(TopTagDto.builder()
                    .tagId(id)
                    .title(title)
                    .icon(null)
                    .accentCode("blue")
                    .count(count)
                    .build());
        }
        return result;
    }

    private List<DailyLoadDto> buildDailyLoad(User user, LocalDateTime from, LocalDateTime to) {
        List<Object[]> rows = taskScheduleRepository.loadByDay(user.getId(), from, to);
        Map<String, DailyLoadDto> map = new TreeMap<>();

        for (Object[] r : rows) {
            String d = (String) r[0];
            long open = ((Number) r[1]).longValue();
            long done = ((Number) r[2]).longValue();
            long overdue = ((Number) r[3]).longValue();
            long total = open + done + overdue;
            map.put(d, DailyLoadDto.builder()
                    .date(d)
                    .openCount(open)
                    .doneCount(done)
                    .overdueCount(overdue)
                    .level(levelFor(total))
                    .build());
        }

        // Заполним пустые дни (level=empty)
        LocalDate fromD = from.toLocalDate();
        LocalDate toD = to.minusDays(1).toLocalDate();
        for (LocalDate d = fromD; !d.isAfter(toD); d = d.plusDays(1)) {
            String key = d.toString();
            map.putIfAbsent(key, DailyLoadDto.builder()
                    .date(key)
                    .openCount(0).doneCount(0).overdueCount(0)
                    .level("empty")
                    .build());
        }

        return new ArrayList<>(map.values());
    }

    private Map<String, Long> toCountMap(List<Object[]> rows) {
        Map<String, Long> map = new HashMap<>();
        for (Object[] r : rows) {
            String d = (String) r[0];
            long c = ((Number) r[1]).longValue();
            map.put(d, c);
        }
        return map;
    }

    private String levelFor(long total) {
        if (total <= 0) return "empty";
        if (total <= 2) return "low";
        if (total <= 5) return "medium";
        return "high";
    }

    private String defaultAccentForCategory(String categoryCode) {
        if (categoryCode == null) return "gray";
        return switch (categoryCode) {
            case "ACTIVE"    -> "blue";
            case "DONE"      -> "green";
            case "EXPIRED"   -> "red";
            case "CANCELLED" -> "gray";
            case "FROZEN"    -> "amber";
            case "ARCHIVED"  -> "slate";
            default          -> "gray";
        };
    }

    private LocalDateTime calculateFrom(String period) {
        LocalDateTime now = LocalDateTime.now();
        return switch (period) {
            case "day"  -> now.toLocalDate().atStartOfDay();
            case "week" -> now.minusWeeks(1);
            case "year" -> now.minusYears(1);
            case "month" -> now.minusMonths(1);
            default -> now.minusMonths(1);
        };
    }
}