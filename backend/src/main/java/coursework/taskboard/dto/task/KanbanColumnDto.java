package coursework.taskboard.dto.task;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KanbanColumnDto {

    private Long statusId;
    private String code;
    private String title;
    private String categoryCode;
    private String accentCode;
    private Boolean isBold;
    private Boolean isItalic;
    private String icon;
    private Integer position;
    private Boolean allowDragIn;

    private long count;
    private List<TaskShortDto> tasks;
}