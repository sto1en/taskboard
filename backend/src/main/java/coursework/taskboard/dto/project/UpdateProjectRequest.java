package coursework.taskboard.dto.project;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProjectRequest {

    @Size(min = 1, max = 200)
    private String title;

    @Size(max = 2000)
    private String description;

    private String accentCode;
    private Long coverAttachmentId;

    private Long statusId;
    private Boolean isPinned;
    private Boolean isTemplate;

    private Integer position;
}