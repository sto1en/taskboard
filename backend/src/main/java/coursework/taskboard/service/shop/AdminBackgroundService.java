package coursework.taskboard.service.shop;

import coursework.taskboard.dto.shop.AdminBackgroundDto;
import coursework.taskboard.model.shop.ProfileBackground;
import coursework.taskboard.repository.shop.ProfileBackgroundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Admin CRUD for profile backgrounds. Mirrors AdminAccentService:
 * images are stored under {uploadDir}/backgrounds and served from /uploads.
 */
@Service
@RequiredArgsConstructor
public class AdminBackgroundService {

    private static final List<String> ALLOWED_EXT = List.of("png", "jpg", "jpeg", "gif", "webp", "svg");

    private final ProfileBackgroundRepository backgroundRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Transactional(readOnly = true)
    public List<AdminBackgroundDto> listBackgrounds() {
        return backgroundRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminBackgroundDto createBackground(String title, String description, String code,
                                               String cssClass, Integer price, Integer oldPrice,
                                               Integer sortOrder, MultipartFile file) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Укажи название");
        }

        String finalCode = code != null && !code.isBlank()
                ? code.trim().toLowerCase()
                : "bg-" + UUID.randomUUID().toString().substring(0, 8);
        if (backgroundRepository.existsByCode(finalCode)) {
            throw new IllegalArgumentException("Фон с таким code уже есть");
        }

        String imageUrl = null;
        if (file != null && !file.isEmpty()) {
            imageUrl = saveFile(finalCode, file);
        }

        int order = sortOrder != null ? sortOrder : (int) backgroundRepository.count() * 10 + 10;

        ProfileBackground bg = ProfileBackground.builder()
                .code(finalCode)
                .title(title)
                .description(description != null ? description : "")
                .cssClass(cssClass != null && !cssClass.isBlank() ? cssClass.trim() : null)
                .imageUrl(imageUrl)
                .price(price != null ? price : 0)
                .oldPrice(oldPrice)
                .sortOrder(order)
                .build();
        backgroundRepository.save(bg);

        return toDto(bg);
    }

    @Transactional
    public AdminBackgroundDto updateBackground(Long id, String title, String description,
                                               String cssClass, Integer price, Integer oldPrice,
                                               Integer sortOrder, MultipartFile file,
                                               Boolean clearImage) {
        ProfileBackground bg = backgroundRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Фон не найден"));

        if (title != null) bg.setTitle(title);
        if (description != null) bg.setDescription(description);
        if (cssClass != null) bg.setCssClass(cssClass.isBlank() ? null : cssClass.trim());
        if (price != null) bg.setPrice(price);
        if (oldPrice != null) bg.setOldPrice(oldPrice);
        if (sortOrder != null) bg.setSortOrder(sortOrder);

        if (Boolean.TRUE.equals(clearImage)) {
            deleteFile(bg.getImageUrl());
            bg.setImageUrl(null);
        } else if (file != null && !file.isEmpty()) {
            deleteFile(bg.getImageUrl());
            bg.setImageUrl(saveFile(bg.getCode(), file));
        }

        backgroundRepository.save(bg);
        return toDto(bg);
    }

    @Transactional
    public void deleteBackground(Long id) {
        ProfileBackground bg = backgroundRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Фон не найден"));
        deleteFile(bg.getImageUrl());
        backgroundRepository.delete(bg);
    }

    private AdminBackgroundDto toDto(ProfileBackground bg) {
        return AdminBackgroundDto.builder()
                .id(bg.getId())
                .code(bg.getCode())
                .title(bg.getTitle())
                .description(bg.getDescription())
                .imageUrl(bg.getImageUrl())
                .cssClass(bg.getCssClass())
                .price(bg.getPrice())
                .oldPrice(bg.getOldPrice())
                .sortOrder(bg.getSortOrder())
                .createdAt(bg.getCreatedAt())
                .build();
    }

    private String saveFile(String code, MultipartFile file) {
        String original = file.getOriginalFilename();
        String ext = "png";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.') + 1).toLowerCase();
        }
        if (!ALLOWED_EXT.contains(ext)) {
            throw new IllegalArgumentException("Недопустимый формат: " + ext);
        }
        String relative = "backgrounds/" + code + "." + ext;
        Path target = Paths.get(uploadDir, relative);
        try {
            Files.createDirectories(target.getParent());
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Не удалось сохранить файл: " + e.getMessage(), e);
        }
        return relative;
    }

    private void deleteFile(String relative) {
        if (relative == null || relative.isBlank()) return;
        try {
            Files.deleteIfExists(Paths.get(uploadDir, relative));
        } catch (IOException ignored) {
        }
    }
}
