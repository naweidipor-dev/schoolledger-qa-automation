package lab;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
class LoginSeleniumTest {
  @Test void viewerCanOpenDashboard() {
    WebDriver driver = new ChromeDriver();
    try {
      driver.get("http://127.0.0.1:4173");
      driver.findElement(By.cssSelector("[data-testid='username']")).sendKeys("viewer");
      driver.findElement(By.cssSelector("[data-testid='password']")).sendKeys("Viewer123!");
      driver.findElement(By.cssSelector("[data-testid='login-submit']")).click();
      assertTrue(driver.getPageSource().contains("Overview"));
    } finally { driver.quit(); }
  }
}
