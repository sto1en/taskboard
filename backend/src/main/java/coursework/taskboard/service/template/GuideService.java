package coursework.taskboard.service.template;

import coursework.taskboard.dto.template.*;
import coursework.taskboard.model.template.Guide;
import coursework.taskboard.model.template.GuideShowcaseEntry;
import coursework.taskboard.model.template.GuideTask;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.template.GuideRepository;
import coursework.taskboard.repository.template.GuideShowcaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class GuideService {

    private static final int SHOWCASE_LIMIT = 4;

    private final GuideRepository guideRepository;
    private final GuideShowcaseRepository showcaseRepository;
    private final TemplateApplyService applyService;

    // ============================================================
    // Чтение
    // ============================================================

    @Transactional(readOnly = true)
    public List<GuideDto> list(User user) {
        List<Guide> own = guideRepository.findByOwnerIdOrderByCreatedAtDesc(user.getId());
        List<Guide> system = guideRepository.findByIsSystemTrueOrderByCreatedAtAsc();

        List<GuideDto> result = new ArrayList<>();
        for (Guide guide : own) result.add(toDto(guide, user));
        for (Guide guide : system) {
            if (result.stream().noneMatch(g -> g.getId().equals(guide.getId()))) {
                result.add(toDto(guide, user));
            }
        }
        return result;
    }

    @Transactional(readOnly = true)
    public GuideDto get(Long id, User user) {
        return toDto(requireAccessible(id, user), user);
    }

    // ============================================================
    // CRUD (только свои гайды; системные копируются)
    // ============================================================

    @Transactional
    public GuideDto create(SaveGuideRequest request, User user) {
        Guide guide = Guide.builder()
                .owner(user)
                .title(request.getTitle().trim())
                .subtitle(nullToEmpty(request.getSubtitle()))
                .description(nullToEmpty(request.getDescription()))
                .periodType(normalizePeriod(request.getPeriodType()))
                .accent(defaultIfBlank(request.getAccent(), "blue"))
                .emoji(defaultIfBlank(request.getEmoji(), "📅"))
                .isSystem(false)
                .build();

        applyTasks(guide, request.getTasks());
        guideRepository.save(guide);
        return toDto(guide, user);
    }

    @Transactional
    public GuideDto update(Long id, SaveGuideRequest request, User user) {
        Guide guide = requireOwn(id, user);

        guide.setTitle(request.getTitle().trim());
        guide.setSubtitle(nullToEmpty(request.getSubtitle()));
        guide.setDescription(nullToEmpty(request.getDescription()));
        guide.setPeriodType(normalizePeriod(request.getPeriodType()));
        guide.setAccent(defaultIfBlank(request.getAccent(), "blue"));
        guide.setEmoji(defaultIfBlank(request.getEmoji(), "📅"));

        guide.getTasks().clear();
        applyTasks(guide, request.getTasks());

        guideRepository.save(guide);
        return toDto(guide, user);
    }

    @Transactional
    public void delete(Long id, User user) {
        Guide guide = requireOwn(id, user);
        showcaseRepository.deleteByGuideId(guide.getId());
        guideRepository.delete(guide);
    }

    @Transactional
    public GuideDto duplicate(Long id, User user) {
        Guide source = requireAccessible(id, user);

        String title = source.getTitle() + " (копия)";
        if (title.length() > 140) title = title.substring(0, 140);

        Guide copy = Guide.builder()
                .owner(user)
                .title(title)
                .subtitle(source.getSubtitle())
                .description(source.getDescription())
                .periodType(source.getPeriodType())
                .accent(source.getAccent())
                .emoji(source.getEmoji())
                .isSystem(false)
                .build();

        int position = 0;
        for (GuideTask task : source.getTasks()) {
            copy.getTasks().add(GuideTask.builder()
                    .guide(copy)
                    .position(position++)
                    .dayOffset(task.getDayOffset())
                    .title(task.getTitle())
                    .description(task.getDescription())
                    .priority(task.getPriority())
                    .statusCategoryCode(task.getStatusCategoryCode())
                    .estimatedMinutes(task.getEstimatedMinutes())
                    .subtasksText(task.getSubtasksText())
                    .build());
        }

        guideRepository.save(copy);
        return toDto(copy, user);
    }

    // ============================================================
    // Применение к доске
    // ============================================================

    @Transactional
    public ApplyPlanResultDto apply(Long id, ApplyPlanRequest request, User user) {
        Guide guide = requireAccessible(id, user);

        List<PlannedTask> planned = new ArrayList<>();
        for (GuideTask task : guide.getTasks()) {
            planned.add(new PlannedTask(
                    task.getTitle(),
                    task.getDescription(),
                    task.getPriority(),
                    task.getStatusCategoryCode(),
                    task.getDayOffset(),
                    task.getEstimatedMinutes(),
                    null,
                    TaskTemplateService.splitSubtasks(task.getSubtasksText())
            ));
        }

        return applyService.apply(planned, request, user,
                guide.getTitle(), guide.getDescription());
    }

    // ============================================================
    // Витрина
    // ============================================================

    @Transactional(readOnly = true)
    public List<GuideDto> getShowcase(User user) {
        return getShowcaseFor(user.getId(), user);
    }

    /**
     * Витрина для «стены» профиля. Если пользователь ещё ничего не выбирал,
     * показываем разумный набор по умолчанию: системные гайды + свой последний.
     */
    @Transactional(readOnly = true)
    public List<GuideDto> getShowcaseFor(Long targetUserId, User viewer) {
        List<GuideShowcaseEntry> entries =
                showcaseRepository.findByUserIdOrderByPositionAsc(targetUserId);

        if (!entries.isEmpty()) {
            List<GuideDto> result = new ArrayList<>();
            for (GuideShowcaseEntry entry : entries) {
                result.add(toDto(entry.getGuide(), viewer));
            }
            return result;
        }

        List<GuideDto> defaults = new ArrayList<>();
        for (Guide guide : guideRepository.findByIsSystemTrueOrderByCreatedAtAsc()) {
            if (defaults.size() >= 2) break;
            defaults.add(toDto(guide, viewer));
        }
        List<Guide> own = guideRepository.findByOwnerIdOrderByCreatedAtDesc(targetUserId);
        if (!own.isEmpty() && defaults.size() < 3) {
            defaults.add(toDto(own.get(0), viewer));
        }
        return defaults;
    }

    @Transactional
    public List<GuideDto> saveShowcase(User user, List<Long> guideIds) {
        Set<Long> unique = new LinkedHashSet<>();
        if (guideIds != null) {
            for (Long id : guideIds) {
                if (id != null) unique.add(id);
            }
        }
        if (unique.size() > SHOWCASE_LIMIT) {
            throw new IllegalArgumentException(
                    "В витрину можно добавить не больше " + SHOWCASE_LIMIT + " гайдов");
        }

        List<Guide> guides = new ArrayList<>();
        for (Long id : unique) {
            guides.add(requireAccessible(id, user));
        }

        showcaseRepository.deleteByUserId(user.getId());
        showcaseRepository.flush();
        int position = 0;
        for (Guide guide : guides) {
            showcaseRepository.save(GuideShowcaseEntry.builder()
                    .user(user)
                    .guide(guide)
                    .position(position++)
                    .build());
        }

        return getShowcase(user);
    }

    // ============================================================
    // Helpers
    // ============================================================

    private Guide requireOwn(Long id, User user) {
        Guide guide = requireAccessible(id, user);
        if (Boolean.TRUE.equals(guide.getIsSystem())
                || guide.getOwner() == null
                || !guide.getOwner().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Этот гайд нельзя изменить — скопируйте его себе");
        }
        return guide;
    }

    private Guide requireAccessible(Long id, User user) {
        Guide guide = guideRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Гайд не найден"));
        boolean system = Boolean.TRUE.equals(guide.getIsSystem());
        boolean mine = guide.getOwner() != null
                && guide.getOwner().getId().equals(user.getId());
        if (!system && !mine) {
            throw new IllegalArgumentException("Гайд не найден");
        }
        return guide;
    }

    private void applyTasks(Guide guide, List<SaveGuideRequest.Task> tasks) {
        if (tasks == null) return;
        int position = 0;
        for (SaveGuideRequest.Task source : tasks) {
            if (source == null || source.getTitle() == null || source.getTitle().isBlank()) continue;

            guide.getTasks().add(GuideTask.builder()
                    .guide(guide)
                    .position(position++)
                    .dayOffset(source.getDayOffset() != null
                            ? Math.max(0, source.getDayOffset())
                            : 0)
                    .title(source.getTitle().trim())
                    .description(nullToEmpty(source.getDescription()))
                    .priority(normalizePriority(source.getPriority()))
                    .statusCategoryCode(defaultIfBlank(source.getStatusCategoryCode(), "ACTIVE"))
                    .estimatedMinutes(source.getEstimatedMinutes())
                    .subtasksText(joinSubtasks(source.getSubtasks()))
                    .build());
        }
    }

    private GuideDto toDto(Guide guide, User viewer) {
        List<GuideTaskDto> tasks = guide.getTasks().stream()
                .map(task -> GuideTaskDto.builder()
                        .id(task.getId())
                        .position(task.getPosition())
                        .dayOffset(task.getDayOffset())
                        .title(task.getTitle())
                        .description(task.getDescription())
                        .priority(task.getPriority())
                        .statusCategoryCode(task.getStatusCategoryCode())
                        .estimatedMinutes(task.getEstimatedMinutes())
                        .subtasks(TaskTemplateService.splitSubtasks(task.getSubtasksText()))
                        .build())
                .toList();

        boolean mine = guide.getOwner() != null && viewer != null
                && guide.getOwner().getId().equals(viewer.getId());

        return GuideDto.builder()
                .id(guide.getId())
                .title(guide.getTitle())
                .subtitle(guide.getSubtitle())
                .description(guide.getDescription())
                .periodType(guide.getPeriodType())
                .accent(guide.getAccent())
                .emoji(guide.getEmoji())
                .isSystem(guide.getIsSystem())
                .mine(mine)
                .createdAt(guide.getCreatedAt())
                .updatedAt(guide.getUpdatedAt())
                .taskCount(tasks.size())
                .tasks(tasks)
                .build();
    }

    private String normalizePeriod(String value) {
        if (value == null) return "WEEK";
        String upper = value.toUpperCase();
        if (upper.equals("WEEK") || upper.equals("MONTH") || upper.equals("CUSTOM")) {
            return upper;
        }
        return "WEEK";
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
        if (priority < 0) return 0;
        if (priority > 5) return 5;
        return priority;
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
