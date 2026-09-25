package coursework.taskboard.repository.tag;

import coursework.taskboard.model.tag.TagAppearance;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TagAppearanceRepository extends JpaRepository<TagAppearance, Long> {
}