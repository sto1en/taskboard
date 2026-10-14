package coursework.taskboard.service.shop;

import coursework.taskboard.dto.shop.AdminFrameDto;
import coursework.taskboard.dto.shop.CategoryDto;
import coursework.taskboard.model.shop.Frame;
import coursework.taskboard.model.shop.FrameCategory;
import coursework.taskboard.repository.shop.FrameCategoryRepository;
import coursework.taskboard.repository.shop.FrameRepository;
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
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminFrameService {

    private static final List<String> ALLOWED_EXT = List.of("png", "jpg", "jpeg", "gif", "webp", "svg");

    private final FrameRepository frameRepository;
    private final FrameCategoryRepository categoryRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    // ============================================================
    // Список
    // ============================================================
    @Transactional(readOnly = true)
    public List<AdminFrameDto> listFrames() {
        return frameRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ============================================================
    // Создание
    // ============================================================
    @Transactional
    public AdminFrameDto createFrame(String title, String description,
                                     String code, String cssClass, String hexColor,
                                     Integer price, Integer oldPrice, Integer sortOrder,
                                     List<Long> categoryIds, MultipartFile file) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Укажи название");
        }

        String finalCode = code != null && !code.isBlank()
                ? code.trim().toLowerCase()
                : "f-" + UUID.randomUUID().toString().substring(0, 8);
        if (frameRepository.existsByCode(finalCode)) {
            throw new IllegalArgumentException("Рамка с таким code уже есть");
        }

        String imageUrl = null;
        if (file != null && !file.isEmpty()) {
            imageUrl = saveFile(finalCode, file);
        }

        int order = sortOrder != null ? sortOrder : (int) frameRepository.count() * 10 + 10;

        Frame frame = Frame.builder()
                .code(finalCode)
                .title(title)
                .description(description != null ? description : "")
                .cssClass(cssClass)
                .imageUrl(imageUrl)
                .hexColor(hexColor)
                .price(price != null ? price : 0)
                .oldPrice(oldPrice)
                .sortOrder(order)
                .categories(resolveCategories(categoryIds))
                .build();
        frameRepository.save(frame);

        return toDto(frame);
    }

    // ============================================================
    // Обновление
    // ============================================================
    @Transactional
    public AdminFrameDto updateFrame(Long id, String title, String description,
                                     String cssClass, String hexColor,
                                     Integer price, Integer oldPrice, Integer sortOrder,
                                     List<Long> categoryIds,
                                     MultipartFile file, Boolean clearImage) {
        Frame f = frameRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Рамка не найдена"));

        if (title != null) f.setTitle(title);
        if (description != null) f.setDescription(description);
        if (cssClass != null) f.setCssClass(cssClass.isBlank() ? null : cssClass);
        if (hexColor != null) f.setHexColor(hexColor.isBlank() ? null : hexColor);
        if (price != null) f.setPrice(price);
        if (oldPrice != null) f.setOldPrice(oldPrice);
        if (sortOrder != null) f.setSortOrder(sortOrder);

        if (categoryIds != null) {
            f.setCategories(resolveCategories(categoryIds));
        }

        if (Boolean.TRUE.equals(clearImage)) {
            if (f.getImageUrl() != null) {
                try { Files.deleteIfExists(Paths.get(uploadDir, f.getImageUrl())); } catch (IOException ignored) {}
            }
            f.setImageUrl(null);
        } else if (file != null && !file.isEmpty()) {
            if (f.getImageUrl() != null) {
                try { Files.deleteIfExists(Paths.get(uploadDir, f.getImageUrl())); } catch (IOException ignored) {}
            }
            f.setImageUrl(saveFile(f.getCode(), file));
        }

        frameRepository.save(f);
        return toDto(f);
    }

    // ============================================================
    // Удаление
    // ============================================================
    @Transactional
    public void deleteFrame(Long id) {
        Frame f = frameRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Рамка не найдена"));
        if (f.getImageUrl() != null) {
            try { Files.deleteIfExists(Paths.get(uploadDir, f.getImageUrl())); } catch (IOException ignored) {}
        }
        frameRepository.delete(f);
    }

    // ============================================================
    // Категории
    // ============================================================
    @Transactional(readOnly = true)
    public List<CategoryDto> listCategories() {
        return categoryRepository.findAllByOrderBySortOrderAsc().stream()
                .map(c -> CategoryDto.builder()
                        .id(c.getId())
                        .code(c.getCode())
                        .title(c.getTitle())
                        .sortOrder(c.getSortOrder())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryDto createCategory(String code, String title, Integer sortOrder) {
        String finalCode = code != null && !code.isBlank()
                ? code.trim().toLowerCase()
                : slugify(title);
        if (categoryRepository.existsByCode(finalCode)) {
            throw new IllegalArgumentException("Тип с таким code уже есть");
        }
        int order = sortOrder != null ? sortOrder : (int) categoryRepository.count() * 10 + 10;

        FrameCategory c = FrameCategory.builder()
                .code(finalCode).title(title).sortOrder(order).build();
        categoryRepository.save(c);

        return CategoryDto.builder()
                .id(c.getId()).code(c.getCode())
                .title(c.getTitle()).sortOrder(c.getSortOrder())
                .build();
    }

    @Transactional
    public CategoryDto updateCategory(Long id, String title, Integer sortOrder) {
        FrameCategory c = categoryRepository.findById(id)
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
        FrameCategory c = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Тип не найден"));
        categoryRepository.delete(c);
    }

    // ============================================================
    // Helpers
    // ============================================================
    private Set<FrameCategory> resolveCategories(List<Long> ids) {
        Set<FrameCategory> set = new HashSet<>();
        if (ids != null && !ids.isEmpty()) {
            set.addAll(categoryRepository.findAllById(ids));
        }
        return set;
    }

    private AdminFrameDto toDto(Frame f) {
        List<CategoryDto> cats = f.getCategories().stream()
                .sorted(Comparator.comparingInt(FrameCategory::getSortOrder))
                .map(c -> CategoryDto.builder()
                        .id(c.getId()).code(c.getCode())
                        .title(c.getTitle()).sortOrder(c.getSortOrder())
                        .build())
                .collect(Collectors.toList());

        return AdminFrameDto.builder()
                .id(f.getId())
                .code(f.getCode())
                .title(f.getTitle())
                .description(f.getDescription())
                .cssClass(f.getCssClass())
                .imageUrl(f.getImageUrl())
                .hexColor(f.getHexColor())
                .price(f.getPrice())
                .oldPrice(f.getOldPrice())
                .sortOrder(f.getSortOrder())
                .createdAt(f.getCreatedAt())
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
        String relative = "frames/" + code + "." + ext;
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