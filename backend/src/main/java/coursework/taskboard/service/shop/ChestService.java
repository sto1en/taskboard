package coursework.taskboard.service.shop;

import coursework.taskboard.dto.shop.ChestDto;
import coursework.taskboard.dto.shop.ChestOpenResultDto;
import coursework.taskboard.dto.shop.ChestsDto;
import coursework.taskboard.model.shop.AccentSkin;
import coursework.taskboard.model.shop.Avatar;
import coursework.taskboard.model.shop.Frame;
import coursework.taskboard.model.shop.TreeSkin;
import coursework.taskboard.model.shop.UserAccent;
import coursework.taskboard.model.shop.UserAvatar;
import coursework.taskboard.model.shop.UserCurrency;
import coursework.taskboard.model.shop.UserFrame;
import coursework.taskboard.model.shop.UserTreeSkin;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.shop.AccentSkinRepository;
import coursework.taskboard.repository.shop.AvatarRepository;
import coursework.taskboard.repository.shop.FrameRepository;
import coursework.taskboard.repository.shop.TreeSkinRepository;
import coursework.taskboard.repository.shop.UserAccentRepository;
import coursework.taskboard.repository.shop.UserAvatarRepository;
import coursework.taskboard.repository.shop.UserCurrencyRepository;
import coursework.taskboard.repository.shop.UserFrameRepository;
import coursework.taskboard.repository.shop.UserTreeSkinRepository;
import coursework.taskboard.service.inventory.KeyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Сундуки — лут-боксы магазина.
 *
 * «Лесной сундук» открывается ключом, «Сундук странника» — за 350 листьев.
 * Ключи выдаёт KeyService за каждые 15 закрытых задач локального дня;
 * недостающий ключ можно купить за 150 листьев.
 *
 * Лут: 60% листья, 27% обычный предмет, 9% необычный, 3% редкий,
 * 1% очень редкий. Редкость предмета определяется его ценой:
 * обычный &lt; 500, необычный 500–1199, редкий 1200–2500, очень редкий &gt; 2500.
 * Повторно выпавший предмет не дублирует строку инвентаря: вместо него
 * начисляются листья в размере цены предмета. Если подходящих предметов
 * нет вовсе — выпадают листья.
 */
@Service
@RequiredArgsConstructor
public class ChestService {

    public static final String FOREST = "forest";
    public static final String WANDERER = "wanderer";

    private static final int WANDERER_PRICE = 350;
    private static final int KEY_PRICE = 150;

    private static final String CURRENCY_KEY = "key";
    private static final String CURRENCY_LEAVES = "leaves";

    private static final String REWARD_ITEM = "item";
    private static final String REWARD_LEAVES = "leaves";

    private static final String RARITY_COMMON = "common";
    private static final String RARITY_UNCOMMON = "uncommon";
    private static final String RARITY_RARE = "rare";
    private static final String RARITY_VERY_RARE = "very_rare";

    private static final int[] LOOT_WEIGHTS = {600, 270, 90, 30, 10};

    private static final int[] FOREST_LEAF_MIN = {50, 100, 200, 400, 800, 1200};
    private static final int[] FOREST_LEAF_MAX = {99, 199, 399, 799, 1199, 2000};
    private static final int[] FOREST_LEAF_WEIGHTS = {450, 300, 150, 70, 25, 5};

    private static final int[] WANDERER_LEAF_MIN = {25, 50, 100, 200, 350, 700};
    private static final int[] WANDERER_LEAF_MAX = {49, 99, 199, 349, 699, 1200};
    private static final int[] WANDERER_LEAF_WEIGHTS = {450, 300, 150, 70, 25, 5};

    private final KeyService keyService;
    private final ShopService shopService;
    private final ShopItemInfoService itemInfoService;
    private final UserCurrencyRepository userCurrencyRepository;

    private final AvatarRepository avatarRepository;
    private final FrameRepository frameRepository;
    private final TreeSkinRepository treeSkinRepository;
    private final AccentSkinRepository accentSkinRepository;

    private final UserAvatarRepository userAvatarRepository;
    private final UserFrameRepository userFrameRepository;
    private final UserTreeSkinRepository userTreeSkinRepository;
    private final UserAccentRepository userAccentRepository;

    // ============================================================
    // Каталог
    // ============================================================

    @Transactional
    public ChestsDto getChests(User user) {
        // Догоняем ключи за уже закрытые сегодня задачи. Повторный GET
        // безопасен: KeyService пропускает выданные milestone.
        keyService.syncKeys(user);

        int keys = keyService.getKeys(user);
        int leaves = getLeaves(user);

        List<ChestDto> chests = List.of(
                ChestDto.builder()
                        .code(FOREST)
                        .title("Лесной сундук")
                        .description("Лесные дары: листья и предметы для уюта. Открывается одним ключом.")
                        .icon("🌿")
                        .currency(CURRENCY_KEY)
                        .price(1)
                        .available(keys >= 1)
                        .build(),
                ChestDto.builder()
                        .code(WANDERER)
                        .title("Сундук странника")
                        .description("Дальняя дорога принесла редкие находки. Открывается за 350 листьев.")
                        .icon("🧭")
                        .currency(CURRENCY_LEAVES)
                        .price(WANDERER_PRICE)
                        .available(leaves >= WANDERER_PRICE)
                        .build()
        );

        return ChestsDto.builder()
                .keys(keys)
                .leaves(leaves)
                .keyProgress(keyService.progressToNextKey(user))
                .keyGoal(KeyService.KEY_GOAL)
                .keyPrice(KEY_PRICE)
                .chests(chests)
                .build();
    }

    /**
     * Купить один ключ за листья. Возвращает обновлённый каталог,
     * чтобы фронт сразу увидел новый баланс и количество ключей.
     */
    @Transactional
    public synchronized ChestsDto buyKey(User user) {
        if (getLeaves(user) < KEY_PRICE) {
            throw new IllegalArgumentException("Недостаточно листьев");
        }
        shopService.spendLeaves(user, KEY_PRICE);
        keyService.addKeys(user, 1);
        return getChests(user);
    }

    // ============================================================
    // Открытие
    // ============================================================

    /**
     * Открыть сундук.
     *
     * synchronized + списание в той же транзакции не дают двум параллельным
     * запросам дважды списать ключ/листья за одно открытие. Фронт вдобавок
     * блокирует кнопку, пока идёт запрос.
     */
    @Transactional
    public synchronized ChestOpenResultDto openChest(User user, String code) {
        String chestCode = normalizeCode(code);

        keyService.syncKeys(user);

        if (FOREST.equals(chestCode)) {
            if (keyService.getKeys(user) < 1) {
                throw new IllegalArgumentException("Не хватает ключей");
            }
            keyService.spendKey(user);
        } else {
            if (getLeaves(user) < WANDERER_PRICE) {
                throw new IllegalArgumentException("Недостаточно листьев");
            }
            shopService.spendLeaves(user, WANDERER_PRICE);
        }

        ChestOpenResultDto result = rollLoot(user, chestCode);
        result.setChestCode(chestCode);
        result.setKeys(keyService.getKeys(user));
        result.setLeavesBalance(getLeaves(user));
        incrementChestsOpened(user);
        return result;
    }

    private void incrementChestsOpened(User user) {
        UserCurrency cur = userCurrencyRepository.findById(user.getId())
                .orElseGet(() -> UserCurrency.builder()
                        .userId(user.getId())
                        .leaves(0)
                        .build());
        cur.setChestsOpened((cur.getChestsOpened() == null ? 0 : cur.getChestsOpened()) + 1);
        userCurrencyRepository.save(cur);
    }

    // ============================================================
    // Лут
    // ============================================================

    private ChestOpenResultDto rollLoot(User user, String chestCode) {
        int roll = ThreadLocalRandom.current().nextInt(1000);
        int cumulative = 0;

        cumulative += LOOT_WEIGHTS[0];
        if (roll < cumulative) {
            return leavesReward(user, chestCode);
        }

        String[] rarities = {RARITY_COMMON, RARITY_UNCOMMON, RARITY_RARE, RARITY_VERY_RARE};
        for (int i = 0; i < rarities.length; i++) {
            cumulative += LOOT_WEIGHTS[i + 1];
            if (roll < cumulative) {
                return itemReward(user, rarities[i], chestCode);
            }
        }

        // Недостижимо (веса в сумме 1000), но оставляем безопасный фолбэк.
        return leavesReward(user, chestCode);
    }

    private ChestOpenResultDto itemReward(User user, String rarity, String chestCode) {
        List<LootCandidate> candidates = candidates(user, rarity);
        if (candidates.isEmpty()) {
            // Подходящих предметов нет — выдаём листья.
            return leavesReward(user, chestCode);
        }

        LootCandidate pick = candidates.get(ThreadLocalRandom.current().nextInt(candidates.size()));

        if (pick.owned()) {
            // Дубликат: вторую строку инвентаря не создаём (unique user_id+item_id),
            // вместо предмета начисляем его цену листьями.
            int refund = pick.price() == null ? 0 : Math.max(0, pick.price());
            if (refund > 0) {
                shopService.addLeaves(user, refund);
            }
            return ChestOpenResultDto.builder()
                    .rewardType(REWARD_ITEM)
                    .rarity(rarity)
                    .title(pick.title())
                    .description(pick.description())
                    .itemId(pick.id())
                    .itemType(pick.type())
                    .owned(true)
                    .duplicateLeaves(refund)
                    .imageUrl(pick.imageUrl())
                    .emoji(pick.emoji())
                    .cssClass(pick.cssClass())
                    .price(pick.price())
                    .build();
        }

        grant(user, pick);

        return ChestOpenResultDto.builder()
                .rewardType(REWARD_ITEM)
                .rarity(rarity)
                .title(pick.title())
                .description(pick.description())
                .itemId(pick.id())
                .itemType(pick.type())
                .owned(false)
                .imageUrl(pick.imageUrl())
                .emoji(pick.emoji())
                .cssClass(pick.cssClass())
                .price(pick.price())
                .build();
    }

    private ChestOpenResultDto leavesReward(User user, String chestCode) {
        int amount = rollLeaves(chestCode);
        // Листья начисляются только через ShopService.addLeaves.
        shopService.addLeaves(user, amount);
        return ChestOpenResultDto.builder()
                .rewardType(REWARD_LEAVES)
                .title("Листья")
                .description("Сундук щедро поделился лесными листьями.")
                .emoji("🍃")
                .leaves(amount)
                .build();
    }

    private int rollLeaves(String chestCode) {
        int[] mins = FOREST.equals(chestCode) ? FOREST_LEAF_MIN : WANDERER_LEAF_MIN;
        int[] maxs = FOREST.equals(chestCode) ? FOREST_LEAF_MAX : WANDERER_LEAF_MAX;
        int[] weights = FOREST.equals(chestCode) ? FOREST_LEAF_WEIGHTS : WANDERER_LEAF_WEIGHTS;

        int roll = ThreadLocalRandom.current().nextInt(1000);
        int cumulative = 0;
        for (int i = 0; i < weights.length; i++) {
            cumulative += weights[i];
            if (roll < cumulative) {
                return ThreadLocalRandom.current().nextInt(mins[i], maxs[i] + 1);
            }
        }
        return mins[mins.length - 1];
    }

    // ============================================================
    // Кандидаты и выдача
    // ============================================================

    private List<LootCandidate> candidates(User user, String rarity) {
        List<LootCandidate> result = new ArrayList<>();

        // Награды за ачивки не должны выпадать из сундуков: иначе их
        // эксклюзивность и запрет продажи теряют смысл.
        Map<String, Set<String>> rewardOnly = itemInfoService.achievementRewardCodes();

        Set<Long> ownedAvatars = new HashSet<>();
        for (UserAvatar ua : userAvatarRepository.findByUserId(user.getId())) {
            ownedAvatars.add(ua.getAvatar().getId());
        }
        for (Avatar a : avatarRepository.findAllByOrderBySortOrderAsc()) {
            if (itemInfoService.isAchievementReward(
                    rewardOnly, ShopItemInfoService.TYPE_AVATAR, a.getCode())) continue;
            if (!rarityMatches(a.getPrice(), rarity)) continue;
            result.add(new LootCandidate(
                    "avatar", a.getId(), a.getTitle(), a.getDescription(),
                    a.getPrice(), a.getEmoji(), a.getImageUrl(), a.getCssClass(),
                    ownedAvatars.contains(a.getId())));
        }

        Set<Long> ownedFrames = new HashSet<>();
        for (UserFrame uf : userFrameRepository.findByUserId(user.getId())) {
            ownedFrames.add(uf.getFrame().getId());
        }
        for (Frame f : frameRepository.findAllByOrderBySortOrderAsc()) {
            if (itemInfoService.isAchievementReward(
                    rewardOnly, ShopItemInfoService.TYPE_FRAME, f.getCode())) continue;
            if (!rarityMatches(f.getPrice(), rarity)) continue;
            result.add(new LootCandidate(
                    "frame", f.getId(), f.getTitle(), f.getDescription(),
                    f.getPrice(), "🖼️", f.getImageUrl(), f.getCssClass(),
                    ownedFrames.contains(f.getId())));
        }

        Set<Long> ownedTrees = new HashSet<>();
        for (UserTreeSkin ut : userTreeSkinRepository.findByUserId(user.getId())) {
            ownedTrees.add(ut.getTreeSkin().getId());
        }
        for (TreeSkin t : treeSkinRepository.findAllByOrderBySortOrderAsc()) {
            if (itemInfoService.isAchievementReward(
                    rewardOnly, ShopItemInfoService.TYPE_TREE, t.getCode())) continue;
            if (!rarityMatches(t.getPrice(), rarity)) continue;
            result.add(new LootCandidate(
                    "tree", t.getId(), t.getTitle(), t.getDescription(),
                    t.getPrice(), "🌳", null, null,
                    ownedTrees.contains(t.getId())));
        }

        Set<Long> ownedAccents = new HashSet<>();
        for (UserAccent ua : userAccentRepository.findByUserId(user.getId())) {
            ownedAccents.add(ua.getAccentSkin().getId());
        }
        for (AccentSkin a : accentSkinRepository.findAllByOrderBySortOrderAsc()) {
            if (itemInfoService.isAchievementReward(
                    rewardOnly, ShopItemInfoService.TYPE_ACCENT, a.getCode())) continue;
            if (!rarityMatches(a.getPrice(), rarity)) continue;
            result.add(new LootCandidate(
                    "accent", a.getId(), a.getTitle(), a.getDescription(),
                    a.getPrice(), "🎨", a.getImageUrl(), a.getCode(),
                    ownedAccents.contains(a.getId())));
        }

        return result;
    }

    private boolean rarityMatches(Integer price, String rarity) {
        int p = price == null ? 0 : price;
        return switch (rarity) {
            case RARITY_COMMON -> p < 500;
            case RARITY_UNCOMMON -> p >= 500 && p < 1200;
            case RARITY_RARE -> p >= 1200 && p <= 2500;
            case RARITY_VERY_RARE -> p > 2500;
            default -> false;
        };
    }

    private void grant(User user, LootCandidate item) {
        // pricePaid = null — предмет получен из сундука, а не куплен.
        switch (item.type()) {
            case "avatar" -> userAvatarRepository.save(UserAvatar.builder()
                    .user(user)
                    .avatar(avatarRepository.findById(item.id()).orElseThrow())
                    .pricePaid(null)
                    .build());
            case "frame" -> userFrameRepository.save(UserFrame.builder()
                    .user(user)
                    .frame(frameRepository.findById(item.id()).orElseThrow())
                    .pricePaid(null)
                    .build());
            case "tree" -> userTreeSkinRepository.save(UserTreeSkin.builder()
                    .user(user)
                    .treeSkin(treeSkinRepository.findById(item.id()).orElseThrow())
                    .pricePaid(null)
                    .build());
            case "accent" -> userAccentRepository.save(UserAccent.builder()
                    .user(user)
                    .accentSkin(accentSkinRepository.findById(item.id()).orElseThrow())
                    .pricePaid(null)
                    .build());
            default -> throw new IllegalArgumentException("Неизвестный предмет");
        }
    }

    // ============================================================
    // Внутренние
    // ============================================================

    private String normalizeCode(String code) {
        String normalized = code == null ? "" : code.trim().toLowerCase();
        if (!FOREST.equals(normalized) && !WANDERER.equals(normalized)) {
            throw new IllegalArgumentException("Сундук не найден");
        }
        return normalized;
    }

    private int getLeaves(User user) {
        return userCurrencyRepository.findById(user.getId())
                .map(UserCurrency::getLeaves)
                .orElse(0);
    }

    /**
     * Кандидат на лут. type нужен для выдачи в нужную таблицу и для фронта
     * (itemId неоднозначен между типами). owned — предмет уже в инвентаре,
     * тогда вместо выдачи начисляются листья.
     */
    private record LootCandidate(
            String type,
            Long id,
            String title,
            String description,
            Integer price,
            String emoji,
            String imageUrl,
            String cssClass,
            boolean owned
    ) {
    }
}
