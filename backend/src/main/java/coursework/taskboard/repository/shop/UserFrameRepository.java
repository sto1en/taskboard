package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.UserFrame;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface UserFrameRepository extends JpaRepository<UserFrame, Long> {

    List<UserFrame> findByUserId(Long userId);

    boolean existsByUserIdAndFrameId(Long userId, Long frameId);

    /** Число покупок по каждой рамке: itemId → count. */
    @Query("SELECT uf.frame.id, COUNT(uf) FROM UserFrame uf GROUP BY uf.frame.id")
    List<Object[]> countPurchasesByFrame();
}
