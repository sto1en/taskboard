package coursework.taskboard.repository.inventory;

import coursework.taskboard.model.inventory.UserInventory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserInventoryRepository extends JpaRepository<UserInventory, Long> {

    Optional<UserInventory> findByUserIdAndItemCode(Long userId, String itemCode);

    List<UserInventory> findByUserId(Long userId);
}
