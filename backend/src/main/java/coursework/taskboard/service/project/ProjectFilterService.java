package coursework.taskboard.service.project;

import coursework.taskboard.dto.project.PinnedFilterDto;
import coursework.taskboard.model.project.Project;
import coursework.taskboard.model.project.ProjectUserFilter;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.board.BoardMemberRepository;
import coursework.taskboard.repository.project.ProjectRepository;
import coursework.taskboard.repository.project.ProjectUserFilterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProjectFilterService {

    private final ProjectUserFilterRepository filterRepository;
    private final ProjectRepository projectRepository;
    private final BoardMemberRepository boardMemberRepository;

    @Transactional(readOnly = true)
    public Optional<PinnedFilterDto> get(Long projectId, User user) {
        checkProjectAccess(projectId, user);

        return filterRepository.findByUserIdAndProjectId(user.getId(), projectId)
                .map(f -> PinnedFilterDto.builder()
                        .statusIds(f.getStatusIds())
                        .sortMode(f.getSortMode())
                        .sortDir(f.getSortDir())
                        .viewMode(f.getViewMode())
                        .build());
    }

    @Transactional
    public PinnedFilterDto save(Long projectId, PinnedFilterDto dto, User user) {
        checkProjectAccess(projectId, user);

        ProjectUserFilter filter = filterRepository
                .findByUserIdAndProjectId(user.getId(), projectId)
                .orElseGet(() -> {
                    ProjectUserFilter f = new ProjectUserFilter();
                    f.setUserId(user.getId());
                    f.setProjectId(projectId);
                    return f;
                });

        filter.setStatusIds(dto.getStatusIds() != null
                ? dto.getStatusIds()
                : List.of());
        filter.setSortMode(dto.getSortMode());
        filter.setSortDir(dto.getSortDir());
        filter.setViewMode(dto.getViewMode());

        filterRepository.save(filter);

        return PinnedFilterDto.builder()
                .statusIds(filter.getStatusIds())
                .sortMode(filter.getSortMode())
                .sortDir(filter.getSortDir())
                .viewMode(filter.getViewMode())
                .build();
    }

    @Transactional
    public void clear(Long projectId, User user) {
        checkProjectAccess(projectId, user);
        filterRepository.deleteByUserIdAndProjectId(user.getId(), projectId);
    }

    @Transactional
    public void onStatusDeleted(Long statusId) {
        filterRepository.removeStatusFromAll(statusId);
    }

    private void checkProjectAccess(Long projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        if (!boardMemberRepository.existsByBoardIdAndUserId(
                project.getBoard().getId(), user.getId())) {
            throw new IllegalArgumentException("No access to project");
        }
    }
}