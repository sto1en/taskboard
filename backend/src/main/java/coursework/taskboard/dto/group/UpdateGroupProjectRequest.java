package coursework.taskboard.dto.group;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateGroupProjectRequest {

    @NotBlank
    @Size(max = 200)
    private String title;

    @Size(max = 4000)
    private String description;
}
