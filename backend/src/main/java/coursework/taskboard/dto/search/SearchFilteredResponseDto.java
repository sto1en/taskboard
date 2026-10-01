package coursework.taskboard.dto.search;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchFilteredResponseDto {

    private List<SearchItemDto> items;
    private long total;
    private int page;
    private int size;
    private int totalPages;
    private boolean hasMore;
}