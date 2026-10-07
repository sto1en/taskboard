package coursework.taskboard.model.user;

import coursework.taskboard.model.shop.Avatar;
import coursework.taskboard.model.shop.Frame;
import coursework.taskboard.model.shop.TreeSkin;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_appearance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAppearance {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private UserSettings settings;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String theme = "light";

    @Column(name = "accent_code", length = 30)
    @Builder.Default
    private String accentCode = "blue";

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String density = "cozy";

    @Column(name = "sidebar_collapsed", nullable = false)
    @Builder.Default
    private Boolean sidebarCollapsed = false;

    @Column(name = "tree_enabled", nullable = false)
    @Builder.Default
    private Boolean treeEnabled = true;

    @Column(name = "tree_kind", nullable = false, length = 20)
    @Builder.Default
    private String treeKind = "sakura";

    // ============================================================
    // Магазин: активные рамка и скин дерева
    // ============================================================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "active_frame_id")
    private Frame activeFrame;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "active_tree_skin_id")
    private TreeSkin activeTreeSkin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "active_avatar_id")
    private Avatar activeAvatar;
}