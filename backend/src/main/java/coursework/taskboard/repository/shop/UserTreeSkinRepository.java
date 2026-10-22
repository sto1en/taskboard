package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.UserTreeSkin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface UserTreeSkinRepository extends JpaRepository<UserTreeSkin, Long> {

    List<UserTreeSkin> findByUserId(Long userId);

    boolean existsByUserIdAndTreeSkinId(Long userId, Long treeSkinId);

    boolean existsByTreeSkinId(Long treeSkinId);

    /** Число покупок по каждому скину дерева: itemId → count. */
    @Query("SELECT ut.treeSkin.id, COUNT(ut) FROM UserTreeSkin ut GROUP BY ut.treeSkin.id")
    List<Object[]> countPurchasesByTreeSkin();
}
