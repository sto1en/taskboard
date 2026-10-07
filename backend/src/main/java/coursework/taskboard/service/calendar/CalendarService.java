package coursework.taskboard.service.calendar;

import coursework.taskboard.dto.calendar.*;
import coursework.taskboard.model.board.Board;
import coursework.taskboard.model.board.BoardStatusAppearance;
import coursework.taskboard.model.task.Task;
import coursework.taskboard.model.task.TaskSchedule;
import coursework.taskboard.model.task.TaskSettings;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.board.BoardRepository;
import coursework.taskboard.repository.board.BoardStatusAppearanceRepository;
import coursework.taskboard.repository.project.ProjectRepository;
import coursework.taskboard.repository.task.TaskScheduleRepository;
import coursework.taskboard.repository.task.TaskSettingsRepository;
import coursework.taskboard.service.task.OverduePolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CalendarService {

    private final TaskScheduleRepository taskScheduleRepository;
    private final TaskSettingsRepository taskSettingsRepository;
    private final BoardStatusAppearanceRepository boardStatusAppearanceRepository;
    private final BoardRepository boardRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public CalendarDto getCalendar(LocalDate from, LocalDate to, User user) {

        List<Board> boards = boardRepository.findByOwnerIdOrderByPositionAsc(user.getId());
        List<Long> projectIds = new ArrayList<>();
        for (Board board : boards) {
            projectRepository.findByBoardIdOrderByPositionAsc(board.getId())
                    .forEach(p -> projectIds.add(p.getId()));
        }

        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt = to.plusDays(1).atStartOfDay();

        List<TaskSchedule> schedules = projectIds.isEmpty()
                ? List.of()
                : taskScheduleRepository.findInPeriod(fromDt, toDt, projectIds);

        Map<LocalDate, List<CalendarTaskDto>> byDate = new TreeMap<>();

        for (TaskSchedule schedule : schedules) {
            if (schedule.getDeadline() == null) continue;

            LocalDate date = schedule.getDeadline().toLocalDate();

            Task task = schedule.getTask();
            TaskSettings settings = taskSettingsRepository.findById(task.getId()).orElse(null);

            BoardStatusAppearance appearance = null;
            if (settings != null && settings.getStatus() != null) {
                appearance = boardStatusAppearanceRepository
                        .findById(settings.getStatus().getId()).orElse(null);
            }

            boolean isOverdue = OverduePolicyService.isOverdue(
                    schedule.getDeadline(),
                    schedule.getCompletedAt()
            );

            CalendarTaskDto dto = CalendarTaskDto.builder()
                    .id(task.getId())
                    .title(task.getTitle())
                    .projectId(task.getProject().getId())
                    .projectTitle(task.getProject().getTitle())
                    .statusCode(settings != null && settings.getStatus() != null
                            ? settings.getStatus().getCode() : null)
                    .statusAccentCode(appearance != null ? appearance.getAccentCode() : null)
                    .isOverdue(isOverdue)
                    .build();

            byDate.computeIfAbsent(date, k -> new ArrayList<>()).add(dto);
        }

        List<CalendarDayDto> days = byDate.entrySet().stream()
                .map(e -> CalendarDayDto.builder()
                        .date(e.getKey().toString())
                        .tasks(e.getValue())
                        .build())
                .collect(Collectors.toList());

        return CalendarDto.builder()
                .from(from.toString())
                .to(to.toString())
                .days(days)
                .build();
    }
}