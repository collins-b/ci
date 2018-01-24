"use strict"

const expect = require('chai').expect;
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../bin/www');
const testUsers = require('./helpers/testUsers');
const testRoles = require('./helpers/testRoles');
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

  describe('POST /roles', () => {
    it('it should POST a role', (done) => {
      chai.request(server)
      .post('/api/roles')
      .send(testRoles[0])
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.be.a('object');
        res.body.should.have.property('title');
        res.body.should.have.property('accessLevel');
        done();
      });
    });

    it('it should not accept duplicate role\'s title.', (done) => {
      const role = {
        title: 'Admin',
        accessLevel: 1,
      };
      chai.request(server)
        .post('/api/roles')
        .send(role)
        .set('X-Access-Token', tokens.user)
        .set('cookie', cookie)
        .end((err, res) => {
          res.should.have.status(409);
          res.body.should.have.property('message').eql('Yo!No duplicates for role title allowed!');
          res.body.should.not.have.property('title');
          res.body.should.not.have.property('accessLevel');
          done();
        });
    });

    it('it should not accept empty entries', (done) => {
      const role = {
        title: '',
        accessLevel: 2,
      };
      chai.request(server)
        .post('/api/roles')
        .send(role)
        .set('X-Access-Token', tokens.user)
        .set('cookie', cookie)
        .end((err, res) => {
          res.should.have.status(406);
          res.body.should.have.property('message').eql('Yo!Empty entries not required!');
          res.body.should.not.have.property('title');
          res.body.should.not.have.property('accessLevel');
          done();
        });
    });

    it('it should not create role for missing fields.', (done) => {
      const role = {
        one: 'user',
        two: 'content',
      };
      chai.request(server)
        .post('/api/roles')
        .send(role)
        .set('X-Access-Token', tokens.user)
        .set('cookie', cookie)
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });
  });

  describe('GET /roles', () => {
    it('should get all the roles', (done) => {
      chai.request(server)
      .get('/api/roles')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.not.be.eql(0);
        done();
      });
    });

    it('it should return a specific role,given id', (done) => {
      chai.request(server)
      .get('/api/roles/1')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('title');
        res.body.should.be.a('object');
        done();
      });
    });

    it('it should ensure a message is returned if role is not found', (done) => {
      chai.request(server)
      .get('/api/roles/999999')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.have.property('message').eql('No instance of such role exists!');
        done();
      });
    });

    it('it should ensure a message is returned if role id passed is not an integer', (done) => {
      chai.request(server)
      .get('/api/roles/a')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.have.property('Error').eql('Role id should be a number');
        done();
      });
    });
  });

  describe('PUT /roles', () => {
    it('it should UPDATE a roles\'s details ', (done) => {
      chai.request(server)
      .put('/api/roles/1')
      .send({ title: 'Admin' })
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.title.should.be.eql('Admin');
        done();
      });
    });

    it('it should ensure a message is returned if role is not found', (done) => {
      chai.request(server)
      .put('/api/roles/999999')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.have.property('message').eql('Sorry,no existence of such a role!');
        done();
      });
    });

    it('it should ensure a message is returned if role id passed is not an integer', (done) => {
      chai.request(server)
      .put('/api/roles/a')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.have.property('Error').eql('Role id should be a number');
        done();
      });
    });
  });

  describe('DELETE /roles', () => {
    it('it should DELETE a role given the id ', (done) => {
      chai.request(server)
      .delete('/api/roles/4')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(204);
        res.body.should.be.a('object');
        done();
      });
    });

    it('it should ensure a message is returned if role is not found', (done) => {
      chai.request(server)
      .delete('/api/roles/9999')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.have.property('message').eql('Sorry,no existence of such a role!');
        done();
      });
    });

    it('it should ensure a message is returned if role id is not an integer', (done) => {
      chai.request(server)
      .delete('/api/roles/a')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.have.property('Error').eql('Role id should be a number');
        done();
      });
    });
  });
});
