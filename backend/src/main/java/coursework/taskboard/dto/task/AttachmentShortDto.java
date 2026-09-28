package coursework.taskboard.dto.task;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentShortDto {

    private Long id;
    private String url;
    private String mimeCode;
    private String originalName;
    private Integer width;
    private Integer height;
    private Integer sizeBytes;
    private Integer position;
}