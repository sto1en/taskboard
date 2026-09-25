/**
*
*/
package coursework.taskboard.repository.board;

import coursework.taskboard.model.board.BoardStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BoardStatusRepository extends JpaRepository<BoardStatus, Long> {

    List<BoardStatus> findByBoardIdOrderByPositionAsc(Long boardId);

    List<BoardStatus> findByBoardIdAndScopeOrderByPositionAsc(Long boardId, String scope);

    Optional<BoardStatus> findByBoardIdAndScopeAndCode(Long boardId, String scope, String code);

    List<BoardStatus> findByBoardIdAndScopeAndCategoryCode(Long boardId, String scope, String categoryCode);

    boolean existsByBoardIdAndScopeAndCode(Long boardId, String scope, String code);

    long countByBoardIdAndScopeAndCategoryCode(Long boardId, String scope, String categoryCode);

    Optional<BoardStatus> findByBoardIdAndScopeAndIsDefaultTrue(Long boardId, String scope);
}