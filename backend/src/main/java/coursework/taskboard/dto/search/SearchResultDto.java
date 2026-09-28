package coursework.taskboard.dto.search;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResultDto {

    private List<SearchItemDto> boards;
    private List<SearchItemDto> projects;
    private List<SearchItemDto> tasks;
    private List<SearchItemDto> tags;
}