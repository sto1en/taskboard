package coursework.taskboard.repository.achievement;

import coursework.taskboard.model.achievement.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AchievementRepository extends JpaRepository<Achievement, Long> {

    List<Achievement> findAllByOrderBySortOrderAsc();

    Optional<Achievement> findByCode(String code);

    boolean existsByCode(String code);
}