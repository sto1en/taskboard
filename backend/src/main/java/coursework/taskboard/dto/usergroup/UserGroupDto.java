package coursework.taskboard.dto.usergroup;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserGroupDto {

    private Long id;
    private String name;
    private Long ownerId;
    private String ownerUsername;
    private boolean isOwner;
    private Long originGroupId;
    private LocalDateTime createdAt;

    private List<UserGroupMemberDto> members;
    private int acceptedCount;
    private int pendingCount;

    @JsonProperty("isOwner")
    public boolean isOwner() {
        return isOwner;
    }
}
