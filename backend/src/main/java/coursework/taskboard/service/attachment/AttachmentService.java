package coursework.taskboard.service.attachment;

import coursework.taskboard.dto.attachment.AttachmentDto;
import coursework.taskboard.dto.attachment.AttachmentMapper;
import coursework.taskboard.model.attachment.Attachment;
import coursework.taskboard.model.attachment.AttachmentMeta;
import coursework.taskboard.model.consts.MimeType;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.attachment.AttachmentMetaRepository;
import coursework.taskboard.repository.attachment.AttachmentRepository;
import coursework.taskboard.repository.consts.MimeTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private static final Set<String> IMAGE_MIMES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );

    private static final Set<String> ALLOWED_MIMES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain", "text/csv", "text/markdown",
            "application/zip",
            "application/x-7z-compressed",
            "application/x-rar-compressed"
    );

    private final AttachmentRepository attachmentRepository;
    private final AttachmentMetaRepository attachmentMetaRepository;
    private final MimeTypeRepository mimeTypeRepository;
    private final AttachmentMapper attachmentMapper;

    @Value("${app.upload.dir}")
    private String uploadDir;

    // ============================================================
    // Загрузить файл
    // ============================================================
    @Transactional
    public AttachmentDto upload(MultipartFile file, User user) throws IOException {

        // 1. Валидация
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Файл пуст");
        }
        String mimeCode = file.getContentType();
        if (mimeCode == null || !ALLOWED_MIMES.contains(mimeCode)) {
            throw new IllegalArgumentException("Недопустимый тип файла: " + mimeCode);
        }

        // 2. SHA-256
        byte[] bytes = file.getBytes();
        String hash = sha256(bytes);

        // 3. Дедупликация
        Attachment existing = attachmentRepository
                .findByOwnerIdAndHash(user.getId(), hash)
                .orElse(null);

        if (existing != null) {
            AttachmentMeta meta = attachmentMetaRepository.findById(existing.getId()).orElse(null);
            return attachmentMapper.toAttachmentDto(existing, meta);
        }

        // 4. MIME
        MimeType mime = mimeTypeRepository.findByCode(mimeCode)
                .orElseThrow(() -> new IllegalArgumentException("MIME not found: " + mimeCode));

        // 5. Генерация пути: uploads/YYYY/MM/uuid.ext
        String ext = getExtension(file.getOriginalFilename());
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        String filename = UUID.randomUUID() + (ext.isEmpty() ? "" : "." + ext);
        String relativePath = datePath + "/" + filename;

        Path uploadPath = Paths.get(uploadDir, datePath);
        Files.createDirectories(uploadPath);
        Path targetPath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        // 6. Attachment
        Attachment attachment = Attachment.builder()
                .owner(user)
                .mime(mime)
                .hash(hash)
                .build();
        attachmentRepository.save(attachment);

        // 7. Meta
        Integer width = null;
        Integer height = null;
        if (IMAGE_MIMES.contains(mimeCode)) {
            int[] dims = readImageDimensions(file);
            if (dims != null) {
                width = dims[0];
                height = dims[1];
            }
        }

        AttachmentMeta meta = AttachmentMeta.builder()
                .attachment(attachment)
                .url(relativePath)
                .originalName(file.getOriginalFilename())
                .alt(null)
                .width(width)
                .height(height)
                .sizeBytes((int) file.getSize())
                .build();
        attachmentMetaRepository.save(meta);

        return attachmentMapper.toAttachmentDto(attachment, meta);
    }

    // ============================================================
    // Получить attachment по id (для привязки)
    // ============================================================
    @Transactional(readOnly = true)
    public AttachmentDto getById(Long id, User user) {
        Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));

        if (!attachment.getOwner().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not your attachment");
        }

        AttachmentMeta meta = attachmentMetaRepository.findById(id).orElse(null);
        return attachmentMapper.toAttachmentDto(attachment, meta);
    }

    // ============================================================
    // Удалить attachment (только если не привязан)
    // ============================================================
    @Transactional
    public void delete(Long id, User user) {
        Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));

        if (!attachment.getOwner().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not your attachment");
        }

        AttachmentMeta meta = attachmentMetaRepository.findById(id).orElse(null);
        if (meta != null) {
            try {
                Path path = Paths.get(uploadDir, meta.getUrl());
                Files.deleteIfExists(path);
            } catch (IOException e) {
                // ignore — файл уже удалён или не существует
            }
        }

        attachmentRepository.delete(attachment);
    }

    // ============================================================
    // Helpers
    // ============================================================
    private String sha256(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(bytes);
            return HexFormat.of().formatHex(hashBytes);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 error", e);
        }
    }

    private String getExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return (dot >= 0) ? filename.substring(dot + 1).toLowerCase() : "";
    }

    private int[] readImageDimensions(MultipartFile file) {
        try (InputStream is = file.getInputStream()) {
            BufferedImage img = ImageIO.read(is);
            if (img == null) return null;
            return new int[]{img.getWidth(), img.getHeight()};
        } catch (IOException e) {
            return null;
        }
    }
}