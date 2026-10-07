package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.Avatar;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AvatarRepository extends JpaRepository<Avatar, Long> {

    List<Avatar> findAllByOrderBySortOrderAsc();

    Optional<Avatar> findByCode(String code);

    boolean existsByCode(String code);
}