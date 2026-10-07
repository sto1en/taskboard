package coursework.taskboard.service.achievement;

import coursework.taskboard.dto.achievement.AchievementDto;
import coursework.taskboard.dto.achievement.AchievementMapper;
import coursework.taskboard.model.achievement.Achievement;
import coursework.taskboard.model.achievement.UserAchievement;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.achievement.AchievementRepository;
import coursework.taskboard.repository.achievement.UserAchievementRepository;
import coursework.taskboard.service.shop.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final AchievementMapper achievementMapper;
    private final ShopService shopService;

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
            result.add(achievementMapper.toDto(a, byAch.get(a.getId())));
        }
        return result;
    }

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

        // 🍃 Награда листьями за ачивку
        if (a.getReward() != null && a.getReward() > 0) {
            shopService.addLeaves(user, a.getReward());
        }

        return achievementMapper.toUnlockedDto(a);
    }

    // Счётные
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

    // Одиночные
    @Transactional public AchievementDto firstTask(User user)      { return unlockByCode(user, "FIRST_TASK"); }
    @Transactional public AchievementDto firstExpired(User user)   { return unlockByCode(user, "FIRST_EXPIRED"); }
    @Transactional public AchievementDto nightOwl(User user)       { return unlockByCode(user, "NIGHT_OWL"); }
    @Transactional public AchievementDto boardCoverSet(User user)  { return unlockByCode(user, "BOARD_COVER_SET"); }
    @Transactional public AchievementDto treeYoung(User user)      { return unlockByCode(user, "TREE_YOUNG"); }
    @Transactional public AchievementDto treeMature(User user)     { return unlockByCode(user, "TREE_MATURE"); }
    @Transactional public AchievementDto treeHarvest(User user)    { return unlockByCode(user, "TREE_HARVEST"); }
    @Transactional public AchievementDto cleanWeek(User user)      { return unlockByCode(user, "CLEAN_WEEK"); }
    @Transactional public AchievementDto duck(User user)           { return unlockByCode(user, "DUCK"); }
    @Transactional public AchievementDto joker(User user)          { return unlockByCode(user, "JOKER"); }
    @Transactional public AchievementDto ninja(User user)          { return unlockByCode(user, "NINJA"); }
    @Transactional public AchievementDto xmasTree(User user)       { return unlockByCode(user, "XMAS_TREE"); }

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

            acc.add(achievementMapper.toUnlockedDto(a));
        }
        return acc;
    }
}