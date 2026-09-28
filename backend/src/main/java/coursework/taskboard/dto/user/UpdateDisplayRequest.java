package coursework.taskboard.dto.user;

import lombok.Data;

@Data
public class UpdateDisplayRequest {

    private String taskSortMode;
    private String taskSortDir;
    private String projectViewMode;
}