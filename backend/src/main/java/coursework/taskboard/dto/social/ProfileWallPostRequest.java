package coursework.taskboard.dto.social;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProfileWallPostRequest {
    @NotBlank
    @Size(max = 1000)
    private String body;
}
