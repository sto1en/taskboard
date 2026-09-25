package coursework.taskboard.repository.board;

import coursework.taskboard.model.board.BoardStatusAppearance;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardStatusAppearanceRepository
        extends JpaRepository<BoardStatusAppearance, Long> {
}