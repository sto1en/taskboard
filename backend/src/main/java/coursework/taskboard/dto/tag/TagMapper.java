package coursework.taskboard.dto.tag;

import coursework.taskboard.model.board.Board;
import coursework.taskboard.model.tag.Tag;
import coursework.taskboard.model.tag.TagAppearance;
import org.springframework.stereotype.Component;

@Component
public class TagMapper {

    // ============================================================
    // DTO → Entity
    // ============================================================
    public Tag toTag(Board board, CreateTagRequest request, String code, int position) {
        return Tag.builder()
                .board(board)
                .code(code)
                .title(request.getTitle())
                .position(position)
                .isSystem(false)
                .build();
    }

    public TagAppearance toTagAppearance(Tag tag, String accentCode, String icon) {
        return TagAppearance.builder()
                .tag(tag)
                .accentCode(accentCode != null ? accentCode : "gray")
                .icon(icon)
                .isBold(false)
                .build();
    }

    // ============================================================
    // Entity → DTO
    // ============================================================
    public TagDto toTagDto(Tag tag, TagAppearance appearance, long taskCount) {
        return TagDto.builder()
                .id(tag.getId())
                .boardId(tag.getBoard().getId())
                .code(tag.getCode())
                .title(tag.getTitle())
                .position(tag.getPosition())
                .isSystem(tag.getIsSystem())
                .accentCode(appearance != null ? appearance.getAccentCode() : null)
                .icon(appearance != null ? appearance.getIcon() : null)
                .isBold(appearance != null && appearance.getIsBold())
                .taskCount(taskCount)
                .build();
    }
}