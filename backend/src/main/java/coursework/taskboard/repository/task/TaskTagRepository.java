package coursework.taskboard.repository.task;

import coursework.taskboard.model.task.TaskTag;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskTagRepository extends JpaRepository<TaskTag, TaskTag.TaskTagId> {

    List<TaskTag> findByTaskId(Long taskId);

    List<TaskTag> findByTagId(Long tagId);

    long countByTagId(Long tagId);
}