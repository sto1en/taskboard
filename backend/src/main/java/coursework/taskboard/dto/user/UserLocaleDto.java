package coursework.taskboard.dto.user;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserLocaleDto {

    private String language;
    private String timezone;
}