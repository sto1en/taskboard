package coursework.taskboard.dto.user;

import lombok.Data;

@Data
public class UpdateWorkspaceRequest {

    private Long defaultBoardId;
    private Short tasksPerPage;
    private Boolean confirmBeforeDelete;
}