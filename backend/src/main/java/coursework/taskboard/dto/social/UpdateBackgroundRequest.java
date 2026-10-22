package coursework.taskboard.dto.social;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateBackgroundRequest {
    @Size(max = 64)
    private String backgroundCode;
}

