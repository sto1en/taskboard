package coursework.taskboard.dto.board;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddBoardMemberRequest {

    /** ID пользователя (найденного через поиск). */
    @NotNull
    private Long userId;

    /** owner | editor | viewer. По умолчанию — editor. */
    private String role;
}