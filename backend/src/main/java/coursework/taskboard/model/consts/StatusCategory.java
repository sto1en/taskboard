package coursework.taskboard.model.consts;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "status_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusCategory {

    @Id
    @Column(length = 30)
    private String code;

    @Column(nullable = false, length = 40)
    private String label;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "is_final", nullable = false)
    @Builder.Default
    private Boolean isFinal = false;
}