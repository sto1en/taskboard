package coursework.taskboard.model.consts;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mime_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MimeType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String code;
}