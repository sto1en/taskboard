package coursework.taskboard.repository.user;

import coursework.taskboard.model.user.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    @Query("""
        SELECT p FROM UserProfile p
        WHERE LOWER(p.displayName) LIKE LOWER(CONCAT('%', :q, '%'))
        ORDER BY p.displayName ASC
    """)
    List<UserProfile> searchByDisplayName(@Param("q") String q);

    List<UserProfile> findAllByOrderByDisplayNameAsc();
}