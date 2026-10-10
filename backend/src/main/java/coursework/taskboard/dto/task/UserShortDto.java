package coursework.taskboard.dto.task;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserShortDto {

    private Long id;
    private String username;
    private String displayName;

    /** Загруженная картинка-аватар (attachment). */
    private String avatarUrl;

    /** SVG-код купленной аватарки (a-wizard, a-ninja, ...). */
    private String avatarCode;

    /** Эмодзи-аватарка (если у аватарки задан emoji). */
    private String avatarEmoji;

    /** Прямая ссылка на картинку аватарки из магазина (avatars.image_url). */
    private String avatarImageUrl;

    /** CSS-класс активной рамки (frame--gold, frame--neon, ...). */
    private String frameCssClass;

    /** SVG-код активной рамки. */
    private String frameCode;
}