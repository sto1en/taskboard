package coursework.taskboard.dto.board;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardDetailDto {

    private Long id;
    private String title;
    private String description;
    private String accentCode;
    private String coverUrl;
    private String ownerRole;

    private List<ProjectSummaryDto> projects;
}