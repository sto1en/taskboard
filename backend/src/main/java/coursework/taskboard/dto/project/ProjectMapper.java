package coursework.taskboard.dto.project;

import coursework.taskboard.model.board.Board;
import coursework.taskboard.model.board.BoardStatus;
import coursework.taskboard.model.project.Project;
import coursework.taskboard.model.project.ProjectSettings;
import coursework.taskboard.model.stage.Stage;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ProjectMapper {

    public Project toProject(Board board, CreateProjectRequest request, int position) {
        return Project.builder()
                .board(board)
                .isMain(false)
                .title(request.getTitle())
                .description(request.getDescription() != null ? request.getDescription() : "")
                .position(position)
                .build();
    }

    public Project toMainProject(Board board, String title) {
        return Project.builder()
                .board(board)
                .isMain(true)
                .title(title)
                .description("")
                .position(0)
                .build();
    }

    public ProjectSettings toProjectSettings(Project project, BoardStatus status, String accentCode) {
        return ProjectSettings.builder()
                .project(project)
                .status(status)
                .isPinned(false)
                .isTemplate(false)
                .accentCode(accentCode)
                .build();
    }

    public ProjectDto toProjectDto(Project project, ProjectSettings settings,
                                   long taskTotal, long taskDone, long taskActive,
                                   String coverUrl) {
        BoardStatus status = settings != null ? settings.getStatus() : null;

        return ProjectDto.builder()
                .id(project.getId())
                .boardId(project.getBoard().getId())
                .title(project.getTitle())
                .description(project.getDescription())
                .isMain(project.getIsMain())
                .position(project.getPosition())
                .accentCode(settings != null ? settings.getAccentCode() : null)
                .coverUrl(coverUrl)
                .statusId(status != null ? status.getId() : null)
                .statusCode(status != null ? status.getCode() : null)
                .statusTitle(status != null ? status.getTitle() : null)
                .statusCategoryCode(status != null ? status.getCategoryCode() : null)
                .isPinned(settings != null && settings.getIsPinned())
                .isTemplate(settings != null && settings.getIsTemplate())
                .taskTotal(taskTotal)
                .taskDone(taskDone)
                .taskActive(taskActive)
                .build();
    }

    public ProjectDetailDto toProjectDetailDto(Project project, ProjectSettings settings,
                                               long taskTotal, long taskDone, long taskActive,
                                               String coverUrl,
                                               List<StageSummaryDto> stages) {
        BoardStatus status = settings != null ? settings.getStatus() : null;

        return ProjectDetailDto.builder()
                .id(project.getId())
                .boardId(project.getBoard().getId())
                .title(project.getTitle())
                .description(project.getDescription())
                .isMain(project.getIsMain())
                .position(project.getPosition())
                .accentCode(settings != null ? settings.getAccentCode() : null)
                .coverUrl(coverUrl)
                .statusCode(status != null ? status.getCode() : null)
                .statusTitle(status != null ? status.getTitle() : null)
                .taskTotal(taskTotal)
                .taskDone(taskDone)
                .taskActive(taskActive)
                .stages(stages)
                .build();
    }

    public StageSummaryDto toStageSummaryDto(Stage stage, long taskTotal, long taskDone) {
        return StageSummaryDto.builder()
                .id(stage.getId())
                .title(stage.getTitle())
                .description(stage.getDescription())
                .state(stage.getState())
                .position(stage.getPosition())
                .taskTotal(taskTotal)
                .taskDone(taskDone)
                .build();
    }
}