package coursework.taskboard.repository.project;

import coursework.taskboard.model.project.ProjectSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectSettingsRepository extends JpaRepository<ProjectSettings, Long> {
}