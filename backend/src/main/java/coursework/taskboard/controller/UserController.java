package coursework.taskboard.controller;

import coursework.taskboard.dto.user.*;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final CurrentUserService currentUserService;

    // ============================================================
    // Поиск пользователей (для приглашения в доску)
    // ============================================================
    @GetMapping("/search")
    public ResponseEntity<List<UserSearchDto>> search(@RequestParam(required = false) String q) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userService.searchUsers(q, user));
    }

    // ============================================================
    // Свой профиль
    // ============================================================
    @GetMapping("/me")
    public ResponseEntity<UserDto> getMe() {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userService.getMe(user));
    }

    @PatchMapping("/me/profile")
    public ResponseEntity<UserProfileDto> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userService.updateProfile(user, request));
    }

    @PatchMapping("/me/appearance")
    public ResponseEntity<UserAppearanceDto> updateAppearance(@Valid @RequestBody UpdateAppearanceRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userService.updateAppearance(user, request));
    }

    @PatchMapping("/me/locale")
    public ResponseEntity<UserLocaleDto> updateLocale(@Valid @RequestBody UpdateLocaleRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userService.updateLocale(user, request));
    }

    @PatchMapping("/me/workspace")
    public ResponseEntity<UserWorkspaceDto> updateWorkspace(@Valid @RequestBody UpdateWorkspaceRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userService.updateWorkspace(user, request));
    }

    @PatchMapping("/me/display")
    public ResponseEntity<UserDisplayDto> updateDisplay(@Valid @RequestBody UpdateDisplayRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userService.updateDisplay(user, request));
    }

    @PatchMapping("/me/notification")
    public ResponseEntity<UserNotificationDto> updateNotification(@Valid @RequestBody UpdateNotificationRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userService.updateNotification(user, request));
    }
}