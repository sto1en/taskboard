package coursework.taskboard.dto.template;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskTemplateDto {
    private Long id;
    private String title;
    private String description;
    private String icon;
    private String accent;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<TaskTemplateItemDto> items;
}
