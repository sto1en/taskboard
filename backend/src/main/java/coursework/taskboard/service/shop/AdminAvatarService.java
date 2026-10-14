package coursework.taskboard.service.shop;

import coursework.taskboard.dto.shop.AdminAvatarDto;
import coursework.taskboard.dto.shop.AvatarCategoryDto;
import coursework.taskboard.dto.shop.CategoryDto;
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
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminAvatarService {

    private static final List<String> ALLOWED_EXT = List.of("png", "jpg", "jpeg", "gif", "webp", "svg");

    private final AvatarRepository avatarRepository;
    private final AvatarCategoryRepository categoryRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    // ============================================================
    // Категории (типы аватарок)
    // ============================================================
    @Transactional(readOnly = true)
    public List<AvatarCategoryDto> listCategories() {
        List<AvatarCategory> list = categoryRepository.findAllByOrderBySortOrderAsc();
        List<AvatarCategoryDto> result = new ArrayList<>();

        // Считаем количество аватарок на категорию ОДНИМ запросом
        Map<Long, Long> counts = new HashMap<>();
        for (Avatar a : avatarRepository.findAll()) {
            for (AvatarCategory c : a.getCategories()) {
                counts.merge(c.getId(), 1L, Long::sum);
            }
        }

        for (AvatarCategory c : list) {
            result.add(AvatarCategoryDto.builder()
                    .id(c.getId())
                    .code(c.getCode())
                    .title(c.getTitle())
                    .sortOrder(c.getSortOrder())
                    .avatarCount(counts.getOrDefault(c.getId(), 0L))
                    .build());
        }
        return result;
    }

    @Transactional
    public AvatarCategoryDto createCategory(AvatarCategoryDto dto) {
        if (dto.getTitle() == null || dto.getTitle().isBlank()) {
            throw new IllegalArgumentException("Укажи название типа");
        }

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

        long count = 0;
        for (Avatar a : avatarRepository.findAll()) {
            if (a.getCategories().stream().anyMatch(cat -> cat.getId().equals(c.getId()))) {
                count++;
            }
        }

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

        // Отвязываем от всех аватарок (many-to-many сам разберётся с links, но лучше явно)
        for (Avatar a : avatarRepository.findAll()) {
            if (a.getCategories().removeIf(cat -> cat.getId().equals(c.getId()))) {
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
        return avatarRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminAvatarDto createAvatar(String title, String description, String code,
                                       String emoji, Integer price, Integer oldPrice,
                                       Integer sortOrder, List<Long> categoryIds,
                                       MultipartFile file) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Укажи название");
        }

        String finalCode = code != null && !code.isBlank()
                ? code.trim().toLowerCase()
                : "a-" + UUID.randomUUID().toString().substring(0, 8);

        if (avatarRepository.existsByCode(finalCode)) {
            throw new IllegalArgumentException("Аватарка с таким code уже есть");
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
                .oldPrice(oldPrice)
                .sortOrder(order)
                .imageUrl(imageUrl)
                .categories(resolveCategories(categoryIds))
                .build();
        avatarRepository.save(a);

        return toDto(a);
    }

    @Transactional
    public AdminAvatarDto updateAvatar(Long id, String title, String description,
                                       String emoji, Integer price, Integer oldPrice,
                                       Integer sortOrder, List<Long> categoryIds,
                                       MultipartFile file, Boolean clearImage) {
        Avatar a = avatarRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Аватарка не найдена"));

        if (title != null) a.setTitle(title);
        if (description != null) a.setDescription(description);
        if (emoji != null) a.setEmoji(emoji.isBlank() ? null : emoji);
        if (price != null) a.setPrice(price);
        if (oldPrice != null) a.setOldPrice(oldPrice);
        if (sortOrder != null) a.setSortOrder(sortOrder);

        // Категории — только если явно переданы (не null)
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
            try { Files.deleteIfExists(Paths.get(uploadDir, a.getImageUrl())); } catch (IOException ignored) {}
        }
        avatarRepository.delete(a);
    }

    // ============================================================
    // Helpers
    // ============================================================
    private Set<AvatarCategory> resolveCategories(List<Long> ids) {
        Set<AvatarCategory> set = new HashSet<>();
        if (ids != null && !ids.isEmpty()) {
            set.addAll(categoryRepository.findAllById(ids));
        }
        return set;
    }

    private AdminAvatarDto toDto(Avatar a) {
        List<CategoryDto> cats = a.getCategories().stream()
                .sorted(Comparator.comparingInt(AvatarCategory::getSortOrder))
                .map(c -> CategoryDto.builder()
                        .id(c.getId())
                        .code(c.getCode())
                        .title(c.getTitle())
                        .sortOrder(c.getSortOrder())
                        .build())
                .collect(Collectors.toList());

        return AdminAvatarDto.builder()
                .id(a.getId())
                .code(a.getCode())
                .title(a.getTitle())
                .description(a.getDescription())
                .emoji(a.getEmoji())
                .imageUrl(a.getImageUrl())
                .cssClass(a.getCssClass())
                .price(a.getPrice())
                .oldPrice(a.getOldPrice())
                .sortOrder(a.getSortOrder())
                .createdAt(a.getCreatedAt())
                .categories(cats)
                .build();
    }

    private String saveAvatarFile(String code, MultipartFile file) {
        String original = file.getOriginalFilename();
        String ext = "png";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.') + 1).toLowerCase();
        }
        if (!ALLOWED_EXT.contains(ext)) {
            throw new IllegalArgumentException("Недопустимый формат: " + ext);
        }

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

    private String slugify(String s) {
        if (s == null) return "cat-" + UUID.randomUUID().toString().substring(0, 6);
        return s.trim().toLowerCase()
                .replaceAll("[^a-z0-9а-яё]+", "-")
                .replaceAll("^-|-$", "");
    }
}