package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.UserBackground;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface UserBackgroundRepository extends JpaRepository<UserBackground, Long> {

    List<UserBackground> findByUserId(Long userId);

    boolean existsByUserIdAndBackgroundId(Long userId, Long backgroundId);

    @Query("SELECT ub.background.id, COUNT(ub) FROM UserBackground ub GROUP BY ub.background.id")
    List<Object[]> countPurchasesByBackground();
}
