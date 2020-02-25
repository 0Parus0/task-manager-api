const { Router } = require('express');
const multer = require('multer');
const sharp = require('sharp');
const router = new Router();

const User = require('../modals/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account');


/**
 * ***********************
 *  users end points
 * ***********************
 */

 /* Saving/Creating a user to mongo-db */

 router.post('/users', async (req, res) => {
   const user = new User(req.body);
  //  sendWelcomeEmail(user.email, user.name);

  try {
    await user.save();
    const token = await user.generateAuthToken()
    res.status(201).send({ user, token});
    
  } catch (error) {
    if(error.name === 'ValidationError'){
      return res.status(400).send(error.message)
    }
    res.status(500).send(error);
  }
})

/* SignIn */

router.post('/users/login', async(req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    
    res.send({user, token});
  } catch (error) {

    res.sendStatus(400);
  }
})

/* Logout with wiping a single token for a single machine/session  */
router.post('/users/logout', auth, async(req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);

    await req.user.save();

    res.send()
  } catch (error) {
    res.sendStatus(500);
  }
})

/* Logout of all machines/sessions and wipe all tokens */

router.post('/users/logoutAll', auth, async(req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (error) {
    res.sendStatus(500);
  }
})



/* Reading or getting all users from mongo-db */

router.get('/users/me', auth, async (req, res) => {
  try {
    res.send(req.user);
    if(!req.user) {
      throw new Error()
    }
  } catch (error) {
    res.sendStatus(401);
  }
})


/* Update own profile */

router.patch('/users/me', auth, async(req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'age', 'password'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));
  if(!isValidOperation) {
    return res.status(400).send({error: 'Invalid updates!'});

  }
  try {
    const user = req.user;
    updates.forEach(update => user[update] = req.body[update]);
    await user.save();
    res.send(user);
  } catch (error) {
    if(error.name === 'ValidationError'){
      return res.status(400).send(error.message)
    }
    res.sendStatus(500).send();
  }
})

// /* Delete own profile */

router.delete('/users/me', auth, async(req, res) => {
  try {
    await req.user.remove();
    res.send(req.user); 
    // sendCancellationEmail(req.user.email, req.user.name);
  } catch (error) {
    res.sendStatus(500);
  }
})

const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image of type (jpg, jpeg or png)'));
    }
    cb(undefined, true);
  }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async(req, res) => {

  const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()

  req.user.avatar = buffer;
  await req.user.save()
  res.send();
},(error, req, res, next) => {
  res.status(400).send({error: error.message});
});

router.delete('/users/me/avatar', auth, async(req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send()
});

router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if(!user || !user.avatar) {
      throw new Error();
    }
    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (error) {
    res.sendStatus(404)
  }
})

module.exports = router;













/* Delete some user  */

// router.delete('/users/:id', async(req, res) => {
//   const _id = req.params.id;

//   try {
//     const userToDelete = await User.findByIdAndDelete(_id);
//     res.send(userToDelete);
//   } catch (error) {
//     console.log(error);
//     if(error.name === 'CastError'){
//       return res.sendStatus(404).send();
//     }
//     res.sendStatus(500).send();
//   }

// })


/* Updating a  user by id */

// router.patch('/users/:id', async (req, res) => {
//   const updates = Object.keys(req.body);
//   const allowedUpdates = ['name', 'email', 'age', 'password'];
//   const isValidOperation = updates.every(update => allowedUpdates.includes(update));
//   const _id = req.params.id;

//   if(!isValidOperation) {
//     return res.status(400).send({error: 'Invalid updates!'});
//   }
  
//   try {
//     const updatedUser = await User.findById(_id);

//     updates.forEach(update => updatedUser[update]= req.body[update]);

//     await updatedUser.save();
//     // const updatedUser = await User.findByIdAndUpdate(_id, req.body, {new: true, runValidators: true});
//     res.send(updatedUser);
//   } catch (error) {
//     if(error.name === 'CastError'){
//       return res.sendStatus(404).send();
//     }else if(error.name === 'ValidationError'){
//       return res.status(400).send(error.message)
//     }
//     res.sendStatus(500).send();
//   }
  
  
// });



/* Reading or getting a single user by id */

// router.get('/users/:id', async (req, res) => {
//   const _id = req.params.id;

//   try {
//    const user = await User.findById(_id);
//     res.send(user)
//   } catch (error) {
//     if(error.name === 'CastError'){
//       return res.sendStatus(404).send();
//     }
//     res.sendStatus(500).send();
//   }

// })

