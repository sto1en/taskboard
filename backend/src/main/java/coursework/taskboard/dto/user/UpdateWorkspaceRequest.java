package coursework.taskboard.dto.user;

import lombok.Data;

@Data
public class UpdateWorkspaceRequest {

    // ── Тумблер «Доска по умолчанию» ──
    private Long defaultBoardId;
    private Long launchProjectId;
    private Boolean clearDefaultBoard;   // true → выключить тумблер
    private Boolean clearLaunchProject;  // true → сбросить стартовый проект

    // ── «Проект для новых задач из календаря» ──
    private Long defaultProjectId;
    private Boolean clearDefaultProject;

    private Short tasksPerPage;
    private Boolean confirmBeforeDelete;
}