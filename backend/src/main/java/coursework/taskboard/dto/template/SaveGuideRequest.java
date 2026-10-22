package coursework.taskboard.dto.template;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class SaveGuideRequest {

    @NotBlank
    @Size(max = 140)
    private String title;

    @Size(max = 255)
    private String subtitle;

    @Size(max = 5000)
    private String description;

    private String periodType;

    @Size(max = 20)
    private String accent;

    @Size(max = 16)
    private String emoji;

    @Valid
    private List<Task> tasks = new ArrayList<>();

    @Data
    public static class Task {
        @NotBlank
        @Size(max = 255)
        private String title;

        @Size(max = 5000)
        private String description;

        private Integer dayOffset;
        private Short priority;
        private String statusCategoryCode;
        private Integer estimatedMinutes;
        private List<String> subtasks = new ArrayList<>();
    }
}
