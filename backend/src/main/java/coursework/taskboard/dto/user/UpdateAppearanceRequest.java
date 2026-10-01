package coursework.taskboard.dto.user;

import lombok.Data;

@Data
public class UpdateAppearanceRequest {

    private String theme;
    private String accentCode;
    private String density;
    private Boolean sidebarCollapsed;

    private Boolean treeEnabled;
    private String treeKind;
}