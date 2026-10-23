package coursework.taskboard.service.template;

import coursework.taskboard.dto.template.*;
import coursework.taskboard.model.template.TaskTemplate;
import coursework.taskboard.model.template.TaskTemplateItem;
import coursework.taskboard.model.user.User;
import coursework.taskboard.model.user.UserAppearance;
import coursework.taskboard.repository.user.UserAppearanceRepository;
import coursework.taskboard.repository.template.TaskTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class TaskTemplateService {

    private final TaskTemplateRepository templateRepository;
    private final TemplateApplyService applyService;
    private final UserAppearanceRepository userAppearanceRepository;

    // ============================================================
    // CRUD
    // ============================================================

    @Transactional(readOnly = true)
    public List<TaskTemplateDto> list(User user) {
        return templateRepository.findByOwnerIdOrderByUpdatedAtDesc(user.getId())
                .stream()
                .map(template -> toDto(template, user, true))
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskTemplateDto get(Long id, User user) {
        return toDto(requireAccessible(id, user), user, true);
    }

    @Transactional
    public TaskTemplateDto create(SaveTaskTemplateRequest request, User user) {
        TaskTemplate template = TaskTemplate.builder()
                .owner(user)
                .title(request.getTitle().trim())
                .description(nullToEmpty(request.getDescription()))
                .icon(defaultIfBlank(request.getIcon(), "🧩"))
                .accent(defaultIfBlank(request.getAccent(), "blue"))
                .isPublic(Boolean.TRUE.equals(request.getIsPublic()))
                .build();

        applyItems(template, request.getItems());
        templateRepository.save(template);
        return toDto(template, user, true);
    }

    @Transactional
    public TaskTemplateDto update(Long id, SaveTaskTemplateRequest request, User user) {
        TaskTemplate template = requireOwn(id, user);

        template.setTitle(request.getTitle().trim());
        template.setDescription(nullToEmpty(request.getDescription()));
        template.setIcon(defaultIfBlank(request.getIcon(), "🧩"));
        template.setAccent(defaultIfBlank(request.getAccent(), "blue"));
        if (request.getIsPublic() != null) {
            template.setIsPublic(request.getIsPublic());
        }

        template.getItems().clear();
        applyItems(template, request.getItems());

        templateRepository.save(template);
        return toDto(template, user, true);
    }

    @Transactional
    public void delete(Long id, User user) {
        templateRepository.delete(requireOwn(id, user));
    }

    /**
     * Быстрое переключение публичности из списка / каталога.
     */
    @Transactional
    public TaskTemplateDto setPublic(Long id, boolean isPublic, User user) {
        TaskTemplate template = requireOwn(id, user);
        template.setIsPublic(isPublic);
        templateRepository.save(template);
        return toDto(template, user, true);
    }

    /**
     * Копия чужого публичного шаблона в свои (или своего — тоже можно).
     */
    @Transactional
    public TaskTemplateDto duplicate(Long id, User user) {
        TaskTemplate source = requireAccessible(id, user);

        String title = source.getTitle() + " (копия)";
        if (title.length() > 120) title = title.substring(0, 120);

        TaskTemplate copy = TaskTemplate.builder()
                .owner(user)
                .title(title)
                .description(source.getDescription())
                .icon(source.getIcon())
                .accent(source.getAccent())
                .isPublic(false)
                .build();

        for (TaskTemplateItem item : source.getItems()) {
            copy.getItems().add(TaskTemplateItem.builder()
                    .template(copy)
                    .position(item.getPosition())
                    .title(item.getTitle())
                    .description(item.getDescription())
                    .priority(item.getPriority())
                    .deadlineOffsetDays(item.getDeadlineOffsetDays())
                    .statusCategoryCode(item.getStatusCategoryCode())
                    .estimatedMinutes(item.getEstimatedMinutes())
                    .startTime(item.getStartTime())
                    .subtasksText(item.getSubtasksText())
                    .build());
        }

        templateRepository.save(copy);
        return toDto(copy, user, true);
    }

    // ============================================================
    // Публичный каталог
    // ============================================================

    /**
     * Каталог публичных шаблонов: поиск по названию/описанию/задачам,
     * сортировка и пагинация.
     *
     * @param sort newest | oldest | title | tasks
     * @param mine true — только свои публичные шаблоны
     */
    @Transactional(readOnly = true)
    public PublicTemplatePageDto listPublic(
            User user, String q, String sort, boolean mine, int page, int size) {

        int safeSize = Math.max(1, Math.min(60, size <= 0 ? 12 : size));
        int safePage = Math.max(0, page);
        String query = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);

        Pageable pageable = PageRequest.of(safePage, safeSize, sortOf(sort));
        Page<TaskTemplate> result = templateRepository.searchPublic(
                user.getId(), mine, query, pageable);

        // Сортировка «по числу задач» считается в памяти (items — LAZY-коллекция,
        // но страница маленькая, а запрос ограничен пагинацией).
        List<TaskTemplate> content = new ArrayList<>(result.getContent());
        if ("tasks".equalsIgnoreCase(sort)) {
            content.sort((a, b) -> Integer.compare(b.getItems().size(), a.getItems().size()));
        }

        List<TaskTemplateDto> items = content.stream()
                .map(template -> toDto(template, user, false))
                .toList();

        return PublicTemplatePageDto.builder()
                .items(items)
                .total(result.getTotalElements())
                .page(result.getNumber())
                .size(result.getSize())
                .totalPages(result.getTotalPages())
                .hasMore(result.hasNext())
                .build();
    }

    private Sort sortOf(String sort) {
        String key = sort == null ? "newest" : sort.toLowerCase(Locale.ROOT);
        return switch (key) {
            case "oldest" -> Sort.by(Sort.Direction.ASC, "updatedAt");
            case "title" -> Sort.by(Sort.Direction.ASC, "title");
            case "tasks" -> Sort.by(Sort.Direction.DESC, "updatedAt");
            default -> Sort.by(Sort.Direction.DESC, "updatedAt");
        };
    }

    // ============================================================
    // Применение
    // ============================================================

    @Transactional
    public ApplyPlanResultDto apply(Long id, ApplyPlanRequest request, User user) {
        TaskTemplate template = requireAccessible(id, user);

        List<PlannedTask> planned = new ArrayList<>();
        for (TaskTemplateItem item : template.getItems()) {
            planned.add(new PlannedTask(
                    item.getTitle(),
                    item.getDescription(),
                    item.getPriority(),
                    item.getStatusCategoryCode(),
                    item.getDeadlineOffsetDays(),
                    item.getEstimatedMinutes(),
                    item.getStartTime() != null ? item.getStartTime().toString() : null,
                    splitSubtasks(item.getSubtasksText())
            ));
        }

        return applyService.apply(planned, request, user,
                template.getTitle(), template.getDescription());
    }

    // ============================================================
    // Helpers
    // ============================================================

    private TaskTemplate requireOwn(Long id, User user) {
        return templateRepository.findByIdAndOwnerId(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Шаблон не найден"));
    }

    /**
     * Свой шаблон — всегда; чужой — только если он публичный.
     */
    private TaskTemplate requireAccessible(Long id, User user) {
        TaskTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Шаблон не найден"));
        boolean mine = template.getOwner() != null
                && template.getOwner().getId().equals(user.getId());
        if (!mine && !Boolean.TRUE.equals(template.getIsPublic())) {
            throw new IllegalArgumentException("Шаблон не найден");
        }
        return template;
    }

    private void applyItems(TaskTemplate template, List<SaveTaskTemplateRequest.Item> items) {
        if (items == null) return;
        int position = 0;
        for (SaveTaskTemplateRequest.Item source : items) {
            if (source == null || source.getTitle() == null || source.getTitle().isBlank()) continue;

            TaskTemplateItem item = TaskTemplateItem.builder()
                    .template(template)
                    .position(position++)
                    .title(source.getTitle().trim())
                    .description(nullToEmpty(source.getDescription()))
                    .priority(normalizePriority(source.getPriority()))
                    .deadlineOffsetDays(source.getDeadlineOffsetDays())
                    .statusCategoryCode(defaultIfBlank(source.getStatusCategoryCode(), "ACTIVE"))
                    .estimatedMinutes(source.getEstimatedMinutes())
                    .startTime(parseTime(source.getStartTime()))
                    .subtasksText(joinSubtasks(source.getSubtasks()))
                    .build();

            template.getItems().add(item);
        }
    }

    private TaskTemplateDto toDto(TaskTemplate template, User viewer, boolean withItems) {
        boolean mine = viewer != null && template.getOwner() != null
                && template.getOwner().getId().equals(viewer.getId());

        List<TaskTemplateItem> source = template.getItems();

        List<TaskTemplateItemDto> items = withItems
                ? source.stream().map(this::toItemDto).toList()
                : List.of();

        User owner = template.getOwner();
        String avatarCode = null;
        String avatarEmoji = null;
        if (owner != null) {
            UserAppearance appearance = userAppearanceRepository.findById(owner.getId()).orElse(null);
            if (appearance != null && appearance.getActiveAvatar() != null) {
                avatarCode = appearance.getActiveAvatar().getCode();
                avatarEmoji = appearance.getActiveAvatar().getEmoji();
            }
        }

        return TaskTemplateDto.builder()
                .id(template.getId())
                .title(template.getTitle())
                .description(template.getDescription())
                .icon(template.getIcon())
                .accent(template.getAccent())
                .isPublic(Boolean.TRUE.equals(template.getIsPublic()))
                .mine(mine)
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .ownerId(owner != null ? owner.getId() : null)
                .ownerUsername(owner != null ? owner.getUsername() : null)
                .ownerDisplayName(ownerDisplayName(owner))
                .ownerAvatarCode(avatarCode)
                .ownerAvatarEmoji(avatarEmoji)
                .itemCount(source.size())
                .items(items)
                .build();
    }

    private TaskTemplateItemDto toItemDto(TaskTemplateItem item) {
        return TaskTemplateItemDto.builder()
                .id(item.getId())
                .position(item.getPosition())
                .title(item.getTitle())
                .description(item.getDescription())
                .priority(item.getPriority())
                .deadlineOffsetDays(item.getDeadlineOffsetDays())
                .statusCategoryCode(item.getStatusCategoryCode())
                .estimatedMinutes(item.getEstimatedMinutes())
                .startTime(item.getStartTime() != null ? item.getStartTime().toString() : null)
                .subtasks(splitSubtasks(item.getSubtasksText()))
                .build();
    }

    private String ownerDisplayName(User owner) {
        if (owner == null) return null;
        if (owner.getProfile() != null && owner.getProfile().getDisplayName() != null
                && !owner.getProfile().getDisplayName().isBlank()) {
            return owner.getProfile().getDisplayName();
        }
        return owner.getUsername();
    }

    static List<String> splitSubtasks(String text) {
        if (text == null || text.isBlank()) return new ArrayList<>();
        return Arrays.stream(text.split("\\r?\\n"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    private String joinSubtasks(List<String> subtasks) {
        if (subtasks == null || subtasks.isEmpty()) return "";
        return subtasks.stream()
                .filter(s -> s != null && !s.isBlank())
                .map(String::trim)
                .reduce((a, b) -> a + "\n" + b)
                .orElse("");
    }

    private Short normalizePriority(Short priority) {
        if (priority == null) return 0;
        // -1 — низкий приоритет (одна звезда в PriorityPicker), 0 — обычный.
        if (priority < -1) return -1;
        if (priority > 5) return 5;
        return priority;
    }

    private LocalTime parseTime(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalTime.parse(value.length() == 5 ? value : value.substring(0, 5));
        } catch (DateTimeParseException | StringIndexOutOfBoundsException e) {
            return null;
        }
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
