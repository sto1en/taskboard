package coursework.taskboard.service.group;

import coursework.taskboard.dto.board.BoardMemberDto;
import coursework.taskboard.dto.board.CreateBoardRequest;
import coursework.taskboard.dto.group.*;
import coursework.taskboard.model.attachment.AttachmentMeta;
import coursework.taskboard.model.board.Board;
import coursework.taskboard.model.board.BoardStatus;
import coursework.taskboard.model.project.Project;
import coursework.taskboard.model.project.ProjectInvite;
import coursework.taskboard.model.project.ProjectMember;
import coursework.taskboard.model.project.ProjectSettings;
import coursework.taskboard.model.user.User;
import coursework.taskboard.model.user.UserProfile;
import coursework.taskboard.repository.attachment.AttachmentMetaRepository;
import coursework.taskboard.repository.board.BoardRepository;
import coursework.taskboard.repository.board.BoardStatusRepository;
import coursework.taskboard.repository.project.ProjectInviteRepository;
import coursework.taskboard.repository.project.ProjectMemberRepository;
import coursework.taskboard.repository.project.ProjectRepository;
import coursework.taskboard.repository.project.ProjectSettingsRepository;
import coursework.taskboard.repository.task.TaskRepository;
import coursework.taskboard.repository.user.UserProfileRepository;
import coursework.taskboard.service.access.ProjectAccessService;
import coursework.taskboard.service.board.BoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Групповые проекты.
 *
 * У пользователя ровно одна скрытая доска «Групповая» — она служит
 * контейнером (статусы, теги, настройки), но в «Мои доски» не попадает.
 * Доступ к каждому проекту выдаётся через project_members, поэтому
 * приглашённый участник не получает доступ к доске и её другим проектам.
 */
@Service
@RequiredArgsConstructor
public class GroupService {

    public static final String GROUP_BOARD_TITLE = "Групповая";
    public static final String ROLE_OWNER = "owner";
    public static final String ROLE_EDITOR = "editor";
    public static final String ROLE_VIEWER = "viewer";

    private final BoardService boardService;
    private final BoardRepository boardRepository;
    private final BoardStatusRepository boardStatusRepository;
    private final ProjectRepository projectRepository;
    private final ProjectSettingsRepository projectSettingsRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectInviteRepository projectInviteRepository;
    private final TaskRepository taskRepository;
    private final UserProfileRepository userProfileRepository;
    private final AttachmentMetaRepository attachmentMetaRepository;
    private final ProjectAccessService accessService;

    @Value("${app.upload.base-url}")
    private String uploadBaseUrl;

    // ============================================================
    // Список и создание
    // ============================================================

    @Transactional(readOnly = true)
    public List<GroupProjectDto> list(User user) {
        List<Project> projects = projectMemberRepository.findProjectsByUserId(user.getId());
        List<GroupProjectDto> result = new ArrayList<>();

        for (Project project : projects) {
            // В project_members могут оказаться и обычные проекты (на будущее) —
            // в «Групповое» показываем только проекты скрытой доски.
            if (!isGroupProject(project)) continue;
            result.add(toDto(project, user));
        }

        result.sort((a, b) -> {
            int doneA = a.getTaskTotal() > 0 && a.getTaskDone() == a.getTaskTotal() ? 1 : 0;
            int doneB = b.getTaskTotal() > 0 && b.getTaskDone() == b.getTaskTotal() ? 1 : 0;
            if (doneA != doneB) return doneA - doneB;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });
        return result;
    }

    @Transactional
    public GroupProjectDto create(User user, CreateGroupProjectRequest request) {
        Board board = ensureGroupBoard(user);

        int position = (int) projectRepository.countByBoardId(board.getId());

        Project project = Project.builder()
                .board(board)
                .isMain(false)
                .title(request.getTitle().trim())
                .description(request.getDescription() != null ? request.getDescription() : "")
                .position(position)
                .build();
        projectRepository.save(project);

        BoardStatus defaultStatus = boardStatusRepository
                .findByBoardIdAndScopeAndIsDefaultTrue(board.getId(), "project")
                .orElseThrow(() -> new IllegalStateException("No default project status"));

        ProjectSettings settings = ProjectSettings.builder()
                .project(project)
                .status(defaultStatus)
                .isPinned(false)
                .isTemplate(false)
                .isManualPosition(false)
                .isCoop(true)
                .build();
        projectSettingsRepository.save(settings);

        ProjectMember owner = ProjectMember.builder()
                .project(project)
                .user(user)
                .role(ROLE_OWNER)
                .build();
        projectMemberRepository.save(owner);

        return toDto(project, user);
    }

    // ============================================================
    // Проект
    // ============================================================

    @Transactional(readOnly = true)
    public GroupWorkspaceDto getWorkspace(Long projectId, User user) {
        Project project = requireGroupProject(projectId, user);

        List<ProjectMember> members = projectMemberRepository.findByProjectId(projectId);
        List<BoardMemberDto> memberDtos = new ArrayList<>();
        for (ProjectMember m : members) {
            memberDtos.add(toMemberDto(m));
        }

        String role = accessService.role(project, user);

        return GroupWorkspaceDto.builder()
                .project(toDto(project, user))
                .members(memberDtos)
                .boardId(project.getBoard().getId())
                .role(role)
                .canEdit(ROLE_OWNER.equals(role) || ROLE_EDITOR.equals(role))
                .isOwner(ROLE_OWNER.equals(role))
                .build();
    }

    @Transactional
    public GroupProjectDto update(Long projectId, UpdateGroupProjectRequest request, User user) {
        Project project = requireGroupProject(projectId, user);
        requireEditor(project, user);

        project.setTitle(request.getTitle().trim());
        project.setDescription(request.getDescription() != null ? request.getDescription() : "");
        projectRepository.save(project);

        return toDto(project, user);
    }

    @Transactional
    public void delete(Long projectId, User user) {
        Project project = requireGroupProject(projectId, user);

        if (!ROLE_OWNER.equals(accessService.role(project, user))) {
            throw new IllegalArgumentException("Удалить групповой проект может только владелец");
        }

        projectInviteRepository.deleteByProjectId(projectId);
        projectMemberRepository.deleteAll(projectMemberRepository.findByProjectId(projectId));
        projectRepository.delete(project);
    }

    // ============================================================
    // Участники и приглашения
    // ============================================================

    @Transactional(readOnly = true)
    public List<BoardMemberDto> members(Long projectId, User user) {
        requireGroupProject(projectId, user);
        List<BoardMemberDto> result = new ArrayList<>();
        for (ProjectMember m : projectMemberRepository.findByProjectId(projectId)) {
            result.add(toMemberDto(m));
        }
        return result;
    }

    @Transactional
    public GroupInviteDto invite(Long projectId, User user) {
        Project project = requireGroupProject(projectId, user);
        requireEditor(project, user);

        String token = UUID.randomUUID().toString().replace("-", "");
        ProjectInvite invite = ProjectInvite.builder()
                .token(token)
                .project(project)
                .createdBy(user)
                .expiresAt(LocalDateTime.now().plusDays(14))
                .build();
        projectInviteRepository.save(invite);

        return GroupInviteDto.builder()
                .token(token)
                .path("/join/" + token)
                .projectId(project.getId())
                .projectTitle(project.getTitle())
                .expiresAt(invite.getExpiresAt())
                .build();
    }

    @Transactional(readOnly = true)
    public GroupInviteDto previewInvite(String token, User user) {
        ProjectInvite invite = findInvite(token);
        if (invite.getInvitedUser() != null
                && !invite.getInvitedUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Это приглашение предназначено другому пользователю");
        }
        return GroupInviteDto.builder()
                .token(invite.getToken())
                .path("/join/" + invite.getToken())
                .projectId(invite.getProject().getId())
                .projectTitle(invite.getProject().getTitle())
                .expiresAt(invite.getExpiresAt())
                .build();
    }

    @Transactional
    public GroupWorkspaceDto join(String token, User user) {
        ProjectInvite invite = findInvite(token);
        Project project = invite.getProject();

        if (invite.getInvitedUser() != null
                && !invite.getInvitedUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Это приглашение предназначено другому пользователю");
        }

        if (!projectMemberRepository.existsByProjectIdAndUserId(project.getId(), user.getId())) {
            ProjectMember member = ProjectMember.builder()
                    .project(project)
                    .user(user)
                    .role(ROLE_EDITOR)
                    .build();
            projectMemberRepository.save(member);
        }

        return getWorkspace(project.getId(), user);
    }

    @Transactional
    public void removeMember(Long projectId, Long userId, User user) {
        Project project = requireGroupProject(projectId, user);

        boolean self = user.getId().equals(userId);
        if (!self && !ROLE_OWNER.equals(accessService.role(project, user))) {
            throw new IllegalArgumentException("Удалять участников может только владелец проекта");
        }

        ProjectMember member = projectMemberRepository
                .findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Участник не найден"));

        if (ROLE_OWNER.equals(member.getRole())) {
            throw new IllegalArgumentException("Нельзя удалить владельца проекта");
        }

        projectMemberRepository.delete(member);
    }

    // ============================================================
    // helpers
    // ============================================================

    /**
     * Одна скрытая доска «Групповая» на пользователя. Создаётся лениво:
     * у тех, кто групповыми проектами не пользуется, лишних досок нет.
     */
    @Transactional
    public Board ensureGroupBoard(User user) {
        return boardRepository.findFirstByOwnerIdAndIsGroupTrue(user.getId())
                .orElseGet(() -> {
                    CreateBoardRequest req = new CreateBoardRequest();
                    req.setTitle(GROUP_BOARD_TITLE);
                    req.setDescription("Групповые проекты");
                    req.setAccentCode("blue");
                    boardService.createBoard(user, req, true);
                    return boardRepository.findFirstByOwnerIdAndIsGroupTrue(user.getId())
                            .orElseThrow(() -> new IllegalStateException("Не удалось создать доску «Групповая»"));
                });
    }

    private boolean isGroupProject(Project project) {
        return Boolean.TRUE.equals(project.getBoard().getIsGroup());
    }

    private Project requireGroupProject(Long projectId, User user) {
        Project project = accessService.requireProject(projectId, user);
        if (!isGroupProject(project)) {
            throw new IllegalArgumentException("Это не групповой проект");
        }
        return project;
    }

    private void requireEditor(Project project, User user) {
        String role = accessService.role(project, user);
        if (!ROLE_OWNER.equals(role) && !ROLE_EDITOR.equals(role)) {
            throw new IllegalArgumentException("Недостаточно прав: проект доступен только для чтения");
        }
    }

    private ProjectInvite findInvite(String token) {
        ProjectInvite invite = projectInviteRepository.findById(token)
                .orElseThrow(() -> new IllegalArgumentException("Приглашение не найдено"));

        if (invite.getExpiresAt() != null
                && invite.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Срок действия приглашения истёк");
        }
        return invite;
    }

    private GroupProjectDto toDto(Project project, User user) {
        String role = accessService.role(project, user);

        return GroupProjectDto.builder()
                .id(project.getId())
                .boardId(project.getBoard().getId())
                .title(project.getTitle())
                .description(project.getDescription())
                .role(role)
                .isOwner(ROLE_OWNER.equals(role))
                .canEdit(ROLE_OWNER.equals(role) || ROLE_EDITOR.equals(role))
                .memberCount(projectMemberRepository.countByProjectId(project.getId()))
                .taskTotal(taskRepository.countByProjectId(project.getId()))
                .taskDone(taskRepository.countDoneByProjectId(project.getId()))
                .taskActive(taskRepository.countActiveByProjectId(project.getId()))
                .createdAt(project.getCreatedAt())
                .build();
    }

    private BoardMemberDto toMemberDto(ProjectMember m) {
        User u = m.getUser();
        UserProfile profile = userProfileRepository.findById(u.getId()).orElse(null);

        String displayName = profile != null && profile.getDisplayName() != null
                ? profile.getDisplayName()
                : u.getUsername();

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
                .isOwner(ROLE_OWNER.equals(m.getRole()))
                .build();
    }
}
