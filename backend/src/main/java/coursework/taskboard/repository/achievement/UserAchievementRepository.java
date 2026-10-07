package coursework.taskboard.repository.achievement;

import coursework.taskboard.model.achievement.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAchievementRepository extends JpaRepository<UserAchievement, Long> {

    List<UserAchievement> findByUserId(Long userId);

    Optional<UserAchievement> findByUserIdAndAchievementId(Long userId, Long achievementId);

    boolean existsByUserIdAndAchievementId(Long userId, Long achievementId);

    long countByUserId(Long userId);
}