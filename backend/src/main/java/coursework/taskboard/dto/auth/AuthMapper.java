package coursework.taskboard.dto.auth;

import coursework.taskboard.model.user.*;
import org.springframework.stereotype.Component;

@Component
public class AuthMapper {

    public User toUser(RegisterRequestDto request, String passwordHash) {
        return User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordHash)
                .build();
    }

    public UserSettings toUserSettings(User user) {
        return UserSettings.builder()
                .user(user)
                .defaultLandingPage("boards")
                .build();
    }

    public UserProfile toUserProfile(User user, String displayName) {
        return UserProfile.builder()
                .user(user)
                .displayName(displayName)
                .build();
    }

    public UserAppearance toUserAppearance(UserSettings settings) {
        return UserAppearance.builder()
                .settings(settings)
                .theme("light")
                .accentCode("blue")
                .density("cozy")
                .sidebarCollapsed(false)
                .build();
    }

    public UserLocale toUserLocale(UserSettings settings) {
        return UserLocale.builder()
                .settings(settings)
                .language("ru")
                .timezone("Europe/Moscow")
                .build();
    }

    public UserWorkspace toUserWorkspace(UserSettings settings) {
        return UserWorkspace.builder()
                .settings(settings)
                .tasksPerPage((short) 50)
                .confirmBeforeDelete(true)
                .build();
    }

    public UserDisplay toUserDisplay(UserSettings settings) {
        return UserDisplay.builder()
                .settings(settings)
                .taskSortMode("manual")
                .taskSortDir("asc")
                .projectViewMode("auto")
                .build();
    }

    public UserNotification toUserNotification(UserSettings settings) {
        return UserNotification.builder()
                .settings(settings)
                .notifyEmail(true)
                .notifyDeadline(true)
                .notifyDigest("daily")
                .remindBeforeDays((short) 1)
                .build();
    }

    public AuthResponseDto toAuthResponse(User user, String displayName, String token) {
        return AuthResponseDto.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .displayName(displayName)
                .build();
    }
}