package coursework.taskboard.service.shop;

import coursework.taskboard.dto.shop.AdminAvatarDto;
import coursework.taskboard.dto.shop.AvatarCategoryDto;
import coursework.taskboard.model.shop.Avatar;
import coursework.taskboard.model.shop.AvatarCategory;
import coursework.taskboard.repository.shop.AvatarCategoryRepository;
import coursework.taskboard.repository.shop.AvatarRepository;
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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminAvatarService {

    private static final List<String> ALLOWED_EXT = List.of("png", "jpg", "jpeg", "gif", "webp", "svg");

    private final AvatarRepository avatarRepository;
    private final AvatarCategoryRepository categoryRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    // ============================================================
    // Категории
    // ============================================================
    @Transactional(readOnly = true)
    public List<AvatarCategoryDto> listCategories() {
        List<AvatarCategory> list = categoryRepository.findAllByOrderBySortOrderAsc();
        List<AvatarCategoryDto> result = new ArrayList<>();
        for (AvatarCategory c : list) {
            long count = avatarRepository.findAll().stream()
                    .filter(a -> a.getCategory() != null && a.getCategory().getId().equals(c.getId()))
                    .count();
            result.add(AvatarCategoryDto.builder()
                    .id(c.getId())
                    .code(c.getCode())
                    .title(c.getTitle())
                    .sortOrder(c.getSortOrder())
                    .avatarCount(count)
                    .build());
        }
        return result;
    }

    @Transactional
    public AvatarCategoryDto createCategory(AvatarCategoryDto dto) {
        String code = dto.getCode() != null && !dto.getCode().isBlank()
                ? dto.getCode().trim().toLowerCase()
                : slugify(dto.getTitle());
        if (categoryRepository.existsByCode(code)) {
            throw new IllegalArgumentException("Тип с таким code уже есть");
        }
        int sortOrder = dto.getSortOrder() != null
                ? dto.getSortOrder()
                : (int) categoryRepository.count() * 10 + 10;

        AvatarCategory c = AvatarCategory.builder()
                .code(code)
                .title(dto.getTitle())
                .sortOrder(sortOrder)
                .build();
        categoryRepository.save(c);

        return AvatarCategoryDto.builder()
                .id(c.getId())
                .code(c.getCode())
                .title(c.getTitle())
                .sortOrder(c.getSortOrder())
                .avatarCount(0)
                .build();
    }

    @Transactional
    public AvatarCategoryDto updateCategory(Long id, AvatarCategoryDto dto) {
        AvatarCategory c = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Тип не найден"));
        if (dto.getTitle() != null) c.setTitle(dto.getTitle());
        if (dto.getSortOrder() != null) c.setSortOrder(dto.getSortOrder());
        categoryRepository.save(c);

        long count = avatarRepository.findAll().stream()
                .filter(a -> a.getCategory() != null && a.getCategory().getId().equals(c.getId()))
                .count();
        return AvatarCategoryDto.builder()
                .id(c.getId())
                .code(c.getCode())
                .title(c.getTitle())
                .sortOrder(c.getSortOrder())
                .avatarCount(count)
                .build();
    }

    @Transactional
    public void deleteCategory(Long id) {
        AvatarCategory c = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Тип не найден"));
        // Отвязываем аватарки, чтобы FK не блокировал удаление
        for (Avatar a : avatarRepository.findAll()) {
            if (a.getCategory() != null && a.getCategory().getId().equals(c.getId())) {
                a.setCategory(null);
                avatarRepository.save(a);
            }
        }
        categoryRepository.delete(c);
    }

    // ============================================================
    // Аватарки
    // ============================================================
    @Transactional(readOnly = true)
    public List<AdminAvatarDto> listAvatars() {
        List<Avatar> list = avatarRepository.findAllByOrderBySortOrderAsc();
        List<AdminAvatarDto> result = new ArrayList<>();
        for (Avatar a : list) {
            result.add(toDto(a));
        }
        return result;
    }

    @Transactional
    public AdminAvatarDto createAvatar(String title, String description, String code,
                                       String emoji, Integer price, Integer sortOrder,
                                       Long categoryId, MultipartFile file) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Укажи название");
        }

        // code: сгенерировать или из формы
        String finalCode = code != null && !code.isBlank()
                ? code.trim().toLowerCase()
                : "a-" + UUID.randomUUID().toString().substring(0, 8);
        if (avatarRepository.existsByCode(finalCode)) {
            throw new IllegalArgumentException("Аватарка с таким code уже есть");
        }

        AvatarCategory category = null;
        if (categoryId != null) {
            category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new IllegalArgumentException("Тип не найден"));
        }

        String imageUrl = null;
        if (file != null && !file.isEmpty()) {
            imageUrl = saveAvatarFile(finalCode, file);
        }

        int order = sortOrder != null ? sortOrder : (int) avatarRepository.count() * 10 + 10;

        Avatar a = Avatar.builder()
                .code(finalCode)
                .title(title)
                .description(description != null ? description : "")
                .emoji(emoji != null && !emoji.isBlank() ? emoji : null)
                .price(price != null ? price : 0)
                .sortOrder(order)
                .imageUrl(imageUrl)
                .category(category)
                .build();
        avatarRepository.save(a);

        return toDto(a);
    }

    @Transactional
    public AdminAvatarDto updateAvatar(Long id, String title, String description,
                                       String emoji, Integer price, Integer sortOrder,
                                       Long categoryId, MultipartFile file, Boolean clearImage) {
        Avatar a = avatarRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Аватарка не найдена"));

        if (title != null) a.setTitle(title);
        if (description != null) a.setDescription(description);
        if (emoji != null) a.setEmoji(emoji.isBlank() ? null : emoji);
        if (price != null) a.setPrice(price);
        if (sortOrder != null) a.setSortOrder(sortOrder);

        if (categoryId != null) {
            AvatarCategory category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new IllegalArgumentException("Тип не найден"));
            a.setCategory(category);
        } else if (Boolean.TRUE.equals(clearImage) && categoryId == null) {
            // categoryId не передан — не меняем
        }

        if (Boolean.TRUE.equals(clearImage)) {
            // Удаляем файл
            if (a.getImageUrl() != null) {
                try {
                    Path p = Paths.get(uploadDir, a.getImageUrl());
                    Files.deleteIfExists(p);
                } catch (IOException ignored) {}
            }
            a.setImageUrl(null);
        } else if (file != null && !file.isEmpty()) {
            // Удаляем старый файл
            if (a.getImageUrl() != null) {
                try {
                    Path p = Paths.get(uploadDir, a.getImageUrl());
                    Files.deleteIfExists(p);
                } catch (IOException ignored) {}
            }
            a.setImageUrl(saveAvatarFile(a.getCode(), file));
        }

        avatarRepository.save(a);
        return toDto(a);
    }

    @Transactional
    public void deleteAvatar(Long id) {
        Avatar a = avatarRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Аватарка не найдена"));

        if (a.getImageUrl() != null) {
            try {
                Path p = Paths.get(uploadDir, a.getImageUrl());
                Files.deleteIfExists(p);
            } catch (IOException ignored) {}
        }
        avatarRepository.delete(a);
    }

    // ============================================================
    // Helpers
    // ============================================================
    private String saveAvatarFile(String code, MultipartFile file) {
        String original = file.getOriginalFilename();
        String ext = "png";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.') + 1).toLowerCase();
        }
        if (!ALLOWED_EXT.contains(ext)) {
            throw new IllegalArgumentException("Недопустимый формат: " + ext);
        }

        // uploads/avatars/<code>.<ext>
        String relativePath = "avatars/" + code + "." + ext;
        Path target = Paths.get(uploadDir, relativePath);
        try {
            Files.createDirectories(target.getParent());
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Не удалось сохранить файл: " + e.getMessage(), e);
        }
        return relativePath;
    }

    private AdminAvatarDto toDto(Avatar a) {
        return AdminAvatarDto.builder()
                .id(a.getId())
                .code(a.getCode())
                .title(a.getTitle())
                .description(a.getDescription())
                .emoji(a.getEmoji())
                .imageUrl(a.getImageUrl())
                .cssClass(a.getCssClass())
                .price(a.getPrice())
                .sortOrder(a.getSortOrder())
                .categoryId(a.getCategory() != null ? a.getCategory().getId() : null)
                .categoryCode(a.getCategory() != null ? a.getCategory().getCode() : null)
                .categoryTitle(a.getCategory() != null ? a.getCategory().getTitle() : null)
                .build();
    }

    private String slugify(String s) {
        if (s == null) return "cat-" + UUID.randomUUID().toString().substring(0, 6);
        return s.trim().toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }
}