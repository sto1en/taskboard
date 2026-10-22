package coursework.taskboard.service.task;

import coursework.taskboard.dto.achievement.AchievementDto;
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
import coursework.taskboard.service.access.ProjectAccessService;
import coursework.taskboard.service.project.ProjectStatusRecalcService;
import coursework.taskboard.service.shop.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class TaskService {

    private static final int MAX_SUBTASKS = 20;
    /**
     * Убывающая отдача за задачи в течение дня. Доход зависит от того, какой
     * по счёту задачу за сегодня закрывает пользователь:
     *   1–12-я  → 30 листьев (базовая ставка)
     *   13–30-я → 20
     *   31-я+   → 12
     * Экономика выровнена так, чтобы топовый предмет магазина (5000) был
     * достижим за первую неделю ачивками и далее копился ~1.5 недели фарма.
     * Расчёт вынесен в leavesForTask(...) и используется как при начислении,
     * так и при откате — иначе отмена вернула бы больше, чем дали.
     */
    private static final int LEAVES_TIER_FULL = 12;    // задач/день по полной ставке
    private static final int LEAVES_TIER_MID = 30;     // до этой границы — пониженная ставка
    private static final int LEAVES_DAILY_BASE = 30;   // листьев за задачу в 1-м тире
    private static final int LEAVES_DAILY_MID = 20;    // листьев за задачу во 2-м тире
    private static final int LEAVES_DAILY_TAIL = 12;   // листьев за задачу в 3-м тире
    /**
     * Бонус «за взросление дерева»: каждые 10 закрытых задач дают +150 листьев.
     * Начисляется отдельно и НЕ участвует в убывании (не зависит от дневного тира).
     */
    private static final int LEAVES_TREE_BONUS = 150;

    private final TaskRepository taskRepository;
    private final TaskSettingsRepository taskSettingsRepository;
    private final TaskScheduleRepository taskScheduleRepository;
    private final TaskTagRepository taskTagRepository;
    private final TaskAttachmentRepository taskAttachmentRepository;
    private final ProjectAccessService accessService;
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
    private final ProjectStatusRecalcService projectStatusRecalcService;

    @Value("${app.upload.base-url}")
    private String uploadBaseUrl;

    // ============================================================
    // СОЗДАНИЕ
    // ============================================================
    @Transactional
    public TaskDto createTask(Long projectId, CreateTaskRequest request, User user) {
        Project project = getProjectWithAccess(projectId, user);
        Board board = project.getBoard();

        if (request.getDeadline() != null
                && request.getDeadline().toLocalDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Нельзя поставить дедлайн в прошлом");
        }

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

        List<AchievementDto> newAch = new ArrayList<>();

        // Ачивки на текст
        newAch.addAll(checkFunnyAchievementsOnText(user, task.getTitle()));

        taskAuditService.log(task, user, "CREATED", null);

        TaskDto dto = taskMapper.toTaskDto(task, settings, schedule, status,
                boardStatusAppearanceRepository.findById(status.getId()).orElse(null),
                tagDtos, new ArrayList<>(), new ArrayList<>(), 0, 0);

        dto.setStartedBy(buildUserShort(task.getStartedBy()));
        dto.setLastEditedBy(buildUserShort(task.getLastEditedBy()));
        dto.setLastEditedAt(task.getLastEditedAt());

        // Если задача сразу создана в финальном статусе — начислить листья
        if (isFinalStatus(status)) {
            newAch.addAll(onTaskCompleted(user, task, schedule, null, status.getCategoryCode()));
        }

        dto.setNewlyUnlockedAchievements(newAch);

        projectStatusRecalcService.recalc(projectId);

        return dto;
    }

    // ============================================================
    // ПОЛУЧЕНИЕ
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

    // ============================================================
    // ОБНОВЛЕНИЕ
    // ============================================================
    @Transactional
    public TaskDto updateTask(Long taskId, UpdateTaskRequest request, User user) {
        Task task = getTaskWithAccess(taskId, user);
        TaskSettings settings = taskSettingsRepository.findById(taskId).orElseThrow();
        TaskSchedule schedule = taskScheduleRepository.findById(taskId).orElseThrow();
        Board board = task.getProject().getBoard();

        List<AchievementDto> newAch = new ArrayList<>();

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
            newAch.addAll(checkFunnyAchievementsOnText(user, task.getTitle()));
        }

        // ============================================================
        // Смена статуса
        // ============================================================
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

            long doneBefore = countDoneTasksToday(user);

            if (!wasFinal && willBeFinal) {
                schedule.setCompletedAt(LocalDateTime.now());
                settings.setStatus(newStatus);
                taskSettingsRepository.save(settings);

                if (task.getParent() == null) {
                    for (Task sub : taskRepository.findByParentIdOrderByPositionAsc(task.getId())) {
                        TaskSettings subSettings = taskSettingsRepository.findById(sub.getId()).orElse(null);
                        if (subSettings != null) {
                            subSettings.setStatus(newStatus);
                            TaskSchedule subSchedule = taskScheduleRepository.findById(sub.getId()).orElse(null);
                            if (subSchedule != null && subSchedule.getCompletedAt() == null) {
                                subSchedule.setCompletedAt(LocalDateTime.now());
                                taskScheduleRepository.save(subSchedule);
                            }
                            taskSettingsRepository.save(subSettings);
                        }
                    }
                }

                if (task.getParent() != null) {
                    newAch.addAll(syncParentStatus(task));
                }

                newAch.addAll(onTaskCompleted(user, task, schedule, oldCategory, newCategory));

            } else if (wasFinal && !willBeFinal) {
                schedule.setCompletedAt(null);
                settings.setStatus(newStatus);
                taskSettingsRepository.save(settings);

                if (task.getParent() == null) {
                    for (Task sub : taskRepository.findByParentIdOrderByPositionAsc(task.getId())) {
                        TaskSettings subSettings = taskSettingsRepository.findById(sub.getId()).orElse(null);
                        if (subSettings != null) {
                            subSettings.setStatus(newStatus);
                            TaskSchedule subSchedule = taskScheduleRepository.findById(sub.getId()).orElse(null);
                            if (subSchedule != null) {
                                subSchedule.setCompletedAt(null);
                                taskScheduleRepository.save(subSchedule);
                            }
                            taskSettingsRepository.save(subSettings);
                        }
                    }
                }

                if (task.getParent() != null) {
                    syncParentStatus(task);
                }

                onTaskReopened(user, task, doneBefore);

            } else {
                settings.setStatus(newStatus);
                taskSettingsRepository.save(settings);

                if (task.getParent() == null) {
                    for (Task sub : taskRepository.findByParentIdOrderByPositionAsc(task.getId())) {
                        TaskSettings subSettings = taskSettingsRepository.findById(sub.getId()).orElse(null);
                        if (subSettings != null) {
                            subSettings.setStatus(newStatus);
                            taskSettingsRepository.save(subSettings);
                        }
                    }
                }

                if (task.getParent() != null) {
                    syncParentStatus(task);
                }
            }

            if ("EXPIRED".equals(newCategory) && !"EXPIRED".equals(oldCategory)) {
                AchievementDto dto = achievementService.firstExpired(user);
                if (dto != null) newAch.add(dto);
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

            if (newDeadline.toLocalDate().isBefore(LocalDate.now())
                    && (oldDl == null
                        || !oldDl.toLocalDate().equals(newDeadline.toLocalDate()))) {
                throw new IllegalArgumentException("Нельзя поставить дедлайн в прошлом");
            }

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

        // Корневая задача повторения — источник правды для серии:
        // название/описание/приоритет и время дедлайна применяем к копиям.
        // Сдвиг даты корня сдвигает и все будущие вхождения.
        propagateRecurrenceChanges(task, request, oldDeadline, schedule);

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

        // Аудит
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

        dto.setNewlyUnlockedAchievements(newAch);

        projectStatusRecalcService.recalc(task.getProject().getId());

        return dto;
    }

    /**
     * Синхронизация серии повторений с корневой задачей.
     *
     * Раньше изменение дедлайна/названия корня не доходило до копий:
     * у вхождений оставался старый дедлайн (или null). Теперь корень —
     * источник правды: текст, приоритет и время дедлайна применяются ко
     * всем вхождениям, а сдвиг даты корня сдвигает всю серию.
     */
    private void propagateRecurrenceChanges(Task template,
                                            UpdateTaskRequest request,
                                            LocalDateTime oldDeadline,
                                            TaskSchedule templateSchedule) {
        TaskRecurrence rec = taskRecurrenceRepository.findByTaskId(template.getId()).orElse(null);
        if (rec == null) return;

        List<Task> instances = taskRepository.findByRecurrenceParentId(template.getId());
        if (instances.isEmpty()) return;

        LocalDateTime newDeadline = templateSchedule.getDeadline();
        long deltaDays = 0;
        if (oldDeadline != null && newDeadline != null) {
            deltaDays = ChronoUnit.DAYS.between(
                    oldDeadline.toLocalDate(), newDeadline.toLocalDate());
        }
        LocalTime newTime = newDeadline != null ? newDeadline.toLocalTime() : null;

        for (Task instance : instances) {
            if (request.getTitle() != null) {
                instance.setTitle(template.getTitle());
            }
            if (request.getDescription() != null) {
                instance.setDescription(template.getDescription());
            }
            if (request.getPriority() != null) {
                TaskSettings instanceSettings = taskSettingsRepository
                        .findById(instance.getId()).orElse(null);
                if (instanceSettings != null) {
                    instanceSettings.setPriority(request.getPriority());
                    taskSettingsRepository.save(instanceSettings);
                }
            }

            if (instance.getOccurrenceDate() != null) {
                LocalDate occurrence = instance.getOccurrenceDate();
                if (deltaDays != 0) {
                    occurrence = occurrence.plusDays(deltaDays);
                    instance.setOccurrenceDate(occurrence);
                }
                if (newTime != null) {
                    TaskSchedule instanceSchedule = taskScheduleRepository
                            .findById(instance.getId()).orElse(null);
                    if (instanceSchedule != null) {
                        instanceSchedule.setDeadline(occurrence.atTime(newTime));
                        taskScheduleRepository.save(instanceSchedule);
                    }
                }
            }
            taskRepository.save(instance);
        }

        if (deltaDays != 0) {
            rec.setStartAt(rec.getStartAt().plusDays(deltaDays));
            taskRecurrenceRepository.save(rec);
        }
    }

    // ============================================================
    // РАСЧЁТ НАГРАДЫ ЗА ЗАДАЧУ (единая точка для начисления и отката)
    // ============================================================

    /**
     * Возвращает количество листьев за одну закрытую задачу с учётом убывающей
     * отдачи в течение дня.
     *
     * @param doneCount порядковый номер этой задачи среди закрытых сегодня
     *                  (1 — первая задача дня, 11 — одиннадцатая и т.д.).
     *                  Для начисления передаётся значение ПОСЛЕ закрытия,
     *                  для отката — то же значение, которое использовалось
     *                  при начислении, чтобы списать ровно столько же.
     */
    private int leavesForTask(long doneCount) {
        if (doneCount <= LEAVES_TIER_FULL) {
            return LEAVES_DAILY_BASE;
        }
        if (doneCount <= LEAVES_TIER_MID) {
            return LEAVES_DAILY_MID;
        }
        return LEAVES_DAILY_TAIL;
    }

    // ============================================================
    // НАГРАДА — возвращает список новых ачивок
    // ============================================================
    private List<AchievementDto> onTaskCompleted(User user, Task task, TaskSchedule schedule,
                                                 String oldCategory, String newCategory) {

        List<AchievementDto> result = new ArrayList<>();

        if (!"DONE".equals(newCategory) && !"ARCHIVED".equals(newCategory)) {
            return result;
        }

        // Награда за задачу с убывающей отдачей. doneAfter — порядковый номер
        // этой задачи среди закрытых сегодня, т.е. её «тир».
        long doneAfter = countDoneTasksToday(user);
        shopService.addLeaves(user, leavesForTask(doneAfter));

        // Бонус за дерево — считается отдельно и не участвует в убывании
        long doneBefore = doneAfter - 1;
        int bonusDelta = (int) ((doneAfter / 10 - doneBefore / 10) * LEAVES_TREE_BONUS);
        if (bonusDelta > 0) {
            shopService.addLeaves(user, bonusDelta);
        }

        // Ачивки
        AchievementDto a1 = achievementService.firstTask(user);
        if (a1 != null) result.add(a1);

        long totalDone = countDoneTasksForUser(user);
        result.addAll(achievementService.checkTotalTasks(user, totalDone));
        result.addAll(achievementService.checkDayTasks(user, doneAfter));

        int hour = LocalDateTime.now().getHour();
        if (hour >= 23 || hour < 5) {
            AchievementDto a = achievementService.nightOwl(user);
            if (a != null) result.add(a);
        }

        if (schedule != null && schedule.getDeadline() != null
                && LocalDateTime.now().isBefore(schedule.getDeadline())) {
            long onTimeCount = countOnTimeForUser(user);
            result.addAll(achievementService.checkOnTime(user, onTimeCount));
        }

        long last10min = countDoneLastMinutes(user, 10);
        if (last10min >= 5) {
            AchievementDto a = achievementService.ninja(user);
            if (a != null) result.add(a);
        }

        return result;
    }

    // ============================================================
    // СПИСАНИЕ ПРИ ОТМЕНЕ
    // ============================================================
    private void onTaskReopened(User user, Task task, long doneBeforeOverride) {
        long doneBefore = doneBeforeOverride;
        long doneAfter = doneBefore - 1;

        // Зеркалим убывающую логику начисления: откатываемая задача всё ещё
        // числится закрытой сегодня, поэтому doneBefore — это её порядковый
        // номер (= тир). Списываем ровно столько же, сколько начислили.
        shopService.deductLeavesSafe(user, leavesForTask(doneBefore));

        int bonusDelta = (int) ((doneAfter / 10 - doneBefore / 10) * LEAVES_TREE_BONUS);
        if (bonusDelta < 0) {
            shopService.deductLeavesSafe(user, -bonusDelta);
        }
    }

    // ============================================================
    // СИНХРОНИЗАЦИЯ РОДИТЕЛЯ — возвращает список новых ачивок
    // ============================================================
    private List<AchievementDto> syncParentStatus(Task task) {
        List<AchievementDto> result = new ArrayList<>();

        Task parent = task.getParent();
        if (parent == null) return result;

        List<Task> siblings = taskRepository.findByParentIdOrderByPositionAsc(parent.getId());
        if (siblings.isEmpty()) return result;

        TaskSettings parentSettings = taskSettingsRepository.findById(parent.getId()).orElse(null);
        if (parentSettings == null) return result;

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

        boolean parentWasFinal = isFinalStatus(parentSettings.getStatus());

        if (allDone && doneStatus != null) {
            if (!parentWasFinal) {
                parentSettings.setStatus(doneStatus);
                taskSettingsRepository.save(parentSettings);

                TaskSchedule parentSchedule = taskScheduleRepository.findById(parent.getId()).orElse(null);
                if (parentSchedule != null) {
                    parentSchedule.setCompletedAt(LocalDateTime.now());
                    taskScheduleRepository.save(parentSchedule);
                }

                User owner = parent.getProject().getBoard().getOwner();
                result.addAll(onTaskCompleted(owner, parent, parentSchedule, null, "DONE"));

                result.addAll(syncParentStatus(parent));
            }
        } else {
            if (parentWasFinal) {
                BoardStatus activeStatus = boardStatusRepository
                        .findByBoardIdAndScopeAndCode(
                                parent.getProject().getBoard().getId(),
                                "task",
                                "IN_PROGRESS"
                        )
                        .orElse(null);

                if (activeStatus != null) {
                    long doneBefore = countDoneTasksToday(
                            parent.getProject().getBoard().getOwner());

                    parentSettings.setStatus(activeStatus);
                    taskSettingsRepository.save(parentSettings);

                    TaskSchedule parentSchedule = taskScheduleRepository.findById(parent.getId()).orElse(null);
                    if (parentSchedule != null) {
                        parentSchedule.setCompletedAt(null);
                        taskScheduleRepository.save(parentSchedule);
                    }

                    User owner = parent.getProject().getBoard().getOwner();
                    onTaskReopened(owner, parent, doneBefore);

                    syncParentStatus(parent);
                }
            }
        }

        return result;
    }

    // ============================================================
    // УДАЛЕНИЕ
    // ============================================================
    @Transactional
    public void deleteTask(Long taskId, User user) {
        Task task = getTaskWithAccess(taskId, user);
        Long projectId = task.getProject().getId();

        TaskSettings settings = taskSettingsRepository.findById(taskId).orElse(null);

        boolean wasFinal = settings != null && isFinalStatus(settings.getStatus());
        long doneBefore = wasFinal ? countDoneTasksToday(user) : 0;

        taskRepository.delete(task);

        if (wasFinal) {
            onTaskReopened(user, task, doneBefore);
        }

        projectStatusRecalcService.recalc(projectId);
    }

    // ============================================================
    // RESCHEDULE
    // ============================================================
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

    // ============================================================
    // ВЛОЖЕНИЯ
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

    // ============================================================
    // ВСПОМОГАТЕЛЬНЫЕ
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
        return accessService.requireProject(projectId, user);
    }

    private Task getTaskWithAccess(Long taskId, User user) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        if (!accessService.canAccessProject(task.getProject(), user)) {
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

    // ============================================================
    // Ачивки на текст — возвращает список
    // ============================================================
    private List<AchievementDto> checkFunnyAchievementsOnText(User user, String title) {
        List<AchievementDto> result = new ArrayList<>();
        if (title == null) return result;

        String low = title.toLowerCase();
        if (low.contains("утка") || low.contains("duck")) {
            AchievementDto a = achievementService.duck(user);
            if (a != null) result.add(a);
        }
        if (low.contains("лол") || low.contains(":d") || low.contains(":д") || low.contains("lol")) {
            AchievementDto a = achievementService.joker(user);
            if (a != null) result.add(a);
        }
        return result;
    }

    // ============================================================
    // Подсчёты
    // ============================================================
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
}