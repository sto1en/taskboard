package coursework.taskboard.dto.board;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateBoardRequest {

    @NotBlank
    @Size(min = 1, max = 120)
    private String title;

    @Size(max = 2000)
    private String description;

    private String accentCode;
}