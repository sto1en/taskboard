package coursework.taskboard.dto.usergroup;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupInviteResultDto {

    private Long groupId;
    private Long projectId;
    private int invited;
    private int skipped;
}
