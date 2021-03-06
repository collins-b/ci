import usersController from '../controllers/users';
import documentsControllers from '../controllers/documents';
import rolesController from '../controllers/roles';
const auth = require('../../middleware/auth');
const path = require('path');

module.exports = (app) => {

  // API documentaion route
  app.get('/docs', (req, res) => {
    res.sendFile(path.join(__dirname, '../../edms.html'));
  });

  // Creates a new user.
  app.post('/api/users', usersController.create);

  // Find matching instances of user.
  app.get('/api/users', auth.authenticate, auth.checkIfAdmin, usersController.listUsers);

 // Search a user by username
  app.post('/api/users/search', usersController.searchUser);

  app.get('/api/search/users', usersController.searchUserByQuery);

  app.get('/api/users/session', auth.authenticate, auth.checkIfAdmin, usersController.session);

  // Creates a new document instance.
  app.post('/api/users/:userId/documents', auth.authenticate, documentsControllers.create);

  // Find a specific user.
  app.get('/api/users/:id', auth.authenticate, auth.checkIfAdmin, usersController.retrieveUser);

  // Update user's attributes.
  app.put('/api/users/:id', usersController.updateUser);

  // Delete a specific user.
  app.delete('/api/users/:userId', auth.authenticate, auth.checkIfAdmin, usersController.deleteUser);

  // Find matching instances of document.
  app.get('/api/documents', documentsControllers.listDocuments);

  // Find owner's private documents
  app.get('/api/documents/private', auth.authenticate, documentsControllers.findPrivateDocuments);

 // Searches against documents (global search)
  app.get('/api/documents', documentsControllers.searchDocument);

  app.get('/api/search/documents', documentsControllers.searchDocumentByQuery);

  // Find a specific document.
  app.get('/api/documents/:id', auth.authenticate, documentsControllers.retrieveDocument);

  // Update document attributes.
  app.put('/api/documents/:id', documentsControllers.updateDocument);

  // Delete a specific document.
  app.delete('/api/documents/:id', auth.authenticate, documentsControllers.deleteDocument);

  // Find all documents belonging to the user.
  app.get('/api/users/:userId/documents', usersController.retrieveUserDocuments);

  // Creates a new role
  app.post('/api/roles', auth.authenticate, auth.checkIfAdmin, rolesController.create);

  // Displays all roles
  app.get('/api/roles', auth.authenticate, auth.checkIfAdmin, rolesController.allRoles);

  // Display a specific role
  app.get('/api/roles/:id', auth.authenticate, auth.checkIfAdmin, rolesController.retrieveRole);

  // Update a specific role
  app.put('/api/roles/:id', auth.authenticate, auth.checkIfAdmin, rolesController.updateRole);

  // Deletes a specific role
  app.delete('/api/roles/:id', auth.authenticate, auth.checkIfAdmin, rolesController.deleteRole);

 // Login user
  app.post('/api/login', usersController.login);

  // Logout user
  app.get('/api/logout', auth.authenticate, usersController.logout);

 // Resets password / recover account
  app.post('/api/users/:reset', usersController.forgot);
};
