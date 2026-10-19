package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.TreeSkin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TreeSkinRepository extends JpaRepository<TreeSkin, Long> {

    List<TreeSkin> findAllByOrderBySortOrderAsc();

    Optional<TreeSkin> findByCode(String code);

    boolean existsByCode(String code);

    @Query("""
        SELECT DISTINCT t FROM TreeSkin t
        LEFT JOIN FETCH t.categories
        LEFT JOIN t.categories c
        WHERE (:categoryIds IS NULL OR c.id IN :categoryIds)
        ORDER BY t.sortOrder ASC
    """)
    List<TreeSkin> findWithCategoriesFiltered(@Param("categoryIds") List<Long> categoryIds);
}
