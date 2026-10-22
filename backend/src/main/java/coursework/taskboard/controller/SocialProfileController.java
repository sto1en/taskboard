package coursework.taskboard.controller;

import coursework.taskboard.dto.achievement.AchievementDto;
import coursework.taskboard.dto.social.*;
import coursework.taskboard.dto.user.UserProfileDto;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.social.SocialProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Социальная часть профиля: стена, друзья, витрина достижений, фон.
 * Всё доступно только авторизованным пользователям.
 */
@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class SocialProfileController {

    private final SocialProfileService socialProfileService;
    private final CurrentUserService currentUserService;

    // ---------- Профиль ----------

    @GetMapping("/profiles/{id}")
    public ResponseEntity<PublicProfileDto> getProfile(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(socialProfileService.getProfile(user, id));
    }

    @PutMapping("/me/background")
    public ResponseEntity<UserProfileDto> updateBackground(
            @Valid @RequestBody UpdateBackgroundRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(
                socialProfileService.updateBackground(user, request.getBackgroundCode()));
    }

    @PutMapping("/me/showcase")
    public ResponseEntity<List<AchievementDto>> updateShowcase(
            @Valid @RequestBody UpdateShowcaseRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(
                socialProfileService.updateShowcase(user, request.getAchievementCodes()));
    }

    // ---------- Друзья ----------

    @GetMapping("/friends")
    public ResponseEntity<FriendListDto> friends() {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(socialProfileService.getFriends(user));
    }

    @PostMapping("/friends/{id}")
    public ResponseEntity<FriendListDto> addFriend(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(socialProfileService.sendRequest(user, id));
    }

    @PostMapping("/friends/{id}/accept")
    public ResponseEntity<FriendListDto> acceptFriend(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(socialProfileService.acceptRequest(user, id));
    }

    @DeleteMapping("/friends/{id}")
    public ResponseEntity<FriendListDto> removeFriend(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(socialProfileService.removeFriend(user, id));
    }

    // ---------- Стена ----------

    @GetMapping("/profiles/{id}/wall")
    public ResponseEntity<List<ProfileWallPostDto>> wall(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(socialProfileService.getWall(user, id));
    }

    @PostMapping("/profiles/{id}/wall")
    public ResponseEntity<List<ProfileWallPostDto>> addWallPost(
            @PathVariable Long id,
            @Valid @RequestBody ProfileWallPostRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(
                socialProfileService.addWallPost(user, id, request.getBody()));
    }

    @DeleteMapping("/profiles/{id}/wall/{postId}")
    public ResponseEntity<List<ProfileWallPostDto>> deleteWallPost(
            @PathVariable Long id,
            @PathVariable Long postId) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(
                socialProfileService.deleteWallPost(user, id, postId));
    }
}
