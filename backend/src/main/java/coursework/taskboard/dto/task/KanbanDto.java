package coursework.taskboard.dto.task;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KanbanDto {

    private List<KanbanColumnDto> columns;
}