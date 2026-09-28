package coursework.taskboard.dto.tag;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateTagRequest {

    @Size(min = 1, max = 60)
    private String title;

    @Size(max = 30)
    private String accentCode;

    @Size(max = 50)
    private String icon;

    private Boolean isBold;

    private Integer position;
}