package coursework.taskboard.repository.template;

import coursework.taskboard.model.template.TaskTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TaskTemplateRepository extends JpaRepository<TaskTemplate, Long> {

    List<TaskTemplate> findByOwnerIdOrderByUpdatedAtDesc(Long ownerId);

    Optional<TaskTemplate> findByIdAndOwnerId(Long id, Long ownerId);

    // ============================================================
    // Публичный каталог
    // ============================================================

    /**
     * Каталог публичных шаблонов с поиском по названию, описанию и задачам.
     * Если {@code mineOnly} — только шаблоны текущего пользователя.
     * Сортировку и пагинацию задаёт {@link Pageable}.
     */
    @Query("""
            select distinct t from TaskTemplate t
            left join t.items i
            where t.isPublic = true
              and (:mineOnly = false or t.owner.id = :userId)
              and (:q = '' or :q is null
                   or lower(t.title) like lower(concat('%', :q, '%'))
                   or lower(t.description) like lower(concat('%', :q, '%'))
                   or lower(i.title) like lower(concat('%', :q, '%')))
            """)
    Page<TaskTemplate> searchPublic(
            @Param("userId") Long userId,
            @Param("mineOnly") boolean mineOnly,
            @Param("q") String q,
            Pageable pageable);

    @Query("""
            select distinct t from TaskTemplate t
            left join t.items i
            where t.isPublic = true
              and (:q = '' or :q is null
                   or lower(t.title) like lower(concat('%', :q, '%'))
                   or lower(t.description) like lower(concat('%', :q, '%'))
                   or lower(i.title) like lower(concat('%', :q, '%')))
            """)
    Page<TaskTemplate> searchPublicAll(
            @Param("q") String q,
            Pageable pageable);
}
