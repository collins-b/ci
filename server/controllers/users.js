const Document = require('../models').documents;
const User = require('../models').users;
const jwt = require('jsonwebtoken');
const _ = require('underscore');
const bcrypt = require('bcrypt-nodejs');
const nodemailer = require('nodemailer');

/**
 * usersController
 */
class UsersController {

/**
 * login
 * @description login a user
 * @param {object} req request
 * @param {object} res response
 * @returns {token} returns a token
 */
  static login(req, res) {
    User.findOne({
      where: {
        userName: req.body.userName
      }
    })
    .then((user) => {
      const fieldsToToken = _.pick(user, 'id', 'userName', 'role');
      if (user && bcrypt.compareSync(req.body.password, user.password)) {
        const token = jwt.sign(user.get(fieldsToToken), process.env.SECRET_KEY, {
          expiresIn: 604800
        });
        req.session.user = user;
        return res.status(200).send(token);
      }
      return res.status(401).send({ message: 'Access Denied!Check your username or password' });
    });
  }

/**
 * logout
 * @description logs out a user
 * @param {object} req request
 * @param {object} res response
 * @returns {object} return an object
 */
  static logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ Message: 'An error occured' });
      } else {
        res.status(200).json({ Message: 'You have signed out successfully.' });
      }
    });
  }

/**
 * session
 * @description checks active user sessions
 * @param {object} req request
 * @param {object} res response
 * @returns {object} return an object
 */
  static session(req, res) {
    if (req.session.hasOwnProperty('user')) {
      return res.status(200).json({
        message: 'Active users available'
      });
    }
    return res.status(404).json({
      message: 'Yo!No login session!.'
    });
  }

/**
 * create
 * @description creates users
 * @param {object} req request
 * @param {object} res response
 * @returns {object} return an object
 */
  static create(req, res) {
    User.findOne({
      where: {
        email: req.body.email
      }
    })
    .then((emailExistence) => {
      if (emailExistence != null) {
        return res.status(409).send({
          message: 'Yo!The email is already taken!',
        });
      }
      const emailTest = /\S+@\S+\.\S+/;
      const checkRoles = /^admin|user|guest$/;
      const passwordStrength = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;
      if (!req.body.firstName || !req.body.otherNames || !req.body.email ||
      !req.body.phone || !req.body.userName || !req.body.password ||
      !req.body.role) {
        return res.status(406).send({ message: 'Yo!Empty entries not required!' });
      } else if (!(req.body.password).match(passwordStrength)) {
        return res.status(417).send({ message: 'Password need to be between 6-20 characters and contain at least one numeric,one uppercase and one lowercase letter.' });
      } else if (parseInt(req.body.phone) === NaN) {
        return res.status(406).send({ message: 'Yo! Phone number passed is not a number!' });
      } else if (!emailTest.test(req.body.email)) {
        return res.status(406).send({ message: 'Yo!That is not a correct email address!' });
      } else if (!checkRoles.test(req.body.role)) {
        return res.status(406).send({ message: 'Yo!The system doesn\'t recognize that role!' });
      } else if (User.userName === req.body.userName) { return res.status(406).send({ message: 'Yo!No duplicates!' }); }
      return User
      .create({
        firstName: req.body.firstName,
        otherNames: req.body.otherNames,
        email: req.body.email,
        phone: req.body.phone,
        userName: req.body.userName,
        password: req.body.password,
        role: req.body.role,
      })
      .then((user) => {
        const fieldsToToken = _.pick(user, 'id', 'userName', 'role');
        const token = jwt.sign(fieldsToToken, process.env.SECRET_KEY, {
          expiresIn: 604800
        });
        return res.status(201).send({
          message: 'You have successfully registered to eDMS!',
          token,
          name: `${user.firstName} ${''} ${user.otherNames}`,
          email: user.email,
          phone: user.phone,
          userName: user.userName
        });
      })
      .catch(error => res.status(400).send(error));
    });
  }

/**
 * listUsers
 * @description lists all registered users
 * @param {object} req request
 * @param {object} res response
 * @returns {array} return an array
 */
  static listUsers(req, res) {
    if (req.query.limit >= 0 && req.query.offset >= 0) {
      User.findAll({ limit: req.query.limit, offset: req.query.offset, attributes: { exclude: ['password', 'id', 'createdAt', 'updatedAt'] } })
     .then((user) => {
       if (!user) {
         return res.status(404).send({
           message: 'No users!',
         });
       }
       return res.status(200).send(user);
     })
      .catch(error => res.status(400).send(error));
    } else {
      User.findAll({ attributes: { exclude: ['password', 'id', 'createdAt', 'updatedAt'] } })
      .all()
      .then(users => res.status(200).send(users))
      .catch(error => res.status(401).send(error));
    }
  }

/**
 * retrieveUser
 * @description retrieves single user
 * @param {object} req request
 * @param {object} res response
 * @returns {object} return an object
 */
  static retrieveUser(req, res) {
    return User
      .findById(req.params.id)
      .then((user) => {
        if (!user) {
          return res.status(404).send({
            message: 'No instance of user exists!',
          });
        }
        user.password = null;
        return res.status(200).send(user);
      })
      .catch(error => res.status(400).send({ Error: 'It seems like you have passed non-integer as user id.' }));
  }

/**
 * retrieveUserDocuments
 * @description retrieves documents belonging to particular user
 * @param {object} req request
 * @param {object} res response
 * @returns {object} return an object
 */
  static retrieveUserDocuments(req, res) {
    return User
      .findById(req.params.userId, {
        include: [{
          model: Document,
          as: 'documents',
        }],
      })
      .then((user) => {
        if (!user) {
          return res.status(404).send({
            message: 'No instance of user exists!',
          });
        }
        return res.status(200).send(user.documents);
      })
      .catch(error => res.status(400).send(error));
  }

/**
 * updateUser
 * @description updates user details
 * @param {object} req request
 * @param {object} res response
 * @returns {object} return an object
 */
  static updateUser(req, res) {
    return User
    .findById(req.params.id)
    .then((user) => {
      if (!user) {
        return res.status(404).send({
          message: 'Sorry,the user is not found!',
        });
      }
      return user
        .update({
          firstName: req.body.firstName || user.firstName,
          otherNames: req.body.otherNames || user.otherNames,
          email: req.body.email || user.email,
          phone: req.body.phone || user.phone,
          userName: req.body.userName || user.userName,
          password: req.body.password || user.password,
          role: req.body.role || user.role,
        })
        .then(() => res.status(200).send({
          name: `${user.firstName} ${''} ${user.otherNames}`,
          email: user.email,
          phone: user.phone,
          userName: user.userName
        }))
        .catch(error => res.status(400).send(error));
    })
    .catch(error => res.status(400).send({ Error: 'It seems like you have passed non-integer as user id.' }));
  }

/**
 * deleteUser
 * @description deletes a user
 * @param {object} req request
 * @param {object} res response
 * @returns {object} return an object
 */
  static deleteUser(req, res) {
    return User
    .findById(req.params.userId)
    .then((user) => {
      if (!user) {
        return res.status(400).send({
          message: 'Sorry,the user is not found!',
        });
      }
      return user
        .destroy()
        .then(() => res.status(204).send())
        .catch(error => res.status(400).send(error));
    })
    .catch(error => res.status(400).send({ Error: 'It seems like you have passed non-integer as user id.' }));
  }

/**
 * forgot
 * @description allows user to restore account
 * @param {object} req request
 * @param {object} res response
 * @returns {object} return an object
 */
  static forgot(req, res) {
    let randomPassword;
    User.findOne({
      where: {
        email: req.params.reset
      }
    })
    .then((user) => {
      if (!user) {
        return res.status(404).send({ message: 'User with that email address doesn\'t exist!' });
      }
      randomPassword = Math.random().toString(36).slice(-8);
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'nationalmcg@gmail.com',
          pass: ''
        }
      });
      const mailOptions = {
        from: '"eDMS"',
        to: user.email,
        subject: 'Password Recovery',
        text: `${'Hello'} ${user.userName} ${'.Please use this auto-generated password to login to your account and change it ASAP:'} ${randomPassword}`,
      };
      transporter.sendMail(mailOptions, (error) => {
        if (error) {
          return res.status(500).send({ message: 'An error occured.Please try again.' });
        }
      });
      return user
      .update({
        password: randomPassword,
      })
      .then(() => { return res.status(200).send({ message: 'An auto-generated password has been send to your email address.Use it to login and change ASAP.' });
      });
    });
  }

/**
 * searchUser
 * @description search user by username
 * @param {object} req request
 * @param {object} res response
 * @returns {object} return an object
 */
  static searchUser(req, res) {
    User.findAll({
      where: {
        $or: [
          {
            userName: { $iLike: `%${req.body.search}%` },
          }
        ]
      },
      order: '"createdAt" DESC',
      attributes: { exclude: ['password', 'createdAt', 'updatedAt'] }
    })
    .then(user => res.status(200).send(user))
    .catch(error => res.status(400).send(error));
  }

/**
 * @description query search by username
 * @param {object} req request
 * @param {object} res response
 * @returns {object} return an object
 */
  static searchUserByQuery(req, res) {
    User.findAll({
      where: {
        userName: { $iLike: `%${req.query.q}%` }
      },
      attributes: { exclude: ['password', 'createdAt', 'updatedAt'] }
    })
      .then(user => res.status(200).send(user));
  }
}

export default UsersController;
