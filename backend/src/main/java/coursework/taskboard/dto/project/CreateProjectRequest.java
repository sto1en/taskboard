package coursework.taskboard.dto.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateProjectRequest {

    @NotBlank
    @Size(min = 1, max = 200)
    private String title;

    @Size(max = 2000)
    private String description;

    private String accentCode;
}