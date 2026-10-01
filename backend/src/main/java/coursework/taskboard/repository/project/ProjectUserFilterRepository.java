package coursework.taskboard.repository.project;

import coursework.taskboard.model.project.ProjectUserFilter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProjectUserFilterRepository
        extends JpaRepository<ProjectUserFilter, ProjectUserFilter.ProjectUserFilterId> {

    Optional<ProjectUserFilter> findByUserIdAndProjectId(Long userId, Long projectId);

    @Modifying
    @Query("DELETE FROM ProjectUserFilter f WHERE f.userId = :userId AND f.projectId = :projectId")
    void deleteByUserIdAndProjectId(@Param("userId") Long userId,
                                    @Param("projectId") Long projectId);

    /**
     * Убрать удалённый статус из всех закреплённых фильтров.
     * Postgres: array_remove.
     */
    @Modifying
    @Query(value = """
            UPDATE project_user_filters
            SET status_ids = array_remove(status_ids, :statusId),
                updated_at = NOW()
            WHERE :statusId = ANY(status_ids)
            """, nativeQuery = true)
    void removeStatusFromAll(@Param("statusId") Long statusId);
}