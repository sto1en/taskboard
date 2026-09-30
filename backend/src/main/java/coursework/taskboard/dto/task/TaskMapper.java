package coursework.taskboard.dto.task;

import coursework.taskboard.dto.attachment.AttachmentDto;
import coursework.taskboard.model.attachment.Attachment;
import coursework.taskboard.model.attachment.AttachmentMeta;
import coursework.taskboard.model.board.BoardStatus;
import coursework.taskboard.model.board.BoardStatusAppearance;
import coursework.taskboard.model.project.Project;
import coursework.taskboard.model.stage.Stage;
import coursework.taskboard.model.tag.Tag;
import coursework.taskboard.model.tag.TagAppearance;
import coursework.taskboard.model.task.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class TaskMapper {

    @Value("${app.upload.base-url}")
    private String baseUrl;

    public Task toTask(Project project, Stage stage, Task parent, CreateTaskRequest request, int position) {
        return Task.builder()
                .project(project)
                .stage(stage)
                .parent(parent)
                .title(request.getTitle())
                .description(request.getDescription() != null ? request.getDescription() : "")
                .position(position)
                .build();
    }

    public TaskSettings toTaskSettings(Task task, BoardStatus status, Short priority) {
        return TaskSettings.builder()
                .task(task)
                .status(status)
                .priority(priority != null ? priority : 0)
                .isPinned(false)
                .build();
    }

    public TaskSchedule toTaskSchedule(Task task, LocalDateTime deadline) {
        return TaskSchedule.builder()
                .task(task)
                .deadline(deadline)
                .build();
    }

    public TaskTag toTaskTag(Task task, Tag tag) {
        return TaskTag.builder()
                .task(task)
                .tag(tag)
                .build();
    }

    public TaskDto toTaskDto(Task task,
                             TaskSettings settings,
                             TaskSchedule schedule,
                             BoardStatus status,
                             BoardStatusAppearance statusAppearance,
                             List<TagShortDto> tags,
                             List<AttachmentDto> attachments,
                             List<TaskShortDto> subtasks,
                             long subtaskTotal,
                             long subtaskDone) {

        return TaskDto.builder()
                .id(task.getId())
                .projectId(task.getProject().getId())
                .stageId(task.getStage() != null ? task.getStage().getId() : null)
                .parentId(task.getParent() != null ? task.getParent().getId() : null)
                .title(task.getTitle())
                .description(task.getDescription())
                .position(task.getPosition())
                .statusId(status != null ? status.getId() : null)
                .statusCode(status != null ? status.getCode() : null)
                .statusTitle(status != null ? status.getTitle() : null)
                .statusCategoryCode(status != null ? status.getCategoryCode() : null)
                .statusAccentCode(statusAppearance != null ? statusAppearance.getAccentCode() : null)
                .priority(settings != null ? settings.getPriority() : 0)
                .isPinned(settings != null && settings.getIsPinned())
                .deadline(schedule != null ? schedule.getDeadline() : null)
                .expiredAt(schedule != null ? schedule.getExpiredAt() : null)
                .completedAt(schedule != null ? schedule.getCompletedAt() : null)
                .tags(tags)
                .attachments(attachments)
                .subtasks(subtasks)
                .subtaskTotal(subtaskTotal)
                .subtaskDone(subtaskDone)
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }

    public TaskShortDto toTaskShortDto(Task task,
                                       TaskSettings settings,
                                       TaskSchedule schedule,
                                       BoardStatus status,
                                       BoardStatusAppearance appearance,
                                       List<String> attachmentNames,
                                       long subtaskTotal,
                                       long subtaskDone,
                                       List<TaskShortDto> subtasks,
                                       List<TagShortDto> tags) {
        return TaskShortDto.builder()
                .id(task.getId())
                .title(task.getTitle())
                .parentId(task.getParent() != null ? task.getParent().getId() : null)
                .statusId(status != null ? status.getId() : null)
                .statusCode(status != null ? status.getCode() : null)
                .statusCategoryCode(status != null ? status.getCategoryCode() : null)
                .statusTitle(status != null ? status.getTitle() : null)
                .statusAccentCode(appearance != null ? appearance.getAccentCode() : null)
                .priority(settings != null ? settings.getPriority() : 0)
                .deadline(schedule != null ? schedule.getDeadline() : null)
                .position(task.getPosition())
                .attachmentNames(attachmentNames)
                .subtaskTotal(subtaskTotal)
                .subtaskDone(subtaskDone)
                .subtasks(subtasks)
                .tags(tags)
                .build();
    }

    public TagShortDto toTagShortDto(Tag tag, TagAppearance appearance) {
        return TagShortDto.builder()
                .id(tag.getId())
                .code(tag.getCode())
                .title(tag.getTitle())
                .accentCode(appearance != null ? appearance.getAccentCode() : null)
                .icon(appearance != null ? appearance.getIcon() : null)
                .build();
    }

    public AttachmentDto toAttachmentDto(Attachment attachment,
                                         AttachmentMeta meta,
                                         Integer position) {
        return AttachmentDto.builder()
                .id(attachment.getId())
                .url(meta != null ? baseUrl + "/" + meta.getUrl() : null)
                .mimeCode(attachment.getMime().getCode())
                .originalName(meta != null ? meta.getOriginalName() : null)
                .alt(meta != null ? meta.getAlt() : null)
                .width(meta != null ? meta.getWidth() : null)
                .height(meta != null ? meta.getHeight() : null)
                .sizeBytes(meta != null ? meta.getSizeBytes() : null)
                .position(position)
                .createdAt(attachment.getCreatedAt())
                .build();
    }

    public KanbanColumnDto toKanbanColumnDto(BoardStatus status,
                                             BoardStatusAppearance appearance,
                                             Boolean allowDragIn,
                                             List<TaskShortDto> tasks) {
        return KanbanColumnDto.builder()
                .statusId(status.getId())
                .code(status.getCode())
                .title(status.getTitle())
                .categoryCode(status.getCategoryCode())
                .accentCode(appearance != null ? appearance.getAccentCode() : null)
                .isBold(appearance != null && appearance.getIsBold())
                .isItalic(appearance != null && appearance.getIsItalic())
                .icon(appearance != null ? appearance.getIcon() : null)
                .position(status.getPosition())
                .allowDragIn(allowDragIn != null ? allowDragIn : true)
                .count(tasks.size())
                .tasks(tasks)
                .build();
    }
}