package coursework.taskboard.dto.project;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDto {

    private Long id;
    private Long boardId;
    private String title;
    private String description;
    private Boolean isMain;
    private Integer position;

    private String accentCode;
    private String coverUrl;
    private Long coverAttachmentId;

    private Long statusId;
    private String statusCode;
    private String statusTitle;
    private String statusCategoryCode;

    private Boolean isPinned;
    private Boolean isTemplate;
    private Boolean isManualPosition;
    private Boolean isCoop;

    /**
     * Роль текущего пользователя в проекте: owner / editor / viewer / null.
     * Нужна клиенту, чтобы заранее блокировать сохранение (viewer не может
     * править задачу) и объяснить причину, а не ждать 400 от бэкенда.
     */
    private String role;
    private Boolean canEdit;

    private long taskTotal;
    private long taskDone;
    private long taskActive;

    private List<StageDto> stages;
}