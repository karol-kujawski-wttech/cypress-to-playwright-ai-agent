describe('Action Card', () => {
    const path = '/zz/en/demo/components/action-cards';

    it('displays variations of Actions Card', () => {
        cy.visit(path).get('div.action-card').mainBodySnapshot('Action Card');
    });

    it('@RTL - displays variations of Actions Card', () => {
        cy.visitRTL(path).get('div.action-card').mainBodySnapshot('RTL - Action Card');
    });
});
