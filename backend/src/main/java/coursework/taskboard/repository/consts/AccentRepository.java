package coursework.taskboard.repository.consts;

import coursework.taskboard.model.consts.Accent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AccentRepository extends JpaRepository<Accent, String> {

    Optional<Accent> findByCode(String code);

    boolean existsByCode(String code);
}