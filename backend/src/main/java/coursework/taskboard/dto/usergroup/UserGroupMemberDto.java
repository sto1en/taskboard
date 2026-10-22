package coursework.taskboard.dto.usergroup;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

/** Участник группы; status = pending | accepted. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserGroupMemberDto {

    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String avatarCode;
    private String avatarEmoji;
    private String avatarImageUrl;
    private String frameCssClass;
    private String status;
    private boolean isOwner;
    private boolean isMe;

    @JsonProperty("isOwner")
    public boolean isOwner() {
        return isOwner;
    }

    @JsonProperty("isMe")
    public boolean isMe() {
        return isMe;
    }
}
