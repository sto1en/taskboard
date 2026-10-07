package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.UserTreeSkin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserTreeSkinRepository extends JpaRepository<UserTreeSkin, Long> {

    List<UserTreeSkin> findByUserId(Long userId);

    boolean existsByUserIdAndTreeSkinId(Long userId, Long treeSkinId);
}