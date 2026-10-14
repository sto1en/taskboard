package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.Frame;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FrameRepository extends JpaRepository<Frame, Long> {

    List<Frame> findAllByOrderBySortOrderAsc();

    Optional<Frame> findByCode(String code);

    boolean existsByCode(String code);

    @Query("""
        SELECT DISTINCT f FROM Frame f
        LEFT JOIN FETCH f.categories
        LEFT JOIN f.categories c
        WHERE (:categoryIds IS NULL OR c.id IN :categoryIds)
        ORDER BY f.sortOrder ASC
    """)
    List<Frame> findWithCategoriesFiltered(@Param("categoryIds") List<Long> categoryIds);
}