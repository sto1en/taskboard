package coursework.taskboard.dto.group;

import com.fasterxml.jackson.annotation.JsonProperty;
import coursework.taskboard.dto.board.BoardMemberDto;
import lombok.*;

import java.util.List;

/**
 * Рабочее пространство группового проекта: только проект и его участники,
 * никаких данных доски-носителя.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupWorkspaceDto {

    private GroupProjectDto project;
    private List<BoardMemberDto> members;

    /** Нужен фронтенду для справочников статусов/тегов (read-only). */
    private Long boardId;

    private String role;
    private boolean canEdit;
    private boolean isOwner;

    @JsonProperty("isOwner")
    public boolean isOwner() {
        return isOwner;
    }
}
