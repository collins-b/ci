"use strict"

const expect = require('chai').expect;
const chai = require('chai');
const chaiHttp = require('chai-http');
const testUsers = require('./helpers/testUsers');
const testDocuments = require('./helpers/testDocuments');
const testToken = require('./helpers/testToken');
const server = require('../bin/www');

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

  describe('GET /documents', () => {
    it('should get all the documents', (done) => {
      chai.request(server)
      .get('/api/documents')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.not.be.eql(0);
        done();
      });
    });

    it('should paginate documents result', (done) => {
      chai.request(server)
      .get('/api/documents?limit=1&offset=0')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.not.be.eql(0);
        done();
      });
    });

    it('it should return a specific document', (done) => {
      chai.request(server)
      .get('/api/documents/2')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('content');
        res.body.should.be.a('object');
        done();
      });
    });

    it('it should not return document for un-authenticated user', (done) => {
      chai.request(server)
      .get('/api/documents/2')
      .set('X-Access-Token', tokens.user)
      .end((err, res) => {
        res.should.have.status(403);
        done();
      });
    });

    it('it should ensure a message is returned if document is not found', (done) => {
      chai.request(server)
      .get('/api/documents/999999')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.have.property('message').eql('No instance of document exists!');
        done();
      });
    });
  });

  describe('POST /documents', () => {
    it('it should POST a document ', (done) => {
      chai.request(server)
      .post('/api/users/1/documents')
      .send(testDocuments[0])
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.be.a('object');
        res.body.should.have.property('title');
        res.body.should.have.property('content');
        res.body.should.have.property('owner');
        res.body.should.have.property('role');
        done();
      });
    });

    it('it should not accept duplicate document\'s title.', (done) => {
      chai.request(server)
        .post('/api/users/1/documents')
        .send(testDocuments[0])
        .set('X-Access-Token', tokens.user)
        .set('cookie', cookie)
        .end((err, res) => {
          res.should.have.status(409);
          res.body.should.have.property('message').eql('Yo!No duplicates for titles allowed!');
          res.body.should.not.have.property('title');
          res.body.should.not.have.property('content');
          res.body.should.not.have.property('owner');
          res.body.should.not.have.property('role');
          done();
        });
    });

    it('it should not accept empty entries', (done) => {
      const doc = {
        title: '',
        content: 'content',
        owner: 'Me',
        role: '',
      };
      chai.request(server)
        .post('/api/users/1/documents')
        .send(doc)
        .set('X-Access-Token', tokens.user)
        .set('cookie', cookie)
        .end((err, res) => {
          res.should.have.status(406);
          res.body.should.have.property('message').eql('Yo!Empty entries not required!');
          res.body.should.not.have.property('title');
          res.body.should.not.have.property('content');
          res.body.should.not.have.property('owner');
          res.body.should.not.have.property('role');
          done();
        });
    });

    it('it should not accept titles with less than 5 words.', (done) => {
      const doc = {
        title: 'this is title',
        content: 'content',
        owner: 'Me',
        role: 'public',
      };
      chai.request(server)
        .post('/api/users/15/documents')
        .send(doc)
        .set('X-Access-Token', tokens.user)
        .set('cookie', cookie)
        .end((err, res) => {
          res.should.have.status(406);
          res.body.should.have.property('message').eql('Yo!A title should have a minimum of 5 words!');
          res.body.should.not.have.property('title');
          res.body.should.not.have.property('content');
          res.body.should.not.have.property('owner');
          res.body.should.not.have.property('role');
          done();
        });
    });

    it('it should not create document for missing fields.', (done) => {
      const doc = {
        one: 'this is title',
        two: 'content',
        three: 'Me',
        four: 'public',
      };
      chai.request(server)
        .post('/api/users/1/documents')
        .send(doc)
        .set('X-Access-Token', tokens.user)
        .set('cookie', cookie)
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });
  });

  describe('/PUT documents', () => {
    it('it should UPDATE a document\'s details ', (done) => {
      chai.request(server)
      .put('/api/documents/1')
      .send({ title: 'Introduction to C' })
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.title.should.be.eql('Introduction to C');
        done();
      });
    });

    it('it should ensure a message is returned if document is not found', (done) => {
      chai.request(server)
      .put('/api/documents/999999')
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.have.property('message').eql('Sorry,no existence of such a document!');
        done();
      });
    });

    it('it should ensure a message is returned if document id is not an integer', (done) => {
      chai.request(server)
      .put('/api/documents/a')
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.have.property('Error').eql('Document id should be integer');
        done();
      });
    });
  });

  describe('/DELETE documents', () => {
    it('it should ensure only admin and owner\'s document can delete a document', (done) => {
      chai.request(server)
      .delete('/api/documents/1')
      .set('X-Access-Token', tokens.user)
      .end((err, res) => {
        res.should.have.status(400);
        done();
      });
    });

    it('it should DELETE a document given the id ', (done) => {
      chai.request(server)
      .delete('/api/documents/1')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(204);
        res.body.should.be.a('object');
        done();
      });
    });

    it('it should ensure a message is returned if document is not found', (done) => {
      chai.request(server)
      .delete('/api/documents/9999')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.have.property('message').eql('Sorry,no existence of such a document!');
        done();
      });
    });

    it('it should ensure a message is returned if document id passed is not an integer', (done) => {
      chai.request(server)
      .delete('/api/documents/a')
      .set('X-Access-Token', tokens.user)
      .set('cookie', cookie)
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.have.property('Error').eql('Document id should be integer');
        done();
      });
    });
  });

  describe('/SEARCH documents', () => {
    it('it should search from documents.', (done) => {
      chai.request(server)
        .get('/api/documents?q=Components')
        .send({ terms: 'Components' })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          expect(res.body[0].content).to.contain('Components');
          done();
        });
    });
  });

  describe('/SEARCH documents by title', () => {
    it('it should search a document by query using title', (done) => {
      chai.request(server)
        .get('/api/search/documents?q=Components')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          expect(res.body[0].title).to.contain('Components');
          done();
        });
    });
  });
});
