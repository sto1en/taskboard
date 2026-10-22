package coursework.taskboard.dto.shop;

import lombok.*;

import java.util.List;

/** Создание/редактирование скина дерева. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminTreeRequest {
    /** Код визуального вида дерева (oak, birch, sakura…). При edit не меняется. */
    private String code;
    private String title;
    private String description;
    private Integer price;
    private Integer sortOrder;
    private List<Long> categoryIds;
}
