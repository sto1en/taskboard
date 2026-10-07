package coursework.taskboard.dto.user;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAppearanceDto {

    private String theme;
    private String accentCode;
    private String density;
    private Boolean sidebarCollapsed;

    private Boolean treeEnabled;
    private String treeKind;

    // Магазин
    private Long activeFrameId;
    private String activeFrameCode;
    private String activeFrameCssClass;

    private Long activeTreeSkinId;
    private String activeTreeSkinCode;
}