package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.AccentSkin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AccentSkinRepository extends JpaRepository<AccentSkin, Long> {

    List<AccentSkin> findAllByOrderBySortOrderAsc();

    Optional<AccentSkin> findByCode(String code);

    boolean existsByCode(String code);

    @Query("""
        SELECT DISTINCT a FROM AccentSkin a
        LEFT JOIN FETCH a.categories
        LEFT JOIN a.categories c
        WHERE (:categoryIds IS NULL OR c.id IN :categoryIds)
        ORDER BY a.sortOrder ASC
    """)
    List<AccentSkin> findWithCategoriesFiltered(@Param("categoryIds") List<Long> categoryIds);
}