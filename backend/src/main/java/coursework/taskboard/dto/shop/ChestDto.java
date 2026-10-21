package coursework.taskboard.dto.shop;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChestDto {

    private String code;
    private String title;
    private String description;
    private String icon;

    /** key — расходуемый ключ, leaves — листья. */
    private String currency;

    private Integer price;
    private Boolean available;
}
