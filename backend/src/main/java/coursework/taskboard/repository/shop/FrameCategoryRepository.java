package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.FrameCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FrameCategoryRepository extends JpaRepository<FrameCategory, Long> {

    List<FrameCategory> findAllByOrderBySortOrderAsc();

    Optional<FrameCategory> findByCode(String code);

    boolean existsByCode(String code);
}