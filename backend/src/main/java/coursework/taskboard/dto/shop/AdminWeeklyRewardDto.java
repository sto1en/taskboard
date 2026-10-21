package coursework.taskboard.dto.shop;

import lombok.*;

import java.time.LocalDateTime;

/** Строка админского расписания подарков недели. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminWeeklyRewardDto {
    private Long id;
    private String weekStart;
    private String weekEnd;
    private String itemType;
    private String itemCode;
    private String itemTitle;
    private Boolean enabled;
    private LocalDateTime createdAt;
}
