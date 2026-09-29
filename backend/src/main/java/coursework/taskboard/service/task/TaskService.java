package coursework.taskboard.service.task;

import coursework.taskboard.dto.attachment.AttachmentDto;
import coursework.taskboard.dto.task.*;
import coursework.taskboard.model.attachment.Attachment;
import coursework.taskboard.model.attachment.AttachmentMeta;
import coursework.taskboard.model.board.Board;
import coursework.taskboard.model.board.BoardStatus;
import coursework.taskboard.model.board.BoardStatusAppearance;
import coursework.taskboard.model.board.BoardStatusSettings;
import coursework.taskboard.model.project.Project;
import coursework.taskboard.model.stage.Stage;
import coursework.taskboard.model.tag.Tag;
import coursework.taskboard.model.tag.TagAppearance;
import coursework.taskboard.model.task.*;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.attachment.AttachmentMetaRepository;
import coursework.taskboard.repository.attachment.AttachmentRepository;
import coursework.taskboard.repository.board.*;
import coursework.taskboard.repository.project.ProjectRepository;
import coursework.taskboard.repository.stage.StageRepository;
import coursework.taskboard.repository.tag.TagAppearanceRepository;
import coursework.taskboard.repository.tag.TagRepository;
import coursework.taskboard.repository.task.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private static final int MAX_SUBTASKS = 20;

    private final TaskRepository taskRepository;
    private final TaskSettingsRepository taskSettingsRepository;
    private final TaskScheduleRepository taskScheduleRepository;
    private final TaskTagRepository taskTagRepository;
    private final TaskAttachmentRepository taskAttachmentRepository;
    private final ProjectRepository projectRepository;
    private final StageRepository stageRepository;
    private final BoardStatusRepository boardStatusRepository;
    private final BoardStatusAppearanceRepository boardStatusAppearanceRepository;
    private final BoardStatusSettingsRepository boardStatusSettingsRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final TagRepository tagRepository;
    private final TagAppearanceRepository tagAppearanceRepository;
    private final AttachmentRepository attachmentRepository;
    private final AttachmentMetaRepository attachmentMetaRepository;

    private final TaskMapper taskMapper;

    // ============================================================
    // Создать задачу
    // ============================================================
    @Transactional
    public TaskDto createTask(Long projectId, CreateTaskRequest request, User user) {
        Project project = getProjectWithAccess(projectId, user);
        Board board = project.getBoard();

        Task parent = null;
        if (request.getParentId() != null) {
            parent = taskRepository.findById(request.getParentId())
                    .orElseThrow(() -> new IllegalArgumentException("Parent task not found"));

            if (!parent.getProject().getId().equals(projectId)) {
                throw new IllegalArgumentException("Parent from another project");
            }
            if (parent.getParent() != null) {
                throw new IllegalArgumentException("Subtasks cannot have subtasks");
            }
            long count = taskRepository.countByParentId(parent.getId());
            if (count >= MAX_SUBTASKS) {
                throw new IllegalArgumentException(
                        "У задачи не может быть больше " + MAX_SUBTASKS + " подзадач");
            }
        }

        Stage stage = null;
        if (request.getStageId() != null) {
            stage = stageRepository.findById(request.getStageId())
                    .orElseThrow(() -> new IllegalArgumentException("Stage not found"));
            if (!stage.getProject().getId().equals(projectId)) {
                throw new IllegalArgumentException("Stage from another project");
            }
        }

        int position = (int) (parent != null
                ? taskRepository.countByParentId(parent.getId())
                : taskRepository.findByProjectIdAndParentIsNullOrderByPositionAsc(projectId).size());

        Task task = taskMapper.toTask(project, stage, parent, request, position);
        taskRepository.save(task);

        BoardStatus status = resolveStatus(request.getStatusId(), board);
        TaskSettings settings = taskMapper.toTaskSettings(task, status, request.getPriority());
        taskSettingsRepository.save(settings);

        TaskSchedule schedule = taskMapper.toTaskSchedule(task, request.getDeadline());
        taskScheduleRepository.save(schedule);

        List<TagShortDto> tagDtos = new ArrayList<>();
        if (request.getTagIds() != null && !request.getTagIds().isEmpty()) {
            for (Long tagId : request.getTagIds()) {
                Tag tag = tagRepository.findById(tagId)
                        .orElseThrow(() -> new IllegalArgumentException("Tag not found: " + tagId));

                if (!tag.getBoard().getId().equals(board.getId())) {
                    throw new IllegalArgumentException("Tag from another board");
                }

                taskTagRepository.save(taskMapper.toTaskTag(task, tag));

                TagAppearance appearance = tagAppearanceRepository.findById(tagId).orElse(null);
                tagDtos.add(taskMapper.toTagShortDto(tag, appearance));
            }
        }

        return taskMapper.toTaskDto(task, settings, schedule, status,
                boardStatusAppearanceRepository.findById(status.getId()).orElse(null),
                tagDtos, new ArrayList<>(), new ArrayList<>(), 0, 0);
    }

    // ============================================================
    // Одна задача — детально
    // ============================================================
    @Transactional(readOnly = true)
    public TaskDto getTask(Long taskId, User user) {
        Task task = getTaskWithAccess(taskId, user);

        TaskSettings settings = taskSettingsRepository.findById(taskId).orElse(null);
        TaskSchedule schedule = taskScheduleRepository.findById(taskId).orElse(null);
        BoardStatus status = settings != null ? settings.getStatus() : null;

        BoardStatusAppearance statusAppearance = status != null
                ? boardStatusAppearanceRepository.findById(status.getId()).orElse(null)
                : null;

        List<TagShortDto> tags = new ArrayList<>();
        for (TaskTag tt : taskTagRepository.findByTaskId(taskId)) {
            Tag tag = tt.getTag();
            TagAppearance ta = tagAppearanceRepository.findById(tag.getId()).orElse(null);
            tags.add(taskMapper.toTagShortDto(tag, ta));
        }

        List<AttachmentDto> attachments = new ArrayList<>();
        for (TaskAttachment att : taskAttachmentRepository.findByTaskIdOrderByPositionAsc(taskId)) {
            Attachment a = att.getAttachment();
            AttachmentMeta meta = attachmentMetaRepository.findById(a.getId()).orElse(null);
            attachments.add(taskMapper.toAttachmentDto(a, meta, att.getPosition()));
        }

        // Подзадачи
        List<TaskShortDto> subtasks = new ArrayList<>();
        for (Task sub : taskRepository.findByParentIdOrderByPositionAsc(taskId)) {
            TaskSettings subSettings = taskSettingsRepository.findById(sub.getId()).orElse(null);
            TaskSchedule subSchedule = taskScheduleRepository.findById(sub.getId()).orElse(null);
            BoardStatus subStatus = subSettings != null ? subSettings.getStatus() : null;
            BoardStatusAppearance subAppearance = subStatus != null
                    ? boardStatusAppearanceRepository.findById(subStatus.getId()).orElse(null)
                    : null;

            boolean subHasAttachments = taskAttachmentRepository.countByTaskId(sub.getId()) > 0;

            List<TagShortDto> subTags = new ArrayList<>();
            for (TaskTag tt : taskTagRepository.findByTaskId(sub.getId())) {
                TagAppearance ta = tagAppearanceRepository.findById(tt.getTag().getId()).orElse(null);
                subTags.add(taskMapper.toTagShortDto(tt.getTag(), ta));
            }

            subtasks.add(taskMapper.toTaskShortDto(sub, subSettings, subSchedule, subStatus,
                    subAppearance, subHasAttachments, subTags));
        }

        long subtaskTotal = subtasks.size();
        long subtaskDone = subtasks.stream()
                .filter(s -> "DONE".equals(s.getStatusCategoryCode())
                        || "CANCELLED".equals(s.getStatusCategoryCode())
                        || "EXPIRED".equals(s.getStatusCategoryCode())
                        || "ARCHIVED".equals(s.getStatusCategoryCode()))
                .count();

        return taskMapper.toTaskDto(task, settings, schedule, status, statusAppearance,
                tags, attachments, subtasks, subtaskTotal, subtaskDone);
    }

    // ============================================================
    // Список задач проекта
    // ============================================================
    @Transactional(readOnly = true)
    public List<TaskShortDto> getProjectTasks(Long projectId, User user) {
        getProjectWithAccess(projectId, user);

        List<Task> tasks = taskRepository.findByProjectIdAndParentIsNullOrderByPositionAsc(projectId);
        return toShortDtos(tasks);
    }

    // ============================================================
    // Kanban по проекту
    // ============================================================
    @Transactional(readOnly = true)
    public KanbanDto getProjectKanban(Long projectId, User user) {
        Project project = getProjectWithAccess(projectId, user);
        Board board = project.getBoard();

        List<BoardStatus> statuses = boardStatusRepository
                .findByBoardIdAndScopeOrderByPositionAsc(board.getId(), "task");

        List<KanbanColumnDto> columns = new ArrayList<>();

        for (BoardStatus status : statuses) {
            List<Task> tasks = taskRepository.findByStatusId(status.getId())
                    .stream()
                    .filter(t -> t.getProject().getId().equals(projectId))
                    .filter(t -> t.getParent() == null)
                    .toList();

            List<TaskShortDto> taskDtos = toShortDtos(tasks);

            BoardStatusAppearance appearance = boardStatusAppearanceRepository
                    .findById(status.getId()).orElse(null);
            BoardStatusSettings statusSettings = boardStatusSettingsRepository
                    .findById(status.getId()).orElse(null);

            columns.add(taskMapper.toKanbanColumnDto(status, appearance,
                    statusSettings != null ? statusSettings.getAllowDragIn() : true,
                    taskDtos));
        }

        return KanbanDto.builder().columns(columns).build();
    }

    // ============================================================
    // Обновить задачу
    // ============================================================
    @Transactional
    public TaskDto updateTask(Long taskId, UpdateTaskRequest request, User user) {
        Task task = getTaskWithAccess(taskId, user);
        TaskSettings settings = taskSettingsRepository.findById(taskId).orElseThrow();
        TaskSchedule schedule = taskScheduleRepository.findById(taskId).orElseThrow();
        Board board = task.getProject().getBoard();

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPosition() != null) task.setPosition(request.getPosition());

        if (request.getStageId() != null) {
            Stage stage = stageRepository.findById(request.getStageId())
                    .orElseThrow(() -> new IllegalArgumentException("Stage not found"));
            if (!stage.getProject().getId().equals(task.getProject().getId())) {
                throw new IllegalArgumentException("Stage from another project");
            }
            task.setStage(stage);
        }

        taskRepository.save(task);

        if (request.getStatusId() != null) {
            BoardStatus newStatus = boardStatusRepository.findById(request.getStatusId())
                    .orElseThrow(() -> new IllegalArgumentException("Status not found"));

            if (!newStatus.getBoard().getId().equals(board.getId())) {
                throw new IllegalArgumentException("Status from another board");
            }
            if (!"task".equals(newStatus.getScope())) {
                throw new IllegalArgumentException("Status must have scope='task'");
            }

            boolean wasFinal = isFinalStatus(settings.getStatus());
            boolean willBeFinal = isFinalStatus(newStatus);

            if (!wasFinal && willBeFinal) {
                schedule.setCompletedAt(LocalDateTime.now());
            } else if (wasFinal && !willBeFinal) {
                schedule.setCompletedAt(null);
            }

            settings.setStatus(newStatus);
        }

        if (request.getPriority() != null) settings.setPriority(request.getPriority());
        if (request.getIsPinned() != null) settings.setIsPinned(request.getIsPinned());
        taskSettingsRepository.save(settings);

        if (request.getDeadline() != null) {
            schedule.setDeadline(request.getDeadline());
        }
        taskScheduleRepository.save(schedule);

        if (request.getTagIds() != null) {
            taskTagRepository.deleteAll(taskTagRepository.findByTaskId(taskId));

            for (Long tagId : request.getTagIds()) {
                Tag tag = tagRepository.findById(tagId)
                        .orElseThrow(() -> new IllegalArgumentException("Tag not found"));
                if (!tag.getBoard().getId().equals(board.getId())) {
                    throw new IllegalArgumentException("Tag from another board");
                }
                taskTagRepository.save(taskMapper.toTaskTag(task, tag));
            }
        }

        List<TagShortDto> tagDtos = new ArrayList<>();
        for (TaskTag tt : taskTagRepository.findByTaskId(taskId)) {
            Tag tag = tt.getTag();
            TagAppearance ta = tagAppearanceRepository.findById(tag.getId()).orElse(null);
            tagDtos.add(taskMapper.toTagShortDto(tag, ta));
        }

        BoardStatus status = settings.getStatus();
        BoardStatusAppearance statusAppearance = boardStatusAppearanceRepository
                .findById(status.getId()).orElse(null);

        long subtaskTotal = taskRepository.countByParentId(taskId);

        return taskMapper.toTaskDto(task, settings, schedule, status, statusAppearance,
                tagDtos, new ArrayList<>(), new ArrayList<>(), subtaskTotal, 0);
    }

    // ============================================================
    // Удалить задачу
    // ============================================================
    @Transactional
    public void deleteTask(Long taskId, User user) {
        Task task = getTaskWithAccess(taskId, user);
        taskRepository.delete(task);
    }

    // ============================================================
    // Вложения
    // ============================================================
    @Transactional
    public void attachAttachment(Long taskId, Long attachmentId, User user) {
        Task task = getTaskWithAccess(taskId, user);
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));

        if (!attachment.getOwner().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not your attachment");
        }

        TaskAttachment.TaskAttachmentId id =
                new TaskAttachment.TaskAttachmentId(taskId, attachmentId);

        if (taskAttachmentRepository.existsById(id)) {
            return;
        }

        int position = (int) taskAttachmentRepository.countByTaskId(taskId);

        TaskAttachment ta = TaskAttachment.builder()
                .task(task)
                .attachment(attachment)
                .position(position)
                .build();
        taskAttachmentRepository.save(ta);
    }

    @Transactional
    public void detachAttachment(Long taskId, Long attachmentId, User user) {
        getTaskWithAccess(taskId, user);

        TaskAttachment.TaskAttachmentId id =
                new TaskAttachment.TaskAttachmentId(taskId, attachmentId);

        if (taskAttachmentRepository.existsById(id)) {
            taskAttachmentRepository.deleteById(id);
        }
    }

    // ============================================================
    // Helpers
    // ============================================================
    private List<TaskShortDto> toShortDtos(List<Task> tasks) {
        List<TaskShortDto> result = new ArrayList<>();

        for (Task task : tasks) {
            TaskSettings settings = taskSettingsRepository.findById(task.getId()).orElse(null);
            TaskSchedule schedule = taskScheduleRepository.findById(task.getId()).orElse(null);
            BoardStatus status = settings != null ? settings.getStatus() : null;
            BoardStatusAppearance appearance = status != null
                    ? boardStatusAppearanceRepository.findById(status.getId()).orElse(null)
                    : null;

            boolean hasAttachments = taskAttachmentRepository.countByTaskId(task.getId()) > 0;

            List<TagShortDto> tagDtos = new ArrayList<>();
            for (TaskTag tt : taskTagRepository.findByTaskId(task.getId())) {
                TagAppearance ta = tagAppearanceRepository.findById(tt.getTag().getId()).orElse(null);
                tagDtos.add(taskMapper.toTagShortDto(tt.getTag(), ta));
            }

            result.add(taskMapper.toTaskShortDto(task, settings, schedule, status, appearance,
                    hasAttachments, tagDtos));
        }

        return result;
    }

    private BoardStatus resolveStatus(Long statusId, Board board) {
        if (statusId != null) {
            BoardStatus status = boardStatusRepository.findById(statusId)
                    .orElseThrow(() -> new IllegalArgumentException("Status not found"));

            if (!status.getBoard().getId().equals(board.getId())) {
                throw new IllegalArgumentException("Status from another board");
            }
            if (!"task".equals(status.getScope())) {
                throw new IllegalArgumentException("Status must have scope='task'");
            }
            return status;
        }

        return boardStatusRepository
                .findByBoardIdAndScopeAndIsDefaultTrue(board.getId(), "task")
                .orElseThrow(() -> new IllegalStateException("No default task status"));
    }

    private boolean isFinalStatus(BoardStatus status) {
        if (status == null) return false;
        return switch (status.getCategoryCode()) {
            case "DONE", "EXPIRED", "CANCELLED", "ARCHIVED" -> true;
            default -> false;
        };
    }

    private Project getProjectWithAccess(Long projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        if (!boardMemberRepository.existsByBoardIdAndUserId(
                project.getBoard().getId(), user.getId())) {
            throw new IllegalArgumentException("No access to project");
        }

        return project;
    }

    private Task getTaskWithAccess(Long taskId, User user) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        if (!boardMemberRepository.existsByBoardIdAndUserId(
                task.getProject().getBoard().getId(), user.getId())) {
            throw new IllegalArgumentException("No access to task");
        }

        return task;
    }
}