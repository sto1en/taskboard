package coursework.taskboard.controller;

import coursework.taskboard.dto.task.*;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.task.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final CurrentUserService currentUserService;

    @GetMapping("/projects/{projectId}/tasks")
    public ResponseEntity<List<TaskShortDto>> list(@PathVariable Long projectId) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(taskService.getProjectTasks(projectId, user));
    }

    @GetMapping("/projects/{projectId}/kanban")
    public ResponseEntity<KanbanDto> kanban(@PathVariable Long projectId) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(taskService.getProjectKanban(projectId, user));
    }

    @GetMapping("/tasks/{id}")
    public ResponseEntity<TaskDto> get(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(taskService.getTask(id, user));
    }

    @PostMapping("/projects/{projectId}/tasks")
    public ResponseEntity<TaskDto> create(@PathVariable Long projectId,
                                          @Valid @RequestBody CreateTaskRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(taskService.createTask(projectId, request, user));
    }

    @PatchMapping("/tasks/{id}")
    public ResponseEntity<TaskDto> update(@PathVariable Long id,
                                          @Valid @RequestBody UpdateTaskRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(taskService.updateTask(id, request, user));
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        taskService.deleteTask(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/tasks/{taskId}/attachments")
    public ResponseEntity<Void> attach(@PathVariable Long taskId,
                                       @Valid @RequestBody AttachRequest request) {
        User user = currentUserService.getCurrentUser();
        taskService.attachAttachment(taskId, request.getAttachmentId(), user);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/tasks/{taskId}/attachments/{attachmentId}")
    public ResponseEntity<Void> detach(@PathVariable Long taskId,
                                       @PathVariable Long attachmentId) {
        User user = currentUserService.getCurrentUser();
        taskService.detachAttachment(taskId, attachmentId, user);
        return ResponseEntity.noContent().build();
    }

    // ============================================================
    // Reschedule
    // ============================================================

    @GetMapping("/tasks/reschedule-candidates")
    public ResponseEntity<List<TaskShortDto>> rescheduleCandidates() {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(taskService.getRescheduleCandidates(user));
    }

    @PatchMapping("/tasks/{id}/snooze-reschedule")
    public ResponseEntity<Void> snoozeReschedule(
            @PathVariable Long id,
            @RequestParam(defaultValue = "24") int hours) {
        User user = currentUserService.getCurrentUser();
        taskService.snoozeReschedule(id, hours, user);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/tasks/{id}/move-date")
    public ResponseEntity<Void> moveDate(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        User user = currentUserService.getCurrentUser();
        taskService.moveDeadline(id, date, user);
        return ResponseEntity.noContent().build();
    }
}