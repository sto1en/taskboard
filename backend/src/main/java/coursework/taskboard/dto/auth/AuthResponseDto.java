package coursework.taskboard.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
@AllArgsConstructor
public class AuthResponseDto {
    private String token;
    private Long userId;
    private String username;
    private String displayName;
}