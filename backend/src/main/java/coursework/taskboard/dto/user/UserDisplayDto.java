package coursework.taskboard.dto.user;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDisplayDto {

    private String taskSortMode;
    private String taskSortDir;
    private String projectViewMode;
}