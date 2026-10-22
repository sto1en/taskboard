package coursework.taskboard.repository.template;

import coursework.taskboard.model.template.GuideShowcaseEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GuideShowcaseRepository extends JpaRepository<GuideShowcaseEntry, Long> {

    List<GuideShowcaseEntry> findByUserIdOrderByPositionAsc(Long userId);

    Optional<GuideShowcaseEntry> findByUserIdAndGuideId(Long userId, Long guideId);

    void deleteByUserId(Long userId);

    void deleteByGuideId(Long guideId);

    long countByUserId(Long userId);
}
