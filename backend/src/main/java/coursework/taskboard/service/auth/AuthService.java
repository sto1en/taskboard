package coursework.taskboard.service.auth;

import coursework.taskboard.dto.auth.*;
import coursework.taskboard.model.user.*;
import coursework.taskboard.repository.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserAppearanceRepository userAppearanceRepository;
    private final UserLocaleRepository userLocaleRepository;
    private final UserWorkspaceRepository userWorkspaceRepository;
    private final UserDisplayRepository userDisplayRepository;
    private final UserNotificationRepository userNotificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    private final AuthMapper authMapper;

    @Transactional
    public AuthResponseDto register(RegisterRequestDto request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already taken");
        }
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        // 1. User
        User user = authMapper.toUser(request, passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        // 2. UserSettings
        UserSettings settings = authMapper.toUserSettings(user);
        userSettingsRepository.save(settings);

        // 3. UserProfile
        userProfileRepository.save(authMapper.toUserProfile(user, request.getDisplayName()));

        // 4-8. Внешний вид, локаль, рабочее пространство, отображение, уведомления
        userAppearanceRepository.save(authMapper.toUserAppearance(settings));
        userLocaleRepository.save(authMapper.toUserLocale(settings));
        userWorkspaceRepository.save(authMapper.toUserWorkspace(settings));
        userDisplayRepository.save(authMapper.toUserDisplay(settings));
        userNotificationRepository.save(authMapper.toUserNotification(settings));

        // 9. Токен
        String token = jwtService.generateToken(user.getId(), user.getUsername());

        return authMapper.toAuthResponse(user, request.getDisplayName(), token);
    }

    public AuthResponseDto login(LoginRequestDto request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(), request.getPassword()));

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        userSettingsRepository.findById(user.getId()).ifPresent(settings -> {
            settings.setLastActiveAt(LocalDateTime.now());
            userSettingsRepository.save(settings);
        });

        String displayName = userProfileRepository.findById(user.getId())
                .map(UserProfile::getDisplayName)
                .orElse(user.getUsername());

        String token = jwtService.generateToken(user.getId(), user.getUsername());

        return authMapper.toAuthResponse(user, displayName, token);
    }
}