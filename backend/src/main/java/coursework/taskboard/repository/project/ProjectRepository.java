package coursework.taskboard.repository.project;

import coursework.taskboard.model.project.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByBoardIdOrderByPositionAsc(Long boardId);

    Optional<Project> findByBoardIdAndIsMainTrue(Long boardId);

    long countByBoardId(Long boardId);

    boolean existsByBoardIdAndTitle(Long boardId, String title);
}