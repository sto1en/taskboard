package coursework.taskboard.dto.social;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/** Выбранные достижения витрины. Пустой список очищает витрину. */
@Data
public class UpdateShowcaseRequest {

    @Size(max = 3)
    private List<String> achievementCodes;
}
