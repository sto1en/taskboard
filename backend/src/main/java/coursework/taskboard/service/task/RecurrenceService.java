package coursework.taskboard.service.task;

import coursework.taskboard.dto.task.RecurrenceDto;
import coursework.taskboard.dto.task.RecurrenceRequestDto;
import coursework.taskboard.model.board.BoardStatus;
import coursework.taskboard.model.task.Task;
import coursework.taskboard.model.task.TaskRecurrence;
import coursework.taskboard.model.task.TaskSchedule;
import coursework.taskboard.model.task.TaskSettings;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.board.BoardStatusRepository;
import coursework.taskboard.repository.task.TaskRecurrenceOverrideRepository;
import coursework.taskboard.repository.task.TaskRecurrenceRepository;
import coursework.taskboard.repository.task.TaskRepository;
import coursework.taskboard.repository.task.TaskScheduleRepository;
import coursework.taskboard.repository.task.TaskSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecurrenceService {

    public static final int GENERATE_HORIZON_DAYS = 14;
    public static final int MAX_INSTANCES_PER_CALL = 500;

    private final TaskRepository taskRepository;
    private final TaskRecurrenceRepository recurrenceRepository;
    private final TaskRecurrenceOverrideRepository overrideRepository;
    private final TaskSettingsRepository taskSettingsRepository;
    private final TaskScheduleRepository taskScheduleRepository;
    private final BoardStatusRepository boardStatusRepository;

    // ============================================================
    // Сохранить правило
    // ============================================================
    @Transactional
    public RecurrenceDto saveRule(Task template, RecurrenceRequestDto req, User user) {
        validateRule(req.getRule());

        TaskRecurrence rec = recurrenceRepository.findByTaskId(template.getId())
                .orElseGet(() -> TaskRecurrence.builder().task(template).build());

        boolean isNew = rec.getStartAt() == null;

        rec.setRule(req.getRule());
        rec.setTimeOfDay(req.getTimeOfDay());

        LocalDateTime startAt = req.getStartAt();
        if (startAt == null) {
            TaskSchedule schedule = taskScheduleRepository.findById(template.getId()).orElse(null);
            startAt = schedule != null && schedule.getDeadline() != null
                    ? schedule.getDeadline()
                    : LocalDateTime.now().withSecond(0).withNano(0);
        }

        if (req.getTimeOfDay() != null) {
            startAt = startAt.with(req.getTimeOfDay());
        }

        rec.setStartAt(startAt);

        rec.setEndMode(req.getEndMode() != null ? req.getEndMode() : "never");
        rec.setEndUntil(req.getEndUntil());
        rec.setEndCount(req.getEndCount());

        if (isNew) {
            rec.setGeneratedUntil(null);
        }

        recurrenceRepository.save(rec);

        // Генерируем начиная с СЕГОДНЯ. Всё, что раньше — не создаём.
        LocalDate today = LocalDate.now();
        LocalDate startFrom = startAt.toLocalDate().isAfter(today) ? startAt.toLocalDate() : today;

        generateInstances(template, rec,
                startFrom,
                today.plusDays(GENERATE_HORIZON_DAYS));

        return toDto(rec, 10);
    }

    // ============================================================
    // Удалить правило — удаляем будущие вхождения, прошлые оставляем
    // ============================================================
    @Transactional
    public void deleteRule(Task template) {
        LocalDate today = LocalDate.now();

        List<Task> future = taskRepository.findByRecurrenceParentId(template.getId())
                .stream()
                .filter(t -> t.getOccurrenceDate() != null
                        && t.getOccurrenceDate().isAfter(today))
                .toList();

        for (Task inst : future) {
            taskScheduleRepository.findById(inst.getId())
                    .ifPresent(taskScheduleRepository::delete);
            taskSettingsRepository.findById(inst.getId())
                    .ifPresent(taskSettingsRepository::delete);
            taskRepository.delete(inst);
        }

        recurrenceRepository.findByTaskId(template.getId())
                .ifPresent(recurrenceRepository::delete);
    }

    // ============================================================
    // Получить правило
    // ============================================================
    @Transactional(readOnly = true)
    public RecurrenceDto getRule(Task template) {
        return recurrenceRepository.findByTaskId(template.getId())
                .map(r -> toDto(r, 10))
                .orElse(null);
    }

    // ============================================================
    // Превью (для модалки)
    // ============================================================
    @Transactional(readOnly = true)
    public List<LocalDateTime> preview(RecurrenceRequestDto req, int limit) {
        validateRule(req.getRule());

        LocalDateTime start = req.getStartAt() != null
                ? req.getStartAt()
                : LocalDateTime.now().withSecond(0).withNano(0);

        if (req.getTimeOfDay() != null) {
            start = start.with(req.getTimeOfDay());
        }

        // Если start в прошлом — двигаем вперёд до ближайшего будущего
        LocalDateTime now = LocalDateTime.now();
        if (start.isBefore(now)) {
            start = alignTo(start, req.getRule(), now);
        }

        LocalDateTime endUntil = "until".equals(req.getEndMode())
                ? req.getEndUntil()
                : null;
        Integer endCount = "count".equals(req.getEndMode())
                ? req.getEndCount()
                : null;

        List<LocalDateTime> result = new ArrayList<>();
        LocalDateTime cursor = start;
        int guard = 0;

        while (result.size() < limit && guard++ < 5000) {
            if (endUntil != null && cursor.isAfter(endUntil)) break;
            if (endCount != null && result.size() >= endCount) break;

            result.add(cursor);
            cursor = nextOccurrence(cursor, req.getRule());
        }
        return result;
    }

    // ============================================================
    // Материализация вхождений в диапазоне (используется календарём)
    // ============================================================
    @Transactional
    public void ensureInstancesInRange(Task template, LocalDate from, LocalDate to) {
        TaskRecurrence rec = recurrenceRepository.findByTaskId(template.getId()).orElse(null);
        if (rec == null) return;

        // Не заглядываем в прошлое дальше сегодняшнего дня
        LocalDate today = LocalDate.now();
        LocalDate effectiveFrom = from.isBefore(today) ? today : from;

        generateInstances(template, rec, effectiveFrom, to);
    }

    // ============================================================
    // Генерация вхождений
    // ============================================================
    @Transactional
    protected void generateInstances(Task template, TaskRecurrence rec,
                                     LocalDate from, LocalDate to) {
        LocalDateTime cursor = rec.getStartAt();
        LocalDateTime horizonEnd = to.plusDays(1).atStartOfDay();

        // Продолжаем от того места, где остановились
        LocalDateTime alreadyUntil = rec.getGeneratedUntil();
        if (alreadyUntil != null && alreadyUntil.isAfter(cursor)) {
            cursor = alreadyUntil;
        }

        // Никогда не генерируем раньше СЕГОДНЯ (00:00)
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        if (cursor.isBefore(todayStart)) {
            cursor = alignTo(cursor, rec.getRule(), todayStart);
        }

        // И не раньше `from`
        LocalDateTime fromStart = from.atStartOfDay();
        if (cursor.isBefore(fromStart)) {
            cursor = alignTo(cursor, rec.getRule(), fromStart);
        }

        Set<LocalDate> existing = new HashSet<>();
        taskRepository.findByRecurrenceParentIdInPeriod(template.getId(), from, to)
                .forEach(t -> existing.add(t.getOccurrenceDate()));

        int created = 0;
        int guard = 0;
        LocalDateTime endCap = "until".equals(rec.getEndMode())
                ? rec.getEndUntil()
                : null;

        while (cursor.isBefore(horizonEnd)
                && created < MAX_INSTANCES_PER_CALL
                && guard++ < 20000) {

            if (endCap != null && cursor.isAfter(endCap)) break;

            LocalDate date = cursor.toLocalDate();

            if (!existing.contains(date)
                    && !date.isBefore(from)
                    && !date.isAfter(to)) {

                if ("count".equals(rec.getEndMode()) && rec.getEndCount() != null) {
                    long done = taskRepository.countByRecurrenceParentId(template.getId());
                    if (done >= rec.getEndCount()) break;
                }

                createInstance(template, date, cursor.toLocalTime());
                created++;
            }

            cursor = nextOccurrence(cursor, rec.getRule());
        }

        rec.setGeneratedUntil(cursor);
        recurrenceRepository.save(rec);

        log.debug("Generated {} instances for task {} in [{}, {}]",
                created, template.getId(), from, to);
    }

    private void createInstance(Task template, LocalDate date, LocalTime timeOfDay) {
        Task instance = Task.builder()
                .project(template.getProject())
                .stage(template.getStage())
                .title(template.getTitle())
                .description(template.getDescription())
                .position(template.getPosition())
                .isRecurrenceInstance(true)
                .recurrenceParent(template)
                .occurrenceDate(date)
                .build();
        taskRepository.save(instance);

        TaskSettings settings = taskSettingsRepository.findById(template.getId()).orElse(null);
        if (settings != null) {
            BoardStatus status = settings.getStatus();

            TaskSettings s = TaskSettings.builder()
                    .task(instance)
                    .status(status)
                    .priority(settings.getPriority())
                    .isPinned(false)
                    .build();
            taskSettingsRepository.save(s);
        }

        TaskSchedule sh = TaskSchedule.builder()
                .task(instance)
                .deadline(date.atTime(timeOfDay))
                .build();
        taskScheduleRepository.save(sh);
    }

    // ============================================================
    // Переход к следующему вхождению
    // ============================================================
    private LocalDateTime nextOccurrence(LocalDateTime cursor, String rule) {
        if (rule == null) throw new IllegalArgumentException("rule is null");

        String[] parts = rule.split(":");
        String kind = parts[0];
        String arg = parts.length > 1 ? parts[1] : null;

        return switch (kind) {
            case "hourly" -> cursor.plusHours(parseIntOr(arg, 1));
            case "daily" -> cursor.plusDays(1);
            case "weekly" -> cursor.plusWeeks(1);
            case "monthly" -> cursor.plusMonths(1);
            case "yearly" -> cursor.plusYears(1);
            case "every" -> {
                if (arg == null || arg.isBlank()) yield cursor.plusDays(1);
                char unit = arg.charAt(arg.length() - 1);
                int n = parseIntOr(arg.substring(0, arg.length() - 1), 1);
                yield switch (unit) {
                    case 'm' -> cursor.plusMinutes(n);
                    case 'h' -> cursor.plusHours(n);
                    case 'd' -> cursor.plusDays(n);
                    case 'w' -> cursor.plusWeeks(n);
                    case 'M' -> cursor.plusMonths(n);
                    case 'y' -> cursor.plusYears(n);
                    default -> cursor.plusDays(n);
                };
            }
            default -> throw new IllegalArgumentException("Unknown rule: " + rule);
        };
    }

    private LocalDateTime alignTo(LocalDateTime cursor, String rule, LocalDateTime from) {
        int guard = 0;
        while (cursor.isBefore(from) && guard++ < 20000) {
            cursor = nextOccurrence(cursor, rule);
        }
        return cursor;
    }

    private int parseIntOr(String s, int fallback) {
        try {
            return Integer.parseInt(s);
        } catch (Exception e) {
            return fallback;
        }
    }

    private void validateRule(String rule) {
        if (rule == null || rule.isBlank()) {
            throw new IllegalArgumentException("Правило не может быть пустым");
        }
        String kind = rule.split(":")[0];
        Set<String> allowed = Set.of("hourly", "daily", "weekly", "monthly", "yearly", "every");
        if (!allowed.contains(kind)) {
            throw new IllegalArgumentException("Неизвестное правило: " + kind);
        }
    }

    private RecurrenceDto toDto(TaskRecurrence rec, int previewLimit) {
        List<LocalDateTime> preview = new ArrayList<>();
        if (previewLimit > 0) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime cursor = rec.getStartAt();
            if (cursor.isBefore(now)) {
                cursor = alignTo(cursor, rec.getRule(), now);
            }
            int guard = 0;
            while (preview.size() < previewLimit && guard++ < 1000) {
                if ("until".equals(rec.getEndMode())
                        && rec.getEndUntil() != null
                        && cursor.isAfter(rec.getEndUntil())) break;
                preview.add(cursor);
                cursor = nextOccurrence(cursor, rec.getRule());
            }
        }

        return RecurrenceDto.builder()
                .rule(rec.getRule())
                .timeOfDay(rec.getTimeOfDay())
                .startAt(rec.getStartAt())
                .endMode(rec.getEndMode())
                .endUntil(rec.getEndUntil())
                .endCount(rec.getEndCount())
                .preview(preview)
                .build();
    }
}