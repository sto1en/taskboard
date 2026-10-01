package coursework.taskboard.service.search;

import coursework.taskboard.dto.search.*;
import coursework.taskboard.dto.task.TagShortDto;
import coursework.taskboard.dto.task.TaskMapper;
import coursework.taskboard.model.board.Board;
import coursework.taskboard.model.board.BoardStatus;
import coursework.taskboard.model.board.BoardStatusAppearance;
import coursework.taskboard.model.project.Project;
import coursework.taskboard.model.tag.Tag;
import coursework.taskboard.model.tag.TagAppearance;
import coursework.taskboard.model.task.Task;
import coursework.taskboard.model.task.TaskSchedule;
import coursework.taskboard.model.task.TaskSettings;
import coursework.taskboard.model.task.TaskTag;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.board.BoardRepository;
import coursework.taskboard.repository.board.BoardStatusAppearanceRepository;
import coursework.taskboard.repository.project.ProjectRepository;
import coursework.taskboard.repository.search.SearchRepository;
import coursework.taskboard.repository.tag.TagAppearanceRepository;
import coursework.taskboard.repository.tag.TagRepository;
import coursework.taskboard.repository.task.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {

    private static final int SUGGESTIONS_PER_KIND = 5;

    private final BoardRepository boardRepository;
    private final ProjectRepository projectRepository;
    private final TagRepository tagRepository;
    private final TagAppearanceRepository tagAppearanceRepository;
    private final TaskRepository taskRepository;
    private final TaskSettingsRepository taskSettingsRepository;
    private final TaskScheduleRepository taskScheduleRepository;
    private final TaskTagRepository taskTagRepository;
    private final BoardStatusAppearanceRepository boardStatusAppearanceRepository;
    private final SearchRepository searchRepository;

    private final TaskMapper taskMapper;    // ← добавлено

    // ============================================================
    // Глобальный (короткий — для dropdown TopBar)
    // ============================================================

    @Transactional(readOnly = true)
    public SearchResultDto globalSearch(String query, User user) {
        if (query == null || query.trim().length() < 2) {
            return SearchResultDto.builder()
                    .boards(List.of())
                    .projects(List.of())
                    .tasks(List.of())
                    .tags(List.of())
                    .build();
        }

        SearchFilterRequestDto f = new SearchFilterRequestDto();
        f.setQ(query.trim());
        f.setPage(0);
        f.setSize(SUGGESTIONS_PER_KIND);

        List<SearchItemDto> boards = searchBoards(user.getId(), f);
        List<SearchItemDto> projects = searchProjects(user.getId(), f);
        List<SearchItemDto> tasks = searchTasks(user.getId(), f);
        List<SearchItemDto> tags = searchTags(user.getId(), f);

        return SearchResultDto.builder()
                .boards(boards.stream().limit(SUGGESTIONS_PER_KIND).toList())
                .projects(projects.stream().limit(SUGGESTIONS_PER_KIND).toList())
                .tasks(tasks.stream().limit(SUGGESTIONS_PER_KIND).toList())
                .tags(tags.stream().limit(SUGGESTIONS_PER_KIND).toList())
                .build();
    }

    // ============================================================
    // Suggestions — короткий список для dropdown
    // ============================================================

    @Transactional(readOnly = true)
    public SearchSuggestionsDto suggestions(String query, User user) {
        if (query == null || query.trim().length() < 2) {
            return SearchSuggestionsDto.builder()
                    .boards(List.of())
                    .projects(List.of())
                    .tasks(List.of())
                    .tags(List.of())
                    .totalCount(0)
                    .build();
        }

        SearchFilterRequestDto f = new SearchFilterRequestDto();
        f.setQ(query.trim());

        List<SearchItemDto> boards = searchBoards(user.getId(), f);
        List<SearchItemDto> projects = searchProjects(user.getId(), f);
        List<SearchItemDto> tasks = searchTasks(user.getId(), f);
        List<SearchItemDto> tags = searchTags(user.getId(), f);

        long total = boards.size() + (long) projects.size() + tasks.size() + tags.size();

        return SearchSuggestionsDto.builder()
                .boards(boards.stream().limit(SUGGESTIONS_PER_KIND).toList())
                .projects(projects.stream().limit(SUGGESTIONS_PER_KIND).toList())
                .tasks(tasks.stream().limit(SUGGESTIONS_PER_KIND).toList())
                .tags(tags.stream().limit(SUGGESTIONS_PER_KIND).toList())
                .totalCount(total)
                .build();
    }

    // ============================================================
    // Полный фильтр с пагинацией
    // ============================================================

    @Transactional(readOnly = true)
    public SearchFilteredResponseDto filter(SearchFilterRequestDto f, User user) {
        List<SearchItemDto> boards = f.wantType("BOARD")
                ? searchBoards(user.getId(), f)
                : List.of();
        List<SearchItemDto> projects = f.wantType("PROJECT")
                ? searchProjects(user.getId(), f)
                : List.of();
        List<SearchItemDto> tasks = f.wantType("TASK")
                ? searchTasks(user.getId(), f)
                : List.of();
        List<SearchItemDto> tags = f.wantType("TAG")
                ? searchTags(user.getId(), f)
                : List.of();

        List<SearchItemDto> all = new ArrayList<>();
        all.addAll(boards);
        all.addAll(projects);
        all.addAll(tasks);
        all.addAll(tags);

        Map<String, Integer> kindOrder = Map.of(
                "task", 0,
                "project", 1,
                "board", 2,
                "tag", 3
        );
        all.sort(Comparator
                .comparingInt((SearchItemDto i) -> kindOrder.getOrDefault(i.getKind(), 99))
                .thenComparing(i -> i.getUpdatedAt() != null ? i.getUpdatedAt() : LocalDateTime.MIN,
                        Comparator.reverseOrder()));

        long total = all.size();
        int size = Math.max(1, Math.min(f.getSize(), 100));
        int page = Math.max(0, f.getPage());
        int totalPages = (int) Math.ceil((double) total / size);
        int fromIdx = Math.min(page * size, (int) total);
        int toIdx = Math.min(fromIdx + size, (int) total);

        List<SearchItemDto> pageItems = all.subList(fromIdx, toIdx);

        return SearchFilteredResponseDto.builder()
                .items(pageItems)
                .total(total)
                .page(page)
                .size(size)
                .totalPages(totalPages)
                .hasMore(page < totalPages - 1)
                .build();
    }

    // ============================================================
    // Поиск в проекте
    // ============================================================

    @Transactional(readOnly = true)
    public List<SearchItemDto> searchInProject(Long projectId, String query, User user) {
        if (query == null || query.isBlank()) return List.of();

        SearchFilterRequestDto f = new SearchFilterRequestDto();
        f.setQ(query.trim());
        f.setProjectIds(List.of(projectId));
        f.setTypes(List.of("TASK"));

        return searchTasks(user.getId(), f);
    }

    // ============================================================
    // Маппинг сущностей → SearchItemDto
    // ============================================================

    private List<SearchItemDto> searchBoards(Long userId, SearchFilterRequestDto f) {
        List<Board> boards = searchRepository.searchBoards(userId, f);
        return boards.stream().map(b -> SearchItemDto.builder()
                .kind("board")
                .id(b.getId())
                .title(b.getTitle())
                .subtitle(b.getDescription())
                .boardId(b.getId())
                .description(b.getDescription())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build()
        ).collect(Collectors.toList());
    }

    private List<SearchItemDto> searchProjects(Long userId, SearchFilterRequestDto f) {
        List<Project> projects = searchRepository.searchProjects(userId, f);
        return projects.stream().map(p -> SearchItemDto.builder()
                .kind("project")
                .id(p.getId())
                .title(p.getTitle())
                .subtitle(p.getBoard().getTitle())
                .boardId(p.getBoard().getId())
                .projectId(p.getId())
                .description(p.getDescription())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build()
        ).collect(Collectors.toList());
    }

    private List<SearchItemDto> searchTasks(Long userId, SearchFilterRequestDto f) {
        List<Task> tasks = searchRepository.searchTasks(userId, f);
        List<SearchItemDto> result = new ArrayList<>();

        for (Task task : tasks) {
            TaskSettings settings = taskSettingsRepository.findById(task.getId()).orElse(null);
            TaskSchedule schedule = taskScheduleRepository.findById(task.getId()).orElse(null);

            BoardStatus status = settings != null ? settings.getStatus() : null;
            BoardStatusAppearance appearance = status != null
                    ? boardStatusAppearanceRepository.findById(status.getId()).orElse(null)
                    : null;

            // ─── Теги как объекты ───
            List<TagShortDto> tagDtos = new ArrayList<>();
            for (TaskTag tt : taskTagRepository.findByTaskId(task.getId())) {
                Tag tag = tt.getTag();
                TagAppearance ta = tagAppearanceRepository.findById(tag.getId()).orElse(null);
                tagDtos.add(taskMapper.toTagShortDto(tag, ta));
            }

            result.add(SearchItemDto.builder()
                    .kind("task")
                    .id(task.getId())
                    .title(task.getTitle())
                    .subtitle(task.getProject().getTitle())
                    .boardId(task.getProject().getBoard().getId())
                    .projectId(task.getProject().getId())
                    .description(task.getDescription())
                    .statusCode(status != null ? status.getCode() : null)
                    .statusTitle(status != null ? status.getTitle() : null)
                    .statusCategoryCode(status != null ? status.getCategoryCode() : null)
                    .statusAccentCode(appearance != null ? appearance.getAccentCode() : null)
                    .deadline(schedule != null ? schedule.getDeadline() : null)
                    .priority(settings != null ? settings.getPriority() : 0)
                    .tags(tagDtos)
                    .createdAt(task.getCreatedAt())
                    .updatedAt(task.getUpdatedAt())
                    .build());
        }
        return result;
    }

    private List<SearchItemDto> searchTags(Long userId, SearchFilterRequestDto f) {
        List<Tag> tags = searchRepository.searchTags(userId, f);
        List<SearchItemDto> result = new ArrayList<>();

        for (Tag tag : tags) {
            TagAppearance appearance = tagAppearanceRepository.findById(tag.getId()).orElse(null);
            result.add(SearchItemDto.builder()
                    .kind("tag")
                    .id(tag.getId())
                    .title(tag.getTitle())
                    .subtitle(tag.getBoard().getTitle())
                    .boardId(tag.getBoard().getId())
                    .accentCode(appearance != null ? appearance.getAccentCode() : null)
                    .icon(appearance != null ? appearance.getIcon() : null)
                    .createdAt(tag.getCreatedAt())
                    .build());
        }
        return result;
    }
}