package coursework.taskboard.controller;

import coursework.taskboard.dto.leaderboard.LeaderboardDto;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.leaderboard.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<LeaderboardDto> get() {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(leaderboardService.getLeaderboard(user));
    }
}
