package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.Avatar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AvatarRepository extends JpaRepository<Avatar, Long> {

    List<Avatar> findAllByOrderBySortOrderAsc();

    Optional<Avatar> findByCode(String code);

    boolean existsByCode(String code);

    @Query("""
        SELECT DISTINCT a FROM Avatar a
        LEFT JOIN FETCH a.categories
        LEFT JOIN a.categories c
        WHERE (:categoryIds IS NULL OR c.id IN :categoryIds)
        ORDER BY a.sortOrder ASC
    """)
    List<Avatar> findWithCategoriesFiltered(@Param("categoryIds") List<Long> categoryIds);
}