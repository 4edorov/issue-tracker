const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const app = require('../server');

chai.use(chaiHttp);

const baseTestIssue = {
  issue_title: 'My test issue',
  issue_text: 'Should test properly',
  created_by: 'Test agent',
};
const extendedTestIssue = {
  ...baseTestIssue,
  assigned_to: 'Alex',
  status_text: 'In test'
};

suite('Functional Tests', function() {
  suite('GET /api/issues/:project', function() {
    const issueTextFilter = 'For test case support';
    const createdByFilter = 'Alex';

    test('Should view issues on a project', function(done) {
      app.then((server) => {
        chai
          .request(server)
          .keepOpen()
          .get('/api/issues/alex-api-v2')
          .set('Content-Type', 'application/json')
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.property(res.body[0], 'issue_title');
            assert.property(res.body[0], 'issue_text');
            assert.property(res.body[0], 'created_by');
            assert.property(res.body[0], 'assigned_to');
            assert.property(res.body[0], 'status_text');
            assert.property(res.body[0], 'open');
            assert.property(res.body[0], '_id');
            assert.property(res.body[0], 'created_on');
            assert.property(res.body[0], 'updated_on');
            done();
          });
      });
    });
    test('Should view issues on a project with one filter: issue_text', function(done) {
      app.then((server) => {
        chai
          .request(server)
          .keepOpen()
          .get('/api/issues/alex-api-v2?issue_text=' + issueTextFilter)
          .set('Content-Type', 'application/json')
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.body[0].issue_text, issueTextFilter);
            done();
          });
      });
    });
    test('Should view issues on a project with one filter: issue_text, created_by', function(done) {
      app.then((server) => {
        chai
          .request(server)
          .keepOpen()
          .get('/api/issues/alex-api-v2?issue_text=' + issueTextFilter + '&created_by=' + createdByFilter)
          .set('Content-Type', 'application/json')
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.body[0].issue_text, issueTextFilter);
            assert.equal(res.body[0].created_by, createdByFilter);
            done();
          });
      })
    });
  });
  suite('POST /api/issues/:project', function() {
    test('Should create an issue with every field', function(done) {
      app.then((server) => {
        chai
          .request(server)
          .keepOpen()
          .post('/api/issues/alex-api-v2')
          .set('Content-Type', 'application/json')
          .send(extendedTestIssue)
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.body.issue_title, extendedTestIssue.issue_title);
            assert.equal(res.body.issue_text, extendedTestIssue.issue_text);
            assert.equal(res.body.created_by, extendedTestIssue.created_by);
            assert.equal(res.body.assigned_to, extendedTestIssue.assigned_to);
            assert.equal(res.body.status_text, extendedTestIssue.status_text);
            assert.isOk(res.body.open);
            assert.isOk(res.body._id);
            assert.isOk(res.body.created_on);
            assert.isOk(res.body.updated_on);
            done();
          });
      });
    });
    test('Should create an issue with only required fields', function(done) {
      app.then((server) => {
        chai
          .request(server)
          .keepOpen()
          .post('/api/issues/alex-api-v2')
          .set('Content-Type', 'application/json')
          .send({
            issue_title: 'My test issue',
            issue_text: 'Should test properly',
            created_by: 'Test agent',
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.body.issue_title, baseTestIssue.issue_title);
            assert.equal(res.body.issue_text, baseTestIssue.issue_text);
            assert.equal(res.body.created_by, baseTestIssue.created_by);
            assert.equal(res.body.assigned_to, '');
            assert.equal(res.body.status_text, '');
            assert.isOk(res.body.open);
            assert.isOk(res.body._id);
            assert.isOk(res.body.created_on);
            assert.isOk(res.body.updated_on);
            done();
          })
      });
    });
    test('Should create an issue with missing required fields', function(done) {
      app.then((server) => {
        chai
          .request(server)
          .keepOpen()
          .post('/api/issues/alex-api-v2')
          .set('Content-Type', 'application/json')
          .send({
            issue_title: '',
            issue_text: '',
            created_by: '',
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.body.error, 'required field(s) missing');
            done();
          });
      });
    });
  });
  suite('PUT /api/issues/:project', function() {
    test('Should update one field on an issue', function(done) {
      const testIssueTitle = 'Updated issue title';

      app.then((server) => {
        chai
          .request(server)
          .keepOpen()
          .post('/api/issues/alex-api-v2')
          .set('Content-Type', 'application/json')
          .send(baseTestIssue)
          .then((postRes) => {
            chai
              .request(server)
              .keepOpen()
              .put('/api/issues/alex-api-v2')
              .set('Content-Type', 'application/json')
              .send({
                _id: postRes.body._id,
                issue_title: testIssueTitle,
              })
              .then(() => {
                chai
                  .request(server)
                  .keepOpen()
                  .get('/api/issues/alex-api-v2?_id=' + postRes.body._id)
                  .set('Content-Type', 'application/json')
                  .end(function(err, getRes) {
                    assert.equal(getRes.status, 200);
                    assert.equal(getRes.body[0]._id, postRes.body._id)
                    assert.equal(getRes.body[0].issue_title, testIssueTitle);
                    done();
                  });
              });
          });
      });
    });
    test('Should update multiple fields on an issue', function(done) {
      const testIssueTitle = 'Updated issue title';
      const testIssueText = 'Updated issue text';

      app.then((server) => {
        chai
          .request(server)
          .keepOpen()
          .post('/api/issues/alex-api-v2')
          .set('Content-Type', 'application/json')
          .send(baseTestIssue)
          .then((postRes) => {
            chai
              .request(server)
              .keepOpen()
              .put('/api/issues/alex-api-v2')
              .set('Content-Type', 'application/json')
              .send({
                _id: postRes.body._id,
                issue_title: testIssueTitle,
                issue_text: testIssueText
              })
              .then(() => {
                chai
                  .request(server)
                  .keepOpen()
                  .get('/api/issues/alex-api-v2?_id=' + postRes.body._id)
                  .set('Content-Type', 'application/json')
                  .end(function(err, getRes) {
                    assert.equal(getRes.status, 200);
                    assert.equal(getRes.body[0]._id, postRes.body._id)
                    assert.equal(getRes.body[0].issue_title, testIssueTitle);
                    assert.equal(getRes.body[0].issue_text, testIssueText);
                    done();
                  });
              });
          });
      });
    });
    test('Should not update an issue with missing _id', function(done) {
      app.then((server) => {
        chai
          .request(server)
          .keepOpen()
          .put('/api/issues/alex-api-v2')
          .set('Content-Type', 'application/json')
          .send({
            issue_title: 'Updated issue title',
            issue_text: 'Updated issue text',
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.body.error, 'missing _id');
            done();
          });
      });
    });
    test('Should not update an issue with no fields to update', function(done) {
      app.then((server) => {
        chai
          .request(server)
          .keepOpen()
          .post('/api/issues/alex-api-v2')
          .set('Content-Type', 'application/json')
          .send(baseTestIssue)
          .then((postRes) => {
            chai
              .request(server)
              .keepOpen()
              .put('/api/issues/alex-api-v2')
              .set('Content-Type', 'application/json')
              .send({
                _id: postRes.body._id,
              })
              .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.equal(res.body.error, 'no update field(s) sent');
                assert.equal(res.body._id, postRes.body._id);
                done();
              });
          });
      });
    });
    test('Should not update an issue with an invalid _id', function(done) {
      app.then((server) => {
        chai
          .request(server)
          .keepOpen()
          .put('/api/issues/alex-api-v2')
          .set('Content-Type', 'application/json')
          .send({
            _id: 'test-id',
            issue_title: 'Updated issue title'
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.body.error, 'could not update');
            assert.equal(res.body._id, 'test-id');
            done();
          });
      });
    });
  });
  suite('DELETE /api/issues/:project', function() {
    test('Should delete an issue', function(done) {
      app.then((server) => {
        chai
          .request(server)
          .keepOpen()
          .post('/api/issues/alex-api-v2')
          .set('Content-Type', 'application/json')
          .send(baseTestIssue)
          .then((postRes) => {
            issueToDelete = postRes.body;

            chai
              .request(server)
              .keepOpen()
              .delete('/api/issues/alex-api-v2')
              .send({
                _id: issueToDelete._id,
              })
              .end(function(err, deleteRes) {
                assert.equal(deleteRes.status, 200);
                assert.equal(deleteRes.body.result, 'successfully deleted');
                assert.equal(deleteRes.body._id, issueToDelete._id);
                done();
              });
          });
      });
    });
    test('Should not delete an issue with an invalid _id', function(done) {
      app.then((server) => {
        chai
          .request(server)
          .keepOpen()
          .delete('/api/issues/alex-api-v2')
          .set('Content-Type', 'application/json')
          .send({
            _id: 'test-id',
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.body.error, 'could not delete');
            assert.equal(res.body._id, 'test-id');
            done();
          });
      });
    });
    test('Should not delete an issue with missing _id', function(done) {
      app.then((server) => {
        chai
          .request(server)
          .keepOpen()
          .delete('/api/issues/alex-api-v2')
          .set('Content-Type', 'application/json')
          .send({})
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.body.error, 'missing _id');
            done();
          });
      });
    });
  });
});
