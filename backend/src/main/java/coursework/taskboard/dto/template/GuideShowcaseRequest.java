package coursework.taskboard.dto.template;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class GuideShowcaseRequest {

    @Size(max = 6)
    private List<Long> guideIds = new ArrayList<>();
}
