package coursework.taskboard.repository.project;

import coursework.taskboard.model.project.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectMemberRepository
        extends JpaRepository<ProjectMember, ProjectMember.ProjectMemberId> {

    @Query("SELECT pm FROM ProjectMember pm WHERE pm.project.id = :projectId ORDER BY pm.addedAt")
    List<ProjectMember> findByProjectId(@Param("projectId") Long projectId);

    @Query("SELECT pm FROM ProjectMember pm WHERE pm.project.id = :projectId AND pm.user.id = :userId")
    Optional<ProjectMember> findByProjectIdAndUserId(@Param("projectId") Long projectId,
                                                     @Param("userId") Long userId);

    @Query("SELECT COUNT(pm) > 0 FROM ProjectMember pm " +
            "WHERE pm.project.id = :projectId AND pm.user.id = :userId")
    boolean existsByProjectIdAndUserId(@Param("projectId") Long projectId,
                                       @Param("userId") Long userId);

    @Query("SELECT pm.role FROM ProjectMember pm " +
            "WHERE pm.project.id = :projectId AND pm.user.id = :userId")
    Optional<String> findRoleByProjectIdAndUserId(@Param("projectId") Long projectId,
                                                  @Param("userId") Long userId);

    /** Все проекты, где пользователь участник (включая собственные). */
    @Query("SELECT pm.project FROM ProjectMember pm WHERE pm.user.id = :userId")
    List<coursework.taskboard.model.project.Project> findProjectsByUserId(@Param("userId") Long userId);

    @Query("SELECT pm.project.id FROM ProjectMember pm WHERE pm.user.id = :userId")
    List<Long> findProjectIdsByUserId(@Param("userId") Long userId);

    /**
     * Есть ли у пользователя доступ к доске через групповой проект.
     * Нужно для read-only справочников (статусы, теги), без которых
     * не отрисовать канбан группового проекта.
     */
    @Query("SELECT COUNT(pm) > 0 FROM ProjectMember pm " +
            "WHERE pm.project.board.id = :boardId AND pm.user.id = :userId")
    boolean existsByBoardIdAndUserId(@Param("boardId") Long boardId,
                                     @Param("userId") Long userId);

    @Query("SELECT COUNT(pm) FROM ProjectMember pm WHERE pm.project.id = :projectId")
    long countByProjectId(@Param("projectId") Long projectId);
}
