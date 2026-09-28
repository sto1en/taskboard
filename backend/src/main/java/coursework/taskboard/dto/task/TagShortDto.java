package coursework.taskboard.dto.task;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TagShortDto {

    private Long id;
    private String code;
    private String title;
    private String accentCode;
    private String icon;
}