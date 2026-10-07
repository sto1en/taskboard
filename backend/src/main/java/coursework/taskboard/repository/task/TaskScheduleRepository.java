package coursework.taskboard.repository.task;

import coursework.taskboard.model.task.TaskSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TaskScheduleRepository extends JpaRepository<TaskSchedule, Long> {

    // ============================================================
    // Cron просрочки
    // ============================================================
    @Query("""
        SELECT ts FROM TaskSchedule ts
        JOIN ts.task t
        JOIN t.settings s
        JOIN s.status st
        WHERE ts.deadline < :threshold
          AND ts.completedAt IS NULL
          AND ts.expiredAt IS NULL
          AND st.categoryCode = 'ACTIVE'
    """)
    List<TaskSchedule> findOverdue(@Param("threshold") LocalDateTime threshold);

    // ============================================================
    // Календарь — диапазон дат
    // ============================================================
    @Query("""
        SELECT ts FROM TaskSchedule ts
        JOIN ts.task t
        WHERE ts.deadline BETWEEN :from AND :to
          AND t.project.id IN :projectIds
    """)
    List<TaskSchedule> findInPeriod(@Param("from") LocalDateTime from,
                                    @Param("to") LocalDateTime to,
                                    @Param("projectIds") List<Long> projectIds);

    // ============================================================
    // Статистика
    // ============================================================
    @Query("""
        SELECT ts FROM TaskSchedule ts
        JOIN ts.task t
        JOIN t.project p
        JOIN p.board b
        WHERE b.owner.id = :userId
          AND ts.completedAt BETWEEN :from AND :to
    """)
    List<TaskSchedule> findCompletedInPeriod(@Param("userId") Long userId,
                                             @Param("from") LocalDateTime from,
                                             @Param("to") LocalDateTime to);

    // ============================================================
    // Reschedule
    // ============================================================
    @Query("""
        SELECT ts FROM TaskSchedule ts
        JOIN ts.task t
        JOIN t.settings s
        JOIN s.status st
        WHERE t.project.id IN :projectIds
          AND ts.deadline IS NOT NULL
          AND ts.completedAt IS NULL
          AND ts.deadline < :threshold
          AND st.categoryCode NOT IN ('DONE', 'CANCELLED', 'ARCHIVED')
          AND (ts.rescheduleSnoozedUntil IS NULL OR ts.rescheduleSnoozedUntil < :now)
        ORDER BY ts.deadline ASC
    """)
    List<TaskSchedule> findPendingReschedule(@Param("now") LocalDateTime now,
                                             @Param("threshold") LocalDateTime threshold,
                                             @Param("projectIds") List<Long> projectIds);

    // ============================================================
    // Нагрузка по дням: сколько задач с дедлайном в каждый день
    // ============================================================
    @Query(value = """
        SELECT to_char(ts.deadline, 'YYYY-MM-DD') AS d,
               count(*) FILTER (WHERE sch.status_category = 'ACTIVE')  AS open_count,
               count(*) FILTER (WHERE sch.status_category = 'DONE')    AS done_count,
               count(*) FILTER (WHERE sch.status_category = 'EXPIRED') AS overdue_count
        FROM task_schedule ts
        JOIN (
            SELECT s.task_id, st.category_code AS status_category
            FROM task_settings s
            JOIN board_statuses st ON st.id = s.status_id
        ) sch ON sch.task_id = ts.task_id
        JOIN tasks t ON t.id = ts.task_id
        JOIN projects p ON p.id = t.project_id
        JOIN boards b ON b.id = p.board_id
        WHERE b.owner_id = :userId
          AND ts.deadline >= :from
          AND ts.deadline < :to
        GROUP BY d
        ORDER BY d
    """, nativeQuery = true)
    List<Object[]> loadByDay(@Param("userId") Long userId,
                             @Param("from") LocalDateTime from,
                             @Param("to") LocalDateTime to);
}