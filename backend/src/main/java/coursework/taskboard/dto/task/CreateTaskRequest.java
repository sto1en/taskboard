package coursework.taskboard.dto.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateTaskRequest {

    @NotBlank
    @Size(min = 1, max = 255)
    private String title;

    @Size(max = 5000)
    private String description;

    private Long stageId;
    private Long statusId;
    private Long parentId;

    private Short priority;
    private LocalDateTime deadline;

    private List<Long> tagIds;
}