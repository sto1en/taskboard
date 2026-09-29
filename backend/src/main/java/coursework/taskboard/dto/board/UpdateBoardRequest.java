package coursework.taskboard.dto.board;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateBoardRequest {

    @Size(min = 1, max = 120)
    private String title;

    @Size(max = 2000)
    private String description;

    private String accentCode;

    private Long coverAttachmentId;

    private Boolean isPinned;
    private Boolean isPublic;

    private Integer position;

    private Boolean clearCover;
}