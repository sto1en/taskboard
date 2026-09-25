package coursework.taskboard.repository.consts;

import coursework.taskboard.model.consts.StatusCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StatusCategoryRepository extends JpaRepository<StatusCategory, String> {

    List<StatusCategory> findAllByOrderBySortOrderAsc();

    List<StatusCategory> findByIsFinal(Boolean isFinal);
}