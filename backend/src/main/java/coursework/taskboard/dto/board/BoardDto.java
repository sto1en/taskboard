package coursework.taskboard.dto.board;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardDto {

    private Long id;
    private String title;
    private String description;
    private Integer position;

    private String accentCode;
    private String coverUrl;

    private Boolean isPinned;
    private Boolean isPublic;

    private String ownerRole;

    private Long mainProjectId;
    private long projectCount;
    private long taskCount;
}