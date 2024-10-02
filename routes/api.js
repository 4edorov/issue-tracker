'use strict';

const remoteDbUri = process.env.REMOTE_DB_URI +
  '/api/issues' + '/' + process.env.PROJECT_NAME;

module.exports = function (app) {

  app.route('/api/issues/:project')

    .get(async function (req, res) {
      const queryString = new URLSearchParams(req.query).toString();
      const getRes = await fetch(remoteDbUri + '?' + queryString)
        .catch((err) => {
          return res.send({ error: 'could not get issues' });
        });
      const issues = await getRes.json();

      return res.send(issues);
    })
    
    .post(async function (req, res) {
      const {
        issue_title,
        issue_text,
        created_by,
        assigned_to = "",
        status_text = ""
      } = req.body;

      if (!issue_title || !issue_text || !created_by) {
        return res.send({ error: 'required field(s) missing' });
      }

      const issue = {
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        open: true
      }

      try {
        const savedRes = await fetch(remoteDbUri, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(issue)
        });
        const savedIssue = await savedRes.json();

        return res.send(savedIssue);
      } catch(err) {
        return res.send({ error: 'could not save an issue' });
      }
    })

    .put(async function (req, res) {
      const issueToUpdate = req.body;
      const { _id, ...fieldsToUpdate } = issueToUpdate;

      if (!_id) {
        return res.send({ error: 'missing _id' });
      }
      if (Object.keys(fieldsToUpdate).length === 0) {
        return res.send({ error: 'no update field(s) sent', _id });
      }

      let existedIssue;

      try {
        const getRes = await fetch(remoteDbUri + '?_id=' + _id)
        const issues = await getRes.json()
        existedIssue = issues[0];
      } catch(err) {
        return res.send({ error: 'could not update', _id });
      }

      Object.keys(fieldsToUpdate).forEach((key) => {
        if (!fieldsToUpdate[key]) {
          delete fieldsToUpdate[key];
        }
      });

      await fetch(remoteDbUri, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...existedIssue, ...fieldsToUpdate })
      }).catch((err) => {
        return res.send({ error: 'could not update', _id });
      });

      return res.send({ result: 'successfully updated', _id });
    })

    .delete(async function (req, res) {
      const { _id } = req.body;

      if (!_id) {
        return res.send({ error: 'missing _id' });
      }

      try {
        const getRes = await fetch(remoteDbUri + '?_id=' + _id)
        const issues = await getRes.json()

        if (issues.length === 0) {
          throw new Error();
        }
      } catch(err) {
        return res.send({ error: 'could not delete', _id });
      }

      await fetch(remoteDbUri, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id })
      }).catch((err) => {
        return res.send({ error: 'could not delete', _id });
      });

      return res.send({ result: 'successfully deleted', _id });
    });
};
