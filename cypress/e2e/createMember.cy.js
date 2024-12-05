import { ElementCollection } from "../../public/js/ElementCollection.mjs";

describe('Member Create Frontend', () => {
  let baseUrl;

  before(() => {
    cy.task('startServer').then((url) => {
      baseUrl = url; // Store the base URL
    });
  });

  beforeEach(() => {
    cy.visit(baseUrl + '/pages/ManageMembers.html');
  });

  after(() => {
    return cy.task('stopServer'); // Stop the server after the report is done
  });

  it('should open the modal and display the create member form', () => {
    // Verify that the page is loaded
    cy.url().should('include', '/pages/ManageMembers.html');
    
    // Open the Create Member modal
    cy.get('button[data-target="#member-create-modal"]', { timeout: 10000 }).click();

    // Check that the modal is visible
    cy.get('#member-create-modal').should('be.visible');
  });

  it('should display an error message for missing required fields', () => {
    // Open the modal
    cy.get('button[data-target="#member-create-modal"]').click();

    // Click the Create New Member button without filling in the form
    cy.get('.modal-footer .btn-primary').contains('Create New Member').click();

    // Verify that an error message is shown
    cy.get('#member-create-modal-message').should('have.class', 'text-danger')
      .and('contain', 'All fields are required!');
  });

  it('should create a new member', () => {
    // Open the modal
    cy.get('button[data-target="#member-create-modal"]').click();

    // Fill out the form fields
    cy.get('#member-create-modal-name').type('Valid Name', { force: true });
    cy.get('#member-create-modal-admin-number').type('2304806I', { force: true });
    cy.get('#member-create-modal-gym-programs').type('Active', { force: true });

    // Click the Create New Member button
    cy.get('.modal-footer .btn-primary').contains('Create New Member').click();

    // Verify that a success message is shown
    cy.get('#member-create-modal-message').should('have.class', 'text-right')

    // Verify that the member list updates
    cy.get('#member-list-container').should('contain', 'Valid Name');
  });

  it('should display an error for invalid admin number format', () => {
    // Open the modal
    cy.get('button[data-target="#member-create-modal"]').click();

    // Fill out the form with an invalid admin number
    cy.get('#member-create-modal-name').type('Valid Name', { force: true });
    cy.get('#member-create-modal-admin-number').type('12345', { force: true });
    cy.get('#member-create-modal-gym-programs').type('Active', { force: true });

    // Click the Create New Member button
    cy.get('.modal-footer .btn-primary').contains('Create New Member').click();

    // Verify that an error message is shown
    cy.get('#member-create-modal-message').should('have.class', 'text-danger')
      .and('contain', 'Invalid admin number format.');
  });

  it('should display an error for inactive gym program', () => {
    // Open the modal
    cy.get('button[data-target="#member-create-modal"]').click();

    // Fill out the form with an inactive gym program
    cy.get('#member-create-modal-name').type('Valid Name', { force: true });
    cy.get('#member-create-modal-admin-number').type('2304806I', { force: true });
    cy.get('#member-create-modal-gym-programs').type('inactive', { force: true });

    // Click the Create New Member button
    cy.get('.modal-footer .btn-primary').contains('Create New Member').click();

    // Verify that an error message is shown for inactive gym program
    cy.get('#member-create-modal-message').should('have.class', 'text-danger')
      .and('contain', 'Program ( Name: inactive ) is inactive!');
  });

  it('should display an error message when a network error occurs', () => {
    // Open the modal
    cy.get('button[data-target="#member-create-modal"]').click();
  
    // Fill out the form fields
    cy.get('#member-create-modal-name').type('Valid Name', { force: true });
    cy.get('#member-create-modal-admin-number').type('2304806I', { force: true });
    cy.get('#member-create-modal-gym-programs').type('Active', { force: true });
  
    // Intercept the POST request and force a network error
    cy.intercept('POST', '/api/members/create', { forceNetworkError: true }).as('createMemberError');
  
    // Click the Create New Member button
    cy.get('.modal-footer .btn-primary').contains('Create New Member').click();
  
    // Wait for the network error
    cy.wait('@createMemberError');
  
    // Verify that the error message is displayed
    cy.get('#member-create-modal-message').should('have.class', 'text-danger')
      .and('contain', 'An error occurred!');
  });
});
