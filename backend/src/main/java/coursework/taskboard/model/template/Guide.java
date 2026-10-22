package coursework.taskboard.model.template;

import coursework.taskboard.model.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Гайд-проект: готовый сценарий на неделю, месяц или свой период.
 *
 * Внутри — задачи с описаниями, подзадачами и дедлайнами, заданными
 * смещением в днях от даты старта. Гайд можно открыть в календарном виде,
 * применить к доске (создать реальный проект с задачами) и выставить
 * в личную витрину на «стене».
 *
 * isSystem = true — встроенный гайд (неделя/месяц), доступный всем.
 * owner = null — гайд принадлежит системе.
 */
@Entity
@Table(name = "guides")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Guide {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(nullable = false, length = 140)
    private String title;

    @Column(nullable = false, length = 255)
    @Builder.Default
    private String subtitle = "";

    @Column(nullable = false, columnDefinition = "text")
    @Builder.Default
    private String description = "";

    @Column(name = "period_type", nullable = false, length = 20)
    @Builder.Default
    private String periodType = "WEEK";

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String accent = "blue";

    @Column(nullable = false, length = 16)
    @Builder.Default
    private String emoji = "📅";

    @Column(name = "is_system", nullable = false)
    @Builder.Default
    private Boolean isSystem = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "guide", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    @Builder.Default
    private List<GuideTask> tasks = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
