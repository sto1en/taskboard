package coursework.taskboard.dto.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateTaskMessageRequest {

    @NotBlank
    @Size(min = 1, max = 5000)
    private String text;
}