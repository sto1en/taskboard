package coursework.taskboard.dto.user;

import lombok.Data;

@Data
public class UpdateLocaleRequest {

    private String language;
    private String timezone;
}