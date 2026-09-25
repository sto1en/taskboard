package coursework.taskboard.repository.user;

import coursework.taskboard.model.user.UserWorkspace;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserWorkspaceRepository extends JpaRepository<UserWorkspace, Long> {
}