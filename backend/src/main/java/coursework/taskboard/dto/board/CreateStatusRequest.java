package coursework.taskboard.dto.board;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateStatusRequest {

    @NotBlank
    @Size(min = 1, max = 20)
    private String scope;

    @NotBlank
    private String categoryCode;

    @NotBlank
    @Size(min = 1, max = 60)
    private String title;

    private String accentCode;
    private String icon;
    private Boolean isBold;
    private Boolean isItalic;
    private Integer position;
}