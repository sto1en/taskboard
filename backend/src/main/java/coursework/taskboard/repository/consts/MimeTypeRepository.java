package coursework.taskboard.repository.consts;

import coursework.taskboard.model.consts.MimeType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MimeTypeRepository extends JpaRepository<MimeType, Long> {

    Optional<MimeType> findByCode(String code);

    boolean existsByCode(String code);
}