package coursework.taskboard.repository.task;

import coursework.taskboard.model.task.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    Page<Task> findByProjectIdAndParentIsNull(Long projectId, Pageable pageable);

    List<Task> findByProjectIdAndParentIsNullOrderByPositionAsc(Long projectId);

    Page<Task> findByStageIdAndParentIsNull(Long stageId, Pageable pageable);

    List<Task> findByStageIdAndParentIsNullOrderByPositionAsc(Long stageId);

    List<Task> findByParentIdOrderByPositionAsc(Long parentId);

    long countByParentId(Long parentId);

    @Query("""
        SELECT t FROM Task t
        JOIN t.project p
        JOIN p.board b
        WHERE b.owner.id = :userId
    """)
    List<Task> findAllByOwnerId(@Param("userId") Long userId);

    @Query("""
        SELECT t FROM Task t
        WHERE t.project.id = :projectId
          AND t.parent IS NULL
          AND (LOWER(t.title) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(t.description) LIKE LOWER(CONCAT('%', :q, '%')))
        ORDER BY t.position
    """)
    List<Task> searchInProject(@Param("projectId") Long projectId, @Param("q") String q);
}