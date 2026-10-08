package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.UserAccent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserAccentRepository extends JpaRepository<UserAccent, Long> {

    List<UserAccent> findByUserId(Long userId);

    boolean existsByUserIdAndAccentSkinId(Long userId, Long accentSkinId);
}