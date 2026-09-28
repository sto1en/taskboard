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
}