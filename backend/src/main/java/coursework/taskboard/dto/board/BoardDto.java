package coursework.taskboard.dto.board;

import coursework.taskboard.dto.achievement.AchievementDto;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class BoardDto {

    private Long id;
    private String title;
    private String description;
    private Integer position;

    private String accentCode;
    private String coverUrl;
    private Long coverAttachmentId;

    private Boolean isPinned;
    private Boolean isPublic;

    private String ownerRole;

    private Long mainProjectId;
    private long projectCount;
    private long taskCount;
    private Long ownerId;

    // ============================================================
    // Ачивки, разблокированные в результате этого действия
    // ============================================================
    private List<AchievementDto> newlyUnlockedAchievements;
}