package coursework.taskboard.repository.usergroup;

import coursework.taskboard.model.usergroup.UserGroupMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserGroupMemberRepository extends JpaRepository<UserGroupMember, Long> {

    List<UserGroupMember> findByGroupIdOrderByCreatedAtAsc(Long groupId);

    List<UserGroupMember> findByGroupIdAndStatus(Long groupId, String status);

    Optional<UserGroupMember> findByGroupIdAndUserId(Long groupId, Long userId);

    List<UserGroupMember> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);

    long countByGroupIdAndStatus(Long groupId, String status);
}
