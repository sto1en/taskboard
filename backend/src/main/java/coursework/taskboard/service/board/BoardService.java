package coursework.taskboard.service.board;

import coursework.taskboard.dto.board.*;
import coursework.taskboard.dto.project.ProjectMapper;
import coursework.taskboard.model.attachment.Attachment;
import coursework.taskboard.model.attachment.AttachmentMeta;
import coursework.taskboard.model.board.*;
import coursework.taskboard.model.project.Project;
import coursework.taskboard.model.project.ProjectSettings;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.attachment.AttachmentMetaRepository;
import coursework.taskboard.repository.attachment.AttachmentRepository;
import coursework.taskboard.repository.board.*;
import coursework.taskboard.repository.project.ProjectRepository;
import coursework.taskboard.repository.project.ProjectSettingsRepository;
import coursework.taskboard.repository.task.TaskRepository;
import coursework.taskboard.repository.user.UserWorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;
    private final BoardAppearanceRepository boardAppearanceRepository;
    private final BoardSettingsRepository boardSettingsRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final BoardStatusRepository boardStatusRepository;
    private final BoardStatusAppearanceRepository boardStatusAppearanceRepository;
    private final BoardStatusSettingsRepository boardStatusSettingsRepository;
    private final ProjectRepository projectRepository;
    private final ProjectSettingsRepository projectSettingsRepository;
    private final UserWorkspaceRepository userWorkspaceRepository;
    private final TaskRepository taskRepository;
    private final AttachmentRepository attachmentRepository;
    private final AttachmentMetaRepository attachmentMetaRepository;

    private final BoardMapper boardMapper;
    private final ProjectMapper projectMapper;

    @Value("${app.upload.base-url}")
    private String uploadBaseUrl;

    @Transactional
    public BoardDto createBoard(User user, CreateBoardRequest request) {
        int boardPosition = (int) boardRepository.countByOwnerId(user.getId());
        Board board = boardMapper.toBoard(user, request, boardPosition);
        boardRepository.save(board);

        BoardAppearance appearance = boardMapper.toBoardAppearance(board, request.getAccentCode());
        boardAppearanceRepository.save(appearance);

        BoardSettings settings = boardMapper.toBoardSettings(board);
        boardSettingsRepository.save(settings);

        BoardMember member = boardMapper.toBoardMember(board, user, "owner");
        boardMemberRepository.save(member);

        createTaskStatuses(board);
        List<BoardStatus> projectStatuses = createProjectStatuses(board);

        BoardStatus defaultProjectStatus = projectStatuses.stream()
                .filter(BoardStatus::getIsDefault)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No default project status"));

        Project mainProject = projectMapper.toMainProject(board, request.getTitle());
        projectRepository.save(mainProject);

        ProjectSettings projectSettings = projectMapper.toProjectSettings(
                mainProject, defaultProjectStatus, null);
        projectSettingsRepository.save(projectSettings);

        userWorkspaceRepository.findById(user.getId()).ifPresent(ws -> {
            if (ws.getDefaultBoard() == null) {
                ws.setDefaultBoard(board);
                userWorkspaceRepository.save(ws);
            }
        });

        long projectCount = projectRepository.countByBoardId(board.getId());
        return boardMapper.toBoardDto(board, appearance, settings, member,
                mainProject, projectCount, 0L, null);
    }

    @Transactional(readOnly = true)
    public List<BoardDto> getUserBoards(User user) {
        List<Board> boards = boardRepository.findByOwnerIdOrderByPositionAsc(user.getId());
        List<BoardDto> result = new ArrayList<>();

        for (Board board : boards) {
            BoardAppearance appearance = boardAppearanceRepository
                    .findById(board.getId()).orElse(null);
            BoardSettings settings = boardSettingsRepository
                    .findById(board.getId()).orElse(null);
            BoardMember member = boardMemberRepository
                    .findByBoardIdAndUserId(board.getId(), user.getId()).orElse(null);
            Project main = projectRepository
                    .findByBoardIdAndIsMainTrue(board.getId()).orElse(null);
            long projectCount = projectRepository.countByBoardId(board.getId());
            long taskCount = taskRepository.countByBoardId(board.getId());

            String coverUrl = resolveCoverUrl(appearance);

            result.add(boardMapper.toBoardDto(board, appearance, settings, member,
                    main, projectCount, taskCount, coverUrl));
        }

        result.sort(Comparator
                .comparing((BoardDto b) -> b.getIsPinned() != null && b.getIsPinned() ? 0 : 1)
                .thenComparing(b -> b.getPosition() == null ? 0 : b.getPosition()));

        return result;
    }

    @Transactional(readOnly = true)
    public BoardDto getBoard(Long boardId, User user) {
        Board board = getBoardWithAccess(boardId, user);

        BoardAppearance appearance = boardAppearanceRepository
                .findById(boardId).orElse(null);
        BoardSettings settings = boardSettingsRepository
                .findById(boardId).orElse(null);
        BoardMember member = boardMemberRepository
                .findByBoardIdAndUserId(boardId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Not a member"));
        Project main = projectRepository
                .findByBoardIdAndIsMainTrue(boardId).orElse(null);

        long projectCount = projectRepository.countByBoardId(boardId);
        long taskCount = taskRepository.countByBoardId(boardId);

        String coverUrl = resolveCoverUrl(appearance);

        return boardMapper.toBoardDto(board, appearance, settings, member,
                main, projectCount, taskCount, coverUrl);
    }

    @Transactional
    public BoardDto updateBoard(Long boardId, UpdateBoardRequest request, User user) {
        Board board = getBoardWithAccess(boardId, user);

        if (request.getTitle() != null) board.setTitle(request.getTitle());
        if (request.getDescription() != null) board.setDescription(request.getDescription());
        if (request.getPosition() != null) board.setPosition(request.getPosition());
        boardRepository.save(board);

        if (request.getAccentCode() != null
                || request.getCoverAttachmentId() != null
                || Boolean.TRUE.equals(request.getClearCover())) {

            BoardAppearance appearance = boardAppearanceRepository
                    .findById(boardId).orElseThrow();

            if (request.getAccentCode() != null) {
                appearance.setAccentCode(request.getAccentCode());
            }

            if (Boolean.TRUE.equals(request.getClearCover())) {
                appearance.setCover(null);
            } else if (request.getCoverAttachmentId() != null) {
                Attachment cover = attachmentRepository
                        .findById(request.getCoverAttachmentId())
                        .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));
                if (!cover.getOwner().getId().equals(user.getId())) {
                    throw new IllegalArgumentException("Not your attachment");
                }
                appearance.setCover(cover);
            }

            boardAppearanceRepository.save(appearance);
        }

        if (request.getIsPinned() != null || request.getIsPublic() != null) {
            BoardSettings settings = boardSettingsRepository.findById(boardId).orElseThrow();
            if (request.getIsPinned() != null) settings.setIsPinned(request.getIsPinned());
            if (request.getIsPublic() != null) settings.setIsPublic(request.getIsPublic());
            boardSettingsRepository.save(settings);
        }

        Project main = projectRepository.findByBoardIdAndIsMainTrue(boardId).orElse(null);
        BoardMember member = boardMemberRepository
                .findByBoardIdAndUserId(boardId, user.getId()).orElseThrow();
        BoardAppearance appearance = boardAppearanceRepository.findById(boardId).orElse(null);
        BoardSettings settings = boardSettingsRepository.findById(boardId).orElse(null);
        long projectCount = projectRepository.countByBoardId(boardId);
        long taskCount = taskRepository.countByBoardId(boardId);

        String coverUrl = resolveCoverUrl(appearance);

        return boardMapper.toBoardDto(board, appearance, settings, member,
                main, projectCount, taskCount, coverUrl);
    }

    @Transactional
    public void deleteBoard(Long boardId, User user) {
        Board board = getBoardWithAccess(boardId, user);
        BoardMember member = boardMemberRepository
                .findByBoardIdAndUserId(boardId, user.getId()).orElseThrow();

        if (!"owner".equals(member.getRole())) {
            throw new IllegalArgumentException("Only owner can delete board");
        }

        boardRepository.delete(board);
    }

    private String resolveCoverUrl(BoardAppearance appearance) {
        if (appearance == null || appearance.getCover() == null) return null;
        AttachmentMeta meta = attachmentMetaRepository
                .findById(appearance.getCover().getId()).orElse(null);
        return meta != null ? uploadBaseUrl + "/" + meta.getUrl() : null;
    }

    private void createTaskStatuses(Board board) {
        createStatus(board, "task", "ACTIVE", "IN_PROGRESS", "В процессе", 1, true, false);
        createStatus(board, "task", "DONE", "DONE", "Выполнено", 2, false, false);
        createStatus(board, "task", "EXPIRED", "EXPIRED", "Просрочено", 3, false, true);
        createStatus(board, "task", "CANCELLED", "CANCELLED", "Отменено", 4, false, false);
        createStatus(board, "task", "FROZEN", "FROZEN", "Отложено", 5, false, false);
    }

    private List<BoardStatus> createProjectStatuses(Board board) {
        List<BoardStatus> statuses = new ArrayList<>();
        statuses.add(createStatus(board, "project", "ACTIVE", "ACTIVE", "Активный", 1, true, false));
        statuses.add(createStatus(board, "project", "DONE", "DONE", "Завершён", 2, false, false));
        statuses.add(createStatus(board, "project", "CANCELLED", "CANCELLED", "Отменён", 3, false, false));
        return statuses;
    }

    private BoardStatus createStatus(Board board, String scope, String categoryCode,
                                     String code, String title, int position,
                                     boolean isDefault, boolean isSystem) {
        BoardStatus status = boardMapper.toBoardStatus(board, scope, categoryCode,
                code, title, position, isDefault, isSystem);
        boardStatusRepository.save(status);

        String accent = defaultAccentForCategory(categoryCode);
        boardStatusAppearanceRepository.save(
                boardMapper.toBoardStatusAppearance(status, accent));

        boolean allowDragIn = true;
        boardStatusSettingsRepository.save(
                boardMapper.toBoardStatusSettings(status, allowDragIn));

        return status;
    }

    private String defaultAccentForCategory(String categoryCode) {
        return switch (categoryCode) {
            case "ACTIVE"    -> "blue";
            case "DONE"      -> "green";
            case "EXPIRED"   -> "red";
            case "CANCELLED" -> "gray";
            case "FROZEN"    -> "amber";
            case "ARCHIVED"  -> "slate";
            default          -> "gray";
        };
    }

    private Board getBoardWithAccess(Long boardId, User user) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("Board not found"));

        if (!boardMemberRepository.existsByBoardIdAndUserId(boardId, user.getId())) {
            throw new IllegalArgumentException("No access to board");
        }

        return board;
    }
}