package coursework.taskboard.dto.board;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardStatusDto {

    private Long id;
    private Long boardId;
    private String scope;
    private String categoryCode;
    private String code;
    private String title;
    private Integer position;
    private Boolean isDefault;
    private Boolean isSystem;

    private String accentCode;
    private String icon;
    private Boolean isBold;
    private Boolean isItalic;

    private Boolean isPinned;
    private Boolean isHidden;
    private Boolean allowDragIn;
}