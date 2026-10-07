package coursework.taskboard.dto.stats;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopTagDto {

    private Long tagId;
    private String title;
    private String icon;
    private String accentCode;
    private long count;
}