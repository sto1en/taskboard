package coursework.taskboard.dto.user;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserWorkspaceDto {

    private Long defaultBoardId;
    private Short tasksPerPage;
    private Boolean confirmBeforeDelete;
}