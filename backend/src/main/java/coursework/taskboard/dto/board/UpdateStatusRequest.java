package coursework.taskboard.dto.board;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateStatusRequest {

    @Size(min = 1, max = 60)
    private String title;

    private String categoryCode;
    private String accentCode;
    private String icon;
    private Boolean isBold;
    private Boolean isItalic;
    private Integer position;
}