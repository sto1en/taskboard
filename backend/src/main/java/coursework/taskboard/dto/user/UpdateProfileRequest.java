package coursework.taskboard.dto.user;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(min = 1, max = 100)
    private String displayName;

    @Size(max = 500)
    private String bio;

    private Long avatarAttachmentId;

    /**
     * Если true — аватар сбрасывается (avatarAttachmentId игнорируется).
     * Используется фронтом для кнопки «Удалить аватар».
     */
    private Boolean clearAvatar;
}