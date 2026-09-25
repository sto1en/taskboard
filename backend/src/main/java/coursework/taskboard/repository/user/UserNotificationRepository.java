package coursework.taskboard.repository.user;

import coursework.taskboard.model.user.UserNotification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {
}