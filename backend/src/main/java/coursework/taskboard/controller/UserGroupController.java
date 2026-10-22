package coursework.taskboard.controller;

import coursework.taskboard.dto.usergroup.*;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.usergroup.UserGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Пользовательские группы и приглашения из них.
 *
 * GET  /api/user-groups                          — мои группы
 * POST /api/user-groups                          — создать группу
 * PATCH/DELETE /api/user-groups/{id}             — переименовать/удалить
 * POST /api/user-groups/{id}/members             — пригласить человека
 * DELETE /api/user-groups/{id}/members/{userId}  — убрать/выйти
 * GET  /api/user-groups/invitations              — входящие приглашения в группы
 * POST /api/user-groups/invitations/{id}/accept  — принять (создаст зеркальную)
 * POST /api/user-groups/invitations/{id}/decline — отклонить
 * POST /api/user-groups/{id}/projects/{projectId}/invite — пригласить всю группу
 * GET  /api/user-groups/project-invitations      — приглашения в кооп-проекты
 * DELETE /api/user-groups/project-invitations/{token} — отклонить
 */
@RestController
@RequestMapping("/api/user-groups")
@RequiredArgsConstructor
public class UserGroupController {

    private final UserGroupService userGroupService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<List<UserGroupDto>> list() {
        return ResponseEntity.ok(userGroupService.list(currentUserService.getCurrentUser()));
    }

    @PostMapping
    public ResponseEntity<UserGroupDto> create(@Valid @RequestBody CreateUserGroupRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userGroupService.create(user, request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<UserGroupDto> rename(@PathVariable Long id,
                                               @Valid @RequestBody UpdateUserGroupRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userGroupService.rename(id, request, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userGroupService.delete(id, currentUserService.getCurrentUser());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<UserGroupDto> addMember(@PathVariable Long id,
                                                  @Valid @RequestBody AddUserGroupMemberRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userGroupService.addMember(id, request, user));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        userGroupService.removeMember(id, userId, currentUserService.getCurrentUser());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/invitations")
    public ResponseEntity<List<UserGroupInviteDto>> groupInvites() {
        return ResponseEntity.ok(userGroupService.incomingGroupInvites(
                currentUserService.getCurrentUser()));
    }

    @PostMapping("/invitations/{id}/accept")
    public ResponseEntity<UserGroupDto> acceptGroupInvite(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userGroupService.acceptGroupInvite(id, user));
    }

    @PostMapping("/invitations/{id}/decline")
    public ResponseEntity<Void> declineGroupInvite(@PathVariable Long id) {
        userGroupService.declineGroupInvite(id, currentUserService.getCurrentUser());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/projects/{projectId}/invite")
    public ResponseEntity<GroupInviteResultDto> inviteGroupToProject(
            @PathVariable Long id,
            @PathVariable Long projectId) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userGroupService.inviteGroupToProject(id, projectId, user));
    }

    @GetMapping("/project-invitations")
    public ResponseEntity<List<GroupProjectInviteDto>> projectInvites() {
        return ResponseEntity.ok(userGroupService.incomingProjectInvites(
                currentUserService.getCurrentUser()));
    }

    @DeleteMapping("/project-invitations/{token}")
    public ResponseEntity<Void> declineProjectInvite(@PathVariable String token) {
        userGroupService.declineProjectInvite(token, currentUserService.getCurrentUser());
        return ResponseEntity.noContent().build();
    }
}
