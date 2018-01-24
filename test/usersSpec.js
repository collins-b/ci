"use strict"

const expect = require('chai').expect;
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../bin/www');
const jwt = require('jsonwebtoken');
const testUsers = require('./helpers/testUsers');
const testToken = require('./helpers/testToken');

const should = chai.should();
chai.use(chaiHttp);

describe('Validate Users', () => {
  const tokens = {};
  let cookie;
  before((done) => {
    tokens.user = testToken.generate(testUsers[0]);
    chai.request(server)
    .post('/api/login')
    .send(testUsers[0])
    .end((err, res) => {
      res.should.have.status(200);
      cookie = res.headers['set-cookie'][0].split(';')[0];
      done();
    });
  });

  describe('/GET users', () => {
    it('it should GET all the users', (done) => {
      chai.request(server)
      .get('/api/users')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.not.be.eql(0);
        done();
      });
    });

    it('it should paginate user result', (done) => {
      chai.request(server)
      .get('/api/users?limit=1&offset=0')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
    });

    it('it should ensure ONLY a logged in admin can view all the users information', (done) => {
      chai.request(server)
      .get('/api/users')
      .end((err, res) => {
        res.should.have.status(401);
        done();
      });
    });

    it('it should return a specific user', (done) => {
      chai.request(server)
      .get('/api/users/1')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('userName');
        res.body.should.be.a('object');
        done();
      });
    });

    it('it should return an error if non-integer is passed as user id', (done) => {
      chai.request(server)
      .get('/api/users/a')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.have.property('Error').eql('It seems like you have passed non-integer as user id.');
        done();
      });
    });

    it('it should ensure a message is returned if user is not found', (done) => {
      chai.request(server)
      .get('/api/users/999999')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.have.property('message').eql('No instance of user exists!');
        done();
      });
    });

    it('it should return documents belonging to a particular user', (done) => {
      chai.request(server)
      .get('/api/users/1/documents')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
    });

    it('it should ensure a message is returned if user is not found', (done) => {
      chai.request(server)
      .get('/api/users/999999/documents')
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.have.property('message').eql('No instance of user exists!');
        done();
      });
    });
  });

  describe('/POST api/users', () => {
    it('it should POST a user ', (done) => {
      const user = {
        firstName: 'this',
        otherNames: 'that',
        email: 'this.that@gmail.com',
        phone: +254700000000,
        userName: 'Collo',
        password: '123456Ww',
        role: 'admin'
      };
      chai.request(server)
      .post('/api/users')
      .send(user)
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.be.a('object');
        res.body.should.have.property('message').eql('You have successfully registered to eDMS!');
        done();
      });
    });

    it('it should not accept duplicate email address', (done) => {
      const user = {
        firstName: 'testing',
        otherNames: 'still testing',
        email: 'johndoe@microhype.com',
        phone: 123456778,
        userName: 'Mmoja',
        password: 'Collo123',
        role: 'user'
      };
      chai.request(server)
        .post('/api/users')
        .send(user)
        .end((err, res) => {
          res.should.have.status(409);
          res.body.should.have.property('message').eql('Yo!The email is already taken!');
          res.body.should.not.have.property('firstName');
          res.body.should.not.have.property('otherNames');
          res.body.should.not.have.property('email');
          res.body.should.not.have.property('phone');
          res.body.should.not.have.property('userName');
          res.body.should.not.have.property('password');
          res.body.should.not.have.property('role');
          done();
        });
    });

    it('it should not accept empty properties', (done) => {
      const user = {
        firstName: '',
        otherNames: '',
        email: '',
        phone: '',
        userName: '',
        password: '',
        role: ''
      };
      chai.request(server)
        .post('/api/users')
        .send(user)
        .end((err, res) => {
          res.should.have.status(406);
          res.body.should.have.property('message').eql('Yo!Empty entries not required!');
          res.body.should.not.have.property('firstName');
          res.body.should.not.have.property('otherNames');
          res.body.should.not.have.property('email');
          res.body.should.not.have.property('phone');
          res.body.should.not.have.property('userName');
          res.body.should.not.have.property('password');
          res.body.should.not.have.property('role');
          done();
        });
    });

    it('it should ensure password is strong', (done) => {
      const user = {
        firstName: 'Collins',
        otherNames: 'Mmoja',
        email: 'coll@gail.com',
        phone: +254700000000,
        userName: 'Collo',
        password: '123456',
        role: 'admin'
      };
      chai.request(server)
      .post('/api/users')
      .send(user)
      .end((err, res) => {
        res.should.have.status(417);
        res.body.should.have.property('message').eql('Password need to be between 6-20 characters and contain at least one numeric,one uppercase and one lowercase letter.');
        res.body.should.not.have.property('firstName');
        res.body.should.not.have.property('otherNames');
        res.body.should.not.have.property('email');
        res.body.should.not.have.property('phone');
        res.body.should.not.have.property('userName');
        res.body.should.not.have.property('password');
        res.body.should.not.have.property('role');
        done();
      });
    });

    it('it should ensure correct email address is submitted', (done) => {
      const user = {
        firstName: 'Collins',
        otherNames: 'Mmoja',
        email: 'collins',
        phone: +254700000000,
        userName: 'Collo',
        password: '123456Ww',
        role: 'admin'
      };
      chai.request(server)
      .post('/api/users')
      .send(user)
      .end((err, res) => {
        res.should.have.status(406);
        res.body.should.have.property('message').eql('Yo!That is not a correct email address!');
        res.body.should.not.have.property('firstName');
        res.body.should.not.have.property('otherNames');
        res.body.should.not.have.property('email');
        res.body.should.not.have.property('phone');
        res.body.should.not.have.property('userName');
        res.body.should.not.have.property('password');
        res.body.should.not.have.property('role');
        done();
      });
    });

    it('it should ensure role exists', (done) => {
      const user = {
        firstName: 'Collins',
        otherNames: 'Mmoja',
        email: 'col@gmail.com',
        phone: +254700000000,
        userName: 'Collo',
        password: '123456Ww',
        role: 'unavailable'
      };
      chai.request(server)
      .post('/api/users')
      .send(user)
      .end((err, res) => {
        res.should.have.status(406);
        res.body.should.have.property('message').eql('Yo!The system doesn\'t recognize that role!');
        res.body.should.not.have.property('firstName');
        res.body.should.not.have.property('otherNames');
        res.body.should.not.have.property('email');
        res.body.should.not.have.property('phone');
        res.body.should.not.have.property('userName');
        res.body.should.not.have.property('password');
        res.body.should.not.have.property('role');
        done();
      });
    });
  });

  describe('/PUT users', () => {
    it('it should UPDATE a user\'s details ', (done) => {
      chai.request(server)
      .put('/api/users/3')
      .send({ firstName: 'Wecs', email: 'wecs@microhype.com' })
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.email.should.be.eql('wecs@microhype.com');
        done();
      });
    });

    it('it should ensure a message is returned if user id is not an integer', (done) => {
      chai.request(server)
      .put('/api/users/a')
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.have.property('Error').eql('It seems like you have passed non-integer as user id.');
        done();
      });
    });

    it('it should ensure a message is returned if user is not found', (done) => {
      chai.request(server)
      .put('/api/users/999999')
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.have.property('message').eql('Sorry,the user is not found!');
        done();
      });
    });
  });

  describe('/DELETE users', () => {
    it('it should DELETE a user given the id ', (done) => {
      chai.request(server)
      .delete('/api/users/2')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(204);
        res.body.should.be.a('object');
        done();
      });
    });

    it('it should ensure a message is returned if user is not found', (done) => {
      chai.request(server)
      .delete('/api/users/9999')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.have.property('message').eql('Sorry,the user is not found!');
        done();
      });
    });

    it('it should ensure a message is returned if user id is non-integer', (done) => {
      chai.request(server)
      .delete('/api/users/a')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.have.property('Error').eql('It seems like you have passed non-integer as user id.');
        done();
      });
    });
  });

  describe('/LOGIN users', () => {
    it('Should return that the user successfully logged in', (done) => {
      chai.request(server)
      .post('/api/login')
      .send(testUsers[0])
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
    });
  });

  describe('/SESSION users', () => {
    it('it should return message if active session is found', (done) => {
      chai.request(server)
      .get('/api/users/session')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('message').eql('Active users available');
        done();
      });
    });

    it('it should return message if no active session is found', (done) => {
      chai.request(server)
      .get('/api/users/session')
      .set('X-Access-Token', tokens.user)
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.have.property('message').eql('Yo!No login session!.');
        done();
      });
    });
  });

  describe('/LOGOUT users', () => {
    it('Should return that the user successfully logged out', (done) => {
      chai.request(server)
      .get('/api/logout')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('Message').eql('You have signed out successfully.');
        done();
      });
    });
  });

  describe('/FORGOT users', () => {
    it('Should auto-generate password to a user for recovery', (done) => {
      chai.request(server)
      .post('/api/users/wecs@microhype.com')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('message').eql('An auto-generated password has been send to your email address.Use it to login and change ASAP.');
        done();
      });
    });

    it('Should warn if no email is found in the system', (done) => {
      chai.request(server)
      .post('/api/users/noreply@gmail.com')
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.have.property('message').eql('User with that email address doesn\'t exist!');
        done();
      });
    });
  });

  describe('/SEARCH users', () => {
    it('it should search a user by username.', (done) => {
      chai.request(server)
        .post('/api/users/search')
        .send({ search: 'doe' })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          expect(res.body[0].otherNames).to.contain('Doe');
          done();
        });
    });

    it('it should search a user by query using username', (done) => {
      chai.request(server)
        .get('/api/search/users?q=collo')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          expect(res.body[0].userName).to.contain('Collo');
          done();
        });
    });
  });
});
