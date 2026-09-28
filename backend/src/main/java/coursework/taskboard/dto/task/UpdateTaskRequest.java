package coursework.taskboard.dto.task;

import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class UpdateTaskRequest {

    @Size(min = 1, max = 255)
    private String title;

    @Size(max = 5000)
    private String description;

    private Long stageId;
    private Long statusId;
    private Short priority;
    private Boolean isPinned;
    private LocalDateTime deadline;

    private Integer position;

    private List<Long> tagIds;
}