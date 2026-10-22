package coursework.taskboard.repository.usergroup;

import coursework.taskboard.model.usergroup.UserGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserGroupRepository extends JpaRepository<UserGroup, Long> {

    List<UserGroup> findByOwnerIdOrderByCreatedAtAsc(Long ownerId);

    Optional<UserGroup> findByOwnerIdAndOriginGroupId(Long ownerId, Long originGroupId);
}
