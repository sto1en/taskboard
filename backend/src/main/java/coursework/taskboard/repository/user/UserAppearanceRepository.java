package coursework.taskboard.repository.user;

import coursework.taskboard.model.user.UserAppearance;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAppearanceRepository extends JpaRepository<UserAppearance, Long> {
}