package coursework.taskboard.model.consts;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "accents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Accent {

    @Id
    @Column(length = 30)
    private String code;

    @Column(nullable = false, length = 60)
    private String label;
}