package coursework.taskboard.model.attachment;

import coursework.taskboard.model.consts.MimeType;
import coursework.taskboard.model.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attachments",
        uniqueConstraints = @UniqueConstraint(columnNames = {"owner_id", "hash"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mime_id", nullable = false)
    private MimeType mime;

    @Column(nullable = false, length = 64)
    private String hash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @OneToOne(mappedBy = "attachment", cascade = CascadeType.ALL, orphanRemoval = true)
    private AttachmentMeta meta;
}