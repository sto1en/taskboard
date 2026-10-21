package coursework.taskboard.repository.inventory;

import coursework.taskboard.model.inventory.UserKeyGrant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface UserKeyGrantRepository extends JpaRepository<UserKeyGrant, Long> {

    List<UserKeyGrant> findByUserIdAndGrantDate(Long userId, LocalDate grantDate);

    boolean existsByUserIdAndGrantDateAndMilestone(Long userId, LocalDate grantDate, Integer milestone);
}
