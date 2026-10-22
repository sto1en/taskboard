package coursework.taskboard.repository.social;

import coursework.taskboard.model.social.ProfileWallPost;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProfileWallPostRepository extends JpaRepository<ProfileWallPost, Long> {

    List<ProfileWallPost> findByProfileUserIdOrderByCreatedAtDesc(Long profileUserId);

    List<ProfileWallPost> findByProfileUserIdOrderByCreatedAtDesc(Long profileUserId, Pageable pageable);

    long countByProfileUserId(Long profileUserId);
}
