package coursework.taskboard.service.shop;

import coursework.taskboard.dto.shop.CategoryDto;
import coursework.taskboard.dto.shop.ShopItemDto;
import coursework.taskboard.dto.shop.UserShopDto;
import coursework.taskboard.model.shop.*;
import coursework.taskboard.model.user.User;
import coursework.taskboard.model.user.UserAppearance;
import coursework.taskboard.repository.shop.*;
import coursework.taskboard.repository.user.UserAppearanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final AvatarRepository avatarRepository;
    private final FrameRepository frameRepository;
    private final TreeSkinRepository treeSkinRepository;
    private final AccentSkinRepository accentSkinRepository;
    private final UserCurrencyRepository userCurrencyRepository;
    private final UserAvatarRepository userAvatarRepository;
    private final UserFrameRepository userFrameRepository;
    private final UserTreeSkinRepository userTreeSkinRepository;
    private final UserAccentRepository userAccentRepository;
    private final UserAppearanceRepository userAppearanceRepository;

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

        return UserShopDto.builder()
                .leaves(leaves)
                .avatars(buildAvatarDtos(user, activeAvatarId, avatarCategoryIds, sortBy, sortDir))
                .frames(buildFrameDtos(user, activeFrameId, frameCategoryIds, sortBy, sortDir))
                .treeSkins(buildTreeSkinDtos(user, activeSkinId))
                .accents(buildAccentDtos(user, activeAccentCode, accentCategoryIds, sortBy, sortDir))
                .build();
    }

    @Transactional(readOnly = true)
    public UserShopDto getShop(User user) {
        return getShop(user, null, null, null, null, null);
    }

    // ============================================================
    // Avatars
    // ============================================================
    private List<ShopItemDto> buildAvatarDtos(User user, Long activeId,
                                              List<Long> categoryIds,
                                              String sortBy, String sortDir) {
        Set<Long> owned = new HashSet<>();
        for (UserAvatar ua : userAvatarRepository.findByUserId(user.getId())) {
            owned.add(ua.getAvatar().getId());
        }

        List<Avatar> list = avatarRepository.findWithCategoriesFiltered(
                categoryIds == null || categoryIds.isEmpty() ? null : categoryIds
        );
        list = sortByPrice(list, sortBy, sortDir, Avatar::getPrice);

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
                    .owned(owned.contains(a.getId()))
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
                                             String sortBy, String sortDir) {
        Set<Long> owned = new HashSet<>();
        for (UserFrame uf : userFrameRepository.findByUserId(user.getId())) {
            owned.add(uf.getFrame().getId());
        }

        List<Frame> list = frameRepository.findWithCategoriesFiltered(
                categoryIds == null || categoryIds.isEmpty() ? null : categoryIds
        );
        list = sortByPrice(list, sortBy, sortDir, Frame::getPrice);

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
                    .owned(owned.contains(f.getId()))
                    .active(f.getId().equals(activeId))
                    .createdAt(f.getCreatedAt())
                    .categories(toCategoryDtos(f.getCategories()))
                    .build());
        }
        return result;
    }

    // ============================================================
    // Tree skins (без категорий)
    // ============================================================
    private List<ShopItemDto> buildTreeSkinDtos(User user, Long activeId) {
        Set<Long> owned = new HashSet<>();
        for (UserTreeSkin us : userTreeSkinRepository.findByUserId(user.getId())) {
            owned.add(us.getTreeSkin().getId());
        }

        List<ShopItemDto> result = new ArrayList<>();
        for (TreeSkin s : treeSkinRepository.findAllByOrderBySortOrderAsc()) {
            result.add(ShopItemDto.builder()
                    .id(s.getId())
                    .code(s.getCode())
                    .title(s.getTitle())
                    .description(s.getDescription())
                    .price(s.getPrice())
                    .owned(owned.contains(s.getId()))
                    .active(s.getId().equals(activeId))
                    .build());
        }
        return result;
    }

    // ============================================================
    // Accents
    // ============================================================
    private List<ShopItemDto> buildAccentDtos(User user, String activeCode,
                                              List<Long> categoryIds,
                                              String sortBy, String sortDir) {
        Set<Long> owned = new HashSet<>();
        for (UserAccent ua : userAccentRepository.findByUserId(user.getId())) {
            owned.add(ua.getAccentSkin().getId());
        }

        List<AccentSkin> list = accentSkinRepository.findWithCategoriesFiltered(
                categoryIds == null || categoryIds.isEmpty() ? null : categoryIds
        );
        list = sortByPrice(list, sortBy, sortDir, AccentSkin::getPrice);

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
                    .isGradient(a.getIsGradient())
                    .imageUrl(a.getImageUrl())
                    .cssClass(a.getCode())
                    .owned(owned.contains(a.getId()))
                    .active(a.getCode().equals(activeCode))
                    .createdAt(a.getCreatedAt())
                    .categories(toCategoryDtos(a.getCategories()))
                    .build());
        }
        return result;
    }

    // ============================================================
    // Helpers
    // ============================================================
    private <T> List<T> sortByPrice(List<T> list, String sortBy, String sortDir,
                                    java.util.function.Function<T, Integer> priceGetter) {
        if (!"price".equalsIgnoreCase(sortBy)) return list;
        boolean desc = "desc".equalsIgnoreCase(sortDir);
        list.sort((a, b) -> desc
                ? Integer.compare(priceGetter.apply(b), priceGetter.apply(a))
                : Integer.compare(priceGetter.apply(a), priceGetter.apply(b)));
        return list;
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
                    }
                    return CategoryDto.builder()
                            .id(id).code(code).title(title).sortOrder(sortOrder)
                            .build();
                })
                .sorted((c1, c2) -> Integer.compare(c1.getSortOrder(), c2.getSortOrder()))
                .toList();
    }

    // ============================================================
    // Аватарки — купля/надевание
    // ============================================================
    @Transactional
    public UserShopDto buyAvatar(User user, Long avatarId) {
        Avatar avatar = avatarRepository.findById(avatarId)
                .orElseThrow(() -> new IllegalArgumentException("Avatar not found"));
        if (userAvatarRepository.existsByUserIdAndAvatarId(user.getId(), avatarId)) {
            throw new IllegalArgumentException("Уже куплено");
        }
        deductLeaves(user, avatar.getPrice());
        userAvatarRepository.save(UserAvatar.builder().user(user).avatar(avatar).build());
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
        if (userFrameRepository.existsByUserIdAndFrameId(user.getId(), frameId)) {
            throw new IllegalArgumentException("Уже куплено");
        }
        deductLeaves(user, frame.getPrice());
        userFrameRepository.save(UserFrame.builder().user(user).frame(frame).build());
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
        if (userTreeSkinRepository.existsByUserIdAndTreeSkinId(user.getId(), skinId)) {
            throw new IllegalArgumentException("Уже куплено");
        }
        deductLeaves(user, skin.getPrice());
        userTreeSkinRepository.save(UserTreeSkin.builder().user(user).treeSkin(skin).build());
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
        if (userAccentRepository.existsByUserIdAndAccentSkinId(user.getId(), accentId)) {
            throw new IllegalArgumentException("Уже куплено");
        }
        deductLeaves(user, skin.getPrice());
        userAccentRepository.save(UserAccent.builder().user(user).accentSkin(skin).build());
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
    // Листья
    // ============================================================

    /**
     * Начислить листья. Если amount <= 0 — ничего не делает.
     */
    @Transactional
    public void addLeaves(User user, int amount) {
        if (amount <= 0) return;
        UserCurrency cur = userCurrencyRepository.findById(user.getId())
                .orElseGet(() -> userCurrencyRepository.save(
                        UserCurrency.builder()
                                .user(user)
                                .userId(user.getId())
                                .leaves(0)
                                .build()
                ));
        cur.setLeaves(cur.getLeaves() + amount);
        userCurrencyRepository.save(cur);
    }

    /**
     * Безопасное списание. Если листьев не хватает — обнуляет до 0.
     * Не уходит в минус. Используется при отмене задач и удалении.
     */
    @Transactional
    public void deductLeavesSafe(User user, int amount) {
        if (amount <= 0) return;
        UserCurrency cur = userCurrencyRepository.findById(user.getId())
                .orElseGet(() -> userCurrencyRepository.save(
                        UserCurrency.builder()
                                .user(user)
                                .userId(user.getId())
                                .leaves(0)
                                .build()
                ));
        int newVal = Math.max(0, cur.getLeaves() - amount);
        cur.setLeaves(newVal);
        userCurrencyRepository.save(cur);
    }

    /**
     * Строгое списание (для покупок). Бросает исключение, если не хватает.
     */
    private void deductLeaves(User user, int amount) {
        UserCurrency cur = userCurrencyRepository.findById(user.getId())
                .orElseGet(() -> userCurrencyRepository.save(
                        UserCurrency.builder()
                                .user(user)
                                .userId(user.getId())
                                .leaves(0)
                                .build()
                ));
        if (cur.getLeaves() < amount) {
            throw new IllegalArgumentException("Недостаточно листьев");
        }
        cur.setLeaves(cur.getLeaves() - amount);
        userCurrencyRepository.save(cur);
    }

    private int getLeaves(User user) {
        return userCurrencyRepository.findById(user.getId())
                .map(UserCurrency::getLeaves)
                .orElse(0);
    }
}