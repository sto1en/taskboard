package coursework.taskboard.dto.usergroup;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddUserGroupMemberRequest {

    @NotNull
    private Long userId;
}
