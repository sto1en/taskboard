package coursework.taskboard.dto.search;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class SearchFilterRequestDto {

    private String q;

    /** Типы результатов: BOARD, PROJECT, TASK, TAG */
    private List<String> types;

    private List<Long> boardIds;
    private List<Long> projectIds;
    private List<Long> tagIds;
    private List<Long> statusIds;
    private List<Short> priorities;

    private Boolean hasDeadline;

    private LocalDate from;
    private LocalDate to;

    private int page = 0;
    private int size = 20;

    // ===== Утилиты =====

    public String getQNormalized() {
        return q == null ? null : q.trim().toLowerCase();
    }

    public boolean hasQuery() {
        return q != null && !q.trim().isEmpty();
    }

    public boolean wantType(String type) {
        return types == null || types.isEmpty() || types.contains(type);
    }
}