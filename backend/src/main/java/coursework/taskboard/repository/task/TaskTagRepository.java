package coursework.taskboard.repository.task;

import coursework.taskboard.model.task.TaskTag;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;

public interface TaskTagRepository extends JpaRepository<TaskTag, TaskTag.TaskTagId> {

    List<TaskTag> findByTaskId(Long taskId);

    /** Теги разом по списку задач; тег и его оформление — одним графом. */
    @EntityGraph(attributePaths = {"tag", "tag.appearance"})
    List<TaskTag> findByTaskIdIn(Collection<Long> taskIds);

    List<TaskTag> findByTagId(Long tagId);

    long countByTagId(Long tagId);
}