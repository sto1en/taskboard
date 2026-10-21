package coursework.taskboard.dto.shop;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChestsDto {

    /** Количество ключей в инвентаре. */
    private Integer keys;

    /** Баланс листьев. */
    private Integer leaves;

    /** Сколько задач закрыто с момента последнего ключа. */
    private Integer keyProgress;

    /** Сколько задач нужно на следующий ключ (15). */
    private Integer keyGoal;

    /** Цена покупного ключа в листьях (150). */
    private Integer keyPrice;

    private List<ChestDto> chests;
}
