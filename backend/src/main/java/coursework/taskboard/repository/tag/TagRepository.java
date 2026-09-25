package coursework.taskboard.repository.tag;

import coursework.taskboard.model.tag.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {

    List<Tag> findByBoardIdOrderByPositionAsc(Long boardId);

    Optional<Tag> findByBoardIdAndCode(Long boardId, String code);

    boolean existsByBoardIdAndCode(Long boardId, String code);

    @Query("SELECT t FROM Tag t " +
            "WHERE t.board.id = :boardId " +
            "AND LOWER(t.title) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Tag> searchByTitle(@Param("boardId") Long boardId, @Param("q") String q);
}