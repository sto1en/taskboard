package coursework.taskboard.repository.social;

import coursework.taskboard.model.social.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    Optional<Friendship> findByRequesterIdAndAddresseeId(Long requesterId, Long addresseeId);

    @Query("""
        SELECT f FROM Friendship f
        WHERE f.status = 'ACCEPTED'
          AND (f.requester.id = :userId OR f.addressee.id = :userId)
    """)
    List<Friendship> findAcceptedForUser(@Param("userId") Long userId);

    @Query("""
        SELECT f FROM Friendship f
        WHERE f.status = 'PENDING'
          AND f.addressee.id = :userId
        ORDER BY f.createdAt DESC
    """)
    List<Friendship> findIncomingRequests(@Param("userId") Long userId);

    @Query("""
        SELECT f FROM Friendship f
        WHERE f.status = 'PENDING'
          AND f.requester.id = :userId
        ORDER BY f.createdAt DESC
    """)
    List<Friendship> findOutgoingRequests(@Param("userId") Long userId);

    @Query("""
        SELECT count(f) FROM Friendship f
        WHERE f.status = 'ACCEPTED'
          AND (f.requester.id = :userId OR f.addressee.id = :userId)
    """)
    long countAcceptedForUser(@Param("userId") Long userId);

    @Query("""
        SELECT count(f) FROM Friendship f
        WHERE f.status = 'PENDING'
          AND f.addressee.id = :userId
    """)
    long countIncomingForUser(@Param("userId") Long userId);
}
