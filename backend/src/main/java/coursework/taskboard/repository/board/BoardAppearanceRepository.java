package coursework.taskboard.repository.board;

import coursework.taskboard.model.board.BoardAppearance;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardAppearanceRepository extends JpaRepository<BoardAppearance, Long> {
}