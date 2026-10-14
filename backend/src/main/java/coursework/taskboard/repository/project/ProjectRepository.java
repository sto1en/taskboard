package coursework.taskboard.repository.project;

import coursework.taskboard.model.project.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByBoardIdOrderByPositionAsc(Long boardId);

    Optional<Project> findByBoardIdAndIsMainTrue(Long boardId);

    long countByBoardId(Long boardId);

    boolean existsByBoardIdAndTitle(Long boardId, String title);

    /**
     * Считает общее количество проектов во всех досках пользователя.
     * Используется для проверки достижения PROJECTS_CREATED.
     */
    @Query("""
        SELECT count(p) FROM Project p
        JOIN p.board b
        WHERE b.owner.id = :userId
    """)
    long countByBoardOwnerId(@Param("userId") Long userId);
}