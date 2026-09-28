package coursework.taskboard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TaskBoardApplication {
    public static void main(String[] args) {
        SpringApplication.run(TaskBoardApplication.class, args);
    }
}