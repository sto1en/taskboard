package coursework.taskboard.dto.template;

import lombok.*;

import java.util.List;

/**
 * Страница каталога публичных шаблонов (поиск + фильтры + сортировка).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicTemplatePageDto {
    private List<TaskTemplateDto> items;
    private long total;
    private int page;
    private int size;
    private int totalPages;
    private boolean hasMore;
}
