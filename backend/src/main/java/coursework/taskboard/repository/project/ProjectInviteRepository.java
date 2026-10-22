package coursework.taskboard.repository.project;

import coursework.taskboard.model.project.ProjectInvite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectInviteRepository extends JpaRepository<ProjectInvite, String> {

    List<ProjectInvite> findByProjectId(Long projectId);

    List<ProjectInvite> findByInvitedUserIdOrderByCreatedAtDesc(Long invitedUserId);

    Optional<ProjectInvite> findByProjectIdAndInvitedUserId(Long projectId, Long invitedUserId);

    void deleteByProjectId(Long projectId);
}
