const express = require("express");
const router = express.Router();
const UserModel = require("../models/user.model");
const TaskModel = require("../models/task.model");
const { generatePassword, validatePassword } = require("../utils/passwordValidation");
const { createToken, verifyToken } = require("../utils/auth");

router.get('/', verifyToken, async (req, res) => {
  const email = req.query.email;
  
  try {
    const populatedData = await UserModel.findOne({"user_details.email" : email}).populate('tasks');
    console.log('populated data is: ', populatedData);
    const responseData = {
      tasks : populatedData.tasks,
      user_details : {
        user_name : populatedData.user_details.user_name,
        email : populatedData.user_details.email,
      }
    }
    
    res.status(200).json(responseData);
  } catch(error) {
    console.log('error occured', error);
    res.status(500).json({error : 'Error occured' + error});
  }
});

// new-user/sign-up route
router.post("/", async (req, res) => {
  try {
    const {user_name, email, password} = req.body.user_details;
    const userExists = await UserModel.findOne({"user_details.email" : email});

    if(userExists && userExists._id) throw Error('User account already exists');

    const {hash, salt} = generatePassword(password);
    const postData = {
      token : req.body.token,
      user_details : {
        user_name,
        email,
        hash,
        salt
      }
    }
    const data = {...postData, task: []};
    const userData = new UserModel(data);
    console.log(userData);

    await userData.save();

    const auth_token = createToken(user_name, userData._id);
    console.log('the generated JWT token is: ', auth_token);

    const responseData = {
      tasks : userData.tasks,
      auth_token,
      user_details : {
        user_name : userData.user_details.user_name,
        email : userData.user_details.email
      }
    }
    res.status(200).json(responseData);
  } catch (error) {
    console.log('error occured', error);
    res.status(500).json({error : 'Error occured' + error});
  }
});

// registered user login route.
router.post('/login', async (req, res) => {
  const {email, password} = req.body;

  try {
    const populatedData = await UserModel.findOne({"user_details.email" : email}).populate('tasks');
    
    if(populatedData === null || !(populatedData._id)) {
      console.log('the user email does not exist.', email);
      return res.status(400).json({
        error : "Invalid credentials. Please check credentials and try again" 
      });
    }

    const {user_name, hash, salt} = populatedData.user_details;
    const isUser = validatePassword(password, hash, salt);

    if(isUser) {
      const auth_token = createToken(user_name, populatedData._id);

      return res.status(200).json({
        auth_token,
        user_details : {
          user_name,
          email
        }
      });
    } else {
      console.log('the email exists, but password failed');
      return res.status(400).json({
        error : "Invalid credentials. Please check credentials and try again" 
      });
    }
  } catch (error) {
    console.log('error occured', error);
    res.status(400).json({error : 'Error occured' + error});
  }
})

router.put('/', verifyToken, async (req, res) => {
  try {
    let body = req.body
    const userEmail = body.email;
    console.log(body);
    const userUpdate = await UserModel.findOne({"user_details.email" : userEmail}).lean().exec();
    const userDetails = userUpdate.user_details;
    if(body.password) {
      const {hash, salt} = generatePassword(body.password);
      body.hash = hash;
      body.salt = salt;
      delete body.password;
    }
    const newDetails = {...userDetails, ...body};
  
    console.log(`new details update: `, newDetails);

    const updatedData = await UserModel.findByIdAndUpdate(userUpdate._id, {user_details : newDetails}, {new: true});

    console.log('Here\'s the update: ', updatedData);

    const responseData = {
      user_name : updatedData.user_details.user_name,
      email : updatedData.user_details.email
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.log('error occured', error);
    res.status(500).json({error : 'Error occured' + error});
  }
});

router.delete('/', verifyToken, async (req, res) => {
  try {
    const userEmail = req.body.email;
    console.log('User Email is ', userEmail);
    const deletedUser = await UserModel.findOneAndDelete({
      "user_details.email" : userEmail
    });
    console.log('The deleted User is ', deletedUser);
    const deletedTasks = await TaskModel.deleteMany({
      user : deletedUser._id
    }).lean().exec();

    console.log('tasks deleted successfully', deletedTasks);
    res.status(200).json('User and associated tasks deleted successfully.');
  } catch (error) {
    console.log('error occured', error);
    res.status(500).json({error : 'Error occured' + error});
  }
});

module.exports = router;
