package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.UserAvatar;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserAvatarRepository extends JpaRepository<UserAvatar, Long> {

    List<UserAvatar> findByUserId(Long userId);

    boolean existsByUserIdAndAvatarId(Long userId, Long avatarId);
}