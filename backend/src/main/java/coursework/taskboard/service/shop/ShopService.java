package coursework.taskboard.service.shop;

import coursework.taskboard.dto.shop.CartCheckoutDto;
import coursework.taskboard.dto.shop.CartItemDto;
import coursework.taskboard.dto.shop.CategoryDto;
import coursework.taskboard.dto.shop.ShopItemDto;
import coursework.taskboard.dto.shop.UserShopDto;
import coursework.taskboard.model.shop.*;
import coursework.taskboard.model.user.User;
import coursework.taskboard.model.user.UserAppearance;
import coursework.taskboard.model.user.UserProfile;
import coursework.taskboard.repository.shop.*;
import coursework.taskboard.repository.user.UserAppearanceRepository;
import coursework.taskboard.repository.user.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final AvatarRepository avatarRepository;
    private final FrameRepository frameRepository;
    private final TreeSkinRepository treeSkinRepository;
    private final AccentSkinRepository accentSkinRepository;
    private final ProfileBackgroundRepository profileBackgroundRepository;
    private final UserCurrencyRepository userCurrencyRepository;
    private final UserAvatarRepository userAvatarRepository;
    private final UserFrameRepository userFrameRepository;
    private final UserTreeSkinRepository userTreeSkinRepository;
    private final UserAccentRepository userAccentRepository;
    private final UserBackgroundRepository userBackgroundRepository;
    private final UserAppearanceRepository userAppearanceRepository;
    private final UserProfileRepository userProfileRepository;
    private final TreeCategoryRepository treeCategoryRepository;
    private final AvatarCategoryRepository avatarCategoryRepository;
    private final FrameCategoryRepository frameCategoryRepository;
    private final AccentCategoryRepository accentCategoryRepository;
    private final ShopItemInfoService itemInfoService;

    // ============================================================
    // Основной метод — с фильтрами и сортировкой
    // ============================================================
    @Transactional(readOnly = true)
    public UserShopDto getShop(User user,
                               String sortBy,
                               String sortDir,
                               List<Long> avatarCategoryIds,
                               List<Long> frameCategoryIds,
                               List<Long> accentCategoryIds) {

        int leaves = getLeaves(user);

        UserAppearance appearance = userAppearanceRepository.findById(user.getId()).orElse(null);
        Long activeAvatarId = appearance != null && appearance.getActiveAvatar() != null
                ? appearance.getActiveAvatar().getId() : null;
        Long activeFrameId = appearance != null && appearance.getActiveFrame() != null
                ? appearance.getActiveFrame().getId() : null;
        Long activeSkinId = appearance != null && appearance.getActiveTreeSkin() != null
                ? appearance.getActiveTreeSkin().getId() : null;
        String activeAccentCode = appearance != null ? appearance.getAccentCode() : null;
        UserProfile profile = userProfileRepository.findById(user.getId()).orElse(null);
        String activeBackgroundCode = profile != null ? profile.getBackgroundCode() : null;

        // Предметы-награды за ачивки не продаются: отдаём фронту флаг
        // rewardOnly, чтобы вместо цены/кнопки он показал «За ачивку».
        Map<String, Set<String>> rewardOnly = itemInfoService.achievementRewardCodes();

        return UserShopDto.builder()
                .leaves(leaves)
                .avatars(buildAvatarDtos(user, activeAvatarId, avatarCategoryIds, sortBy, sortDir, rewardOnly))
                .frames(buildFrameDtos(user, activeFrameId, frameCategoryIds, sortBy, sortDir, rewardOnly))
                .treeSkins(buildTreeSkinDtos(user, activeSkinId, sortBy, sortDir, rewardOnly))
                .accents(buildAccentDtos(user, activeAccentCode, accentCategoryIds, sortBy, sortDir, rewardOnly))
                .backgrounds(buildBackgroundDtos(user, activeBackgroundCode, sortBy, sortDir))
                .build();
    }

    @Transactional(readOnly = true)
    public UserShopDto getShop(User user) {
        // По умолчанию — «популярность + новые», см. sortItems().
        return getShop(user, "popular", "desc", null, null, null);
    }

    /** Типы деревьев для фильтров магазина. */
    @Transactional(readOnly = true)
    public List<CategoryDto> getTreeCategories() {
        // Явная перегрузка: repository отдаёт List<TreeCategory>, и без каста
        // компилятор выбирает toCategoryDtos(Set<?>), который пересобирает
        // аргумент в HashSet и превращает категории деревьев в DTO с null
        // id/title/code — фронт из такого списка не может построить чипы.
        return toCategoryDtos(
                new HashSet<>(treeCategoryRepository.findAllByOrderBySortOrderAsc()),
                TreeCategory.class);
    }

    /** Справочники для чипов магазина (только чтение, без админских данных). */
    @Transactional(readOnly = true)
    public List<CategoryDto> getAvatarCategories() {
        return toCategoryDtos(new HashSet<>(avatarCategoryRepository.findAllByOrderBySortOrderAsc()));
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> getFrameCategories() {
        return toCategoryDtos(new HashSet<>(frameCategoryRepository.findAllByOrderBySortOrderAsc()));
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> getAccentCategories() {
        return toCategoryDtos(new HashSet<>(accentCategoryRepository.findAllByOrderBySortOrderAsc()));
    }

    // ============================================================
    // Avatars
    // ============================================================
    private List<ShopItemDto> buildAvatarDtos(User user, Long activeId,
                                              List<Long> categoryIds,
                                              String sortBy, String sortDir,
                                              Map<String, Set<String>> rewardOnly) {
        // Предмет → сколько за него реально отдали (null если подарен ачивкой)
        Map<Long, Integer> paid = new HashMap<>();
        for (UserAvatar ua : userAvatarRepository.findByUserId(user.getId())) {
            paid.put(ua.getAvatar().getId(), ua.getPricePaid());
        }
        Map<Long, Long> purchases = purchCounts(userAvatarRepository.countPurchasesByAvatar());

        List<Avatar> list = avatarRepository.findWithCategoriesFiltered(
                categoryIds == null || categoryIds.isEmpty() ? null : categoryIds
        );
        list = sortItems(list, sortBy, sortDir, Avatar::getPrice,
                Avatar::getCreatedAt, purchases);

        List<ShopItemDto> result = new ArrayList<>();
        for (Avatar a : list) {
            result.add(ShopItemDto.builder()
                    .id(a.getId())
                    .code(a.getCode())
                    .title(a.getTitle())
                    .description(a.getDescription())
                    .emoji(a.getEmoji())
                    .imageUrl(a.getImageUrl())
                    .cssClass(a.getCssClass())
                    .price(a.getPrice())
                    .oldPrice(a.getOldPrice())
                    .owned(paid.containsKey(a.getId()))
                    .pricePaid(paid.get(a.getId()))
                    .rewardOnly(itemInfoService.isAchievementReward(
                            rewardOnly, ShopItemInfoService.TYPE_AVATAR, a.getCode()))
                    .purchaseCount(purchases.getOrDefault(a.getId(), 0L))
                    .active(a.getId().equals(activeId))
                    .createdAt(a.getCreatedAt())
                    .categories(toCategoryDtos(a.getCategories()))
                    .build());
        }
        return result;
    }

    // ============================================================
    // Frames
    // ============================================================
    private List<ShopItemDto> buildFrameDtos(User user, Long activeId,
                                             List<Long> categoryIds,
                                             String sortBy, String sortDir,
                                             Map<String, Set<String>> rewardOnly) {
        Map<Long, Integer> paid = new HashMap<>();
        for (UserFrame uf : userFrameRepository.findByUserId(user.getId())) {
            paid.put(uf.getFrame().getId(), uf.getPricePaid());
        }
        Map<Long, Long> purchases = purchCounts(userFrameRepository.countPurchasesByFrame());

        List<Frame> list = frameRepository.findWithCategoriesFiltered(
                categoryIds == null || categoryIds.isEmpty() ? null : categoryIds
        );
        list = sortItems(list, sortBy, sortDir, Frame::getPrice,
                Frame::getCreatedAt, purchases);

        List<ShopItemDto> result = new ArrayList<>();
        for (Frame f : list) {
            result.add(ShopItemDto.builder()
                    .id(f.getId())
                    .code(f.getCode())
                    .title(f.getTitle())
                    .description(f.getDescription())
                    .cssClass(f.getCssClass())
                    .imageUrl(f.getImageUrl())
                    .hexColor(f.getHexColor())
                    .price(f.getPrice())
                    .oldPrice(f.getOldPrice())
                    .owned(paid.containsKey(f.getId()))
                    .pricePaid(paid.get(f.getId()))
                    .rewardOnly(itemInfoService.isAchievementReward(
                            rewardOnly, ShopItemInfoService.TYPE_FRAME, f.getCode()))
                    .purchaseCount(purchases.getOrDefault(f.getId(), 0L))
                    .active(f.getId().equals(activeId))
                    .createdAt(f.getCreatedAt())
                    .categories(toCategoryDtos(f.getCategories()))
                    .build());
        }
        return result;
    }

    // ============================================================
    // Tree skins
    // ============================================================
    private List<ShopItemDto> buildTreeSkinDtos(User user, Long activeId,
                                                String sortBy, String sortDir,
                                                Map<String, Set<String>> rewardOnly) {
        Map<Long, Integer> paid = new HashMap<>();
        for (UserTreeSkin us : userTreeSkinRepository.findByUserId(user.getId())) {
            paid.put(us.getTreeSkin().getId(), us.getPricePaid());
        }
        Map<Long, Long> purchases = purchCounts(userTreeSkinRepository.countPurchasesByTreeSkin());

        List<TreeSkin> list = sortItems(treeSkinRepository.findWithCategoriesFiltered(null),
                sortBy, sortDir, TreeSkin::getPrice, null, purchases);

        List<ShopItemDto> result = new ArrayList<>();
        for (TreeSkin s : list) {
            result.add(ShopItemDto.builder()
                    .id(s.getId())
                    .code(s.getCode())
                    .title(s.getTitle())
                    .description(s.getDescription())
                    .price(s.getPrice())
                    .owned(paid.containsKey(s.getId()))
                    .pricePaid(paid.get(s.getId()))
                    .rewardOnly(itemInfoService.isAchievementReward(
                            rewardOnly, ShopItemInfoService.TYPE_TREE, s.getCode()))
                    .purchaseCount(purchases.getOrDefault(s.getId(), 0L))
                    .active(s.getId().equals(activeId))
                    .createdAt(s.getCreatedAt())
                    .categories(toCategoryDtos(s.getCategories()))
                    .build());
        }
        return result;
    }

    // ============================================================
    // Accents
    // ============================================================
    private List<ShopItemDto> buildAccentDtos(User user, String activeCode,
                                              List<Long> categoryIds,
                                              String sortBy, String sortDir,
                                              Map<String, Set<String>> rewardOnly) {
        Map<Long, Integer> paid = new HashMap<>();
        for (UserAccent ua : userAccentRepository.findByUserId(user.getId())) {
            paid.put(ua.getAccentSkin().getId(), ua.getPricePaid());
        }
        Map<Long, Long> purchases = purchCounts(userAccentRepository.countPurchasesByAccent());

        List<AccentSkin> list = accentSkinRepository.findWithCategoriesFiltered(
                categoryIds == null || categoryIds.isEmpty() ? null : categoryIds
        );
        list = sortItems(list, sortBy, sortDir, AccentSkin::getPrice,
                AccentSkin::getCreatedAt, purchases);

        List<ShopItemDto> result = new ArrayList<>();
        for (AccentSkin a : list) {
            result.add(ShopItemDto.builder()
                    .id(a.getId())
                    .code(a.getCode())
                    .title(a.getTitle())
                    .description(a.getDescription())
                    .price(a.getPrice())
                    .oldPrice(a.getOldPrice())
                    .hexColor(a.getHexColor())
                    .hexColorSecondary(a.getHexColorSecondary())
                    .hexColorTertiary(a.getHexColorTertiary())
                    .isGradient(a.getIsGradient())
                    .isRare(a.getIsRare())
                    .imageUrl(a.getImageUrl())
                    .cssClass(a.getCode())
                    .owned(paid.containsKey(a.getId()))
                    .pricePaid(paid.get(a.getId()))
                    .rewardOnly(itemInfoService.isAchievementReward(
                            rewardOnly, ShopItemInfoService.TYPE_ACCENT, a.getCode()))
                    .purchaseCount(purchases.getOrDefault(a.getId(), 0L))
                    .active(a.getCode().equals(activeCode))
                    .createdAt(a.getCreatedAt())
                    .categories(toCategoryDtos(a.getCategories()))
                    .build());
        }
        return result;
    }

    // ============================================================
    // Backgrounds
    // ============================================================
    private List<ShopItemDto> buildBackgroundDtos(User user, String activeCode,
                                                  String sortBy, String sortDir) {
        Map<Long, Integer> paid = new HashMap<>();
        for (UserBackground ub : userBackgroundRepository.findByUserId(user.getId())) {
            paid.put(ub.getBackground().getId(), ub.getPricePaid());
        }
        Map<Long, Long> purchases = purchCounts(userBackgroundRepository.countPurchasesByBackground());

        List<ProfileBackground> list = sortItems(
                profileBackgroundRepository.findAllByOrderBySortOrderAsc(),
                sortBy, sortDir, ProfileBackground::getPrice,
                ProfileBackground::getCreatedAt, purchases);

        List<ShopItemDto> result = new ArrayList<>();
        for (ProfileBackground bg : list) {
            boolean free = bg.getPrice() == null || bg.getPrice() <= 0;
            result.add(ShopItemDto.builder()
                    .id(bg.getId())
                    .code(bg.getCode())
                    .title(bg.getTitle())
                    .description(bg.getDescription())
                    .price(bg.getPrice())
                    .oldPrice(bg.getOldPrice())
                    .imageUrl(bg.getImageUrl())
                    .cssClass(bg.getCssClass() != null ? bg.getCssClass() : bg.getCode())
                    .owned(free || paid.containsKey(bg.getId()))
                    .pricePaid(paid.get(bg.getId()))
                    .purchaseCount(purchases.getOrDefault(bg.getId(), 0L))
                    .active(bg.getCode().equalsIgnoreCase(activeCode))
                    .createdAt(bg.getCreatedAt())
                    .build());
        }
        return result;
    }

    // ============================================================
    // Helpers
    // ============================================================

    /**
     * Сортировка каталога.
     *
     *   • «price» — по цене по возрастанию/убыванию.
     *   • «popular» — по числу покупок; при равенстве новые сверху.
     *   • иначе (в т.ч. «default») — прежний порядок из репозитория.
     *
     * «По типу» сортирует фронт: карточка может попасть в несколько типов
     * сразу, поэтому размножение элементов логичнее до пагинации.
     */
    private <T> List<T> sortItems(List<T> list,
                                  String sortBy,
                                  String sortDir,
                                  java.util.function.Function<T, Integer> price,
                                  java.util.function.Function<T, java.time.LocalDateTime> createdAt,
                                  Map<Long, Long> purchases) {
        if (sortBy == null || sortBy.isBlank()) return list;

        if ("price".equalsIgnoreCase(sortBy)) {
            boolean desc = "desc".equalsIgnoreCase(sortDir);
            list.sort((a, b) -> desc
                    ? Integer.compare(price.apply(b), price.apply(a))
                    : Integer.compare(price.apply(a), price.apply(b)));
            return list;
        }

        if ("popular".equalsIgnoreCase(sortBy)) {
            boolean asc = "asc".equalsIgnoreCase(sortDir);
            list.sort((a, b) -> {
                long pa = purchases.getOrDefault(idOf(a), 0L);
                long pb = purchases.getOrDefault(idOf(b), 0L);
                int byCount = asc
                        ? Long.compare(pa, pb)
                        : Long.compare(pb, pa);
                if (byCount != 0) return byCount;

                // Новые сверху — «популярность + новые товары».
                if (createdAt == null) return 0;
                java.time.LocalDateTime ca = createdAt.apply(a);
                java.time.LocalDateTime cb = createdAt.apply(b);
                if (ca == null && cb == null) return 0;
                if (ca == null) return 1;
                if (cb == null) return -1;
                return cb.compareTo(ca);
            });
            return list;
        }

        return list;
    }

    /**
     * Универсальный резолвер id: сортировка «по популярности» сравнивает
     * число покупок, а компаратор не знает, в каком поле лежит id.
     */
    private static <T> Long idOf(T item) {
        if (item instanceof Avatar a) return a.getId();
        if (item instanceof Frame f) return f.getId();
        if (item instanceof TreeSkin t) return t.getId();
        if (item instanceof AccentSkin s) return s.getId();
        if (item instanceof ProfileBackground b) return b.getId();
        return -1L;
    }

    private Map<Long, Long> purchCounts(List<Object[]> rows) {
        Map<Long, Long> map = new HashMap<>();
        if (rows == null) return map;
        for (Object[] row : rows) {
            if (row == null || row.length < 2) continue;
            if (row[0] == null || row[1] == null) continue;
            map.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
        }
        return map;
    }

    private List<CategoryDto> toCategoryDtos(Set<?> categories) {
        if (categories == null || categories.isEmpty()) return List.of();
        return categories.stream()
                .map(c -> {
                    Long id = null;
                    String code = null;
                    String title = null;
                    Integer sortOrder = 0;
                    if (c instanceof AvatarCategory ac) {
                        id = ac.getId(); code = ac.getCode(); title = ac.getTitle(); sortOrder = ac.getSortOrder();
                    } else if (c instanceof FrameCategory fc) {
                        id = fc.getId(); code = fc.getCode(); title = fc.getTitle(); sortOrder = fc.getSortOrder();
                    } else if (c instanceof AccentCategory acc) {
                        id = acc.getId(); code = acc.getCode(); title = acc.getTitle(); sortOrder = acc.getSortOrder();
                    } else if (c instanceof TreeCategory tc) {
                        id = tc.getId(); code = tc.getCode(); title = tc.getTitle(); sortOrder = tc.getSortOrder();
                    }
                    return CategoryDto.builder()
                            .id(id).code(code).title(title).sortOrder(sortOrder)
                            .build();
                })
                .sorted((c1, c2) -> Integer.compare(c1.getSortOrder(), c2.getSortOrder()))
                .toList();
    }

    /**
     * Перегрузка, которая гарантированно не теряет тип элементов.
     *
     * Была только List<?> → Set<?>: у List<CategoryDto>-возвращающего метода с
     * аргументом List<TreeCategory> компилятор выбирал Set-версию (ошибок при
     * этом нет — стирание типов), та делала new HashSet<>(list) и на выходе
     * получала null во всех полях. Теперь выбор перегрузки однозначен.
     */
    private <T> List<CategoryDto> toCategoryDtos(Collection<T> categories, Class<T> type) {
        return toCategoryDtos(new LinkedHashSet<>(categories));
    }

    // ============================================================
    // Аватарки — купля/надевание
    // ============================================================
    @Transactional
    public UserShopDto buyAvatar(User user, Long avatarId) {
        Avatar avatar = avatarRepository.findById(avatarId)
                .orElseThrow(() -> new IllegalArgumentException("Avatar not found"));
        ensureNotAchievementReward(ShopItemInfoService.TYPE_AVATAR, avatar.getCode());
        if (userAvatarRepository.existsByUserIdAndAvatarId(user.getId(), avatarId)) {
            throw new IllegalArgumentException("Уже куплено");
        }
        deductLeaves(user, avatar.getPrice());
        userAvatarRepository.save(UserAvatar.builder()
                .user(user).avatar(avatar).pricePaid(avatar.getPrice()).build());
        return getShop(user);
    }

    @Transactional
    public UserShopDto equipAvatar(User user, Long avatarId) {
        if (!userAvatarRepository.existsByUserIdAndAvatarId(user.getId(), avatarId)) {
            throw new IllegalArgumentException("Аватарка не куплена");
        }
        Avatar avatar = avatarRepository.findById(avatarId).orElseThrow();
        UserAppearance appearance = userAppearanceRepository.findById(user.getId()).orElseThrow();
        appearance.setActiveAvatar(avatar);
        userAppearanceRepository.save(appearance);
        return getShop(user);
    }

    // ============================================================
    // Рамки
    // ============================================================
    @Transactional
    public UserShopDto buyFrame(User user, Long frameId) {
        Frame frame = frameRepository.findById(frameId)
                .orElseThrow(() -> new IllegalArgumentException("Frame not found"));
        ensureNotAchievementReward(ShopItemInfoService.TYPE_FRAME, frame.getCode());
        if (userFrameRepository.existsByUserIdAndFrameId(user.getId(), frameId)) {
            throw new IllegalArgumentException("Уже куплено");
        }
        deductLeaves(user, frame.getPrice());
        userFrameRepository.save(UserFrame.builder()
                .user(user).frame(frame).pricePaid(frame.getPrice()).build());
        return getShop(user);
    }

    @Transactional
    public UserShopDto equipFrame(User user, Long frameId) {
        if (!userFrameRepository.existsByUserIdAndFrameId(user.getId(), frameId)) {
            throw new IllegalArgumentException("Рамка не куплена");
        }
        Frame frame = frameRepository.findById(frameId).orElseThrow();
        UserAppearance appearance = userAppearanceRepository.findById(user.getId()).orElseThrow();
        appearance.setActiveFrame(frame);
        userAppearanceRepository.save(appearance);
        return getShop(user);
    }

    @Transactional
    public UserShopDto unequipFrame(User user) {
        UserAppearance appearance = userAppearanceRepository.findById(user.getId()).orElseThrow();
        appearance.setActiveFrame(null);
        userAppearanceRepository.save(appearance);
        return getShop(user);
    }

    // ============================================================
    // Деревья
    // ============================================================
    @Transactional
    public UserShopDto buyTreeSkin(User user, Long skinId) {
        TreeSkin skin = treeSkinRepository.findById(skinId)
                .orElseThrow(() -> new IllegalArgumentException("Tree skin not found"));
        ensureNotAchievementReward(ShopItemInfoService.TYPE_TREE, skin.getCode());
        if (userTreeSkinRepository.existsByUserIdAndTreeSkinId(user.getId(), skinId)) {
            throw new IllegalArgumentException("Уже куплено");
        }
        deductLeaves(user, skin.getPrice());
        userTreeSkinRepository.save(UserTreeSkin.builder()
                .user(user).treeSkin(skin).pricePaid(skin.getPrice()).build());
        return getShop(user);
    }

    @Transactional
    public UserShopDto equipTreeSkin(User user, Long skinId) {
        if (!userTreeSkinRepository.existsByUserIdAndTreeSkinId(user.getId(), skinId)) {
            throw new IllegalArgumentException("Скин не куплен");
        }
        TreeSkin skin = treeSkinRepository.findById(skinId).orElseThrow();
        UserAppearance appearance = userAppearanceRepository.findById(user.getId()).orElseThrow();
        appearance.setActiveTreeSkin(skin);
        userAppearanceRepository.save(appearance);
        return getShop(user);
    }

    @Transactional
    public UserShopDto unequipTreeSkin(User user) {
        UserAppearance appearance = userAppearanceRepository.findById(user.getId()).orElseThrow();
        appearance.setActiveTreeSkin(null);
        userAppearanceRepository.save(appearance);
        return getShop(user);
    }

    // ============================================================
    // Акценты
    // ============================================================
    @Transactional
    public UserShopDto buyAccent(User user, Long accentId) {
        AccentSkin skin = accentSkinRepository.findById(accentId)
                .orElseThrow(() -> new IllegalArgumentException("Accent not found"));
        ensureNotAchievementReward(ShopItemInfoService.TYPE_ACCENT, skin.getCode());
        if (userAccentRepository.existsByUserIdAndAccentSkinId(user.getId(), accentId)) {
            throw new IllegalArgumentException("Уже куплено");
        }
        deductLeaves(user, skin.getPrice());
        userAccentRepository.save(UserAccent.builder()
                .user(user).accentSkin(skin).pricePaid(skin.getPrice()).build());
        return getShop(user);
    }

    @Transactional
    public UserShopDto equipAccent(User user, Long accentId) {
        if (!userAccentRepository.existsByUserIdAndAccentSkinId(user.getId(), accentId)) {
            throw new IllegalArgumentException("Акцент не куплен");
        }
        AccentSkin skin = accentSkinRepository.findById(accentId).orElseThrow();
        UserAppearance appearance = userAppearanceRepository.findById(user.getId()).orElseThrow();
        appearance.setAccentCode(skin.getCode());
        userAppearanceRepository.save(appearance);
        return getShop(user);
    }

    @Transactional
    public UserShopDto unequipAccent(User user) {
        UserAppearance appearance = userAppearanceRepository.findById(user.getId()).orElseThrow();
        appearance.setAccentCode("blue");
        userAppearanceRepository.save(appearance);
        return getShop(user);
    }

    // ============================================================
    // Фоны профиля
    // ============================================================
    @Transactional
    public UserShopDto buyBackground(User user, Long backgroundId) {
        ProfileBackground bg = profileBackgroundRepository.findById(backgroundId)
                .orElseThrow(() -> new IllegalArgumentException("Фон не найден"));
        if (isBackgroundOwned(user, bg)) {
            throw new IllegalArgumentException("Уже куплено");
        }
        deductLeaves(user, bg.getPrice() != null ? bg.getPrice() : 0);
        userBackgroundRepository.save(UserBackground.builder()
                .user(user).background(bg).pricePaid(bg.getPrice()).build());
        return getShop(user);
    }

    @Transactional
    public UserShopDto equipBackground(User user, Long backgroundId) {
        ProfileBackground bg = profileBackgroundRepository.findById(backgroundId)
                .orElseThrow(() -> new IllegalArgumentException("Фон не найден"));
        if (!isBackgroundOwned(user, bg)) {
            throw new IllegalArgumentException("Фон не куплен");
        }
        UserProfile profile = userProfileRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalStateException("Profile not found"));
        profile.setBackgroundCode(bg.getCode());
        userProfileRepository.save(profile);
        return getShop(user);
    }

    private boolean isBackgroundOwned(User user, ProfileBackground bg) {
        boolean free = bg.getPrice() == null || bg.getPrice() <= 0;
        return free || userBackgroundRepository
                .existsByUserIdAndBackgroundId(user.getId(), bg.getId());
    }

    // ============================================================
    // Корзина
    // ============================================================

    /** Одна проверенная позиция корзины: тип, id, цена и название. */
    private record CartLine(String type, Long id, int price, String title) {}

    /**
     * Оформление корзины одной транзакцией.
     *
     * Порядок важен: сначала проверяем ВСЕ позиции (существует, не награда за
     * ачивку, ещё не куплено) и только потом списываем суммарную стоимость.
     * Если хоть одна позиция не проходит проверку — корзина не покупается
     * частично, баланс не меняется. Цена берётся с сервера, а не с клиента.
     */
    @Transactional
    public CartCheckoutDto checkoutCart(User user, List<CartItemDto> items) {
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("Корзина пуста");
        }

        // Убираем дубли: одну и ту же аватарку не должны списать дважды.
        Set<String> seen = new HashSet<>();
        List<CartLine> lines = new ArrayList<>();

        for (CartItemDto item : items) {
            if (item == null || item.getId() == null) {
                throw new IllegalArgumentException("Некорректный предмет в корзине");
            }
            String type = ShopItemInfoService.normalizeType(item.getType());
            if (type == null) {
                throw new IllegalArgumentException("Неизвестный тип предмета");
            }
            if (!seen.add(type + ":" + item.getId())) continue;

            Long id = item.getId();
            switch (type) {
                case ShopItemInfoService.TYPE_AVATAR -> {
                    Avatar avatar = avatarRepository.findById(id)
                            .orElseThrow(() -> new IllegalArgumentException("Аватарка не найдена"));
                    ensureNotAchievementReward(ShopItemInfoService.TYPE_AVATAR, avatar.getCode());
                    if (userAvatarRepository.existsByUserIdAndAvatarId(user.getId(), id)) {
                        throw new IllegalArgumentException("«" + avatar.getTitle() + "» уже куплено");
                    }
                    lines.add(new CartLine(type, id, avatar.getPrice(), avatar.getTitle()));
                }
                case ShopItemInfoService.TYPE_FRAME -> {
                    Frame frame = frameRepository.findById(id)
                            .orElseThrow(() -> new IllegalArgumentException("Рамка не найдена"));
                    ensureNotAchievementReward(ShopItemInfoService.TYPE_FRAME, frame.getCode());
                    if (userFrameRepository.existsByUserIdAndFrameId(user.getId(), id)) {
                        throw new IllegalArgumentException("«" + frame.getTitle() + "» уже куплено");
                    }
                    lines.add(new CartLine(type, id, frame.getPrice(), frame.getTitle()));
                }
                case ShopItemInfoService.TYPE_TREE -> {
                    TreeSkin skin = treeSkinRepository.findById(id)
                            .orElseThrow(() -> new IllegalArgumentException("Дерево не найдено"));
                    ensureNotAchievementReward(ShopItemInfoService.TYPE_TREE, skin.getCode());
                    if (userTreeSkinRepository.existsByUserIdAndTreeSkinId(user.getId(), id)) {
                        throw new IllegalArgumentException("«" + skin.getTitle() + "» уже куплено");
                    }
                    lines.add(new CartLine(type, id, skin.getPrice(), skin.getTitle()));
                }
                case ShopItemInfoService.TYPE_ACCENT -> {
                    AccentSkin skin = accentSkinRepository.findById(id)
                            .orElseThrow(() -> new IllegalArgumentException("Акцент не найден"));
                    ensureNotAchievementReward(ShopItemInfoService.TYPE_ACCENT, skin.getCode());
                    if (userAccentRepository.existsByUserIdAndAccentSkinId(user.getId(), id)) {
                        throw new IllegalArgumentException("«" + skin.getTitle() + "» уже куплено");
                    }
                    lines.add(new CartLine(type, id, skin.getPrice(), skin.getTitle()));
                }
                case ShopItemInfoService.TYPE_BACKGROUND -> {
                    ProfileBackground bg = profileBackgroundRepository.findById(id)
                            .orElseThrow(() -> new IllegalArgumentException("Фон не найден"));
                    if (isBackgroundOwned(user, bg)) {
                        throw new IllegalArgumentException("«" + bg.getTitle() + "» уже куплено");
                    }
                    lines.add(new CartLine(type, id, bg.getPrice() != null ? bg.getPrice() : 0, bg.getTitle()));
                }
                default -> throw new IllegalArgumentException("Неизвестный тип предмета");
            }
        }

        if (lines.isEmpty()) {
            throw new IllegalArgumentException("Корзина пуста");
        }

        int total = lines.stream().mapToInt(CartLine::price).sum();
        deductLeaves(user, total);

        List<String> titles = new ArrayList<>(lines.size());
        for (CartLine line : lines) {
            switch (line.type()) {
                case ShopItemInfoService.TYPE_AVATAR -> userAvatarRepository.save(UserAvatar.builder()
                        .user(user)
                        .avatar(avatarRepository.getReferenceById(line.id()))
                        .pricePaid(line.price())
                        .build());
                case ShopItemInfoService.TYPE_FRAME -> userFrameRepository.save(UserFrame.builder()
                        .user(user)
                        .frame(frameRepository.getReferenceById(line.id()))
                        .pricePaid(line.price())
                        .build());
                case ShopItemInfoService.TYPE_TREE -> userTreeSkinRepository.save(UserTreeSkin.builder()
                        .user(user)
                        .treeSkin(treeSkinRepository.getReferenceById(line.id()))
                        .pricePaid(line.price())
                        .build());
                case ShopItemInfoService.TYPE_ACCENT -> userAccentRepository.save(UserAccent.builder()
                        .user(user)
                        .accentSkin(accentSkinRepository.getReferenceById(line.id()))
                        .pricePaid(line.price())
                        .build());
                case ShopItemInfoService.TYPE_BACKGROUND -> userBackgroundRepository.save(UserBackground.builder()
                        .user(user)
                        .background(profileBackgroundRepository.getReferenceById(line.id()))
                        .pricePaid(line.price())
                        .build());
                default -> { }
            }
            titles.add(line.title());
        }

        return CartCheckoutDto.builder()
                .shop(getShop(user))
                .count(lines.size())
                .total(total)
                .titles(titles)
                .build();
    }

    // ============================================================
    // Листья
    // ============================================================

    /**
     * Гарантирует строку баланса у пользователя.
     *
     * Раньше @MapsId у UserCurrency требовал managed-ассоциацию и падал на
     * detached-пользователе. Теперь PK — обычная колонка, но ссылку на User
     * всё равно берём через getReferenceById: прокси без лишнего SELECT.
     */
    private UserCurrency ensureCurrency(User user) {
        return userCurrencyRepository.findById(user.getId())
                .orElseGet(() -> {
                    UserCurrency cur = UserCurrency.builder()
                            .userId(user.getId())
                            .leaves(0)
                            .build();
                    return userCurrencyRepository.saveAndFlush(cur);
                });
    }

    /**
     * Начислить листья. Если amount <= 0 — ничего не делает.
     */
    @Transactional
    public void addLeaves(User user, int amount) {
        if (amount <= 0) return;
        UserCurrency cur = ensureCurrency(user);
        cur.setLeaves(cur.getLeaves() + amount);
        cur.setTotalEarned((cur.getTotalEarned() == null ? 0 : cur.getTotalEarned()) + amount);
        userCurrencyRepository.save(cur);
    }

    /**
     * Безопасное списание. Если листьев не хватает — обнуляет до 0.
     * Не уходит в минус. Используется при отмене задач и удалении.
     */
    @Transactional
    public void deductLeavesSafe(User user, int amount) {
        if (amount <= 0) return;
        UserCurrency cur = ensureCurrency(user);
        int spent = Math.min(amount, Math.max(0, cur.getLeaves()));
        int newVal = Math.max(0, cur.getLeaves() - amount);
        cur.setLeaves(newVal);
        cur.setTotalSpent((cur.getTotalSpent() == null ? 0 : cur.getTotalSpent()) + spent);
        userCurrencyRepository.save(cur);
    }

    /**
     * Строгое списание для внешних сервисов (например, открытие сундука).
     * Бросает исключение, если листьев не хватает.
     */
    @Transactional
    public void spendLeaves(User user, int amount) {
        deductLeaves(user, amount);
    }

    /**
     * Строгое списание (для покупок). Бросает исключение, если не хватает.
     */
    private void deductLeaves(User user, int amount) {
        UserCurrency cur = ensureCurrency(user);
        if (cur.getLeaves() < amount) {
            throw new IllegalArgumentException("Недостаточно листьев");
        }
        cur.setLeaves(cur.getLeaves() - amount);
        cur.setTotalSpent((cur.getTotalSpent() == null ? 0 : cur.getTotalSpent()) + amount);
        userCurrencyRepository.save(cur);
    }

    /**
     * Предметы, выдаваемые за ачивки, не продаются — даже если у них
     * указана цена. Проверка стоит и в списке (флаг rewardOnly), и здесь,
     * чтобы покупку нельзя было обойти прямым запросом к API.
     */
    private void ensureNotAchievementReward(String type, String code) {
        if (itemInfoService.isAchievementReward(
                itemInfoService.achievementRewardCodes(), type, code)) {
            throw new IllegalArgumentException(
                    "Этот предмет выдаётся за достижение и не продаётся");
        }
    }

    private int getLeaves(User user) {
        return userCurrencyRepository.findById(user.getId())
                .map(UserCurrency::getLeaves)
                .orElse(0);
    }
}