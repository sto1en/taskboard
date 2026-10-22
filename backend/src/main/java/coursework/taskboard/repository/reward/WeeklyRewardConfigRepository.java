package coursework.taskboard.repository.reward;

import coursework.taskboard.model.reward.WeeklyRewardConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WeeklyRewardConfigRepository extends JpaRepository<WeeklyRewardConfig, Long> {

    Optional<WeeklyRewardConfig> findByWeekStart(LocalDate weekStart);

    List<WeeklyRewardConfig> findAllByOrderByWeekStartAsc();

    boolean existsByItemTypeAndItemCode(String itemType, String itemCode);
}
