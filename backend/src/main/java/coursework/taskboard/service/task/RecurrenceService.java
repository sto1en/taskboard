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

    /** Жёсткий лимит на количество создаваемых копий. */
    public static final int MAX_INSTANCES = 100;

    private final TaskRepository taskRepository;
    private final TaskRecurrenceRepository recurrenceRepository;
    private final TaskRecurrenceOverrideRepository overrideRepository;
    private final TaskSettingsRepository taskSettingsRepository;
    private final TaskScheduleRepository taskScheduleRepository;
    private final BoardStatusRepository boardStatusRepository;

    // ============================================================
    // Сохранить правило — сразу создаём все копии
    // ============================================================
    @Transactional
    public RecurrenceDto saveRule(Task template, RecurrenceRequestDto req, User user) {
        validateRule(req.getRule());

        // Всегда требуем endCount — иначе непонятно, сколько копий создавать
        if (!"count".equals(req.getEndMode()) || req.getEndCount() == null) {
            throw new IllegalArgumentException(
                    "Для повторения нужно указать конечное количество копий");
        }

        int count = req.getEndCount();
        if (count < 1) {
            throw new IllegalArgumentException("Количество копий должно быть не меньше 1");
        }
        if (count > MAX_INSTANCES) {
            throw new IllegalArgumentException(
                    "Максимум " + MAX_INSTANCES + " копий за раз");
        }

        // Если правило уже существует — удаляем старые вхождения
        TaskRecurrence existing = recurrenceRepository.findByTaskId(template.getId()).orElse(null);
        if (existing != null) {
            deleteInstancesForTemplate(template.getId());
        }

        TaskRecurrence rec = existing != null
                ? existing
                : TaskRecurrence.builder().task(template).build();

        rec.setRule(req.getRule());

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
        rec.setEndMode("count");
        rec.setEndUntil(null);
        rec.setEndCount(count);
        rec.setTimeOfDay(req.getTimeOfDay());
        rec.setGeneratedUntil(null);

        recurrenceRepository.save(rec);

        // Создаём ровно `count` копий
        createInstances(template, rec, count);

        return toDto(rec, count);
    }

    // ============================================================
    // Удалить правило — сносим ВСЕ вхождения
    // ============================================================
    @Transactional
    public void deleteRule(Task template) {
        deleteInstancesForTemplate(template.getId());
        recurrenceRepository.findByTaskId(template.getId())
                .ifPresent(recurrenceRepository::delete);
    }

    private void deleteInstancesForTemplate(Long templateId) {
        List<Task> instances = taskRepository.findByRecurrenceParentId(templateId);
        for (Task inst : instances) {
            taskScheduleRepository.findById(inst.getId())
                    .ifPresent(taskScheduleRepository::delete);
            taskSettingsRepository.findById(inst.getId())
                    .ifPresent(taskSettingsRepository::delete);
            taskRepository.delete(inst);
        }
    }

    // ============================================================
    // Получить правило
    // ============================================================
    @Transactional(readOnly = true)
    public RecurrenceDto getRule(Task template) {
        return recurrenceRepository.findByTaskId(template.getId())
                .map(r -> toDto(r, r.getEndCount() != null ? r.getEndCount() : 10))
                .orElse(null);
    }

    // ============================================================
    // Превью — просто N ближайших моментов
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

        int count = req.getEndCount() != null ? req.getEndCount() : limit;
        int effectiveLimit = Math.min(count, Math.max(limit, 5));

        List<LocalDateTime> result = new ArrayList<>();
        LocalDateTime cursor = start;
        int guard = 0;

        while (result.size() < effectiveLimit && guard++ < 5000) {
            result.add(cursor);
            cursor = nextOccurrence(cursor, req.getRule());
        }
        return result;
    }

    // ============================================================
    // Создание N копий
    // ============================================================
    private void createInstances(Task template, TaskRecurrence rec, int count) {
        LocalDateTime cursor = rec.getStartAt();
        LocalTime timeOfDay = cursor.toLocalTime();

        for (int i = 0; i < count; i++) {
            LocalDate date = cursor.toLocalDate();
            createInstance(template, date, timeOfDay);
            cursor = nextOccurrence(cursor, rec.getRule());
        }

        log.debug("Created {} instances for task {}", count, template.getId());
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

        // Копируем статус/приоритет — без дедлайна
        TaskSettings settings = taskSettingsRepository.findById(template.getId()).orElse(null);
        if (settings != null) {
            TaskSettings s = TaskSettings.builder()
                    .task(instance)
                    .status(settings.getStatus())
                    .priority(settings.getPriority())
                    .isPinned(false)
                    .build();
            taskSettingsRepository.save(s);
        } else {
            // fallback — создаём минимальный settings (без него приложение может упасть)
            BoardStatus active = boardStatusRepository
                    .findByBoardIdAndScopeAndIsDefaultTrue(
                            template.getProject().getBoard().getId(), "task")
                    .orElse(null);
            if (active != null) {
                TaskSettings s = TaskSettings.builder()
                        .task(instance)
                        .status(active)
                        .priority((short) 0)
                        .isPinned(false)
                        .build();
                taskSettingsRepository.save(s);
            }
        }

        // task_schedule создаём ПУСТОЙ (без deadline)
        TaskSchedule sh = TaskSchedule.builder()
                .task(instance)
                .deadline(null)
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
            LocalDateTime cursor = rec.getStartAt();
            int guard = 0;
            while (preview.size() < previewLimit && guard++ < 1000) {
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