package coursework.taskboard.dto.template;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class SaveTaskTemplateRequest {

    @NotBlank
    @Size(max = 120)
    private String title;

    @Size(max = 2000)
    private String description;

    @Size(max = 16)
    private String icon;

    @Size(max = 20)
    private String accent;

    @Valid
    private List<Item> items = new ArrayList<>();

    @Data
    public static class Item {
        @NotBlank
        @Size(max = 255)
        private String title;

        @Size(max = 5000)
        private String description;

        private Short priority;
        private Integer deadlineOffsetDays;
        private String statusCategoryCode;
        private Integer estimatedMinutes;

        @Pattern(regexp = "^$|^([01]\\d|2[0-3]):[0-5]\\d$", message = "Время должно быть в формате ЧЧ:ММ")
        private String startTime;

        private List<String> subtasks = new ArrayList<>();
    }
}
