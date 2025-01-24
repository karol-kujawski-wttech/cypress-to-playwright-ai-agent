describe('Wikipedia Tests', () => {
    it('should have the correct page title', () => {
      cy.visit('https://www.wikipedia.org');
      
      cy.title().should('equal', 'Wikipedia');
    });
  });