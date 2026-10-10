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
import coursework.taskboard.model.user.UserAppearance;
import coursework.taskboard.model.user.UserProfile;
import coursework.taskboard.repository.attachment.AttachmentMetaRepository;
import coursework.taskboard.repository.attachment.AttachmentRepository;
import coursework.taskboard.repository.board.*;
import coursework.taskboard.repository.project.ProjectRepository;
import coursework.taskboard.repository.stage.StageRepository;
import coursework.taskboard.repository.tag.TagAppearanceRepository;
import coursework.taskboard.repository.tag.TagRepository;
import coursework.taskboard.repository.task.*;
import coursework.taskboard.repository.user.UserAppearanceRepository;
import coursework.taskboard.repository.user.UserProfileRepository;
import coursework.taskboard.service.achievement.AchievementService;
import coursework.taskboard.service.shop.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class TaskService {

    private static final int MAX_SUBTASKS = 20;

    private final TaskRepository taskRepository;
    private final TaskSettingsRepository taskSettingsRepository;
    private final TaskScheduleRepository taskScheduleRepository;
    private final TaskTagRepository taskTagRepository;
    private final TaskAttachmentRepository taskAttachmentRepository;
    private final TaskRecurrenceRepository taskRecurrenceRepository;
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
    private final UserProfileRepository userProfileRepository;
    private final UserAppearanceRepository userAppearanceRepository;

    private final TaskMapper taskMapper;
    private final AchievementService achievementService;
    private final ShopService shopService;
    private final RecurrenceService recurrenceService;
    private final TaskAuditService taskAuditService;

    @Value("${app.upload.base-url}")
    private String uploadBaseUrl;

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
                throw new IllegalArgumentException("Подзадача не может содержать свои подзадачи");
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
        task.setStartedBy(user);
        task.setLastEditedBy(user);
        task.setLastEditedAt(LocalDateTime.now());
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

        checkFunnyAchievementsOnText(user, task.getTitle());

        taskAuditService.log(task, user, "CREATED", null);

        TaskDto dto = taskMapper.toTaskDto(task, settings, schedule, status,
                boardStatusAppearanceRepository.findById(status.getId()).orElse(null),
                tagDtos, new ArrayList<>(), new ArrayList<>(), 0, 0);

        dto.setStartedBy(buildUserShort(task.getStartedBy()));
        dto.setLastEditedBy(buildUserShort(task.getLastEditedBy()));
        dto.setLastEditedAt(task.getLastEditedAt());

        return dto;
    }

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

        List<TaskShortDto> subtasks = new ArrayList<>();
        for (Task sub : taskRepository.findByParentIdOrderByPositionAsc(taskId)) {
            TaskSettings subSettings = taskSettingsRepository.findById(sub.getId()).orElse(null);
            TaskSchedule subSchedule = taskScheduleRepository.findById(sub.getId()).orElse(null);
            BoardStatus subStatus = subSettings != null ? subSettings.getStatus() : null;
            BoardStatusAppearance subAppearance = subStatus != null
                    ? boardStatusAppearanceRepository.findById(subStatus.getId()).orElse(null)
                    : null;

            List<String> subAttachmentNames = getAttachmentNames(sub.getId());

            List<TagShortDto> subTags = new ArrayList<>();
            for (TaskTag tt : taskTagRepository.findByTaskId(sub.getId())) {
                TagAppearance ta = tagAppearanceRepository.findById(tt.getTag().getId()).orElse(null);
                subTags.add(taskMapper.toTagShortDto(tt.getTag(), ta));
            }

            TaskShortDto subDto = taskMapper.toTaskShortDto(sub, subSettings, subSchedule, subStatus,
                    subAppearance, subAttachmentNames, 0, 0, null, subTags);
            subDto.setStartedBy(buildUserShort(sub.getStartedBy()));
            subDto.setLastEditedBy(buildUserShort(sub.getLastEditedBy()));
            subtasks.add(subDto);
        }

        long subtaskTotal = subtasks.size();
        long subtaskDone = subtasks.stream()
                .filter(s -> isDoneCategory(s.getStatusCategoryCode()))
                .count();

        TaskDto dto = taskMapper.toTaskDto(task, settings, schedule, status, statusAppearance,
                tags, attachments, subtasks, subtaskTotal, subtaskDone);

        dto.setStartedBy(buildUserShort(task.getStartedBy()));
        dto.setLastEditedBy(buildUserShort(task.getLastEditedBy()));
        dto.setLastEditedAt(task.getLastEditedAt());

        RecurrenceDto rec = recurrenceService.getRule(task);
        dto.setRecurrence(rec);

        return dto;
    }

    @Transactional(readOnly = true)
    public List<TaskShortDto> getProjectTasks(Long projectId, User user) {
        getProjectWithAccess(projectId, user);

        List<Task> tasks = taskRepository.findByProjectIdAndParentIsNullOrderByPositionAsc(projectId);
        return toShortDtos(tasks);
    }

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

    @Transactional
    public TaskDto updateTask(Long taskId, UpdateTaskRequest request, User user) {
        Task task = getTaskWithAccess(taskId, user);
        TaskSettings settings = taskSettingsRepository.findById(taskId).orElseThrow();
        TaskSchedule schedule = taskScheduleRepository.findById(taskId).orElseThrow();
        Board board = task.getProject().getBoard();

        String oldTitle = task.getTitle();
        String oldDescription = task.getDescription();
        String oldStatusTitle = settings.getStatus() != null ? settings.getStatus().getTitle() : null;
        Short oldPriority = settings.getPriority();
        LocalDateTime oldDeadline = schedule.getDeadline();
        List<Long> oldTagIds = taskTagRepository.findByTaskId(taskId).stream()
                .map(tt -> tt.getTag().getId()).toList();

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

        if (Boolean.TRUE.equals(request.getClearParent())) {
            if (task.getParent() != null) {
                task.setParent(null);
                task.setPosition(
                        (int) taskRepository.countByProjectIdAndParentIsNull(task.getProject().getId())
                );
            }
        } else if (request.getParentId() != null) {
            if (!request.getParentId().equals(taskId)) {
                Task newParent = taskRepository.findById(request.getParentId())
                        .orElseThrow(() -> new IllegalArgumentException("Parent task not found"));

                if (!newParent.getProject().getId().equals(task.getProject().getId())) {
                    throw new IllegalArgumentException("Parent from another project");
                }
                if (newParent.getParent() != null) {
                    throw new IllegalArgumentException("Подзадача не может содержать свои подзадачи");
                }

                Task current = newParent;
                while (current != null) {
                    if (current.getId().equals(taskId)) {
                        throw new IllegalArgumentException("Cannot set descendant as parent");
                    }
                    current = current.getParent();
                }

                long siblings = taskRepository.countByParentId(newParent.getId());
                if (!newParent.getId().equals(task.getParent() != null ? task.getParent().getId() : null)
                        && siblings >= MAX_SUBTASKS) {
                    throw new IllegalArgumentException(
                            "У задачи не может быть больше " + MAX_SUBTASKS + " подзадач");
                }

                task.setParent(newParent);
                task.setPosition((int) siblings);
            }
        }

        if (request.getTitle() != null) {
            checkFunnyAchievementsOnText(user, task.getTitle());
        }

        if (request.getStatusId() != null) {
            BoardStatus newStatus = boardStatusRepository.findById(request.getStatusId())
                    .orElseThrow(() -> new IllegalArgumentException("Status not found"));

            if (!newStatus.getBoard().getId().equals(board.getId())) {
                throw new IllegalArgumentException("Status from another board");
            }
            if (!"task".equals(newStatus.getScope())) {
                throw new IllegalArgumentException("Status must have scope='task'");
            }

            String oldCategory = settings.getStatus() != null
                    ? settings.getStatus().getCategoryCode() : null;
            String newCategory = newStatus.getCategoryCode();

            boolean wasFinal = isFinalStatus(settings.getStatus());
            boolean willBeFinal = isFinalStatus(newStatus);

            if (!wasFinal && willBeFinal) {
                schedule.setCompletedAt(LocalDateTime.now());
            } else if (wasFinal && !willBeFinal) {
                schedule.setCompletedAt(null);
            }

            settings.setStatus(newStatus);
            taskSettingsRepository.save(settings);

            if (task.getParent() == null) {
                for (Task sub : taskRepository.findByParentIdOrderByPositionAsc(task.getId())) {
                    TaskSettings subSettings = taskSettingsRepository.findById(sub.getId()).orElse(null);
                    if (subSettings != null) {
                        subSettings.setStatus(newStatus);

                        TaskSchedule subSchedule = taskScheduleRepository.findById(sub.getId()).orElse(null);
                        if (subSchedule != null) {
                            if (!wasFinal && willBeFinal && subSchedule.getCompletedAt() == null) {
                                subSchedule.setCompletedAt(LocalDateTime.now());
                            } else if (wasFinal && !willBeFinal) {
                                subSchedule.setCompletedAt(null);
                            }
                            taskScheduleRepository.save(subSchedule);
                        }

                        taskSettingsRepository.save(subSettings);
                    }
                }
            }

            if (task.getParent() != null) {
                syncParentStatus(task);
            }

            if (!wasFinal && willBeFinal) {
                onTaskCompleted(user, task, schedule, oldCategory, newCategory);
            } else if ("EXPIRED".equals(newCategory) && !"EXPIRED".equals(oldCategory)) {
                achievementService.firstExpired(user);
            }
        } else {
            taskSettingsRepository.save(settings);
        }

        if (request.getPriority() != null) settings.setPriority(request.getPriority());
        if (request.getIsPinned() != null) settings.setIsPinned(request.getIsPinned());
        taskSettingsRepository.save(settings);

        if (request.getDeadline() != null) {
            LocalDateTime oldDl = schedule.getDeadline();
            LocalDateTime newDeadline = request.getDeadline();

            boolean wasOverdue = oldDl != null
                    && oldDl.isBefore(OverduePolicyService.thresholdNow())
                    && schedule.getCompletedAt() == null;

            schedule.setDeadline(newDeadline);

            if (wasOverdue) {
                int count = schedule.getRescheduleCount() == null ? 0 : schedule.getRescheduleCount();
                schedule.setRescheduleCount(count + 1);
                schedule.setExpiredAt(null);
                schedule.setRescheduleSnoozedUntil(null);

                if (newDeadline.isAfter(LocalDateTime.now())) {
                    BoardStatus activeStatus = boardStatusRepository
                            .findByBoardIdAndScopeAndIsDefaultTrue(board.getId(), "task")
                            .orElse(null);
                    if (activeStatus != null) {
                        settings.setStatus(activeStatus);
                        taskSettingsRepository.save(settings);
                    }
                }
            }
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

        task.setLastEditedBy(user);
        task.setLastEditedAt(LocalDateTime.now());
        taskRepository.save(task);

        if (!Objects.equals(oldTitle, task.getTitle())) {
            taskAuditService.log(task, user, "UPDATED", "title", oldTitle, task.getTitle());
        }
        if (!Objects.equals(oldDescription, task.getDescription())) {
            taskAuditService.log(task, user, "UPDATED", "description", oldDescription, task.getDescription());
        }
        String newStatusTitle = settings.getStatus() != null ? settings.getStatus().getTitle() : null;
        if (!Objects.equals(oldStatusTitle, newStatusTitle)) {
            taskAuditService.log(task, user, "STATUS_CHANGED", "status", oldStatusTitle, newStatusTitle);
        }
        if (!Objects.equals(oldPriority, settings.getPriority())) {
            taskAuditService.log(task, user, "UPDATED", "priority",
                    oldPriority != null ? oldPriority.toString() : null,
                    settings.getPriority() != null ? settings.getPriority().toString() : null);
        }
        if (!Objects.equals(oldDeadline, schedule.getDeadline())) {
            taskAuditService.log(task, user, "UPDATED", "deadline",
                    oldDeadline != null ? oldDeadline.toString() : null,
                    schedule.getDeadline() != null ? schedule.getDeadline().toString() : null);
        }

        List<Long> newTagIds = taskTagRepository.findByTaskId(taskId).stream()
                .map(tt -> tt.getTag().getId()).toList();
        for (Long id : newTagIds) {
            if (!oldTagIds.contains(id)) {
                Tag tag = tagRepository.findById(id).orElse(null);
                taskAuditService.log(task, user, "TAG_ADDED", "tag", null,
                        tag != null ? tag.getTitle() : String.valueOf(id));
            }
        }
        for (Long id : oldTagIds) {
            if (!newTagIds.contains(id)) {
                Tag tag = tagRepository.findById(id).orElse(null);
                taskAuditService.log(task, user, "TAG_REMOVED", "tag",
                        tag != null ? tag.getTitle() : String.valueOf(id), null);
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

        TaskDto dto = taskMapper.toTaskDto(task, settings, schedule, status, statusAppearance,
                tagDtos, new ArrayList<>(), new ArrayList<>(), subtaskTotal, 0);

        dto.setStartedBy(buildUserShort(task.getStartedBy()));
        dto.setLastEditedBy(buildUserShort(task.getLastEditedBy()));
        dto.setLastEditedAt(task.getLastEditedAt());

        RecurrenceDto rec = recurrenceService.getRule(task);
        dto.setRecurrence(rec);

        return dto;
    }

    private void onTaskCompleted(User user, Task task, TaskSchedule schedule,
                                 String oldCategory, String newCategory) {

        if (!"DONE".equals(newCategory) && !"ARCHIVED".equals(newCategory)) {
            return;
        }

        shopService.addLeaves(user, 1);

        achievementService.firstTask(user);

        long totalDone = countDoneTasksForUser(user);
        achievementService.checkTotalTasks(user, totalDone);

        long doneToday = countDoneTasksToday(user);
        achievementService.checkDayTasks(user, doneToday);

        int hour = LocalDateTime.now().getHour();
        if (hour >= 23 || hour < 5) {
            achievementService.nightOwl(user);
        }

        if (schedule != null && schedule.getDeadline() != null
                && LocalDateTime.now().isBefore(schedule.getDeadline())) {
            long onTimeCount = countOnTimeForUser(user);
            achievementService.checkOnTime(user, onTimeCount);
        }

        long last10min = countDoneLastMinutes(user, 10);
        if (last10min >= 5) {
            achievementService.ninja(user);
        }
    }

    private void checkFunnyAchievementsOnText(User user, String title) {
        if (title == null) return;
        String low = title.toLowerCase();
        if (low.contains("утка") || low.contains("duck")) {
            achievementService.duck(user);
        }
        if (low.contains("лол") || low.contains(":d") || low.contains(":д") || low.contains("lol")) {
            achievementService.joker(user);
        }
    }

    private long countDoneTasksForUser(User user) {
        return taskRepository.findAllByOwnerId(user.getId()).stream()
                .filter(t -> {
                    TaskSettings s = taskSettingsRepository.findById(t.getId()).orElse(null);
                    if (s == null || s.getStatus() == null) return false;
                    String c = s.getStatus().getCategoryCode();
                    return "DONE".equals(c) || "ARCHIVED".equals(c);
                })
                .count();
    }

    private long countDoneTasksToday(User user) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        return taskRepository.findAllByOwnerId(user.getId()).stream()
                .filter(t -> {
                    TaskSchedule sch = taskScheduleRepository.findById(t.getId()).orElse(null);
                    if (sch == null || sch.getCompletedAt() == null) return false;
                    return sch.getCompletedAt().isAfter(startOfDay);
                })
                .count();
    }

    private long countOnTimeForUser(User user) {
        return taskRepository.findAllByOwnerId(user.getId()).stream()
                .filter(t -> {
                    TaskSchedule sch = taskScheduleRepository.findById(t.getId()).orElse(null);
                    if (sch == null || sch.getDeadline() == null || sch.getCompletedAt() == null) return false;
                    return sch.getCompletedAt().isBefore(sch.getDeadline());
                })
                .count();
    }

    private long countDoneLastMinutes(User user, int minutes) {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(minutes);
        return taskRepository.findAllByOwnerId(user.getId()).stream()
                .filter(t -> {
                    TaskSchedule sch = taskScheduleRepository.findById(t.getId()).orElse(null);
                    if (sch == null || sch.getCompletedAt() == null) return false;
                    return sch.getCompletedAt().isAfter(threshold);
                })
                .count();
    }

    private void syncParentStatus(Task task) {
        Task parent = task.getParent();
        if (parent == null) return;

        List<Task> siblings = taskRepository.findByParentIdOrderByPositionAsc(parent.getId());
        if (siblings.isEmpty()) return;

        TaskSettings parentSettings = taskSettingsRepository.findById(parent.getId()).orElse(null);
        if (parentSettings == null) return;

        boolean allDone = true;
        BoardStatus doneStatus = null;

        for (Task sibling : siblings) {
            TaskSettings s = taskSettingsRepository.findById(sibling.getId()).orElse(null);
            if (s == null || s.getStatus() == null) {
                allDone = false;
                break;
            }
            if ("DONE".equals(s.getStatus().getCategoryCode())) {
                doneStatus = s.getStatus();
            } else {
                allDone = false;
                break;
            }
        }

        if (allDone && doneStatus != null) {
            if (!"DONE".equals(parentSettings.getStatus().getCategoryCode())) {
                parentSettings.setStatus(doneStatus);
                taskSettingsRepository.save(parentSettings);

                TaskSchedule parentSchedule = taskScheduleRepository.findById(parent.getId()).orElse(null);
                if (parentSchedule != null) {
                    parentSchedule.setCompletedAt(LocalDateTime.now());
                    taskScheduleRepository.save(parentSchedule);
                }

                syncParentStatus(parent);
            }
        } else {
            if ("DONE".equals(parentSettings.getStatus().getCategoryCode())) {
                BoardStatus activeStatus = boardStatusRepository
                        .findByBoardIdAndScopeAndCode(
                                parent.getProject().getBoard().getId(),
                                "task",
                                "IN_PROGRESS"
                        )
                        .orElse(null);

                if (activeStatus != null) {
                    parentSettings.setStatus(activeStatus);
                    taskSettingsRepository.save(parentSettings);

                    TaskSchedule parentSchedule = taskScheduleRepository.findById(parent.getId()).orElse(null);
                    if (parentSchedule != null) {
                        parentSchedule.setCompletedAt(null);
                        taskScheduleRepository.save(parentSchedule);
                    }

                    syncParentStatus(parent);
                }
            }
        }
    }

    @Transactional
    public void deleteTask(Long taskId, User user) {
        Task task = getTaskWithAccess(taskId, user);
        taskRepository.delete(task);
    }

    @Transactional(readOnly = true)
    public List<TaskShortDto> getRescheduleCandidates(User user) {
        List<Long> projectIds = projectRepository.findAll().stream()
                .filter(p -> p.getBoard().getOwner().getId().equals(user.getId()))
                .map(Project::getId)
                .toList();

        if (projectIds.isEmpty()) return List.of();

        List<TaskSchedule> schedules = taskScheduleRepository.findPendingReschedule(
                LocalDateTime.now(),
                OverduePolicyService.thresholdNow(),
                projectIds
        );

        List<Task> tasks = new ArrayList<>();
        for (TaskSchedule ts : schedules) {
            tasks.add(ts.getTask());
        }
        return toShortDtos(tasks);
    }

    @Transactional
    public void snoozeReschedule(Long taskId, int hours, User user) {
        getTaskWithAccess(taskId, user);
        TaskSchedule schedule = taskScheduleRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found"));
        schedule.setRescheduleSnoozedUntil(LocalDateTime.now().plusHours(hours));
        taskScheduleRepository.save(schedule);
    }

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

        AttachmentMeta meta = attachmentMetaRepository.findById(attachmentId).orElse(null);
        taskAuditService.log(task, user, "ATTACHMENT_ADDED", "attachment", null,
                meta != null ? meta.getOriginalName() : String.valueOf(attachmentId));

        task.setLastEditedBy(user);
        task.setLastEditedAt(LocalDateTime.now());
        taskRepository.save(task);
    }

    @Transactional
    public void detachAttachment(Long taskId, Long attachmentId, User user) {
        Task task = getTaskWithAccess(taskId, user);

        Attachment a = attachmentRepository.findById(attachmentId).orElse(null);
        AttachmentMeta meta = a != null
                ? attachmentMetaRepository.findById(a.getId()).orElse(null)
                : null;
        taskAuditService.log(task, user, "ATTACHMENT_REMOVED", "attachment",
                meta != null ? meta.getOriginalName() : String.valueOf(attachmentId), null);

        TaskAttachment.TaskAttachmentId id =
                new TaskAttachment.TaskAttachmentId(taskId, attachmentId);

        if (taskAttachmentRepository.existsById(id)) {
            taskAttachmentRepository.deleteById(id);
        }

        task.setLastEditedBy(user);
        task.setLastEditedAt(LocalDateTime.now());
        taskRepository.save(task);
    }

    private List<TaskShortDto> toShortDtos(List<Task> tasks) {
        List<TaskShortDto> result = new ArrayList<>();

        for (Task task : tasks) {
            TaskSettings settings = taskSettingsRepository.findById(task.getId()).orElse(null);
            TaskSchedule schedule = taskScheduleRepository.findById(task.getId()).orElse(null);
            BoardStatus status = settings != null ? settings.getStatus() : null;
            BoardStatusAppearance appearance = status != null
                    ? boardStatusAppearanceRepository.findById(status.getId()).orElse(null)
                    : null;

            List<String> attachmentNames = getAttachmentNames(task.getId());

            List<TaskShortDto> subtasks = new ArrayList<>();
            for (Task sub : taskRepository.findByParentIdOrderByPositionAsc(task.getId())) {
                TaskSettings ss = taskSettingsRepository.findById(sub.getId()).orElse(null);
                TaskSchedule sch = taskScheduleRepository.findById(sub.getId()).orElse(null);
                BoardStatus stStatus = ss != null ? ss.getStatus() : null;
                BoardStatusAppearance stApp = stStatus != null
                        ? boardStatusAppearanceRepository.findById(stStatus.getId()).orElse(null)
                        : null;

                List<String> stAttachmentNames = getAttachmentNames(sub.getId());

                List<TagShortDto> stTags = new ArrayList<>();
                for (TaskTag tt : taskTagRepository.findByTaskId(sub.getId())) {
                    TagAppearance ta = tagAppearanceRepository.findById(tt.getTag().getId()).orElse(null);
                    stTags.add(taskMapper.toTagShortDto(tt.getTag(), ta));
                }

                TaskShortDto subDto = taskMapper.toTaskShortDto(sub, ss, sch, stStatus, stApp,
                        stAttachmentNames, 0, 0, null, stTags);
                subDto.setStartedBy(buildUserShort(sub.getStartedBy()));
                subDto.setLastEditedBy(buildUserShort(sub.getLastEditedBy()));
                subtasks.add(subDto);
            }

            long subtaskTotal = subtasks.size();
            long subtaskDone = subtasks.stream()
                    .filter(s -> isDoneCategory(s.getStatusCategoryCode()))
                    .count();

            List<TagShortDto> tagDtos = new ArrayList<>();
            for (TaskTag tt : taskTagRepository.findByTaskId(task.getId())) {
                TagAppearance ta = tagAppearanceRepository.findById(tt.getTag().getId()).orElse(null);
                tagDtos.add(taskMapper.toTagShortDto(tt.getTag(), ta));
            }

            TaskShortDto dto = taskMapper.toTaskShortDto(task, settings, schedule, status, appearance,
                    attachmentNames, subtaskTotal, subtaskDone, subtasks, tagDtos);
            dto.setStartedBy(buildUserShort(task.getStartedBy()));
            dto.setLastEditedBy(buildUserShort(task.getLastEditedBy()));
            result.add(dto);
        }

        return result;
    }

    private UserShortDto buildUserShort(User u) {
        if (u == null) return null;

        UserProfile profile = userProfileRepository.findById(u.getId()).orElse(null);
        AttachmentMeta meta = null;
        if (profile != null && profile.getAvatar() != null) {
            meta = attachmentMetaRepository.findById(profile.getAvatar().getId()).orElse(null);
        }

        UserAppearance appearance = userAppearanceRepository.findById(u.getId()).orElse(null);

        String avatarCode = null;
        String avatarEmoji = null;
        String avatarImageUrl = null;
        String frameCssClass = null;
        String frameCode = null;

        if (appearance != null) {
            if (appearance.getActiveAvatar() != null) {
                avatarCode = appearance.getActiveAvatar().getCode();
                avatarEmoji = appearance.getActiveAvatar().getEmoji();
                String raw = appearance.getActiveAvatar().getImageUrl();
                if (raw != null && !raw.isBlank()) {
                    avatarImageUrl = (raw.startsWith("http://")
                            || raw.startsWith("https://")
                            || raw.startsWith("/"))
                            ? raw
                            : uploadBaseUrl + "/" + raw;
                }
            }
            if (appearance.getActiveFrame() != null) {
                frameCssClass = appearance.getActiveFrame().getCssClass();
                frameCode = appearance.getActiveFrame().getCode();
            }
        }

        UserShortDto dto = taskMapper.toUserShortDto(u, profile, meta);
        if (dto != null) {
            dto.setAvatarCode(avatarCode);
            dto.setAvatarEmoji(avatarEmoji);
            dto.setAvatarImageUrl(avatarImageUrl);
            dto.setFrameCssClass(frameCssClass);
            dto.setFrameCode(frameCode);
        }
        return dto;
    }

    private List<String> getAttachmentNames(Long taskId) {
        List<String> names = new ArrayList<>();
        for (TaskAttachment att : taskAttachmentRepository.findByTaskIdOrderByPositionAsc(taskId)) {
            Attachment a = att.getAttachment();
            AttachmentMeta meta = attachmentMetaRepository.findById(a.getId()).orElse(null);
            if (meta != null && meta.getOriginalName() != null) {
                names.add(meta.getOriginalName());
            }
        }
        return names;
    }

    private boolean isDoneCategory(String categoryCode) {
        return "DONE".equals(categoryCode)
                || "CANCELLED".equals(categoryCode)
                || "EXPIRED".equals(categoryCode)
                || "ARCHIVED".equals(categoryCode);
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

    @Transactional
    public void moveDeadline(Long taskId, LocalDate newDate, User user) {
        Task task = getTaskWithAccess(taskId, user);
        TaskSchedule schedule = taskScheduleRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found"));

        LocalDateTime oldDeadline = schedule.getDeadline();

        LocalDateTime newDeadline;
        if (schedule.getDeadline() != null
                && (schedule.getDeadline().getHour() != 0 || schedule.getDeadline().getMinute() != 0)) {
            newDeadline = newDate.atTime(schedule.getDeadline().toLocalTime());
        } else {
            newDeadline = newDate.atStartOfDay();
        }
        schedule.setDeadline(newDeadline);
        taskScheduleRepository.save(schedule);

        if (!Objects.equals(oldDeadline, newDeadline)) {
            taskAuditService.log(task, user, "UPDATED", "deadline",
                    oldDeadline != null ? oldDeadline.toString() : null,
                    newDeadline != null ? newDeadline.toString() : null);
        }

        task.setLastEditedBy(user);
        task.setLastEditedAt(LocalDateTime.now());
        taskRepository.save(task);
    }

    @Transactional
    public RecurrenceDto saveRecurrence(Long taskId, RecurrenceRequestDto req, User user) {
        Task task = getTaskWithAccess(taskId, user);
        return recurrenceService.saveRule(task, req, user);
    }

    @Transactional(readOnly = true)
    public RecurrenceDto getRecurrence(Long taskId, User user) {
        Task task = getTaskWithAccess(taskId, user);
        return recurrenceService.getRule(task);
    }

    @Transactional
    public void deleteRecurrence(Long taskId, User user) {
        Task task = getTaskWithAccess(taskId, user);
        recurrenceService.deleteRule(task);
    }

    @Transactional(readOnly = true)
    public List<LocalDateTime> previewRecurrence(RecurrenceRequestDto req) {
        return recurrenceService.preview(req, 10);
    }
}