package coursework.taskboard.repository.board;

import coursework.taskboard.model.board.BoardSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardSettingsRepository extends JpaRepository<BoardSettings, Long> {
}