package coursework.taskboard.repository.task;

import coursework.taskboard.model.task.TaskSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface TaskScheduleRepository extends JpaRepository<TaskSchedule, Long> {

    @Query("""
        SELECT ts FROM TaskSchedule ts
        JOIN ts.task t
        JOIN t.settings s
        JOIN s.status st
        WHERE ts.deadline < :today
          AND ts.completedAt IS NULL
          AND ts.expiredAt IS NULL
          AND st.categoryCode = 'ACTIVE'
    """)
    List<TaskSchedule> findOverdue(@Param("today") LocalDate today);

    @Query("""
        SELECT ts FROM TaskSchedule ts
        JOIN ts.task t
        WHERE ts.deadline BETWEEN :from AND :to
          AND t.project.id IN :projectIds
    """)
    List<TaskSchedule> findInPeriod(@Param("from") LocalDate from,
                                    @Param("to") LocalDate to,
                                    @Param("projectIds") List<Long> projectIds);

    List<TaskSchedule> findByDeadline(LocalDate deadline);

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
}