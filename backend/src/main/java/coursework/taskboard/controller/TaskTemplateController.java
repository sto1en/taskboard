package coursework.taskboard.controller;

import coursework.taskboard.dto.template.ApplyPlanRequest;
import coursework.taskboard.dto.template.ApplyPlanResultDto;
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

/**
 * Шаблоны задач: личный конструктор повторяющихся наборов задач.
 */
@RestController
@RequestMapping("/api/task-templates")
@RequiredArgsConstructor
public class TaskTemplateController {

    private final TaskTemplateService templateService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<List<TaskTemplateDto>> list() {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(templateService.list(user));
    }

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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        templateService.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/apply")
    public ResponseEntity<ApplyPlanResultDto> apply(
            @PathVariable Long id,
            @Valid @RequestBody ApplyPlanRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(templateService.apply(id, request, user));
    }
}
