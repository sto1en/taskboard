package coursework.taskboard.dto.template;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuideDto {
    private Long id;
    private String title;
    private String subtitle;
    private String description;
    private String periodType;
    private String accent;
    private String emoji;
    private Boolean isSystem;
    private Boolean mine;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int taskCount;
    private List<GuideTaskDto> tasks;
}
