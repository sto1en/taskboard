package coursework.taskboard.service.social;

import coursework.taskboard.dto.achievement.AchievementDto;
import coursework.taskboard.dto.social.*;
import coursework.taskboard.dto.shop.BackgroundDto;
import coursework.taskboard.dto.user.UserProfileDto;
import coursework.taskboard.model.achievement.Achievement;
import coursework.taskboard.model.achievement.UserAchievement;
import coursework.taskboard.model.attachment.AttachmentMeta;
import coursework.taskboard.model.shop.ProfileBackground;
import coursework.taskboard.model.social.Friendship;
import coursework.taskboard.model.social.ProfileShowcase;
import coursework.taskboard.model.social.ProfileWallPost;
import coursework.taskboard.model.user.User;
import coursework.taskboard.model.user.UserAppearance;
import coursework.taskboard.model.user.UserLocale;
import coursework.taskboard.model.user.UserProfile;
import coursework.taskboard.repository.achievement.AchievementRepository;
import coursework.taskboard.repository.achievement.UserAchievementRepository;
import coursework.taskboard.repository.attachment.AttachmentMetaRepository;
import coursework.taskboard.repository.shop.UserCurrencyRepository;
import coursework.taskboard.repository.shop.ProfileBackgroundRepository;
import coursework.taskboard.repository.shop.UserBackgroundRepository;
import coursework.taskboard.repository.social.FriendshipRepository;
import coursework.taskboard.repository.social.ProfileShowcaseRepository;
import coursework.taskboard.repository.social.ProfileWallPostRepository;
import coursework.taskboard.repository.task.TaskRepository;
import coursework.taskboard.repository.user.UserAppearanceRepository;
import coursework.taskboard.repository.user.UserLocaleRepository;
import coursework.taskboard.repository.user.UserProfileRepository;
import coursework.taskboard.repository.user.UserRepository;
import coursework.taskboard.service.achievement.AchievementService;
import coursework.taskboard.service.template.GuideService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SocialProfileService {

    private static final String DEFAULT_TIMEZONE = "Europe/Moscow";
    private static final int SHOWCASE_LIMIT = 3;

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserAppearanceRepository userAppearanceRepository;
    private final UserLocaleRepository userLocaleRepository;
    private final AttachmentMetaRepository attachmentMetaRepository;
    private final UserCurrencyRepository userCurrencyRepository;
    private final ProfileBackgroundRepository profileBackgroundRepository;
    private final UserBackgroundRepository userBackgroundRepository;

    private final TaskRepository taskRepository;
    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final AchievementService achievementService;

    private final FriendshipRepository friendshipRepository;
    private final ProfileWallPostRepository wallPostRepository;
    private final ProfileShowcaseRepository showcaseRepository;

    private final GuideService guideService;

    @Value("${app.upload.base-url}")
    private String uploadBaseUrl;

    // ============================================================
    // Публичный профиль
    // ============================================================

    @Transactional(readOnly = true)
    public PublicProfileDto getProfile(User viewer, Long targetId) {
        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        UserProfile profile = userProfileRepository.findById(targetId).orElse(null);
        UserAppearance appearance = userAppearanceRepository.findById(targetId).orElse(null);

        List<AchievementDto> all = achievementService.getForUser(target);
        List<AchievementDto> unlocked = all.stream()
                .filter(a -> Boolean.TRUE.equals(a.getUnlocked()))
                .sorted(Comparator.comparing(
                        AchievementDto::getUnlockedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        List<AchievementDto> showcase = buildShowcase(target, unlocked);
        List<SocialUserDto> friends = friendsOf(target);

        String backgroundCode = profile != null && profile.getBackgroundCode() != null
                ? profile.getBackgroundCode() : "aurora";
        ProfileBackground activeBackground = profileBackgroundRepository
                .findByCode(backgroundCode).orElse(null);
        boolean self = viewer.getId().equals(target.getId());

        return PublicProfileDto.builder()
                .id(target.getId())
                .username(target.getUsername())
                .displayName(profile != null ? profile.getDisplayName() : target.getUsername())
                .bio(profile != null ? profile.getBio() : null)
                .memberSince(target.getCreatedAt())
                .isAdmin(Boolean.TRUE.equals(target.getIsAdmin()))
                .avatarCode(appearance != null && appearance.getActiveAvatar() != null
                        ? appearance.getActiveAvatar().getCode() : null)
                .avatarEmoji(appearance != null && appearance.getActiveAvatar() != null
                        ? appearance.getActiveAvatar().getEmoji() : null)
                .avatarImageUrl(appearance != null && appearance.getActiveAvatar() != null
                        ? appearance.getActiveAvatar().getImageUrl() : null)
                .avatarUrl(legacyAvatarUrl(profile))
                .frameCssClass(appearance != null && appearance.getActiveFrame() != null
                        ? appearance.getActiveFrame().getCssClass() : null)
                .backgroundCode(backgroundCode)
                .backgroundCssClass(activeBackground != null
                        ? activeBackground.getCssClass() : backgroundCode)
                .backgroundImageUrl(activeBackground != null
                        ? activeBackground.getImageUrl() : null)
                .backgrounds(self ? ownedBackgrounds(target) : List.of())
                .leaves(currentLeaves(target))
                .streakDays(streakFor(target))
                .tasksDoneTotal(taskRepository.countDoneByOwner(target.getId()))
                .achievementsUnlocked(unlocked.size())
                .achievementsTotal(all.size())
                .level(1 + unlocked.size() / 3)
                .friendStatus(friendStatus(viewer, target))
                .friendsCount(friends.size())
                .incomingRequests((int) friendshipRepository.countIncomingForUser(viewer.getId()))
                .friends(friends)
                .achievements(unlocked)
                .showcase(showcase)
                .guideShowcase(guideService.getShowcaseFor(target.getId(), viewer))
                .wall(buildWall(target, viewer))
                .build();
    }

    /** Мини-профиль для карточек друзей/авторов. */
    @Transactional(readOnly = true)
    public SocialUserDto toSocialUser(User user) {
        UserProfile profile = userProfileRepository.findById(user.getId()).orElse(null);
        UserAppearance appearance = userAppearanceRepository.findById(user.getId()).orElse(null);
        return SocialUserDto.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .displayName(profile != null ? profile.getDisplayName() : user.getUsername())
                .avatarCode(appearance != null && appearance.getActiveAvatar() != null
                        ? appearance.getActiveAvatar().getCode() : null)
                .avatarEmoji(appearance != null && appearance.getActiveAvatar() != null
                        ? appearance.getActiveAvatar().getEmoji() : null)
                .avatarImageUrl(appearance != null && appearance.getActiveAvatar() != null
                        ? appearance.getActiveAvatar().getImageUrl() : null)
                .avatarUrl(legacyAvatarUrl(profile))
                .frameCssClass(appearance != null && appearance.getActiveFrame() != null
                        ? appearance.getActiveFrame().getCssClass() : null)
                .build();
    }

    // ============================================================
    // Друзья
    // ============================================================

    @Transactional(readOnly = true)
    public FriendListDto getFriends(User user) {
        List<SocialUserDto> friends = friendsOf(user);
        List<SocialUserDto> incoming = friendshipRepository
                .findIncomingRequests(user.getId()).stream()
                .map(f -> toSocialUser(f.getRequester()))
                .toList();
        List<SocialUserDto> outgoing = friendshipRepository
                .findOutgoingRequests(user.getId()).stream()
                .map(f -> toSocialUser(f.getAddressee()))
                .toList();

        return FriendListDto.builder()
                .friends(friends)
                .incoming(incoming)
                .outgoing(outgoing)
                .friendsCount(friends.size())
                .incomingCount(incoming.size())
                .build();
    }

    @Transactional
    public FriendListDto sendRequest(User user, Long targetId) {
        if (user.getId().equals(targetId)) {
            throw new IllegalArgumentException("Нельзя добавить себя в друзья");
        }
        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        Optional<Friendship> direct = friendshipRepository
                .findByRequesterIdAndAddresseeId(user.getId(), targetId);
        if (direct.isPresent()) {
            Friendship f = direct.get();
            if (Friendship.ACCEPTED.equals(f.getStatus())) {
                throw new IllegalArgumentException("Вы уже друзья");
            }
            if (Friendship.PENDING.equals(f.getStatus())) {
                throw new IllegalArgumentException("Заявка уже отправлена");
            }
            f.setStatus(Friendship.PENDING);
            f.setCreatedAt(LocalDateTime.now());
            f.setRespondedAt(null);
            friendshipRepository.save(f);
            return getFriends(user);
        }

        Optional<Friendship> reverse = friendshipRepository
                .findByRequesterIdAndAddresseeId(targetId, user.getId());
        if (reverse.isPresent()) {
            Friendship f = reverse.get();
            if (Friendship.PENDING.equals(f.getStatus())) {
                f.setStatus(Friendship.ACCEPTED);
                f.setRespondedAt(LocalDateTime.now());
                friendshipRepository.save(f);
                return getFriends(user);
            }
            if (Friendship.ACCEPTED.equals(f.getStatus())) {
                throw new IllegalArgumentException("Вы уже друзья");
            }
            friendshipRepository.delete(f);
        }

        friendshipRepository.save(Friendship.builder()
                .requester(user)
                .addressee(target)
                .status(Friendship.PENDING)
                .createdAt(LocalDateTime.now())
                .build());
        return getFriends(user);
    }

    @Transactional
    public FriendListDto acceptRequest(User user, Long requesterId) {
        Friendship f = friendshipRepository
                .findByRequesterIdAndAddresseeId(requesterId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Заявка не найдена"));
        if (!Friendship.PENDING.equals(f.getStatus())) {
            throw new IllegalArgumentException("Заявка уже обработана");
        }
        f.setStatus(Friendship.ACCEPTED);
        f.setRespondedAt(LocalDateTime.now());
        friendshipRepository.save(f);
        return getFriends(user);
    }

    @Transactional
    public FriendListDto removeFriend(User user, Long otherId) {
        Friendship f = friendshipRepository
                .findByRequesterIdAndAddresseeId(user.getId(), otherId)
                .or(() -> friendshipRepository.findByRequesterIdAndAddresseeId(otherId, user.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Связь не найдена"));
        friendshipRepository.delete(f);
        return getFriends(user);
    }

    // ============================================================
    // Стена
    // ============================================================

    @Transactional(readOnly = true)
    public List<ProfileWallPostDto> getWall(User viewer, Long profileUserId) {
        User profileUser = userRepository.findById(profileUserId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
        return buildWall(profileUser, viewer);
    }

    @Transactional
    public List<ProfileWallPostDto> addWallPost(User viewer, Long profileUserId, String body) {
        User profileUser = userRepository.findById(profileUserId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
        String text = body == null ? "" : body.trim();
        if (text.isEmpty()) {
            throw new IllegalArgumentException("Сообщение не может быть пустым");
        }
        if (text.length() > 1000) {
            throw new IllegalArgumentException("Слишком длинное сообщение");
        }

        wallPostRepository.save(ProfileWallPost.builder()
                .profileUser(profileUser)
                .author(viewer)
                .body(text)
                .createdAt(LocalDateTime.now())
                .build());
        return buildWall(profileUser, viewer);
    }

    @Transactional
    public List<ProfileWallPostDto> deleteWallPost(User viewer, Long profileUserId, Long postId) {
        ProfileWallPost post = wallPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Сообщение не найдено"));
        if (!post.getProfileUser().getId().equals(profileUserId)) {
            throw new IllegalArgumentException("Сообщение не с этой стены");
        }
        boolean isAuthor = post.getAuthor().getId().equals(viewer.getId());
        boolean isOwner = profileUserId.equals(viewer.getId());
        if (!isAuthor && !isOwner && !Boolean.TRUE.equals(viewer.getIsAdmin())) {
            throw new IllegalArgumentException("Нет прав на удаление");
        }
        wallPostRepository.delete(post);
        return buildWall(post.getProfileUser(), viewer);
    }

    // ============================================================
    // Витрина
    // ============================================================

    @Transactional
    public List<AchievementDto> updateShowcase(User user, List<String> codes) {
        List<String> safeCodes = codes == null ? List.of() : codes.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .limit(SHOWCASE_LIMIT)
                .toList();

        List<Achievement> selected = new ArrayList<>();
        for (String code : safeCodes) {
            Achievement a = achievementRepository.findByCode(code)
                    .orElseThrow(() -> new IllegalArgumentException("Достижение не найдено: " + code));
            if (!userAchievementRepository.existsByUserIdAndAchievementId(user.getId(), a.getId())) {
                throw new IllegalArgumentException("Достижение ещё не получено: " + code);
            }
            selected.add(a);
        }

        showcaseRepository.deleteByUserId(user.getId());
        for (int i = 0; i < selected.size(); i++) {
            showcaseRepository.save(ProfileShowcase.builder()
                    .user(user)
                    .achievement(selected.get(i))
                    .position(i)
                    .build());
        }

        List<AchievementDto> all = achievementService.getForUser(user);
        Map<String, AchievementDto> byCode = new HashMap<>();
        for (AchievementDto dto : all) byCode.put(dto.getCode(), dto);
        return selected.stream().map(a -> byCode.get(a.getCode())).filter(Objects::nonNull).toList();
    }

    // ============================================================
    // Профиль: фон
    // ============================================================

    @Transactional
    public UserProfileDto updateBackground(User user, String backgroundCode) {
        UserProfile profile = userProfileRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalStateException("Profile not found"));
        String code = backgroundCode == null || backgroundCode.isBlank()
                ? "aurora" : backgroundCode.trim();
        if (code.length() > 64) {
            throw new IllegalArgumentException("Слишком длинный код фона");
        }
        ProfileBackground bg = profileBackgroundRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Фон не найден"));
        boolean free = bg.getPrice() == null || bg.getPrice() <= 0;
        if (!free && !userBackgroundRepository.existsByUserIdAndBackgroundId(user.getId(), bg.getId())) {
            throw new IllegalArgumentException("Сначала купи этот фон в магазине");
        }
        profile.setBackgroundCode(code);
        userProfileRepository.save(profile);

        AttachmentMeta avatarMeta = profile.getAvatar() != null
                ? attachmentMetaRepository.findById(profile.getAvatar().getId()).orElse(null)
                : null;
        return UserProfileDto.builder()
                .displayName(profile.getDisplayName())
                .bio(profile.getBio())
                .avatarAttachmentId(profile.getAvatar() != null ? profile.getAvatar().getId() : null)
                .avatarUrl(avatarMeta != null ? uploadBaseUrl + "/" + avatarMeta.getUrl() : null)
                .backgroundCode(profile.getBackgroundCode())
                .build();
    }

    // ============================================================
    // Внутренние
    // ============================================================

    /** Доступные пользователю фоны: бесплатные + купленные. */
    private List<BackgroundDto> ownedBackgrounds(User user) {
        Set<Long> purchased = new HashSet<>();
        for (var ub : userBackgroundRepository.findByUserId(user.getId())) {
            purchased.add(ub.getBackground().getId());
        }
        return profileBackgroundRepository.findAllByOrderBySortOrderAsc().stream()
                .filter(bg -> bg.getPrice() == null || bg.getPrice() <= 0
                        || purchased.contains(bg.getId()))
                .map(bg -> BackgroundDto.builder()
                        .id(bg.getId())
                        .code(bg.getCode())
                        .title(bg.getTitle())
                        .description(bg.getDescription())
                        .imageUrl(bg.getImageUrl())
                        .cssClass(bg.getCssClass() != null ? bg.getCssClass() : bg.getCode())
                        .price(bg.getPrice())
                        .oldPrice(bg.getOldPrice())
                        .build())
                .toList();
    }

    private List<ProfileWallPostDto> buildWall(User profileUser, User viewer) {
        return wallPostRepository.findByProfileUserIdOrderByCreatedAtDesc(profileUser.getId())
                .stream()
                .map(post -> ProfileWallPostDto.builder()
                        .id(post.getId())
                        .body(post.getBody())
                        .createdAt(post.getCreatedAt())
                        .author(toSocialUser(post.getAuthor()))
                        .canDelete(post.getAuthor().getId().equals(viewer.getId())
                                || profileUser.getId().equals(viewer.getId())
                                || Boolean.TRUE.equals(viewer.getIsAdmin()))
                        .build())
                .toList();
    }

    private List<SocialUserDto> friendsOf(User user) {
        return friendshipRepository.findAcceptedForUser(user.getId()).stream()
                .map(f -> f.getRequester().getId().equals(user.getId())
                        ? f.getAddressee() : f.getRequester())
                .map(this::toSocialUser)
                .toList();
    }

    private String friendStatus(User viewer, User target) {
        if (viewer.getId().equals(target.getId())) return "SELF";
        Optional<Friendship> direct = friendshipRepository
                .findByRequesterIdAndAddresseeId(viewer.getId(), target.getId());
        if (direct.isPresent()) {
            Friendship f = direct.get();
            if (Friendship.ACCEPTED.equals(f.getStatus())) return "FRIENDS";
            if (Friendship.PENDING.equals(f.getStatus())) return "REQUEST_SENT";
        }
        Optional<Friendship> reverse = friendshipRepository
                .findByRequesterIdAndAddresseeId(target.getId(), viewer.getId());
        if (reverse.isPresent()) {
            Friendship f = reverse.get();
            if (Friendship.ACCEPTED.equals(f.getStatus())) return "FRIENDS";
            if (Friendship.PENDING.equals(f.getStatus())) return "REQUEST_RECEIVED";
        }
        return "NONE";
    }

    private List<AchievementDto> buildShowcase(User target, List<AchievementDto> unlocked) {
        List<ProfileShowcase> rows = showcaseRepository.findByUserIdOrderByPositionAsc(target.getId());
        Map<String, AchievementDto> byCode = new HashMap<>();
        for (AchievementDto dto : unlocked) byCode.put(dto.getCode(), dto);

        if (!rows.isEmpty()) {
            return rows.stream()
                    .map(r -> byCode.get(r.getAchievement().getCode()))
                    .filter(Objects::nonNull)
                    .toList();
        }

        // Витрина по умолчанию: три самых «дорогих» полученных достижения.
        return unlocked.stream()
                .sorted(Comparator.comparing(
                        (AchievementDto a) -> a.getReward() == null ? 0 : a.getReward())
                        .reversed())
                .limit(SHOWCASE_LIMIT)
                .toList();
    }

    private int currentLeaves(User user) {
        return userCurrencyRepository.findById(user.getId())
                .map(c -> c.getLeaves() == null ? 0 : c.getLeaves())
                .orElse(0);
    }

    private String legacyAvatarUrl(UserProfile profile) {
        if (profile == null || profile.getAvatar() == null) return null;
        AttachmentMeta meta = attachmentMetaRepository
                .findById(profile.getAvatar().getId()).orElse(null);
        return meta != null ? uploadBaseUrl + "/" + meta.getUrl() : null;
    }

    /**
     * Стрик: сколько дней подряд (включая сегодня или вчера) были закрытые
     * задачи. Если сегодня ещё ничего не закрыто, серия не обнуляется до
     * конца дня — начинаем отсчёт со вчера.
     */
    public int streakFor(User user) {
        List<java.sql.Date> rows = taskRepository.findCompletedDatesByOwner(user.getId());
        if (rows.isEmpty()) return 0;

        Set<LocalDate> days = new HashSet<>();
        for (java.sql.Date d : rows) {
            if (d != null) days.add(d.toLocalDate());
        }

        LocalDate cursor = LocalDate.now(zoneFor(user));
        if (!days.contains(cursor)) {
            cursor = cursor.minusDays(1);
            if (!days.contains(cursor)) return 0;
        }

        int streak = 0;
        while (days.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    private ZoneId zoneFor(User user) {
        String timezone = userLocaleRepository.findById(user.getId())
                .map(UserLocale::getTimezone)
                .orElse(DEFAULT_TIMEZONE);
        try {
            return ZoneId.of(timezone);
        } catch (DateTimeException | NullPointerException ex) {
            return ZoneId.of(DEFAULT_TIMEZONE);
        }
    }
}
