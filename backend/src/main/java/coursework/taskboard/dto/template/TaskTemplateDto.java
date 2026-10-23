package coursework.taskboard.dto.template;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskTemplateDto {
    private Long id;
    private String title;
    private String description;
    private String icon;
    private String accent;
    private Boolean isPublic;
    /** Доступен ли шаблон текущему пользователю на изменение (владелец). */
    private Boolean mine;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Автор публичного шаблона — нужен в общем каталоге. */
    private Long ownerId;
    private String ownerUsername;
    private String ownerDisplayName;
    /** Код аватарки автора (emoji или код скина). */
    private String ownerAvatarCode;
    private String ownerAvatarEmoji;

    /** Сколько задач в шаблоне. Для каталога без полной выдачи items. */
    private int itemCount;
    private List<TaskTemplateItemDto> items;
}
