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

    // ============================================================
    // Агрегаты для диаграмм
    // ============================================================

    /** Количество задач, созданных по дням за период. */
    @Query(value = """
        SELECT to_char(t.created_at, 'YYYY-MM-DD') AS d, count(*)
        FROM tasks t
        JOIN projects p ON p.id = t.project_id
        JOIN boards b ON b.id = p.board_id
        WHERE b.owner_id = :userId
          AND t.created_at >= :from
          AND t.created_at < :to
        GROUP BY d
        ORDER BY d
    """, nativeQuery = true)
    List<Object[]> countCreatedByDay(@Param("userId") Long userId,
                                     @Param("from") LocalDateTime from,
                                     @Param("to") LocalDateTime to);

    /** Количество закрытых задач по дням за период. */
    @Query(value = """
        SELECT to_char(sch.completed_at, 'YYYY-MM-DD') AS d, count(*)
        FROM task_schedule sch
        JOIN tasks t ON t.id = sch.task_id
        JOIN projects p ON p.id = t.project_id
        JOIN boards b ON b.id = p.board_id
        WHERE b.owner_id = :userId
          AND sch.completed_at >= :from
          AND sch.completed_at < :to
        GROUP BY d
        ORDER BY d
    """, nativeQuery = true)
    List<Object[]> countDoneByDay(@Param("userId") Long userId,
                                  @Param("from") LocalDateTime from,
                                  @Param("to") LocalDateTime to);

    /** Распределение по статусам (задачи пользователя). */
    @Query("""
        SELECT s.status.id, s.status.code, s.status.title, s.status.categoryCode, count(t)
        FROM Task t
        JOIN t.settings s
        JOIN t.project p
        JOIN p.board b
        WHERE b.owner.id = :userId
        GROUP BY s.status.id, s.status.code, s.status.title, s.status.categoryCode
        ORDER BY count(t) DESC
    """)
    List<Object[]> countByStatus(@Param("userId") Long userId);

    /** Топ тегов по количеству задач. */
    @Query("""
        SELECT tg.id, tg.title, count(tt)
        FROM TaskTag tt
        JOIN tt.tag tg
        JOIN tt.task t
        JOIN t.project p
        JOIN p.board b
        WHERE b.owner.id = :userId
        GROUP BY tg.id, tg.title
        ORDER BY count(tt) DESC
    """)
    List<Object[]> topTags(@Param("userId") Long userId, Pageable pageable);
}