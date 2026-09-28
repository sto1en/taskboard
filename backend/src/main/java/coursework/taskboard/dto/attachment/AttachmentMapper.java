package coursework.taskboard.dto.attachment;

import coursework.taskboard.model.attachment.Attachment;
import coursework.taskboard.model.attachment.AttachmentMeta;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AttachmentMapper {

    @Value("${app.upload.base-url}")
    private String baseUrl;

    public AttachmentDto toAttachmentDto(Attachment attachment, AttachmentMeta meta) {
        return AttachmentDto.builder()
                .id(attachment.getId())
                .url(meta != null ? baseUrl + "/" + meta.getUrl() : null)
                .mimeCode(attachment.getMime().getCode())
                .originalName(meta != null ? meta.getOriginalName() : null)
                .alt(meta != null ? meta.getAlt() : null)
                .width(meta != null ? meta.getWidth() : null)
                .height(meta != null ? meta.getHeight() : null)
                .sizeBytes(meta != null ? meta.getSizeBytes() : null)
                .createdAt(attachment.getCreatedAt())
                .build();
    }
}