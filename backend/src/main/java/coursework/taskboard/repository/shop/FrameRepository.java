package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.Frame;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FrameRepository extends JpaRepository<Frame, Long> {

    List<Frame> findAllByOrderBySortOrderAsc();

    Optional<Frame> findByCode(String code);

    boolean existsByCode(String code);
}