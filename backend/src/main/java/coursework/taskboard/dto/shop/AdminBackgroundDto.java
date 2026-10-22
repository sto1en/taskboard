package coursework.taskboard.dto.shop;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminBackgroundDto {
    private Long id;
    private String code;
    private String title;
    private String description;
    private String imageUrl;
    private String cssClass;
    private Integer price;
    private Integer oldPrice;
    private Integer sortOrder;
    private LocalDateTime createdAt;
}
