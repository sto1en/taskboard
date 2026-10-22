package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.ProfileBackground;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProfileBackgroundRepository extends JpaRepository<ProfileBackground, Long> {

    List<ProfileBackground> findAllByOrderBySortOrderAsc();

    Optional<ProfileBackground> findByCode(String code);

    boolean existsByCode(String code);

    /** Число покупок по каждому фону: itemId → count. */
    @Query("SELECT ub.background.id, COUNT(ub) FROM UserBackground ub GROUP BY ub.background.id")
    List<Object[]> countPurchasesByBackground();
}
