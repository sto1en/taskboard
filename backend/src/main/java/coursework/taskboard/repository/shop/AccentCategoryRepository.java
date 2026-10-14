package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.AccentCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccentCategoryRepository extends JpaRepository<AccentCategory, Long> {

    List<AccentCategory> findAllByOrderBySortOrderAsc();

    Optional<AccentCategory> findByCode(String code);

    boolean existsByCode(String code);
}