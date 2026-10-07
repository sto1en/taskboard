package coursework.taskboard.repository.shop;

import coursework.taskboard.model.shop.UserCurrency;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserCurrencyRepository extends JpaRepository<UserCurrency, Long> {
}