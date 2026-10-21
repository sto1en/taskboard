package coursework.taskboard.repository.reward;

import coursework.taskboard.model.reward.UserWeeklyReward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface UserWeeklyRewardRepository extends JpaRepository<UserWeeklyReward, Long> {

    Optional<UserWeeklyReward> findByUserIdAndWeekStart(Long userId, LocalDate weekStart);

    boolean existsByUserIdAndWeekStart(Long userId, LocalDate weekStart);
}
