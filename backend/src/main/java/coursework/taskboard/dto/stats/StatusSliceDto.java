package coursework.taskboard.dto.stats;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusSliceDto {

    private Long statusId;
    private String code;
    private String title;
    private String categoryCode;
    private String accentCode;
    private long count;
}