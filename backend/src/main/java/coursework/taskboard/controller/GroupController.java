package coursework.taskboard.controller;

import coursework.taskboard.dto.board.BoardMemberDto;
import coursework.taskboard.dto.group.*;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.group.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Групповые проекты.
 *
 * Все эндпоинты работают через project_members и не требуют членства
 * в доске-носителе. Данные самой доски здесь не отдаются.
 */
@RestController
@RequestMapping("/api/group")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;
    private final CurrentUserService currentUserService;

    @GetMapping("/projects")
    public ResponseEntity<List<GroupProjectDto>> list() {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(groupService.list(user));
    }

    @PostMapping("/projects")
    public ResponseEntity<GroupProjectDto> create(
            @Valid @RequestBody CreateGroupProjectRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(groupService.create(user, request));
    }

    @GetMapping("/projects/{id}")
    public ResponseEntity<GroupWorkspaceDto> get(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(groupService.getWorkspace(id, user));
    }

    @PatchMapping("/projects/{id}")
    public ResponseEntity<GroupProjectDto> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateGroupProjectRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(groupService.update(id, request, user));
    }

    @DeleteMapping("/projects/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        groupService.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/projects/{id}/members")
    public ResponseEntity<List<BoardMemberDto>> members(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(groupService.members(id, user));
    }

    @PostMapping("/projects/{id}/invite")
    public ResponseEntity<GroupInviteDto> invite(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(groupService.invite(id, user));
    }

    @DeleteMapping("/projects/{id}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long id,
                                             @PathVariable Long userId) {
        User user = currentUserService.getCurrentUser();
        groupService.removeMember(id, userId, user);
        return ResponseEntity.noContent().build();
    }

    /** Превью приглашения: название проекта и срок действия. */
    @GetMapping("/invites/{token}")
    public ResponseEntity<GroupInviteDto> preview(@PathVariable String token) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(groupService.previewInvite(token, user));
    }

    @PostMapping("/join/{token}")
    public ResponseEntity<GroupWorkspaceDto> join(@PathVariable String token) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(groupService.join(token, user));
    }
}
