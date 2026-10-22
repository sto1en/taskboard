package coursework.taskboard.service.access;

import coursework.taskboard.model.project.Project;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.board.BoardMemberRepository;
import coursework.taskboard.repository.project.ProjectMemberRepository;
import coursework.taskboard.repository.project.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Единая точка проверки доступа к проекту.
 *
 * Правило: доступ к проекту даёт либо членство в доске (как раньше),
 * либо членство в самом проекте (project_members). Второе нужно для
 * групповых проектов: участник работает с проектом, но доска, её
 * остальные проекты и настройки ему недоступны.
 *
 * Важно: board-эндпоинты по-прежнему проверяют только board_members,
 * поэтому доступ к проекту не «протекает» на доску.
 */
@Service
@RequiredArgsConstructor
public class ProjectAccessService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final BoardMemberRepository boardMemberRepository;

    @Transactional(readOnly = true)
    public Project requireProject(Long projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        if (!canAccessProject(project, user)) {
            throw new IllegalArgumentException("No access to project");
        }
        return project;
    }

    @Transactional(readOnly = true)
    public boolean canAccessProject(Project project, User user) {
        if (project == null || user == null) return false;
        Long boardId = project.getBoard().getId();
        if (boardMemberRepository.existsByBoardIdAndUserId(boardId, user.getId())) {
            return true;
        }
        return projectMemberRepository.existsByProjectIdAndUserId(
                project.getId(), user.getId());
    }

    @Transactional(readOnly = true)
    public boolean canAccessProject(Long projectId, User user) {
        if (projectId == null || user == null) return false;
        Project project = projectRepository.findById(projectId).orElse(null);
        return canAccessProject(project, user);
    }

    @Transactional(readOnly = true)
    public void requireBoard(Long boardId, User user) {
        if (boardId == null || user == null
                || !boardMemberRepository.existsByBoardIdAndUserId(boardId, user.getId())) {
            throw new IllegalArgumentException("No access to board");
        }
    }

    @Transactional(readOnly = true)
    public boolean canAccessBoard(Long boardId, User user) {
        return boardId != null && user != null
                && boardMemberRepository.existsByBoardIdAndUserId(boardId, user.getId());
    }

    /**
     * Член доски или участник любого группового проекта этой доски.
     * Используется только для чтения справочников, без которых не
     * отрисовать канбан и форму задачи (статусы, теги).
     */
    @Transactional(readOnly = true)
    public boolean canReadBoardReference(Long boardId, User user) {
        if (boardId == null || user == null) return false;
        return boardMemberRepository.existsByBoardIdAndUserId(boardId, user.getId())
                || projectMemberRepository.existsByBoardIdAndUserId(boardId, user.getId());
    }

    /** Роль в проекте: owner / editor / viewer (или null, если доступа нет). */
    @Transactional(readOnly = true)
    public String role(Project project, User user) {
        if (project == null || user == null) return null;
        if (project.getBoard().getOwner().getId().equals(user.getId())
                || boardMemberRepository.existsByBoardIdAndUserId(
                        project.getBoard().getId(), user.getId())) {
            return "owner";
        }
        return projectMemberRepository
                .findRoleByProjectIdAndUserId(project.getId(), user.getId())
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public boolean isProjectMember(Long projectId, User user) {
        return projectId != null && user != null
                && projectMemberRepository.existsByProjectIdAndUserId(projectId, user.getId());
    }
}
