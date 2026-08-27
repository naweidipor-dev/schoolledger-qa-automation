describe("SchoolLedger login", () => {
  it("allows the viewer to reach the dashboard", () => {
    cy.visit("/");
    cy.get('[data-testid="username"]').type("viewer");
    cy.get('[data-testid="password"]').type("Viewer123!");
    cy.get('[data-testid="login-submit"]').click();
    cy.contains("h1", "Overview").should("be.visible");
  });
});
