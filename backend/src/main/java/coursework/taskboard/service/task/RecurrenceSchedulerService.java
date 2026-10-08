package coursework.taskboard.service.task;

import coursework.taskboard.model.board.BoardStatus;
import coursework.taskboard.model.task.Task;
import coursework.taskboard.model.task.TaskSchedule;
import coursework.taskboard.repository.board.BoardStatusRepository;
import coursework.taskboard.repository.task.TaskRecurrenceRepository;
import coursework.taskboard.repository.task.TaskRepository;
import coursework.taskboard.repository.task.TaskScheduleRepository;
import coursework.taskboard.repository.task.TaskSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Раз в сутки в 03:00 проходит по всем шаблонам повторений
 * и материализует вхождения на GENERATE_HORIZON_DAYS вперёд.
 * Просроченные (старше GRACE_HOURS) переводятся в EXPIRED.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RecurrenceSchedulerService {

    private final TaskRepository taskRepository;
    private final TaskRecurrenceRepository recurrenceRepository;
    private final TaskSettingsRepository taskSettingsRepository;
    private final TaskScheduleRepository taskScheduleRepository;
    private final BoardStatusRepository boardStatusRepository;
    private final RecurrenceService recurrenceService;

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void materializeRecurrences() {
        LocalDate today = LocalDate.now();
        LocalDate to = today.plusDays(RecurrenceService.GENERATE_HORIZON_DAYS);

        List<Task> templates = taskRepository.findAll().stream()
                .filter(t -> recurrenceRepository.existsByTaskId(t.getId()))
                .toList();

        for (Task template : templates) {
            try {
                recurrenceService.ensureInstancesInRange(template, today, to);
            } catch (Exception e) {
                log.error("Failed to materialize recurrences for task {}",
                        template.getId(), e);
            }
        }

        markExpiredInstances();
    }

    private void markExpiredInstances() {
        LocalDateTime threshold = OverduePolicyService.thresholdNow();
        List<TaskSchedule> overdue = taskScheduleRepository.findOverdue(threshold);

        for (TaskSchedule schedule : overdue) {
            Task task = schedule.getTask();
            if (!Boolean.TRUE.equals(task.getIsRecurrenceInstance())) continue;

            taskSettingsRepository.findById(task.getId()).ifPresent(settings -> {
                Long boardId = settings.getStatus().getBoard().getId();
                BoardStatus expired = boardStatusRepository
                        .findByBoardIdAndScopeAndCode(boardId, "task", "EXPIRED")
                        .orElse(null);

                if (expired != null) {
                    settings.setStatus(expired);
                    taskSettingsRepository.save(settings);
                }
            });

            schedule.setExpiredAt(LocalDateTime.now());
            taskScheduleRepository.save(schedule);
        }
    }
}