package coursework.taskboard.repository.user;

import coursework.taskboard.model.user.UserDisplay;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserDisplayRepository extends JpaRepository<UserDisplay, Long> {
}