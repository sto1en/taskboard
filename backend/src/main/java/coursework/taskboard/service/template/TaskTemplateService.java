package coursework.taskboard.service.template;

import coursework.taskboard.dto.template.*;
import coursework.taskboard.model.template.TaskTemplate;
import coursework.taskboard.model.template.TaskTemplateItem;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.template.TaskTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskTemplateService {

    private final TaskTemplateRepository templateRepository;
    private final TemplateApplyService applyService;

    // ============================================================
    // CRUD
    // ============================================================

    @Transactional(readOnly = true)
    public List<TaskTemplateDto> list(User user) {
        return templateRepository.findByOwnerIdOrderByUpdatedAtDesc(user.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskTemplateDto get(Long id, User user) {
        return toDto(requireOwn(id, user));
    }

    @Transactional
    public TaskTemplateDto create(SaveTaskTemplateRequest request, User user) {
        TaskTemplate template = TaskTemplate.builder()
                .owner(user)
                .title(request.getTitle().trim())
                .description(nullToEmpty(request.getDescription()))
                .icon(defaultIfBlank(request.getIcon(), "🧩"))
                .accent(defaultIfBlank(request.getAccent(), "blue"))
                .build();

        applyItems(template, request.getItems());
        templateRepository.save(template);
        return toDto(template);
    }

    @Transactional
    public TaskTemplateDto update(Long id, SaveTaskTemplateRequest request, User user) {
        TaskTemplate template = requireOwn(id, user);

        template.setTitle(request.getTitle().trim());
        template.setDescription(nullToEmpty(request.getDescription()));
        template.setIcon(defaultIfBlank(request.getIcon(), "🧩"));
        template.setAccent(defaultIfBlank(request.getAccent(), "blue"));

        template.getItems().clear();
        applyItems(template, request.getItems());

        templateRepository.save(template);
        return toDto(template);
    }

    @Transactional
    public void delete(Long id, User user) {
        templateRepository.delete(requireOwn(id, user));
    }

    // ============================================================
    // Применение
    // ============================================================

    @Transactional
    public ApplyPlanResultDto apply(Long id, ApplyPlanRequest request, User user) {
        TaskTemplate template = requireOwn(id, user);

        List<PlannedTask> planned = new ArrayList<>();
        for (TaskTemplateItem item : template.getItems()) {
            planned.add(new PlannedTask(
                    item.getTitle(),
                    item.getDescription(),
                    item.getPriority(),
                    item.getStatusCategoryCode(),
                    item.getDeadlineOffsetDays(),
                    item.getEstimatedMinutes(),
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

    private TaskTemplateDto toDto(TaskTemplate template) {
        List<TaskTemplateItemDto> items = template.getItems().stream()
                .map(item -> TaskTemplateItemDto.builder()
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
                        .build())
                .toList();

        return TaskTemplateDto.builder()
                .id(template.getId())
                .title(template.getTitle())
                .description(template.getDescription())
                .icon(template.getIcon())
                .accent(template.getAccent())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .items(items)
                .build();
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
