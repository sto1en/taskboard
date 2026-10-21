package coursework.taskboard.service.shop;

import coursework.taskboard.model.achievement.Achievement;
import coursework.taskboard.model.shop.*;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.achievement.AchievementRepository;
import coursework.taskboard.repository.shop.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Общие операции с предметами магазина: выдача, проверка владения и
 * резолв метаданных.
 *
 * Здесь же собирается индекс «предмет выдаётся за ачивку». Такой предмет
 * нельзя купить и он не попадает в лут сундуков — иначе эксклюзивная
 * награда за достижение превращалась бы в обычный товар.
 */
@Service
@RequiredArgsConstructor
public class ShopItemInfoService {

    public static final String TYPE_TREE = "TREE";
    public static final String TYPE_FRAME = "FRAME";
    public static final String TYPE_AVATAR = "AVATAR";
    public static final String TYPE_ACCENT = "ACCENT";

    private final AvatarRepository avatarRepository;
    private final FrameRepository frameRepository;
    private final TreeSkinRepository treeSkinRepository;
    private final AccentSkinRepository accentSkinRepository;

    private final UserAvatarRepository userAvatarRepository;
    private final UserFrameRepository userFrameRepository;
    private final UserTreeSkinRepository userTreeSkinRepository;
    private final UserAccentRepository userAccentRepository;

    private final AchievementRepository achievementRepository;

    // ============================================================
    // Ачивки → недоступные для продажи предметы
    // ============================================================

    @Transactional(readOnly = true)
    public Map<String, Set<String>> achievementRewardCodes() {
        Map<String, Set<String>> result = new HashMap<>();
        for (Achievement a : achievementRepository.findAllByOrderBySortOrderAsc()) {
            if (a.getRewardItemType() == null || a.getRewardItemCode() == null) continue;
            String type = normalizeType(a.getRewardItemType());
            if (type == null) continue;
            result.computeIfAbsent(type, k -> new HashSet<>())
                    .add(a.getRewardItemCode().trim());
        }
        return result;
    }

    public boolean isAchievementReward(Map<String, Set<String>> index,
                                       String type,
                                       String code) {
        if (index == null || type == null || code == null) return false;
        Set<String> codes = index.get(normalizeType(type));
        return codes != null && codes.contains(code);
    }

    // ============================================================
    // Метаданные
    // ============================================================

    @Transactional(readOnly = true)
    public ItemInfo resolve(String type, String code) {
        String normalized = normalizeType(type);
        if (normalized == null || code == null) return null;

        return switch (normalized) {
            case TYPE_TREE -> treeSkinRepository.findByCode(code)
                    .map(t -> new ItemInfo(t.getId(), TYPE_TREE, t.getCode(), t.getTitle(),
                            t.getDescription(), t.getPrice(), null, "🌳", null,
                            null, null, null, false, false))
                    .orElse(null);
            case TYPE_FRAME -> frameRepository.findByCode(code)
                    .map(f -> new ItemInfo(f.getId(), TYPE_FRAME, f.getCode(), f.getTitle(),
                            f.getDescription(), f.getPrice(), f.getImageUrl(), "🖼️", f.getCssClass(),
                            null, null, null, false, false))
                    .orElse(null);
            case TYPE_AVATAR -> avatarRepository.findByCode(code)
                    .map(a -> new ItemInfo(a.getId(), TYPE_AVATAR, a.getCode(), a.getTitle(),
                            a.getDescription(), a.getPrice(), a.getImageUrl(), a.getEmoji(), a.getCssClass(),
                            null, null, null, false, false))
                    .orElse(null);
            case TYPE_ACCENT -> accentSkinRepository.findByCode(code)
                    .map(a -> new ItemInfo(a.getId(), TYPE_ACCENT, a.getCode(), a.getTitle(),
                            a.getDescription(), a.getPrice(), a.getImageUrl(), "🎨", a.getCode(),
                            a.getHexColor(), a.getHexColorSecondary(), a.getHexColorTertiary(),
                            Boolean.TRUE.equals(a.getIsGradient()), Boolean.TRUE.equals(a.getIsRare())))
                    .orElse(null);
            default -> null;
        };
    }

    // ============================================================
    // Владение и выдача
    // ============================================================

    @Transactional(readOnly = true)
    public boolean isOwned(User user, String type, String code) {
        ItemInfo item = resolve(type, code);
        if (item == null) return false;

        return switch (normalizeType(type)) {
            case TYPE_TREE -> userTreeSkinRepository
                    .existsByUserIdAndTreeSkinId(user.getId(), item.id());
            case TYPE_FRAME -> userFrameRepository
                    .existsByUserIdAndFrameId(user.getId(), item.id());
            case TYPE_AVATAR -> userAvatarRepository
                    .existsByUserIdAndAvatarId(user.getId(), item.id());
            case TYPE_ACCENT -> userAccentRepository
                    .existsByUserIdAndAccentSkinId(user.getId(), item.id());
            default -> false;
        };
    }

    /**
     * Выдать предмет. Возвращает false, если предмет уже есть или не найден.
     * pricePaid = null — предмет получен в награду, а не куплен.
     */
    @Transactional
    public boolean grant(User user, String type, String code) {
        ItemInfo item = resolve(type, code);
        if (item == null) return false;
        if (isOwned(user, type, code)) return false;

        switch (normalizeType(type)) {
            case TYPE_TREE -> userTreeSkinRepository.save(UserTreeSkin.builder()
                    .user(user)
                    .treeSkin(treeSkinRepository.findById(item.id()).orElseThrow())
                    .pricePaid(null)
                    .build());
            case TYPE_FRAME -> userFrameRepository.save(UserFrame.builder()
                    .user(user)
                    .frame(frameRepository.findById(item.id()).orElseThrow())
                    .pricePaid(null)
                    .build());
            case TYPE_AVATAR -> userAvatarRepository.save(UserAvatar.builder()
                    .user(user)
                    .avatar(avatarRepository.findById(item.id()).orElseThrow())
                    .pricePaid(null)
                    .build());
            case TYPE_ACCENT -> userAccentRepository.save(UserAccent.builder()
                    .user(user)
                    .accentSkin(accentSkinRepository.findById(item.id()).orElseThrow())
                    .pricePaid(null)
                    .build());
            default -> {
                return false;
            }
        }
        return true;
    }

    // ============================================================
    // Helpers
    // ============================================================

    public static String normalizeType(String type) {
        if (type == null) return null;
        String t = type.trim().toUpperCase(Locale.ROOT);
        return switch (t) {
            case TYPE_TREE, TYPE_FRAME, TYPE_AVATAR, TYPE_ACCENT -> t;
            default -> null;
        };
    }

    public record ItemInfo(
            Long id,
            String type,
            String code,
            String title,
            String description,
            Integer price,
            String imageUrl,
            String emoji,
            String cssClass,
            String hexColor,
            String hexColorSecondary,
            String hexColorTertiary,
            boolean isGradient,
            boolean isRare
    ) {
    }
}
