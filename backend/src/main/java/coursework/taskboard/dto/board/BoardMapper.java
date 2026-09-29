package coursework.taskboard.dto.board;

import coursework.taskboard.model.board.*;
import coursework.taskboard.model.project.Project;
import coursework.taskboard.model.project.ProjectSettings;
import coursework.taskboard.model.user.User;
import org.springframework.stereotype.Component;

@Component
public class BoardMapper {

    public Board toBoard(User owner, CreateBoardRequest request, int position) {
        return Board.builder()
                .owner(owner)
                .title(request.getTitle())
                .description(request.getDescription() != null ? request.getDescription() : "")
                .position(position)
                .build();
    }

    public BoardAppearance toBoardAppearance(Board board, String accentCode) {
        return BoardAppearance.builder()
                .board(board)
                .accentCode(accentCode != null ? accentCode : "blue")
                .build();
    }

    public BoardSettings toBoardSettings(Board board) {
        return BoardSettings.builder()
                .board(board)
                .isPinned(false)
                .isPublic(false)
                .build();
    }

    public BoardMember toBoardMember(Board board, User user, String role) {
        return BoardMember.builder()
                .board(board)
                .user(user)
                .role(role)
                .build();
    }

    public BoardStatus toBoardStatus(Board board, String scope, String categoryCode,
                                     String code, String title, int position,
                                     boolean isDefault, boolean isSystem) {
        return BoardStatus.builder()
                .board(board)
                .scope(scope)
                .categoryCode(categoryCode)
                .code(code)
                .title(title)
                .position(position)
                .isDefault(isDefault)
                .isSystem(isSystem)
                .build();
    }

    public BoardStatusAppearance toBoardStatusAppearance(BoardStatus status, String accentCode) {
        return BoardStatusAppearance.builder()
                .status(status)
                .accentCode(accentCode)
                .isBold(false)
                .isItalic(false)
                .displayMode("default")
                .build();
    }

    public BoardStatusSettings toBoardStatusSettings(BoardStatus status, boolean allowDragIn) {
        return BoardStatusSettings.builder()
                .status(status)
                .isPinned(false)
                .isHidden(false)
                .allowDragIn(allowDragIn)
                .build();
    }

    public BoardDto toBoardDto(Board board, BoardAppearance appearance,
                               BoardSettings settings, BoardMember member,
                               Project mainProject, long projectCount, long taskCount,
                               String coverUrl) {
        return BoardDto.builder()
                .id(board.getId())
                .title(board.getTitle())
                .description(board.getDescription())
                .position(board.getPosition())
                .accentCode(appearance != null ? appearance.getAccentCode() : "blue")
                .coverUrl(coverUrl)
                .coverAttachmentId(appearance != null && appearance.getCover() != null
                        ? appearance.getCover().getId() : null)
                .isPinned(settings != null && settings.getIsPinned())
                .isPublic(settings != null && settings.getIsPublic())
                .ownerRole(member != null ? member.getRole() : null)
                .mainProjectId(mainProject != null ? mainProject.getId() : null)
                .projectCount(projectCount)
                .taskCount(taskCount)
                .build();
    }
}