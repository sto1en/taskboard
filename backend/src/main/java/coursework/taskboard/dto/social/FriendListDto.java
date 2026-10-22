package coursework.taskboard.dto.social;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendListDto {
    private List<SocialUserDto> friends;
    private List<SocialUserDto> incoming;
    private List<SocialUserDto> outgoing;
    private Integer friendsCount;
    private Integer incomingCount;
}
