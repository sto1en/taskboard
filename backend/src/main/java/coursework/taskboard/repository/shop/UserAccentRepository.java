package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.UserAccent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface UserAccentRepository extends JpaRepository<UserAccent, Long> {

    List<UserAccent> findByUserId(Long userId);

    boolean existsByUserIdAndAccentSkinId(Long userId, Long accentSkinId);

    /** Число покупок по каждому акценту: itemId → count. */
    @Query("SELECT ua.accentSkin.id, COUNT(ua) FROM UserAccent ua GROUP BY ua.accentSkin.id")
    List<Object[]> countPurchasesByAccent();
}
