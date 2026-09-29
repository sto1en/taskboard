package coursework.taskboard.dto.attachment;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentDto {

    private Long id;
    private String url;              // полный URL для фронта
    private String mimeCode;
    private String originalName;
    private String alt;
    private Integer width;
    private Integer height;
    private Integer sizeBytes;
    private Integer position;        // порядок вложения в задаче
    private LocalDateTime createdAt;
}