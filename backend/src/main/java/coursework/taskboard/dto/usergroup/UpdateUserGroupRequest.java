package coursework.taskboard.dto.usergroup;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserGroupRequest {

    @NotBlank
    @Size(max = 64)
    private String name;
}
