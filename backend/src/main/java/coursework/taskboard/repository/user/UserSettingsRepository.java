package coursework.taskboard.repository.user;

import coursework.taskboard.model.user.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSettingsRepository extends JpaRepository<UserSettings, Long> {
}