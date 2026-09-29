package coursework.taskboard.service.project;

import coursework.taskboard.dto.project.*;
import coursework.taskboard.model.attachment.Attachment;
import coursework.taskboard.model.attachment.AttachmentMeta;
import coursework.taskboard.model.board.*;
import coursework.taskboard.model.project.Project;
import coursework.taskboard.model.project.ProjectSettings;
import coursework.taskboard.model.stage.Stage;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.attachment.AttachmentMetaRepository;
import coursework.taskboard.repository.attachment.AttachmentRepository;
import coursework.taskboard.repository.board.*;
import coursework.taskboard.repository.project.*;
import coursework.taskboard.repository.stage.StageRepository;
import coursework.taskboard.repository.task.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectSettingsRepository projectSettingsRepository;
    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final BoardStatusRepository boardStatusRepository;
    private final StageRepository stageRepository;
    private final TaskRepository taskRepository;
    private final AttachmentRepository attachmentRepository;
    private final AttachmentMetaRepository attachmentMetaRepository;

    private final ProjectMapper projectMapper;

    @Value("${app.upload.base-url}")
    private String uploadBaseUrl;

    @Transactional(readOnly = true)
    public List<ProjectDto> getBoardProjects(Long boardId, User user) {
        checkBoardAccess(boardId, user);

        List<Project> projects = projectRepository.findByBoardIdOrderByPositionAsc(boardId);
        List<ProjectDto> result = new ArrayList<>();

        for (Project project : projects) {
            ProjectSettings settings = projectSettingsRepository.findById(project.getId()).orElse(null);

            long total = taskRepository.countByProjectId(project.getId());
            long done = taskRepository.countDoneByProjectId(project.getId());
            long active = taskRepository.countActiveByProjectId(project.getId());

            String coverUrl = resolveCoverUrl(settings);

            result.add(projectMapper.toProjectDto(project, settings, total, done, active,
                    coverUrl, null));
        }

        result.sort(Comparator
                .comparing((ProjectDto p) -> p.getIsPinned() != null && p.getIsPinned() ? 0 : 1)
                .thenComparing(p -> p.getPosition() == null ? 0 : p.getPosition()));

        return result;
    }

    @Transactional(readOnly = true)
    public ProjectDto getProject(Long projectId, User user) {
        Project project = getProjectWithAccess(projectId, user);
        ProjectSettings settings = projectSettingsRepository.findById(projectId).orElse(null);

        long total = taskRepository.countByProjectId(projectId);
        long done = taskRepository.countDoneByProjectId(projectId);
        long active = taskRepository.countActiveByProjectId(projectId);

        List<Stage> stages = stageRepository.findByProjectIdOrderByPositionAsc(projectId);
        List<StageDto> stageDtos = new ArrayList<>();

        for (Stage stage : stages) {
            long stageTotal = taskRepository.countByStageId(stage.getId());
            long stageDone = taskRepository.countDoneByStageId(stage.getId());
            stageDtos.add(projectMapper.toStageDto(stage, stageTotal, stageDone));
        }

        String coverUrl = resolveCoverUrl(settings);

        return projectMapper.toProjectDto(project, settings, total, done, active,
                coverUrl, stageDtos);
    }

    @Transactional
    public ProjectDto createProject(Long boardId, CreateProjectRequest request, User user) {
        checkBoardAccess(boardId, user);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("Board not found"));

        int position = (int) projectRepository.countByBoardId(boardId);

        Project project = projectMapper.toProject(board, request, position);
        projectRepository.save(project);

        BoardStatus defaultStatus = boardStatusRepository
                .findByBoardIdAndScopeAndIsDefaultTrue(boardId, "project")
                .orElseThrow(() -> new IllegalStateException("No default project status"));

        ProjectSettings settings = projectMapper.toProjectSettings(
                project, defaultStatus, request.getAccentCode());
        projectSettingsRepository.save(settings);

        return projectMapper.toProjectDto(project, settings, 0, 0, 0, null, null);
    }

    @Transactional
    public ProjectDto updateProject(Long projectId, UpdateProjectRequest request, User user) {
        Project project = getProjectWithAccess(projectId, user);
        ProjectSettings settings = projectSettingsRepository.findById(projectId)
                .orElseThrow();

        if (request.getTitle() != null) project.setTitle(request.getTitle());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getPosition() != null) project.setPosition(request.getPosition());
        projectRepository.save(project);

        if (request.getAccentCode() != null) settings.setAccentCode(request.getAccentCode());
        if (request.getIsPinned() != null) settings.setIsPinned(request.getIsPinned());
        if (request.getIsTemplate() != null) settings.setIsTemplate(request.getIsTemplate());

        if (request.getCoverAttachmentId() != null) {
            Attachment cover = attachmentRepository.findById(request.getCoverAttachmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));
            if (!cover.getOwner().getId().equals(user.getId())) {
                throw new IllegalArgumentException("Not your attachment");
            }
            settings.setCover(cover);
        }

        if (request.getStatusId() != null) {
            BoardStatus status = boardStatusRepository.findById(request.getStatusId())
                    .orElseThrow(() -> new IllegalArgumentException("Status not found"));

            if (!"project".equals(status.getScope())) {
                throw new IllegalArgumentException("Status must have scope='project'");
            }
            if (!status.getBoard().getId().equals(project.getBoard().getId())) {
                throw new IllegalArgumentException("Status from another board");
            }

            settings.setStatus(status);
        }
        projectSettingsRepository.save(settings);

        long total = taskRepository.countByProjectId(projectId);
        long done = taskRepository.countDoneByProjectId(projectId);
        long active = taskRepository.countActiveByProjectId(projectId);

        String coverUrl = resolveCoverUrl(settings);

        return projectMapper.toProjectDto(project, settings, total, done, active,
                coverUrl, null);
    }

    @Transactional
    public void deleteProject(Long projectId, User user) {
        Project project = getProjectWithAccess(projectId, user);

        if (Boolean.TRUE.equals(project.getIsMain())) {
            throw new IllegalArgumentException(
                    "Нельзя удалить главный проект доски. Переименуйте его или создайте новый."
            );
        }

        projectRepository.delete(project);
    }

    private String resolveCoverUrl(ProjectSettings settings) {
        if (settings == null || settings.getCover() == null) return null;
        AttachmentMeta meta = attachmentMetaRepository
                .findById(settings.getCover().getId()).orElse(null);
        return meta != null ? uploadBaseUrl + "/" + meta.getUrl() : null;
    }

    private void checkBoardAccess(Long boardId, User user) {
        if (!boardMemberRepository.existsByBoardIdAndUserId(boardId, user.getId())) {
            throw new IllegalArgumentException("No access to board");
        }
    }

    private Project getProjectWithAccess(Long projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        if (!boardMemberRepository.existsByBoardIdAndUserId(
                project.getBoard().getId(), user.getId())) {
            throw new IllegalArgumentException("No access to project");
        }

        return project;
    }
}