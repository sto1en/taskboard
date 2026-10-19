package coursework.taskboard.service.shop;

import coursework.taskboard.dto.shop.AdminAccentDto;
import coursework.taskboard.dto.shop.CategoryDto;
import coursework.taskboard.model.shop.AccentCategory;
import coursework.taskboard.model.shop.AccentSkin;
import coursework.taskboard.repository.shop.AccentCategoryRepository;
import coursework.taskboard.repository.shop.AccentSkinRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminAccentService {

    private static final List<String> ALLOWED_EXT = List.of("png", "jpg", "jpeg", "gif", "webp", "svg");

    private final AccentSkinRepository accentSkinRepository;
    private final AccentCategoryRepository categoryRepository;

    @org.springframework.beans.factory.annotation.Value("${app.upload.dir}")
    private String uploadDir;

    @Transactional(readOnly = true)
    public List<AdminAccentDto> listAccents() {
        return accentSkinRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminAccentDto createAccent(String title, String description,
                                       String code, String hexColor, String hexColorSecondary,
                                       Boolean isGradient, Integer price, Integer oldPrice,
                                       Integer sortOrder, List<Long> categoryIds,
                                       MultipartFile file) {
        return createAccent(title, description, code, hexColor, hexColorSecondary, null,
                isGradient, null, price, oldPrice, sortOrder, categoryIds, file);
    }

    @Transactional
    public AdminAccentDto createAccent(String title, String description,
                                       String code, String hexColor, String hexColorSecondary,
                                       String hexColorTertiary,
                                       Boolean isGradient, Boolean isRare,
                                       Integer price, Integer oldPrice,
                                       Integer sortOrder, List<Long> categoryIds,
                                       MultipartFile file) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Укажи название");
        }
        if (hexColor == null || hexColor.isBlank()) {
            throw new IllegalArgumentException("Укажи цвет");
        }

        String finalCode = code != null && !code.isBlank()
                ? code.trim().toLowerCase()
                : "ac-" + UUID.randomUUID().toString().substring(0, 8);
        if (accentSkinRepository.existsByCode(finalCode)) {
            throw new IllegalArgumentException("Акцент с таким code уже есть");
        }

        String imageUrl = null;
        if (file != null && !file.isEmpty()) {
            imageUrl = saveFile(finalCode, file);
        }

        int order = sortOrder != null ? sortOrder : (int) accentSkinRepository.count() * 10 + 10;

        AccentSkin skin = AccentSkin.builder()
                .code(finalCode)
                .title(title)
                .description(description != null ? description : "")
                .hexColor(hexColor)
                .hexColorSecondary(hexColorSecondary)
                .hexColorTertiary(hexColorTertiary)
                .isGradient(Boolean.TRUE.equals(isGradient))
                .isRare(Boolean.TRUE.equals(isRare))
                .imageUrl(imageUrl)
                .price(price != null ? price : 0)
                .oldPrice(oldPrice)
                .sortOrder(order)
                .categories(resolveCategories(categoryIds))
                .build();
        accentSkinRepository.save(skin);

        return toDto(skin);
    }

    @Transactional
    public AdminAccentDto updateAccent(Long id, String title, String description,
                                       String hexColor, String hexColorSecondary,
                                       Boolean isGradient, Integer price, Integer oldPrice,
                                       Integer sortOrder, List<Long> categoryIds,
                                       MultipartFile file, Boolean clearImage) {
        return updateAccent(id, title, description, hexColor, hexColorSecondary, null,
                isGradient, null, price, oldPrice, sortOrder, categoryIds, file, clearImage);
    }

    @Transactional
    public AdminAccentDto updateAccent(Long id, String title, String description,
                                       String hexColor, String hexColorSecondary,
                                       String hexColorTertiary,
                                       Boolean isGradient, Boolean isRare,
                                       Integer price, Integer oldPrice,
                                       Integer sortOrder, List<Long> categoryIds,
                                       MultipartFile file, Boolean clearImage) {
        AccentSkin a = accentSkinRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Акцент не найден"));

        if (title != null) a.setTitle(title);
        if (description != null) a.setDescription(description);
        if (hexColor != null) a.setHexColor(hexColor);
        if (hexColorSecondary != null) a.setHexColorSecondary(hexColorSecondary.isBlank() ? null : hexColorSecondary);
        if (hexColorTertiary != null) a.setHexColorTertiary(hexColorTertiary.isBlank() ? null : hexColorTertiary);
        if (isGradient != null) a.setIsGradient(isGradient);
        if (isRare != null) a.setIsRare(isRare);
        if (price != null) a.setPrice(price);
        if (oldPrice != null) a.setOldPrice(oldPrice);
        if (sortOrder != null) a.setSortOrder(sortOrder);

        if (categoryIds != null) {
            a.setCategories(resolveCategories(categoryIds));
        }

        if (Boolean.TRUE.equals(clearImage)) {
            if (a.getImageUrl() != null) {
                try { Files.deleteIfExists(Paths.get(uploadDir, a.getImageUrl())); } catch (IOException ignored) {}
            }
            a.setImageUrl(null);
        } else if (file != null && !file.isEmpty()) {
            if (a.getImageUrl() != null) {
                try { Files.deleteIfExists(Paths.get(uploadDir, a.getImageUrl())); } catch (IOException ignored) {}
            }
            a.setImageUrl(saveFile(a.getCode(), file));
        }

        accentSkinRepository.save(a);
        return toDto(a);
    }

    @Transactional
    public void deleteAccent(Long id) {
        AccentSkin a = accentSkinRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Акцент не найден"));
        if (a.getImageUrl() != null) {
            try { Files.deleteIfExists(Paths.get(uploadDir, a.getImageUrl())); } catch (IOException ignored) {}
        }
        accentSkinRepository.delete(a);
    }

    // ============================================================
    // Категории
    // ============================================================
    @Transactional(readOnly = true)
    public List<CategoryDto> listCategories() {
        return categoryRepository.findAllByOrderBySortOrderAsc().stream()
                .map(c -> CategoryDto.builder()
                        .id(c.getId()).code(c.getCode())
                        .title(c.getTitle()).sortOrder(c.getSortOrder())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryDto createCategory(String code, String title, Integer sortOrder) {
        String finalCode = code != null && !code.isBlank() ? code.trim().toLowerCase() : slugify(title);
        if (categoryRepository.existsByCode(finalCode)) {
            throw new IllegalArgumentException("Тип с таким code уже есть");
        }
        int order = sortOrder != null ? sortOrder : (int) categoryRepository.count() * 10 + 10;

        AccentCategory c = AccentCategory.builder()
                .code(finalCode).title(title).sortOrder(order).build();
        categoryRepository.save(c);

        return CategoryDto.builder()
                .id(c.getId()).code(c.getCode())
                .title(c.getTitle()).sortOrder(c.getSortOrder())
                .build();
    }

    @Transactional
    public CategoryDto updateCategory(Long id, String title, Integer sortOrder) {
        AccentCategory c = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Тип не найден"));
        if (title != null) c.setTitle(title);
        if (sortOrder != null) c.setSortOrder(sortOrder);
        categoryRepository.save(c);

        return CategoryDto.builder()
                .id(c.getId()).code(c.getCode())
                .title(c.getTitle()).sortOrder(c.getSortOrder())
                .build();
    }

    @Transactional
    public void deleteCategory(Long id) {
        AccentCategory c = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Тип не найден"));
        categoryRepository.delete(c);
    }

    // ============================================================
    // Helpers
    // ============================================================
    private Set<AccentCategory> resolveCategories(List<Long> ids) {
        Set<AccentCategory> set = new HashSet<>();
        if (ids != null && !ids.isEmpty()) {
            set.addAll(categoryRepository.findAllById(ids));
        }
        return set;
    }

    private AdminAccentDto toDto(AccentSkin a) {
        List<CategoryDto> cats = a.getCategories().stream()
                .sorted(Comparator.comparingInt(AccentCategory::getSortOrder))
                .map(c -> CategoryDto.builder()
                        .id(c.getId()).code(c.getCode())
                        .title(c.getTitle()).sortOrder(c.getSortOrder())
                        .build())
                .collect(Collectors.toList());

        return AdminAccentDto.builder()
                .id(a.getId())
                .code(a.getCode())
                .title(a.getTitle())
                .description(a.getDescription())
                .hexColor(a.getHexColor())
                .hexColorSecondary(a.getHexColorSecondary())
                .hexColorTertiary(a.getHexColorTertiary())
                .isGradient(a.getIsGradient())
                .isRare(a.getIsRare())
                .imageUrl(a.getImageUrl())
                .price(a.getPrice())
                .oldPrice(a.getOldPrice())
                .sortOrder(a.getSortOrder())
                .createdAt(a.getCreatedAt())
                .categories(cats)
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
        String relative = "accents/" + code + "." + ext;
        Path target = Paths.get(uploadDir, relative);
        try {
            Files.createDirectories(target.getParent());
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Не удалось сохранить файл: " + e.getMessage(), e);
        }
        return relative;
    }

    private String slugify(String s) {
        if (s == null) return "cat-" + UUID.randomUUID().toString().substring(0, 6);
        return s.trim().toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }
}