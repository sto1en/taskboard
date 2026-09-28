package coursework.taskboard.repository.board;

import coursework.taskboard.model.board.BoardMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BoardMemberRepository
        extends JpaRepository<BoardMember, BoardMember.BoardMemberId> {

    @Query("SELECT bm FROM BoardMember bm WHERE bm.board.id = :boardId")
    List<BoardMember> findByBoardId(@Param("boardId") Long boardId);

    @Query("SELECT bm FROM BoardMember bm WHERE bm.user.id = :userId")
    List<BoardMember> findByUserId(@Param("userId") Long userId);

    @Query("SELECT bm FROM BoardMember bm " +
            "WHERE bm.board.id = :boardId AND bm.user.id = :userId")
    Optional<BoardMember> findByBoardIdAndUserId(@Param("boardId") Long boardId,
                                                 @Param("userId") Long userId);

    @Query("SELECT bm.role FROM BoardMember bm " +
            "WHERE bm.board.id = :boardId AND bm.user.id = :userId")
    Optional<String> findRoleByBoardIdAndUserId(@Param("boardId") Long boardId,
                                                @Param("userId") Long userId);

    @Query("SELECT COUNT(bm) > 0 FROM BoardMember bm " +
            "WHERE bm.board.id = :boardId AND bm.user.id = :userId")
    boolean existsByBoardIdAndUserId(@Param("boardId") Long boardId,
                                     @Param("userId") Long userId);

    @Query("SELECT COUNT(bm) FROM BoardMember bm WHERE bm.board.id = :boardId")
    long countByBoardId(@Param("boardId") Long boardId);
}