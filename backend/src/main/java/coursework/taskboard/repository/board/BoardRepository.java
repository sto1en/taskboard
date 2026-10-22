package coursework.taskboard.repository.board;

import coursework.taskboard.model.board.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BoardRepository extends JpaRepository<Board, Long> {

    List<Board> findByOwnerIdOrderByPositionAsc(Long ownerId);

    java.util.Optional<Board> findFirstByOwnerIdAndIsGroupTrue(Long ownerId);

    long countByOwnerId(Long ownerId);
}