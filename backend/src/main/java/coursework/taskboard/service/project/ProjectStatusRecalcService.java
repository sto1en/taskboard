package coursework.taskboard.service.project;

import coursework.taskboard.model.board.BoardStatus;
import coursework.taskboard.model.project.Project;
import coursework.taskboard.model.project.ProjectSettings;
import coursework.taskboard.repository.board.BoardStatusRepository;
import coursework.taskboard.repository.project.ProjectRepository;
import coursework.taskboard.repository.project.ProjectSettingsRepository;
import coursework.taskboard.repository.task.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Пересчитывает статус проекта в зависимости от статусов его задач.
 * Если все задачи — в финальных категориях (DONE / EXPIRED / CANCELLED / ARCHIVED),
 * проект переводится в статус "DONE" (scope=project).
 * Иначе — в дефолтный активный статус проекта.
 */
@Service
@RequiredArgsConstructor
public class ProjectStatusRecalcService {

    private final ProjectRepository projectRepository;
    private final ProjectSettingsRepository projectSettingsRepository;
    private final BoardStatusRepository boardStatusRepository;
    private final TaskRepository taskRepository;

    @Transactional
    public void recalc(Long projectId) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) return;

        ProjectSettings settings = projectSettingsRepository.findById(projectId).orElse(null);
        if (settings == null) return;

        long total = taskRepository.countByProjectId(projectId);
        if (total == 0) return;

        long done = taskRepository.countDoneByProjectId(projectId);

        BoardStatus targetStatus;
        if (done == total) {
            targetStatus = boardStatusRepository
                    .findByBoardIdAndScopeAndCode(project.getBoard().getId(), "project", "DONE")
                    .orElse(null);
        } else {
            targetStatus = boardStatusRepository
                    .findByBoardIdAndScopeAndIsDefaultTrue(project.getBoard().getId(), "project")
                    .orElse(null);
        }

        if (targetStatus == null) return;
        if (settings.getStatus() != null
                && settings.getStatus().getId().equals(targetStatus.getId())) {
            return;
        }

        settings.setStatus(targetStatus);

        // Когда проект завершился — сбрасываем ручную позицию,
        // чтобы он уехал в конец списка.
        if ("DONE".equals(targetStatus.getCode())) {
            settings.setIsManualPosition(false);
        }

        projectSettingsRepository.save(settings);
    }
}