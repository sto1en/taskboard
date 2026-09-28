package coursework.taskboard.service.stats;

import coursework.taskboard.dto.stats.StatsDto;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.task.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final TaskRepository taskRepository;

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