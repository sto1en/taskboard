package coursework.taskboard.dto.user;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserWorkspaceDto {

    /** Тумблер «Доска по умолчанию» — включён, если defaultBoardId != null. */
    private Long defaultBoardId;

    /** Стартовый проект внутри выбранной доски. Может быть null. */
    private Long launchProjectId;

    /** Проект для новых задач из календаря. */
    private Long defaultProjectId;

    private Short tasksPerPage;
    private Boolean confirmBeforeDelete;
}