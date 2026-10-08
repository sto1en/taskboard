package coursework.taskboard.repository.task;

import coursework.taskboard.model.task.TaskRecurrenceOverride;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TaskRecurrenceOverrideRepository
        extends JpaRepository<TaskRecurrenceOverride, Long> {

    List<TaskRecurrenceOverride> findByTaskIdAndOccurrenceDateBetween(
            Long taskId, LocalDate from, LocalDate to);

    Optional<TaskRecurrenceOverride> findByTaskIdAndOccurrenceDate(
            Long taskId, LocalDate occurrenceDate);

    List<TaskRecurrenceOverride> findByTaskId(Long taskId);
}