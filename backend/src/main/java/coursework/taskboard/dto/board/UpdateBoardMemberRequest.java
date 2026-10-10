package coursework.taskboard.dto.board;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateBoardMemberRequest {

    @NotBlank
    private String role;
}