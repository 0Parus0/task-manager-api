const { Router } = require('express');
const router = new Router();
const auth = require('../middleware/auth');

const Task = require('../modals/task');



/**
 * ***********************
 *  tasks end point
 * ***********************
 */

 /* Saving/Creating a task to mongo-db */

 router.post('/tasks', auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  })

  try {
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(error.message);
  }
})

/* Reading or getting all/completed/incomplete tasks from mongo-db using query string */
/* tasks?completed=true */
/* GET/tasks?limit=10&skip=0 */
/* GET/tasks?sortBy=createdAt_asc/desc */
router.get('/tasks', auth, async (req, res) => {
  const match = {};
  const sort = {};

  if(req.query.completed) {
    match.completed = req.query.completed === 'true'
  }

  if(req.query.sortBy) {
    const parts = req.query.sortBy.split(':')
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
  }

  try {
    const id =  req.user._id;
    // const tasks = await Task.find({owner: id})
    // or
    await req.user.populate({
      path: 'tasks',
      match, 
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    }).execPopulate();
    
    res.send(req.user.tasks);
  } catch (error) {
    // console.log(error)
    res.sendStatus(500).send();
  }

})

/* Reading or getting single task by id from mongo-db */

router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({_id, owner: req.user._id});
    if(!task) {
      return res.sendStatus(404);
    }
    res.send(task);
  } catch (error) {
    // console.log(error);
    if(error.name === 'CastError'){
      return res.sendStatus(404);
    }
    res.sendStatus(500);
  }  
})

router.patch('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;
  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if(!isValidOperation) {
    return res.status(400).send('Invalid Operation');
  }

  try {
    const task = await Task.findOne({_id: req.params.id, owner: req.user._id});
    if(!task) {
      return res.sendStatus(404);
    }
    updates.forEach(update => task[update] = req.body[update])
    res.send(task);
  } catch (error) {
    console.log(error);
    if(error.name === 'ValidationError'){
      return res.status(400).send(error.message)
    }
    res.sendStatus(500).send();
  }
})

router.delete('/tasks/:id', auth, async(req, res) => {
  const _id = req.params.id;
  try {
    const taskToDelete = await Task.findOneAndDelete({_id, owner: req.user._id});
    if(!taskToDelete) {
      return res.sendStatus(404);
    }

    res.send(taskToDelete);
  } catch (error) {
    if(error.name === 'CastError') {
      return res.sendStatus(404);
    }
    res.sendStatus(500);
  }
})


module.exports = router;
