package coursework.taskboard.service.board;

import coursework.taskboard.dto.board.AddBoardMemberRequest;
import coursework.taskboard.dto.board.BoardMemberDto;
import coursework.taskboard.dto.board.UpdateBoardMemberRequest;
import coursework.taskboard.model.attachment.AttachmentMeta;
import coursework.taskboard.model.board.Board;
import coursework.taskboard.model.board.BoardMember;
import coursework.taskboard.model.user.User;
import coursework.taskboard.model.user.UserProfile;
import coursework.taskboard.repository.attachment.AttachmentMetaRepository;
import coursework.taskboard.repository.board.BoardMemberRepository;
import coursework.taskboard.repository.board.BoardRepository;
import coursework.taskboard.repository.user.UserProfileRepository;
import coursework.taskboard.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BoardMemberService {

    private static final Set<String> ALLOWED_ROLES = Set.of("owner", "editor", "viewer");

    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final AttachmentMetaRepository attachmentMetaRepository;

    @Value("${app.upload.base-url}")
    private String uploadBaseUrl;

    @Transactional(readOnly = true)
    public List<BoardMemberDto> list(Long boardId, User requester) {
        checkAccess(boardId, requester);

        List<BoardMember> members = boardMemberRepository.findByBoardId(boardId);
        List<BoardMemberDto> result = new ArrayList<>();

        for (BoardMember m : members) {
            result.add(toDto(m));
        }
        return result;
    }

    @Transactional
    public BoardMemberDto add(Long boardId, AddBoardMemberRequest req, User requester) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("Board not found"));

        if (!board.getOwner().getId().equals(requester.getId())) {
            throw new IllegalArgumentException("Только владелец может приглашать участников");
        }

        String role = req.getRole() != null ? req.getRole() : "editor";
        if (!ALLOWED_ROLES.contains(role) || "owner".equals(role)) {
            throw new IllegalArgumentException("Недопустимая роль: " + role);
        }

        User target = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        if (target.getId().equals(requester.getId())) {
            throw new IllegalArgumentException("Вы уже владелец этой доски");
        }

        if (boardMemberRepository.existsByBoardIdAndUserId(boardId, target.getId())) {
            throw new IllegalArgumentException("Пользователь уже добавлен в доску");
        }

        BoardMember member = BoardMember.builder()
                .board(board)
                .user(target)
                .role(role)
                .build();
        boardMemberRepository.save(member);

        return toDto(member);
    }

    @Transactional
    public BoardMemberDto update(Long boardId, Long userId, UpdateBoardMemberRequest req, User requester) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("Board not found"));

        if (!board.getOwner().getId().equals(requester.getId())) {
            throw new IllegalArgumentException("Только владелец может менять роли");
        }

        if (!ALLOWED_ROLES.contains(req.getRole()) || "owner".equals(req.getRole())) {
            throw new IllegalArgumentException("Недопустимая роль: " + req.getRole());
        }

        BoardMember member = boardMemberRepository.findByBoardIdAndUserId(boardId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Участник не найден"));

        if ("owner".equals(member.getRole())) {
            throw new IllegalArgumentException("Нельзя изменить роль владельца");
        }

        member.setRole(req.getRole());
        boardMemberRepository.save(member);
        return toDto(member);
    }

    @Transactional
    public void remove(Long boardId, Long userId, User requester) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("Board not found"));

        boolean isOwner = board.getOwner().getId().equals(requester.getId());
        boolean self = requester.getId().equals(userId);

        if (!isOwner && !self) {
            throw new IllegalArgumentException("Недостаточно прав");
        }

        BoardMember member = boardMemberRepository.findByBoardIdAndUserId(boardId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Участник не найден"));

        if ("owner".equals(member.getRole())) {
            throw new IllegalArgumentException("Нельзя удалить владельца доски");
        }

        boardMemberRepository.delete(member);
    }

    // ============================================================
    // helpers
    // ============================================================

    private void checkAccess(Long boardId, User user) {
        if (!boardMemberRepository.existsByBoardIdAndUserId(boardId, user.getId())) {
            throw new IllegalArgumentException("No access to board");
        }
    }

    private BoardMemberDto toDto(BoardMember m) {
        User u = m.getUser();

        UserProfile profile = userProfileRepository.findById(u.getId()).orElse(null);

        String displayName = profile != null ? profile.getDisplayName() : u.getUsername();

        String avatarUrl = null;
        if (profile != null && profile.getAvatar() != null) {
            AttachmentMeta meta = attachmentMetaRepository
                    .findById(profile.getAvatar().getId()).orElse(null);
            if (meta != null) {
                avatarUrl = uploadBaseUrl + "/" + meta.getUrl();
            }
        }

        return BoardMemberDto.builder()
                .userId(u.getId())
                .username(u.getUsername())
                .displayName(displayName)
                .role(m.getRole())
                .avatarUrl(avatarUrl)
                .isOwner("owner".equals(m.getRole()))
                .build();
    }
}