package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.AccentSkin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccentSkinRepository extends JpaRepository<AccentSkin, Long> {

    List<AccentSkin> findAllByOrderBySortOrderAsc();

    Optional<AccentSkin> findByCode(String code);

    boolean existsByCode(String code);
}