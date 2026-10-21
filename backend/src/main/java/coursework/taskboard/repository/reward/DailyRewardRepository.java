package coursework.taskboard.repository.reward;

import coursework.taskboard.model.reward.DailyReward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface DailyRewardRepository extends JpaRepository<DailyReward, Long> {

    Optional<DailyReward> findByUserIdAndRewardDate(Long userId, LocalDate rewardDate);
}
