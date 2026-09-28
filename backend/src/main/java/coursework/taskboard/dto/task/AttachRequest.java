package coursework.taskboard.dto.task;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AttachRequest {

    @NotNull
    private Long attachmentId;
}