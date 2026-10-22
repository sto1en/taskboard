package coursework.taskboard.dto.template;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ApplyPlanRequest {

    @NotNull
    private Long boardId;

    /** Существующий проект. Можно не передавать, если createProject = true. */
    private Long projectId;

    private Boolean createProject = false;

    private String projectTitle;
    private String projectDescription;

    /** Дата старта: от неё считаются дедлайны (день 0). */
    private LocalDate startDate;

    private Boolean includeSubtasks = true;
}
