package coursework.taskboard.repository.task;

import coursework.taskboard.model.task.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    // ============================================================
    // Списки задач
    // ============================================================
    Page<Task> findByProjectIdAndParentIsNull(Long projectId, Pageable pageable);

    List<Task> findByProjectIdAndParentIsNullOrderByPositionAsc(Long projectId);

    Page<Task> findByStageIdAndParentIsNull(Long stageId, Pageable pageable);

    List<Task> findByStageIdAndParentIsNullOrderByPositionAsc(Long stageId);

    List<Task> findByParentIdOrderByPositionAsc(Long parentId);

    long countByParentId(Long parentId);

    long countByProjectIdAndParentIsNull(Long projectId);

    // ============================================================
    // Подсчёты
    // ============================================================
    long countByProjectId(Long projectId);

    long countByStageId(Long stageId);

    @Query("""
        SELECT count(t) FROM Task t
        JOIN t.settings s
        WHERE t.project.id = :projectId
          AND s.status.categoryCode IN ('DONE', 'EXPIRED', 'CANCELLED', 'ARCHIVED')
    """)
    long countDoneByProjectId(@Param("projectId") Long projectId);

    @Query("""
        SELECT count(t) FROM Task t
        JOIN t.settings s
        WHERE t.project.id = :projectId
          AND s.status.categoryCode = 'ACTIVE'
    """)
    long countActiveByProjectId(@Param("projectId") Long projectId);

    @Query("""
        SELECT count(t) FROM Task t
        JOIN t.settings s
        WHERE t.stage.id = :stageId
          AND s.status.categoryCode IN ('DONE', 'EXPIRED', 'CANCELLED', 'ARCHIVED')
    """)
    long countDoneByStageId(@Param("stageId") Long stageId);

    @Query("""
        SELECT count(t) FROM Task t
        JOIN t.project p
        WHERE p.board.id = :boardId
    """)
    long countByBoardId(@Param("boardId") Long boardId);

    // ============================================================
    // Kanban / поиск / статистика
    // ============================================================
    @Query("""
        SELECT t FROM Task t
        JOIN t.settings s
        WHERE s.status.id = :statusId
        ORDER BY t.position
    """)
    List<Task> findByStatusId(@Param("statusId") Long statusId);

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

    @Query("""
        SELECT count(t) FROM Task t
        JOIN t.project p
        JOIN p.board b
        WHERE b.owner.id = :userId
          AND t.createdAt >= :from
    """)

    long countTotalByOwner(@Param("userId") Long userId, @Param("from") LocalDateTime from);
    @Query("""
    SELECT count(t) FROM Task t
    JOIN t.settings s
    JOIN s.status st
    JOIN t.schedule sch
    JOIN t.project p
    JOIN p.board b
    WHERE b.owner.id = :userId
      AND sch.completedAt >= :from
      AND st.categoryCode = :categoryCode
""")
    long countByCategoryByOwner(@Param("userId") Long userId,
                                @Param("from") LocalDateTime from,
                                @Param("categoryCode") String categoryCode);
}