package coursework.taskboard.service.board;

import coursework.taskboard.dto.board.*;
import coursework.taskboard.model.board.*;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.board.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BoardStatusService {

    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final BoardStatusRepository boardStatusRepository;
    private final BoardStatusAppearanceRepository boardStatusAppearanceRepository;
    private final BoardStatusSettingsRepository boardStatusSettingsRepository;

    @Transactional(readOnly = true)
    public List<BoardStatusDto> list(Long boardId, String scope, User user) {
        checkAccess(boardId, user);

        List<BoardStatus> statuses = scope != null
                ? boardStatusRepository.findByBoardIdAndScopeOrderByPositionAsc(boardId, scope)
                : boardStatusRepository.findByBoardIdOrderByPositionAsc(boardId);

        List<BoardStatusDto> result = new ArrayList<>();
        for (BoardStatus s : statuses) {
            result.add(toDto(s));
        }
        return result;
    }

    @Transactional
    public BoardStatusDto create(Long boardId, CreateStatusRequest request, User user) {
        checkAccess(boardId, user);

        Board board = boardRepository.findById(boardId).orElseThrow();

        String code = "CUSTOM_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        int position = request.getPosition() != null
                ? request.getPosition()
                : (int) boardStatusRepository
                .findByBoardIdAndScopeOrderByPositionAsc(boardId, request.getScope())
                .size() + 1;

        BoardStatus status = BoardStatus.builder()
                .board(board)
                .scope(request.getScope())
                .categoryCode(request.getCategoryCode())
                .code(code)
                .title(request.getTitle())
                .position(position)
                .isDefault(false)
                .isSystem(false)
                .build();
        boardStatusRepository.save(status);

        BoardStatusAppearance appearance = BoardStatusAppearance.builder()
                .status(status)
                .accentCode(request.getAccentCode() != null ? request.getAccentCode() : "gray")
                .isBold(request.getIsBold() != null && request.getIsBold())
                .isItalic(request.getIsItalic() != null && request.getIsItalic())
                .icon(request.getIcon())
                .displayMode("default")
                .build();
        boardStatusAppearanceRepository.save(appearance);

        BoardStatusSettings settings = BoardStatusSettings.builder()
                .status(status)
                .isPinned(false)
                .isHidden(false)
                .allowDragIn(true)
                .build();
        boardStatusSettingsRepository.save(settings);

        return toDto(status);
    }

    @Transactional
    public BoardStatusDto update(Long boardId, Long statusId, UpdateStatusRequest request, User user) {
        checkAccess(boardId, user);

        BoardStatus status = boardStatusRepository.findById(statusId)
                .orElseThrow(() -> new IllegalArgumentException("Status not found"));

        if (!status.getBoard().getId().equals(boardId)) {
            throw new IllegalArgumentException("Status from another board");
        }

        if (request.getTitle() != null) status.setTitle(request.getTitle());
        if (request.getCategoryCode() != null) status.setCategoryCode(request.getCategoryCode());
        if (request.getPosition() != null) status.setPosition(request.getPosition());

        boardStatusRepository.save(status);

        BoardStatusAppearance appearance = boardStatusAppearanceRepository
                .findById(statusId).orElseThrow();
        if (request.getAccentCode() != null) appearance.setAccentCode(request.getAccentCode());
        if (request.getIcon() != null) appearance.setIcon(request.getIcon());
        if (request.getIsBold() != null) appearance.setIsBold(request.getIsBold());
        if (request.getIsItalic() != null) appearance.setIsItalic(request.getIsItalic());
        boardStatusAppearanceRepository.save(appearance);

        return toDto(status);
    }

    @Transactional
    public void delete(Long boardId, Long statusId, User user) {
        checkAccess(boardId, user);

        BoardStatus status = boardStatusRepository.findById(statusId)
                .orElseThrow(() -> new IllegalArgumentException("Status not found"));

        if (!status.getBoard().getId().equals(boardId)) {
            throw new IllegalArgumentException("Status from another board");
        }
        if (Boolean.TRUE.equals(status.getIsSystem())) {
            throw new IllegalArgumentException("Нельзя удалить системный статус");
        }

        boardStatusRepository.delete(status);
    }

    private void checkAccess(Long boardId, User user) {
        if (!boardMemberRepository.existsByBoardIdAndUserId(boardId, user.getId())) {
            throw new IllegalArgumentException("No access to board");
        }
    }

    private BoardStatusDto toDto(BoardStatus s) {
        BoardStatusAppearance appearance = boardStatusAppearanceRepository
                .findById(s.getId()).orElse(null);
        BoardStatusSettings settings = boardStatusSettingsRepository
                .findById(s.getId()).orElse(null);

        return BoardStatusDto.builder()
                .id(s.getId())
                .boardId(s.getBoard().getId())
                .scope(s.getScope())
                .categoryCode(s.getCategoryCode())
                .code(s.getCode())
                .title(s.getTitle())
                .position(s.getPosition())
                .isDefault(s.getIsDefault())
                .isSystem(s.getIsSystem())
                .accentCode(appearance != null ? appearance.getAccentCode() : null)
                .icon(appearance != null ? appearance.getIcon() : null)
                .isBold(appearance != null && appearance.getIsBold())
                .isItalic(appearance != null && appearance.getIsItalic())
                .isPinned(settings != null && settings.getIsPinned())
                .isHidden(settings != null && settings.getIsHidden())
                .allowDragIn(settings != null ? settings.getAllowDragIn() : true)
                .build();
    }
}