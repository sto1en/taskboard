package coursework.taskboard.dto.search;

import coursework.taskboard.dto.task.TagShortDto;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchItemDto {

    private String kind;              // "board" | "project" | "task" | "tag"
    private Long id;
    private String title;
    private String subtitle;
    private String accentCode;
    private String icon;

    private Long boardId;
    private Long projectId;

    // Дополнительные поля для карточки результата
    private String description;
    private String statusCode;
    private String statusTitle;
    private String statusCategoryCode;
    private String statusAccentCode;
    private LocalDateTime deadline;
    private Short priority;

    // Было List<String> tagTitles
    private List<TagShortDto> tags;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String matchedField;      // "title" | "description" | "tag"
}