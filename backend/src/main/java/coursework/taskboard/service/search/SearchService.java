package coursework.taskboard.service.search;

import coursework.taskboard.dto.search.SearchItemDto;
import coursework.taskboard.dto.search.SearchResultDto;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.board.BoardRepository;
import coursework.taskboard.repository.tag.TagRepository;
import coursework.taskboard.repository.project.ProjectRepository;
import coursework.taskboard.repository.task.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {

    private static final int MAX_RESULTS_PER_KIND = 10;

    private final BoardRepository boardRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TagRepository tagRepository;

    @Transactional(readOnly = true)
    public SearchResultDto globalSearch(String query, User user) {
        if (query == null || query.isBlank() || query.trim().length() < 2) {
            return SearchResultDto.builder()
                    .boards(List.of())
                    .projects(List.of())
                    .tasks(List.of())
                    .tags(List.of())
                    .build();
        }

        String q = query.trim();

        // 1. Доски пользователя
        List<SearchItemDto> boards = boardRepository
                .findByOwnerIdOrderByPositionAsc(user.getId())
                .stream()
                .filter(b -> matches(b.getTitle(), q) || matches(b.getDescription(), q))
                .limit(MAX_RESULTS_PER_KIND)
                .map(b -> SearchItemDto.builder()
                        .kind("board")
                        .id(b.getId())
                        .title(b.getTitle())
                        .boardId(b.getId())
                        .build())
                .collect(Collectors.toList());

        Set<Long> boardIds = boardRepository.findByOwnerIdOrderByPositionAsc(user.getId())
                .stream().map(b -> b.getId()).collect(Collectors.toSet());

        // 2. Проекты
        List<SearchItemDto> projects = new ArrayList<>();
        projectRepository.findAll().stream()
                .filter(p -> boardIds.contains(p.getBoard().getId()))
                .filter(p -> matches(p.getTitle(), q) || matches(p.getDescription(), q))
                .limit(MAX_RESULTS_PER_KIND)
                .forEach(p -> projects.add(SearchItemDto.builder()
                        .kind("project")
                        .id(p.getId())
                        .title(p.getTitle())
                        .subtitle(p.getBoard().getTitle())
                        .boardId(p.getBoard().getId())
                        .projectId(p.getId())
                        .build()));

        // 3. Задачи
        List<SearchItemDto> tasks = new ArrayList<>();
        taskRepository.findAllByOwnerId(user.getId()).stream()
                .filter(t -> t.getParent() == null)
                .filter(t -> matches(t.getTitle(), q) || matches(t.getDescription(), q))
                .limit(MAX_RESULTS_PER_KIND)
                .forEach(t -> tasks.add(SearchItemDto.builder()
                        .kind("task")
                        .id(t.getId())
                        .title(t.getTitle())
                        .subtitle(t.getProject().getTitle())
                        .boardId(t.getProject().getBoard().getId())
                        .projectId(t.getProject().getId())
                        .build()));

        // 4. Теги
        List<SearchItemDto> tags = new ArrayList<>();
        for (Long boardId : boardIds) {
            tagRepository.searchByTitle(boardId, q).stream()
                    .limit(MAX_RESULTS_PER_KIND)
                    .forEach(tag -> tags.add(SearchItemDto.builder()
                            .kind("tag")
                            .id(tag.getId())
                            .title(tag.getTitle())
                            .subtitle(tag.getBoard().getTitle())
                            .boardId(tag.getBoard().getId())
                            .build()));
        }

        return SearchResultDto.builder()
                .boards(limit(boards))
                .projects(limit(projects))
                .tasks(limit(tasks))
                .tags(limit(tags))
                .build();
    }

    @Transactional(readOnly = true)
    public List<SearchItemDto> searchInProject(Long projectId, String query, User user) {
        if (query == null || query.isBlank()) return List.of();

        String q = query.trim();

        return taskRepository.searchInProject(projectId, q).stream()
                .limit(50)
                .map(t -> SearchItemDto.builder()
                        .kind("task")
                        .id(t.getId())
                        .title(t.getTitle())
                        .boardId(t.getProject().getBoard().getId())
                        .projectId(t.getProject().getId())
                        .build())
                .collect(Collectors.toList());
    }

    private boolean matches(String text, String query) {
        if (text == null) return false;
        return text.toLowerCase().contains(query.toLowerCase());
    }

    private List<SearchItemDto> limit(List<SearchItemDto> list) {
        return list.size() <= MAX_RESULTS_PER_KIND
                ? list
                : list.subList(0, MAX_RESULTS_PER_KIND);
    }
}