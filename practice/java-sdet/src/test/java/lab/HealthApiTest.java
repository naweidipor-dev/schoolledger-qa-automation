package lab;
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import org.junit.jupiter.api.Test;
class HealthApiTest {
  @Test void healthContractIsStable() {
    given().baseUri("http://127.0.0.1:4173")
      .when().get("/api/health")
      .then().statusCode(200).body("status", equalTo("ok")).body("service", equalTo("school-ledger-api"));
  }
}
