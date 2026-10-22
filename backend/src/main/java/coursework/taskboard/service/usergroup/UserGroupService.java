package coursework.taskboard.service.usergroup;

import coursework.taskboard.dto.social.SocialUserDto;
import coursework.taskboard.dto.usergroup.*;
import coursework.taskboard.model.project.Project;
import coursework.taskboard.model.project.ProjectInvite;
import coursework.taskboard.model.project.ProjectMember;
import coursework.taskboard.model.project.ProjectSettings;
import coursework.taskboard.model.usergroup.UserGroup;
import coursework.taskboard.model.usergroup.UserGroupMember;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.project.ProjectInviteRepository;
import coursework.taskboard.repository.project.ProjectMemberRepository;
import coursework.taskboard.repository.project.ProjectSettingsRepository;
import coursework.taskboard.repository.user.UserRepository;
import coursework.taskboard.repository.usergroup.UserGroupMemberRepository;
import coursework.taskboard.repository.usergroup.UserGroupRepository;
import coursework.taskboard.service.access.ProjectAccessService;
import coursework.taskboard.service.social.SocialProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Пользовательские группы (списки людей) и приглашения из них.
 *
 * Сценарий:
 *  1. Владелец создаёт группу и добавляет людей — им уходит приглашение.
 *  2. Приглашённый принимает: он становится accepted-участником, а у него
 *     создаётся такая же (зеркальная) группа.
 *  3. Владелец одной кнопкой приглашает всех accepted-участников группы
 *     в кооперативный проект — каждому создаётся персональное приглашение.
 */
@Service
@RequiredArgsConstructor
public class UserGroupService {

    private final UserGroupRepository groupRepository;
    private final UserGroupMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final ProjectAccessService accessService;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectSettingsRepository projectSettingsRepository;
    private final ProjectInviteRepository projectInviteRepository;
    private final SocialProfileService socialProfileService;

    // ============================================================
    // Группы
    // ============================================================

    @Transactional(readOnly = true)
    public List<UserGroupDto> list(User user) {
        List<UserGroup> groups = groupRepository.findByOwnerIdOrderByCreatedAtAsc(user.getId());
        List<UserGroupDto> result = new ArrayList<>();
        for (UserGroup g : groups) {
            result.add(toDto(g, user));
        }
        return result;
    }

    @Transactional
    public UserGroupDto create(User user, CreateUserGroupRequest request) {
        String name = normalizeName(request.getName());
        UserGroup group = groupRepository.save(UserGroup.builder()
                .owner(user)
                .name(name)
                .build());

        memberRepository.save(UserGroupMember.builder()
                .group(group)
                .user(user)
                .status(UserGroupMember.ACCEPTED)
                .respondedAt(LocalDateTime.now())
                .build());

        return toDto(group, user);
    }

    @Transactional
    public UserGroupDto rename(Long groupId, UpdateUserGroupRequest request, User user) {
        UserGroup group = requireOwnedGroup(groupId, user);
        group.setName(normalizeName(request.getName()));
        groupRepository.save(group);
        return toDto(group, user);
    }

    @Transactional
    public void delete(Long groupId, User user) {
        UserGroup group = requireOwnedGroup(groupId, user);
        memberRepository.deleteAll(memberRepository.findByGroupIdOrderByCreatedAtAsc(groupId));
        groupRepository.delete(group);
    }

    @Transactional
    public UserGroupDto addMember(Long groupId, AddUserGroupMemberRequest request, User user) {
        UserGroup group = requireOwnedGroup(groupId, user);

        if (request.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Вы уже в этой группе");
        }
        User target = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        Optional<UserGroupMember> existing =
                memberRepository.findByGroupIdAndUserId(groupId, target.getId());
        if (existing.isPresent()) {
            throw new IllegalArgumentException(
                    UserGroupMember.ACCEPTED.equals(existing.get().getStatus())
                            ? "Пользователь уже в группе"
                            : "Приглашение уже отправлено");
        }

        memberRepository.save(UserGroupMember.builder()
                .group(group)
                .user(target)
                .status(UserGroupMember.PENDING)
                .build());

        return toDto(group, user);
    }

    /** Удалить участника (владелец) или выйти из чужой группы (сам участник). */
    @Transactional
    public void removeMember(Long groupId, Long userId, User user) {
        UserGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Группа не найдена"));

        boolean owner = group.getOwner().getId().equals(user.getId());
        boolean self = user.getId().equals(userId);
        if (!owner && !self) {
            throw new IllegalArgumentException("Недостаточно прав");
        }

        if (userId.equals(group.getOwner().getId())) {
            throw new IllegalArgumentException("Владелец не может выйти из своей группы — удалите группу");
        }

        UserGroupMember member = memberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Участник не найден"));
        memberRepository.delete(member);
    }

    // ============================================================
    // Приглашения в группы
    // ============================================================

    @Transactional(readOnly = true)
    public List<UserGroupInviteDto> incomingGroupInvites(User user) {
        List<UserGroupMember> pending = memberRepository
                .findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), UserGroupMember.PENDING);

        List<UserGroupInviteDto> result = new ArrayList<>();
        for (UserGroupMember m : pending) {
            UserGroup g = m.getGroup();
            SocialUserDto owner = socialProfileService.toSocialUser(g.getOwner());
            result.add(UserGroupInviteDto.builder()
                    .groupId(g.getId())
                    .groupName(g.getName())
                    .ownerId(g.getOwner().getId())
                    .ownerUsername(g.getOwner().getUsername())
                    .ownerDisplayName(owner.getDisplayName())
                    .createdAt(m.getCreatedAt())
                    .acceptedCount((int) memberRepository
                            .countByGroupIdAndStatus(g.getId(), UserGroupMember.ACCEPTED))
                    .build());
        }
        return result;
    }

    @Transactional
    public UserGroupDto acceptGroupInvite(Long groupId, User user) {
        UserGroupMember membership = memberRepository.findByGroupIdAndUserId(groupId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Приглашение не найдено"));
        if (!UserGroupMember.PENDING.equals(membership.getStatus())) {
            throw new IllegalArgumentException("Приглашение уже обработано");
        }

        membership.setStatus(UserGroupMember.ACCEPTED);
        membership.setRespondedAt(LocalDateTime.now());
        memberRepository.save(membership);

        // Зеркальная группа: у принявшего появляется такая же группа со всеми,
        // кто уже согласился. Создаётся один раз на исходную группу.
        UserGroup source = membership.getGroup();
        Optional<UserGroup> existingMirror = groupRepository
                .findByOwnerIdAndOriginGroupId(user.getId(), source.getId());
        UserGroup mirror = existingMirror.orElseGet(() -> {
            UserGroup g = groupRepository.save(UserGroup.builder()
                    .owner(user)
                    .name(source.getName())
                    .originGroupId(source.getId())
                    .build());
            memberRepository.save(UserGroupMember.builder()
                    .group(g)
                    .user(user)
                    .status(UserGroupMember.ACCEPTED)
                    .respondedAt(LocalDateTime.now())
                    .build());
            return g;
        });

        for (UserGroupMember m : memberRepository.findByGroupIdAndStatus(
                source.getId(), UserGroupMember.ACCEPTED)) {
            if (m.getUser().getId().equals(user.getId())) continue;
            if (memberRepository.findByGroupIdAndUserId(
                    mirror.getId(), m.getUser().getId()).isPresent()) continue;
            memberRepository.save(UserGroupMember.builder()
                    .group(mirror)
                    .user(m.getUser())
                    .status(UserGroupMember.ACCEPTED)
                    .respondedAt(LocalDateTime.now())
                    .build());
        }

        return toDto(mirror, user);
    }

    @Transactional
    public void declineGroupInvite(Long groupId, User user) {
        UserGroupMember membership = memberRepository.findByGroupIdAndUserId(groupId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Приглашение не найдено"));
        if (!UserGroupMember.PENDING.equals(membership.getStatus())) {
            throw new IllegalArgumentException("Приглашение уже обработано");
        }
        memberRepository.delete(membership);
    }

    // ============================================================
    // Приглашение группы в проект
    // ============================================================

    @Transactional
    public GroupInviteResultDto inviteGroupToProject(Long groupId, Long projectId, User user) {
        UserGroup group = requireOwnedGroup(groupId, user);
        Project project = accessService.requireProject(projectId, user);

        String role = accessService.role(project, user);
        if (!"owner".equals(role) && !"editor".equals(role)) {
            throw new IllegalArgumentException("Недостаточно прав в проекте");
        }

        ProjectSettings settings = projectSettingsRepository.findById(projectId).orElse(null);
        if (settings != null && !Boolean.TRUE.equals(settings.getIsCoop())) {
            throw new IllegalArgumentException("Приглашать можно только в кооперативный проект");
        }

        int invited = 0;
        int skipped = 0;
        for (UserGroupMember m : memberRepository.findByGroupIdAndStatus(
                groupId, UserGroupMember.ACCEPTED)) {
            User target = m.getUser();
            if (target.getId().equals(user.getId())) continue;
            if (projectMemberRepository.existsByProjectIdAndUserId(projectId, target.getId())
                    || projectInviteRepository
                    .findByProjectIdAndInvitedUserId(projectId, target.getId()).isPresent()) {
                skipped++;
                continue;
            }

            projectInviteRepository.save(ProjectInvite.builder()
                    .token(UUID.randomUUID().toString().replace("-", ""))
                    .project(project)
                    .createdBy(user)
                    .invitedUser(target)
                    .expiresAt(LocalDateTime.now().plusDays(14))
                    .build());
            invited++;
        }

        return GroupInviteResultDto.builder()
                .groupId(groupId)
                .projectId(projectId)
                .invited(invited)
                .skipped(skipped)
                .build();
    }

    @Transactional(readOnly = true)
    public List<GroupProjectInviteDto> incomingProjectInvites(User user) {
        List<ProjectInvite> invites = projectInviteRepository
                .findByInvitedUserIdOrderByCreatedAtDesc(user.getId());

        List<GroupProjectInviteDto> result = new ArrayList<>();
        for (ProjectInvite inv : invites) {
            if (inv.getExpiresAt() != null && inv.getExpiresAt().isBefore(LocalDateTime.now())) continue;
            if (projectMemberRepository.existsByProjectIdAndUserId(
                    inv.getProject().getId(), user.getId())) continue;

            SocialUserDto from = socialProfileService.toSocialUser(inv.getCreatedBy());
            result.add(GroupProjectInviteDto.builder()
                    .token(inv.getToken())
                    .projectId(inv.getProject().getId())
                    .projectTitle(inv.getProject().getTitle())
                    .fromUserId(inv.getCreatedBy().getId())
                    .fromUsername(inv.getCreatedBy().getUsername())
                    .fromDisplayName(from.getDisplayName())
                    .createdAt(inv.getCreatedAt())
                    .expiresAt(inv.getExpiresAt())
                    .build());
        }
        return result;
    }

    @Transactional
    public void declineProjectInvite(String token, User user) {
        ProjectInvite invite = projectInviteRepository.findById(token)
                .orElseThrow(() -> new IllegalArgumentException("Приглашение не найдено"));
        if (invite.getInvitedUser() == null
                || !invite.getInvitedUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Это приглашение не вам");
        }
        projectInviteRepository.delete(invite);
    }

    // ============================================================
    // helpers
    // ============================================================

    private UserGroup requireOwnedGroup(Long groupId, User user) {
        UserGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Группа не найдена"));
        if (!group.getOwner().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Только владелец группы может это сделать");
        }
        return group;
    }

    private String normalizeName(String raw) {
        String name = raw == null ? "" : raw.trim();
        if (name.isEmpty()) throw new IllegalArgumentException("Название группы не может быть пустым");
        if (name.length() > 64) throw new IllegalArgumentException("Слишком длинное название");
        return name;
    }

    private UserGroupDto toDto(UserGroup group, User viewer) {
        List<UserGroupMember> members = memberRepository
                .findByGroupIdOrderByCreatedAtAsc(group.getId());

        List<UserGroupMemberDto> memberDtos = new ArrayList<>();
        int accepted = 0;
        int pending = 0;
        for (UserGroupMember m : members) {
            SocialUserDto s = socialProfileService.toSocialUser(m.getUser());
            boolean isOwner = group.getOwner().getId().equals(m.getUser().getId());
            if (UserGroupMember.ACCEPTED.equals(m.getStatus())) accepted++;
            else pending++;
            memberDtos.add(UserGroupMemberDto.builder()
                    .userId(s.getUserId())
                    .username(s.getUsername())
                    .displayName(s.getDisplayName())
                    .avatarUrl(s.getAvatarUrl())
                    .avatarCode(s.getAvatarCode())
                    .avatarEmoji(s.getAvatarEmoji())
                    .avatarImageUrl(s.getAvatarImageUrl())
                    .frameCssClass(s.getFrameCssClass())
                    .status(m.getStatus())
                    .isOwner(isOwner)
                    .isMe(m.getUser().getId().equals(viewer.getId()))
                    .build());
        }

        return UserGroupDto.builder()
                .id(group.getId())
                .name(group.getName())
                .ownerId(group.getOwner().getId())
                .ownerUsername(group.getOwner().getUsername())
                .isOwner(group.getOwner().getId().equals(viewer.getId()))
                .originGroupId(group.getOriginGroupId())
                .createdAt(group.getCreatedAt())
                .members(memberDtos)
                .acceptedCount(accepted)
                .pendingCount(pending)
                .build();
    }
}
