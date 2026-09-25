package coursework.taskboard.model.attachment;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "attachment_meta")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttachmentMeta {

    @Id
    @Column(name = "attachment_id")
    private Long attachmentId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "attachment_id")
    private Attachment attachment;

    @Column(nullable = false, columnDefinition = "text")
    private String url;

    @Column(name = "original_name", length = 255)
    private String originalName;

    @Column(length = 255)
    private String alt;

    private Integer width;

    private Integer height;

    @Column(name = "size_bytes", nullable = false)
    private Integer sizeBytes;
}