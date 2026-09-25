package coursework.taskboard.repository.board;

import coursework.taskboard.model.board.BoardStatusSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardStatusSettingsRepository
        extends JpaRepository<BoardStatusSettings, Long> {
}