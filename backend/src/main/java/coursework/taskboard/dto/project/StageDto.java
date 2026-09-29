package coursework.taskboard.dto.project;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StageDto {

    private Long id;
    private String title;
    private String description;
    private String state;
    private Integer position;

    private long taskTotal;
    private long taskDone;
}