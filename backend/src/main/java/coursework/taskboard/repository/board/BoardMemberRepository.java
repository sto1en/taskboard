package coursework.taskboard.repository.board;

import coursework.taskboard.model.board.BoardMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface BoardMemberRepository
        extends JpaRepository<BoardMember, BoardMember.BoardMemberId> {

    List<BoardMember> findByBoardId(Long boardId);

    List<BoardMember> findByUserId(Long userId);

    Optional<BoardMember> findByBoardIdAndUserId(Long boardId, Long userId);

    @Query("SELECT bm.role FROM BoardMember bm " +
            "WHERE bm.board.id = :boardId AND bm.user.id = :userId")
    Optional<String> findRoleByBoardIdAndUserId(@Param("boardId") Long boardId,
                                                @Param("userId") Long userId);

    boolean existsByBoardIdAndUserId(Long boardId, Long userId);

    long countByBoardId(Long boardId);
}