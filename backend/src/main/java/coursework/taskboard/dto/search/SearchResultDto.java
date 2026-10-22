package coursework.taskboard.dto.search;

import coursework.taskboard.dto.user.UserSearchDto;
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
    private List<UserSearchDto> users;
}