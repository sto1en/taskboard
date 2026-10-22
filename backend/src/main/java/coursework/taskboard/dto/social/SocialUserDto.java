package coursework.taskboard.dto.social;

import lombok.*;

/** Компактная карточка человека для друзей, стены и витрины. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SocialUserDto {
    private Long userId;
    private String username;
    private String displayName;
    private String avatarCode;
    private String avatarEmoji;
    private String avatarImageUrl;
    private String avatarUrl;
    private String frameCssClass;
}
