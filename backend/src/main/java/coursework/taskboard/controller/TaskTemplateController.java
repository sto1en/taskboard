package coursework.taskboard.controller;

import coursework.taskboard.dto.template.ApplyPlanRequest;
import coursework.taskboard.dto.template.ApplyPlanResultDto;
import coursework.taskboard.dto.template.PublicTemplatePageDto;
import coursework.taskboard.dto.template.SaveTaskTemplateRequest;
import coursework.taskboard.dto.template.TaskTemplateDto;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.template.TaskTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Шаблоны задач: личный конструктор повторяющихся наборов задач
 * и каталог публичных шаблонов пользователей.
 */
@RestController
@RequestMapping("/api/task-templates")
@RequiredArgsConstructor
public class TaskTemplateController {

    private final TaskTemplateService templateService;
    private final CurrentUserService currentUserService;

    // ---------- Свои шаблоны ----------

    @GetMapping
    public ResponseEntity<List<TaskTemplateDto>> list() {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(templateService.list(user));
    }

    // ---------- Публичный каталог ----------

    /**
     * Каталог публичных шаблонов: поиск по названию/описанию/задачам,
     * сортировка, пагинация. {@code mine=true} — только свои публичные.
     */
    @GetMapping("/public")
    public ResponseEntity<PublicTemplatePageDto> listPublic(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "sort", required = false, defaultValue = "newest") String sort,
            @RequestParam(name = "mine", required = false, defaultValue = "false") boolean mine,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "12") int size) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(templateService.listPublic(user, q, sort, mine, page, size));
    }

    // ---------- Один шаблон ----------

    @GetMapping("/{id}")
    public ResponseEntity<TaskTemplateDto> get(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(templateService.get(id, user));
    }

    @PostMapping
    public ResponseEntity<TaskTemplateDto> create(
            @Valid @RequestBody SaveTaskTemplateRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(templateService.create(request, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskTemplateDto> update(
            @PathVariable Long id,
            @Valid @RequestBody SaveTaskTemplateRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(templateService.update(id, request, user));
    }

    /** Быстрое переключение публичности: {"isPublic": true}. */
    @PatchMapping("/{id}/visibility")
    public ResponseEntity<TaskTemplateDto> setVisibility(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        User user = currentUserService.getCurrentUser();
        boolean isPublic = Boolean.TRUE.equals(body.get("isPublic"))
                || "true".equals(String.valueOf(body.get("isPublic")));
        return ResponseEntity.ok(templateService.setPublic(id, isPublic, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        templateService.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    /** Копия чужого публичного шаблона в свои. */
    @PostMapping("/{id}/duplicate")
    public ResponseEntity<TaskTemplateDto> duplicate(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(templateService.duplicate(id, user));
    }

    @PostMapping("/{id}/apply")
    public ResponseEntity<ApplyPlanResultDto> apply(
            @PathVariable Long id,
            @Valid @RequestBody ApplyPlanRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(templateService.apply(id, request, user));
    }
}
