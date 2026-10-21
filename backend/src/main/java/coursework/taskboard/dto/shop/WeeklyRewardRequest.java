package coursework.taskboard.dto.shop;

import lombok.*;

/** Создание/обновление подарка недели (upsert по понедельнику). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyRewardRequest {
    /** Любая дата недели в ISO; бэкенд приведёт её к понедельнику. */
    private String weekStart;
    /** TREE | FRAME | AVATAR | ACCENT */
    private String itemType;
    private String itemCode;
    private Boolean enabled;
}
