package coursework.taskboard.repository.template;

import coursework.taskboard.model.template.TaskTemplateItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskTemplateItemRepository extends JpaRepository<TaskTemplateItem, Long> {

    List<TaskTemplateItem> findByTemplateIdOrderByPositionAsc(Long templateId);
}
