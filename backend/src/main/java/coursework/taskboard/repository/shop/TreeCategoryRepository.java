package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.TreeCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TreeCategoryRepository extends JpaRepository<TreeCategory, Long> {

    List<TreeCategory> findAllByOrderBySortOrderAsc();

    boolean existsByCode(String code);
}
