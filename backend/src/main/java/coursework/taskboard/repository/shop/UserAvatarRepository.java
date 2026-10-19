package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.UserAvatar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface UserAvatarRepository extends JpaRepository<UserAvatar, Long> {

    List<UserAvatar> findByUserId(Long userId);

    boolean existsByUserIdAndAvatarId(Long userId, Long avatarId);

    /** Число покупок по каждой аватарке: itemId → count. */
    @Query("SELECT ua.avatar.id, COUNT(ua) FROM UserAvatar ua GROUP BY ua.avatar.id")
    List<Object[]> countPurchasesByAvatar();
}
