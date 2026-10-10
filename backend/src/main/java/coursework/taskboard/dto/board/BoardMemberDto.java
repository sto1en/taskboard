package coursework.taskboard.dto.board;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardMemberDto {

    private Long userId;
    private String username;
    private String displayName;
    private String role;          // owner | editor | viewer
    private String avatarUrl;
    private boolean isOwner;
}