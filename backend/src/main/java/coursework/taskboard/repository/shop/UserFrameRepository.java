package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.UserFrame;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserFrameRepository extends JpaRepository<UserFrame, Long> {

    List<UserFrame> findByUserId(Long userId);

    boolean existsByUserIdAndFrameId(Long userId, Long frameId);
}