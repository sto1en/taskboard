package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.TreeSkin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TreeSkinRepository extends JpaRepository<TreeSkin, Long> {

    List<TreeSkin> findAllByOrderBySortOrderAsc();

    Optional<TreeSkin> findByCode(String code);

    boolean existsByCode(String code);
}