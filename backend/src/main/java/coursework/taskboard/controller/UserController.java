package coursework.taskboard.controller;

import coursework.taskboard.dto.user.*;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<UserDto> getMe() {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userService.getMe(user));
    }

    @PatchMapping("/profile")
    public ResponseEntity<UserProfileDto> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userService.updateProfile(user, request));
    }

    @PatchMapping("/appearance")
    public ResponseEntity<UserAppearanceDto> updateAppearance(@Valid @RequestBody UpdateAppearanceRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userService.updateAppearance(user, request));
    }

    @PatchMapping("/locale")
    public ResponseEntity<UserLocaleDto> updateLocale(@Valid @RequestBody UpdateLocaleRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userService.updateLocale(user, request));
    }

    @PatchMapping("/workspace")
    public ResponseEntity<UserWorkspaceDto> updateWorkspace(@Valid @RequestBody UpdateWorkspaceRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userService.updateWorkspace(user, request));
    }

    @PatchMapping("/display")
    public ResponseEntity<UserDisplayDto> updateDisplay(@Valid @RequestBody UpdateDisplayRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userService.updateDisplay(user, request));
    }

    @PatchMapping("/notification")
    public ResponseEntity<UserNotificationDto> updateNotification(@Valid @RequestBody UpdateNotificationRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userService.updateNotification(user, request));
    }
}