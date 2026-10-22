package coursework.taskboard.service.template;

import coursework.taskboard.dto.project.CreateProjectRequest;
import coursework.taskboard.dto.project.ProjectDto;
import coursework.taskboard.dto.task.CreateTaskRequest;
import coursework.taskboard.dto.task.TaskDto;
import coursework.taskboard.dto.template.ApplyPlanRequest;
import coursework.taskboard.dto.template.ApplyPlanResultDto;
import coursework.taskboard.model.board.BoardStatus;
import coursework.taskboard.model.project.Project;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.board.BoardStatusRepository;
import coursework.taskboard.repository.project.ProjectRepository;
import coursework.taskboard.repository.user.UserRepository;
import coursework.taskboard.service.access.ProjectAccessService;
import coursework.taskboard.service.project.ProjectService;
import coursework.taskboard.service.task.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Общий «движок» применения шаблонов и гайдов:
 * создаёт проект (по желанию) и задачи с дедлайнами и подзадачами.
 */
@Service
@RequiredArgsConstructor
public class TemplateApplyService {

    private static final int MAX_SUBTASKS = 20;

    private final ProjectService projectService;
    private final ProjectRepository projectRepository;
    private final BoardStatusRepository boardStatusRepository;
    private final ProjectAccessService accessService;
    private final TaskService taskService;
    private final UserRepository userRepository;

    @Transactional
    public ApplyPlanResultDto apply(List<PlannedTask> planned,
                                    ApplyPlanRequest request,
                                    User user,
                                    String fallbackTitle,
                                    String fallbackDescription) {
        if (request.getBoardId() == null) {
            throw new IllegalArgumentException("Не выбрана доска");
        }
        accessService.requireBoard(request.getBoardId(), user);

        boolean createProject = Boolean.TRUE.equals(request.getCreateProject())
                || request.getProjectId() == null;
        Project project = createProject
                ? createProject(request, user, fallbackTitle, fallbackDescription)
                : resolveProject(request, user);

        Long boardId = project.getBoard().getId();
        List<BoardStatus> statuses = boardStatusRepository
                .findByBoardIdAndScopeOrderByPositionAsc(boardId, "task");
        if (statuses.isEmpty()) {
            throw new IllegalStateException("На доске нет статусов задач");
        }

        LocalDate start = request.getStartDate() != null
                ? request.getStartDate()
                : LocalDate.now();
        boolean includeSubtasks = !Boolean.FALSE.equals(request.getIncludeSubtasks());

        int createdTasks = 0;
        int createdSubtasks = 0;

        for (PlannedTask plannedTask : planned) {
            if (plannedTask.title() == null || plannedTask.title().isBlank()) continue;

            CreateTaskRequest parentReq = new CreateTaskRequest();
            parentReq.setTitle(plannedTask.title().trim());
            parentReq.setDescription(emptyToNull(plannedTask.description()));
            parentReq.setPriority(clampPriority(plannedTask.priority()));
            parentReq.setStatusId(resolveStatusId(statuses, plannedTask.statusCategoryCode()));
            parentReq.setDeadline(deadline(start, plannedTask.deadlineOffsetDays()));

            TaskDto parent = taskService.createTask(project.getId(), parentReq, user);
            createdTasks++;

            if (includeSubtasks && plannedTask.subtasks() != null) {
                int subtaskCount = 0;
                for (String raw : plannedTask.subtasks()) {
                    if (raw == null || raw.isBlank()) continue;
                    if (subtaskCount >= MAX_SUBTASKS) break;

                    CreateTaskRequest subReq = new CreateTaskRequest();
                    subReq.setTitle(raw.trim());
                    subReq.setParentId(parent.getId());
                    subReq.setPriority((short) 0);
                    subReq.setStatusId(parentReq.getStatusId());
                    taskService.createTask(project.getId(), subReq, user);
                    subtaskCount++;
                    createdSubtasks++;
                }
            }
        }

        return ApplyPlanResultDto.builder()
                .projectId(project.getId())
                .projectTitle(project.getTitle())
                .createdTasks(createdTasks)
                .createdSubtasks(createdSubtasks)
                .message(createdTasks == 0
                        ? "В плане не было задач"
                        : "Добавлено задач: " + createdTasks
                        + (createdSubtasks > 0 ? ", подзадач: " + createdSubtasks : ""))
                .build();
    }

    private Project createProject(ApplyPlanRequest request,
                                  User user,
                                  String fallbackTitle,
                                  String fallbackDescription) {
        String title = request.getProjectTitle();
        if (title == null || title.isBlank()) title = fallbackTitle;
        if (title == null || title.isBlank()) title = "Новый проект";
        if (title.length() > 200) title = title.substring(0, 200);

        String description = request.getProjectDescription();
        if (description == null || description.isBlank()) description = fallbackDescription;
        if (description != null && description.length() > 2000) {
            description = description.substring(0, 2000);
        }

        CreateProjectRequest create = new CreateProjectRequest();
        create.setTitle(title);
        create.setDescription(description);

        // User из CurrentUserService — detached: ProjectService внутри читает
        // user.getBoards() для достижений. Берём управляемую копию в текущей транзакции.
        User managedUser = userRepository.findById(user.getId()).orElse(user);
        ProjectDto dto = projectService.createProject(request.getBoardId(), create, managedUser);

        return projectRepository.findById(dto.getId())
                .orElseThrow(() -> new IllegalStateException("Не удалось создать проект"));
    }

    private Project resolveProject(ApplyPlanRequest request, User user) {
        Project project = accessService.requireProject(request.getProjectId(), user);
        if (!project.getBoard().getId().equals(request.getBoardId())) {
            throw new IllegalArgumentException("Проект принадлежит другой доске");
        }
        return project;
    }

    private Long resolveStatusId(List<BoardStatus> statuses, String categoryCode) {
        String code = categoryCode == null || categoryCode.isBlank()
                ? "ACTIVE"
                : categoryCode.toUpperCase();

        List<BoardStatus> matching = new ArrayList<>();
        for (BoardStatus status : statuses) {
            if (code.equalsIgnoreCase(status.getCategoryCode())) matching.add(status);
        }
        if (!matching.isEmpty()) return matching.get(0).getId();

        for (BoardStatus status : statuses) {
            if ("ACTIVE".equalsIgnoreCase(status.getCategoryCode())) return status.getId();
        }
        for (BoardStatus status : statuses) {
            if (Boolean.TRUE.equals(status.getIsDefault())) return status.getId();
        }
        return statuses.get(0).getId();
    }

    private LocalDateTime deadline(LocalDate start, Integer offsetDays) {
        if (offsetDays == null) return null;
        int offset = Math.max(0, offsetDays);
        LocalDate date = start.plusDays(offset);
        // Бэкенд не принимает дедлайн в прошлом — оставляем поле пустым.
        if (date.isBefore(LocalDate.now())) return null;
        return LocalDateTime.of(date, LocalTime.of(23, 59));
    }

    private Short clampPriority(Short priority) {
        if (priority == null) return 0;
        // Сохраняем шкалу PriorityPicker: -1 (низкий), 0 (обычный), 2 (важный).
        if (priority < -1) return -1;
        if (priority > 5) return 5;
        return priority;
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
