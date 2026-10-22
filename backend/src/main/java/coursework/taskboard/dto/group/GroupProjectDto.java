package coursework.taskboard.dto.group;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Карточка группового проекта в списке «Групповое».
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupProjectDto {

    private Long id;
    private Long boardId;
    private String title;
    private String description;

    /** Роль текущего пользователя: owner | editor | viewer. */
    private String role;
    private boolean isOwner;
    private boolean canEdit;

    private long memberCount;
    private long taskTotal;
    private long taskDone;
    private long taskActive;

    private LocalDateTime createdAt;

    @JsonProperty("isOwner")
    public boolean isOwner() {
        return isOwner;
    }
}
