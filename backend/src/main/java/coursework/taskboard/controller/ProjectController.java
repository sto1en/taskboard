package coursework.taskboard.controller;

import coursework.taskboard.dto.project.*;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.project.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final CurrentUserService currentUserService;

    @GetMapping("/boards/{boardId}/projects")
    public ResponseEntity<List<ProjectDto>> listByBoard(@PathVariable Long boardId) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(projectService.getBoardProjects(boardId, user));
    }

    @GetMapping("/projects/{id}")
    public ResponseEntity<ProjectDto> get(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(projectService.getProject(id, user));
    }

    @PostMapping("/boards/{boardId}/projects")
    public ResponseEntity<ProjectDto> create(@PathVariable Long boardId,
                                             @Valid @RequestBody CreateProjectRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(projectService.createProject(boardId, request, user));
    }

    @PatchMapping("/projects/{id}")
    public ResponseEntity<ProjectDto> update(@PathVariable Long id,
                                             @Valid @RequestBody UpdateProjectRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(projectService.updateProject(id, request, user));
    }

    @DeleteMapping("/projects/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        projectService.deleteProject(id, user);
        return ResponseEntity.noContent().build();
    }
}