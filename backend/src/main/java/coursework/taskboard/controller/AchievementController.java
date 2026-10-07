package coursework.taskboard.controller;

import coursework.taskboard.dto.achievement.AchievementDto;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.achievement.AchievementService;
import coursework.taskboard.service.auth.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<List<AchievementDto>> getAll() {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(achievementService.getForUser(user));
    }
}