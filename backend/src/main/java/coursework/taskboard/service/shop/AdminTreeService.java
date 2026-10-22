package coursework.taskboard.service.shop;

import coursework.taskboard.dto.shop.AdminTreeDto;
import coursework.taskboard.dto.shop.AdminTreeRequest;
import coursework.taskboard.dto.shop.CategoryDto;
import coursework.taskboard.model.shop.TreeCategory;
import coursework.taskboard.model.shop.TreeSkin;
import coursework.taskboard.repository.reward.WeeklyRewardConfigRepository;
import coursework.taskboard.repository.shop.TreeCategoryRepository;
import coursework.taskboard.repository.shop.TreeSkinRepository;
import coursework.taskboard.repository.shop.UserTreeSkinRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Админка скинов деревьев.
 *
 * Внешний вид дерева задаётся его code (SVG-компонент на фронте), поэтому
 * при редактировании code не меняется — меняются название, цена, описание,
 * порядок и типы. При создании админ выбирает ещё не занятый вид.
 */
@Service
@RequiredArgsConstructor
public class AdminTreeService {

    private final TreeSkinRepository treeRepository;
    private final TreeCategoryRepository categoryRepository;
    private final UserTreeSkinRepository userTreeSkinRepository;
    private final WeeklyRewardConfigRepository weeklyRewardRepository;

    // ============================================================
    // Список
    // ============================================================

    @Transactional(readOnly = true)
    public List<AdminTreeDto> listTrees() {
        return treeRepository.findWithCategoriesFiltered(null).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ============================================================
    // Создание
    // ============================================================

    @Transactional
    public AdminTreeDto createTree(AdminTreeRequest req) {
        if (req == null || req.getTitle() == null || req.getTitle().isBlank()) {
            throw new IllegalArgumentException("Укажи название");
        }

        String code = req.getCode() != null && !req.getCode().isBlank()
                ? req.getCode().trim().toLowerCase()
                : "tree-" + UUID.randomUUID().toString().substring(0, 8);

        if (treeRepository.existsByCode(code)) {
            throw new IllegalArgumentException("Дерево с таким внешним видом уже есть");
        }

        int order = req.getSortOrder() != null
                ? req.getSortOrder()
                : (int) treeRepository.count() * 10 + 10;

        TreeSkin tree = TreeSkin.builder()
                .code(code)
                .title(req.getTitle().trim())
                .description(req.getDescription() != null ? req.getDescription() : "")
                .price(req.getPrice() != null ? Math.max(0, req.getPrice()) : 0)
                .sortOrder(order)
                .createdAt(LocalDateTime.now())
                .categories(resolveCategories(req.getCategoryIds()))
                .build();

        treeRepository.save(tree);
        return toDto(tree);
    }

    // ============================================================
    // Обновление
    // ============================================================

    @Transactional
    public AdminTreeDto updateTree(Long id, AdminTreeRequest req) {
        TreeSkin tree = treeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Дерево не найдено"));

        if (req == null) return toDto(tree);

        if (req.getTitle() != null) {
            if (req.getTitle().isBlank()) {
                throw new IllegalArgumentException("Укажи название");
            }
            tree.setTitle(req.getTitle().trim());
        }
        if (req.getDescription() != null) {
            tree.setDescription(req.getDescription());
        }
        if (req.getPrice() != null) {
            tree.setPrice(Math.max(0, req.getPrice()));
        }
        if (req.getSortOrder() != null) {
            tree.setSortOrder(req.getSortOrder());
        }
        if (req.getCategoryIds() != null) {
            tree.setCategories(resolveCategories(req.getCategoryIds()));
        }

        treeRepository.save(tree);
        return toDto(tree);
    }

    // ============================================================
    // Удаление
    // ============================================================

    @Transactional
    public void deleteTree(Long id) {
        TreeSkin tree = treeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Дерево не найдено"));

        if (userTreeSkinRepository.existsByTreeSkinId(tree.getId())) {
            throw new IllegalArgumentException(
                    "Нельзя удалить: дерево уже куплено игроками");
        }
        if (weeklyRewardRepository.existsByItemTypeAndItemCode("TREE", tree.getCode())) {
            throw new IllegalArgumentException(
                    "Нельзя удалить: дерево назначено подарком недели");
        }

        treeRepository.delete(tree);
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
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Укажи название типа");
        }

        String finalCode = code != null && !code.isBlank()
                ? code.trim().toLowerCase()
                : slugify(title);
        if (finalCode == null || finalCode.isBlank()) {
            finalCode = "cat-" + UUID.randomUUID().toString().substring(0, 8);
        }

        if (categoryRepository.existsByCode(finalCode)) {
            throw new IllegalArgumentException("Тип с таким code уже есть");
        }

        int order = sortOrder != null
                ? sortOrder
                : (int) categoryRepository.count() * 10 + 10;

        TreeCategory category = TreeCategory.builder()
                .code(finalCode)
                .title(title.trim())
                .sortOrder(order)
                .build();
        categoryRepository.save(category);

        return CategoryDto.builder()
                .id(category.getId())
                .code(category.getCode())
                .title(category.getTitle())
                .sortOrder(category.getSortOrder())
                .build();
    }

    @Transactional
    public CategoryDto updateCategory(Long id, String title, Integer sortOrder) {
        TreeCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Тип не найден"));

        if (title != null) {
            if (title.isBlank()) {
                throw new IllegalArgumentException("Укажи название типа");
            }
            category.setTitle(title.trim());
        }
        if (sortOrder != null) {
            category.setSortOrder(sortOrder);
        }
        categoryRepository.save(category);

        return CategoryDto.builder()
                .id(category.getId())
                .code(category.getCode())
                .title(category.getTitle())
                .sortOrder(category.getSortOrder())
                .build();
    }

    @Transactional
    public void deleteCategory(Long id) {
        TreeCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Тип не найден"));
        categoryRepository.delete(category);
    }

    // ============================================================
    // Helpers
    // ============================================================

    private Set<TreeCategory> resolveCategories(List<Long> ids) {
        Set<TreeCategory> set = new HashSet<>();
        if (ids != null && !ids.isEmpty()) {
            set.addAll(categoryRepository.findAllById(ids));
        }
        return set;
    }

    private AdminTreeDto toDto(TreeSkin tree) {
        List<CategoryDto> cats = tree.getCategories().stream()
                .sorted(Comparator.comparingInt(TreeCategory::getSortOrder))
                .map(c -> CategoryDto.builder()
                        .id(c.getId())
                        .code(c.getCode())
                        .title(c.getTitle())
                        .sortOrder(c.getSortOrder())
                        .build())
                .collect(Collectors.toList());

        return AdminTreeDto.builder()
                .id(tree.getId())
                .code(tree.getCode())
                .title(tree.getTitle())
                .description(tree.getDescription())
                .price(tree.getPrice())
                .sortOrder(tree.getSortOrder())
                .createdAt(tree.getCreatedAt())
                .categories(cats)
                .build();
    }

    private String slugify(String s) {
        if (s == null) return "cat-" + UUID.randomUUID().toString().substring(0, 6);
        return s.trim().toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }
}
