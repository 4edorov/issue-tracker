'use strict';

const { ObjectId } = require('mongodb');
const getProjectCollectionName = (req) => {
  return req.params.project + '-issues';
};

module.exports = function (app, db) {

  app.route('/api/issues/:project')

    .get(async function (req, res) {
      const query = req.query;
      if (query._id) {
        query._id = new ObjectId(query._id);
      }
      const issues = await db.collection(getProjectCollectionName(req))
        .find(req.query)
        .toArray();

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
        open: true,
        created_on: new Date().toISOString(),
        updated_on: new Date().toISOString()
      }
      const insertRes = await db.collection(getProjectCollectionName(req))
        .insertOne(issue)
        .catch((err) => {
          return res.send({ error: 'could not save an issue' });
        }
      );

      return res.send({ ...issue, _id: insertRes.insertedId });
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

      Object.keys(fieldsToUpdate).forEach((key) => {
        if (!fieldsToUpdate[key]) {
          delete fieldsToUpdate[key];
        }
      });

      try {
        const updateRes = await db.collection(getProjectCollectionName(req))
          .updateOne(
            { _id: new ObjectId(_id) },
            { $set: {
              ...fieldsToUpdate,
              updated_on: new Date().toISOString()
            }});

          if (updateRes.modifiedCount < 1) {
            throw new Error('could not update')
          }
      } catch (err) {
        return res.send({ error: 'could not update', _id });
      }
      return res.send({ result: 'successfully updated', _id });
    })

    .delete(async function (req, res) {
      const { _id } = req.body;

      if (!_id) {
        return res.send({ error: 'missing _id' });
      }

      try {
        const deleteRes = await db.collection(getProjectCollectionName(req))
          .deleteOne({ _id: new ObjectId(_id) });

        if (deleteRes.deletedCount < 1) {
          throw new Error('could not delete');
        }
      } catch (err) {
        return res.send({ error: 'could not delete', _id });
      }

      return res.send({ result: 'successfully deleted', _id });
    });
};
