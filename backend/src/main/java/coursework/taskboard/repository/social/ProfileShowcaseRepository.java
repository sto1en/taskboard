package coursework.taskboard.repository.social;

import coursework.taskboard.model.social.ProfileShowcase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProfileShowcaseRepository extends JpaRepository<ProfileShowcase, Long> {

    List<ProfileShowcase> findByUserIdOrderByPositionAsc(Long userId);

    void deleteByUserId(Long userId);
}
