package coursework.taskboard.service.task;

import coursework.taskboard.model.board.BoardStatus;
import coursework.taskboard.model.task.TaskSchedule;
import coursework.taskboard.repository.board.BoardStatusRepository;
import coursework.taskboard.repository.task.TaskScheduleRepository;
import coursework.taskboard.repository.task.TaskSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OverdueSchedulerService {

    private final TaskScheduleRepository taskScheduleRepository;
    private final TaskSettingsRepository taskSettingsRepository;
    private final BoardStatusRepository boardStatusRepository;

    // Раз в час, в 00 минут
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void markOverdueTasks() {
        LocalDateTime threshold = OverduePolicyService.thresholdNow();

        List<TaskSchedule> overdue = taskScheduleRepository.findOverdue(threshold);

        if (overdue.isEmpty()) {
            log.debug("No overdue tasks");
            return;
        }

        for (TaskSchedule schedule : overdue) {
            Long taskId = schedule.getTask().getId();

            taskSettingsRepository.findById(taskId).ifPresent(settings -> {
                Long boardId = settings.getStatus().getBoard().getId();

                BoardStatus expiredStatus = boardStatusRepository
                        .findByBoardIdAndScopeAndCode(boardId, "task", "EXPIRED")
                        .orElse(null);

                if (expiredStatus != null) {
                    settings.setStatus(expiredStatus);
                    taskSettingsRepository.save(settings);
                }
            });

            schedule.setExpiredAt(LocalDateTime.now());
            taskScheduleRepository.save(schedule);
        }

        log.info("Marked {} tasks as overdue (grace={}h)",
                overdue.size(), OverduePolicyService.GRACE_HOURS);
    }
}