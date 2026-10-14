package coursework.taskboard.service.achievement;

import coursework.taskboard.dto.achievement.AchievementDto;
import coursework.taskboard.dto.achievement.AchievementMapper;
import coursework.taskboard.model.achievement.Achievement;
import coursework.taskboard.model.achievement.UserAchievement;
import coursework.taskboard.model.shop.*;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.achievement.AchievementRepository;
import coursework.taskboard.repository.achievement.UserAchievementRepository;
import coursework.taskboard.repository.shop.*;
import coursework.taskboard.service.shop.ShopService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final AchievementMapper achievementMapper;
    private final ShopService shopService;

    private final AccentSkinRepository accentSkinRepository;
    private final FrameRepository frameRepository;
    private final AvatarRepository avatarRepository;
    private final TreeSkinRepository treeSkinRepository;
    private final UserAccentRepository userAccentRepository;
    private final UserFrameRepository userFrameRepository;
    private final UserAvatarRepository userAvatarRepository;
    private final UserTreeSkinRepository userTreeSkinRepository;

    // ============================================================
    // Получить все ачивки для пользователя
    // ============================================================
    @Transactional(readOnly = true)
    public List<AchievementDto> getForUser(User user) {
        List<Achievement> all = achievementRepository.findAllByOrderBySortOrderAsc();
        List<UserAchievement> mine = userAchievementRepository.findByUserId(user.getId());

        Map<Long, UserAchievement> byAch = new HashMap<>();
        for (UserAchievement ua : mine) {
            byAch.put(ua.getAchievement().getId(), ua);
        }

        List<AchievementDto> result = new ArrayList<>();
        for (Achievement a : all) {
            String rewardItemTitle = resolveRewardItemTitle(a);
            result.add(achievementMapper.toDto(a, byAch.get(a.getId()), rewardItemTitle));
        }
        return result;
    }

    // ============================================================
    // Разблокировать по code
    // ============================================================
    @Transactional
    public AchievementDto unlockByCode(User user, String code) {
        Achievement a = achievementRepository.findByCode(code).orElse(null);
        if (a == null) return null;
        if (userAchievementRepository.existsByUserIdAndAchievementId(user.getId(), a.getId())) {
            return null;
        }

        UserAchievement ua = UserAchievement.builder()
                .user(user)
                .achievement(a)
                .build();
        userAchievementRepository.save(ua);

        // 🍃 Награда листьями
        if (a.getReward() != null && a.getReward() > 0) {
            shopService.addLeaves(user, a.getReward());
        }

        // 🎁 Награда предметом
        grantItemReward(user, a);

        return achievementMapper.toUnlockedDto(a, resolveRewardItemTitle(a));
    }

    // ============================================================
    // Выдать предмет
    // ============================================================
    private void grantItemReward(User user, Achievement a) {
        String type = a.getRewardItemType();
        String code = a.getRewardItemCode();
        if (type == null || code == null) return;

        try {
            switch (type) {
                case "ACCENT" -> {
                    AccentSkin skin = accentSkinRepository.findByCode(code).orElse(null);
                    if (skin == null) return;
                    if (userAccentRepository.existsByUserIdAndAccentSkinId(user.getId(), skin.getId())) return;
                    userAccentRepository.save(UserAccent.builder()
                            .user(user).accentSkin(skin).build());
                    log.info("Granted ACCENT {} to user {}", code, user.getUsername());
                }
                case "FRAME" -> {
                    Frame frame = frameRepository.findByCode(code).orElse(null);
                    if (frame == null) return;
                    if (userFrameRepository.existsByUserIdAndFrameId(user.getId(), frame.getId())) return;
                    userFrameRepository.save(UserFrame.builder()
                            .user(user).frame(frame).build());
                    log.info("Granted FRAME {} to user {}", code, user.getUsername());
                }
                case "AVATAR" -> {
                    Avatar avatar = avatarRepository.findByCode(code).orElse(null);
                    if (avatar == null) return;
                    if (userAvatarRepository.existsByUserIdAndAvatarId(user.getId(), avatar.getId())) return;
                    userAvatarRepository.save(UserAvatar.builder()
                            .user(user).avatar(avatar).build());
                    log.info("Granted AVATAR {} to user {}", code, user.getUsername());
                }
                case "TREE" -> {
                    TreeSkin skin = treeSkinRepository.findByCode(code).orElse(null);
                    if (skin == null) return;
                    if (userTreeSkinRepository.existsByUserIdAndTreeSkinId(user.getId(), skin.getId())) return;
                    userTreeSkinRepository.save(UserTreeSkin.builder()
                            .user(user).treeSkin(skin).build());
                    log.info("Granted TREE {} to user {}", code, user.getUsername());
                }
                default -> log.warn("Unknown rewardItemType: {}", type);
            }
        } catch (Exception e) {
            log.error("Failed to grant item {} {} to user {}", type, code, user.getUsername(), e);
        }
    }

    // ============================================================
    // Название предмета для UI
    // ============================================================
    private String resolveRewardItemTitle(Achievement a) {
        if (a.getRewardItemType() == null || a.getRewardItemCode() == null) return null;
        String code = a.getRewardItemCode();
        return switch (a.getRewardItemType()) {
            case "ACCENT" -> accentSkinRepository.findByCode(code)
                    .map(AccentSkin::getTitle).orElse(null);
            case "FRAME" -> frameRepository.findByCode(code)
                    .map(Frame::getTitle).orElse(null);
            case "AVATAR" -> avatarRepository.findByCode(code)
                    .map(Avatar::getTitle).orElse(null);
            case "TREE" -> treeSkinRepository.findByCode(code)
                    .map(TreeSkin::getTitle).orElse(null);
            default -> null;
        };
    }

    // ============================================================
    // Счётные
    // ============================================================
    public List<AchievementDto> checkTotalTasks(User user, long totalDone) {
        return tryUnlockByThreshold(user, "TASKS_DONE_TOTAL", totalDone);
    }
    public List<AchievementDto> checkDayTasks(User user, long doneToday) {
        return tryUnlockByThreshold(user, "TASKS_DONE_DAY", doneToday);
    }
    public List<AchievementDto> checkStreak(User user, int streakDays) {
        return tryUnlockByThreshold(user, "STREAK_DAYS", streakDays);
    }
    public List<AchievementDto> checkBoards(User user, long count) {
        return tryUnlockByThreshold(user, "BOARDS_CREATED", count);
    }
    public List<AchievementDto> checkProjects(User user, long count) {
        return tryUnlockByThreshold(user, "PROJECTS_CREATED", count);
    }
    public List<AchievementDto> checkExpiredTotal(User user, long count) {
        return tryUnlockByThreshold(user, "EXPIRED_TOTAL", count);
    }
    public List<AchievementDto> checkOnTime(User user, long count) {
        return tryUnlockByThreshold(user, "ON_TIME_TOTAL", count);
    }

    // ============================================================
    // Одиночные — ВСЕ КОДЫ СВЕРЕНЫ С DataInitializerConfig
    // ============================================================
    @Transactional public AchievementDto firstTask(User user)      { return unlockByCode(user, "FIRST_TASK"); }
    @Transactional public AchievementDto firstExpired(User user)   { return unlockByCode(user, "FIRST_EXPIRED"); }
    @Transactional public AchievementDto nightOwl(User user)       { return unlockByCode(user, "NIGHT_OWL"); }
    @Transactional public AchievementDto boardCoverSet(User user)  { return unlockByCode(user, "COVER_SET"); }
    @Transactional public AchievementDto treeYoung(User user)      { return unlockByCode(user, "TREE_YOUNG"); }
    @Transactional public AchievementDto treeMature(User user)     { return unlockByCode(user, "TREE_MATURE"); }
    @Transactional public AchievementDto treeHarvest(User user)    { return unlockByCode(user, "TREE_HARVEST"); }
    @Transactional public AchievementDto cleanWeek(User user)      { return unlockByCode(user, "CLEAN_WEEK"); }
    @Transactional public AchievementDto duck(User user)           { return unlockByCode(user, "DUCK"); }
    @Transactional public AchievementDto joker(User user)          { return unlockByCode(user, "JOKER"); }
    @Transactional public AchievementDto ninja(User user)          { return unlockByCode(user, "NINJA"); }
    @Transactional public AchievementDto xmasTree(User user)       { return unlockByCode(user, "XMAS_TREE"); }

    // ============================================================
    // По порогу
    // ============================================================
    @Transactional
    protected List<AchievementDto> tryUnlockByThreshold(User user, String conditionType, long value) {
        List<AchievementDto> acc = new ArrayList<>();
        List<Achievement> all = achievementRepository.findAllByOrderBySortOrderAsc();
        for (Achievement a : all) {
            if (!conditionType.equals(a.getConditionType())) continue;
            if (value < a.getThreshold()) continue;
            if (userAchievementRepository.existsByUserIdAndAchievementId(user.getId(), a.getId())) continue;

            UserAchievement ua = UserAchievement.builder()
                    .user(user)
                    .achievement(a)
                    .build();
            userAchievementRepository.save(ua);

            if (a.getReward() != null && a.getReward() > 0) {
                shopService.addLeaves(user, a.getReward());
            }
            grantItemReward(user, a);

            acc.add(achievementMapper.toUnlockedDto(a, resolveRewardItemTitle(a)));
        }
        return acc;
    }
}