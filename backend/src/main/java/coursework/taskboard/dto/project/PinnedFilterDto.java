package coursework.taskboard.dto.project;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PinnedFilterDto {

    private List<Long> statusIds;
    private String sortMode;
    private String sortDir;
    private String viewMode;
}