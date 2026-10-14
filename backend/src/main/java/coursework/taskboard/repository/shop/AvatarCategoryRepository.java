package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.AvatarCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AvatarCategoryRepository extends JpaRepository<AvatarCategory, Long> {

    List<AvatarCategory> findAllByOrderBySortOrderAsc();

    Optional<AvatarCategory> findByCode(String code);

    boolean existsByCode(String code);
}