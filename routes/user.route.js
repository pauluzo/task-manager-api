const express = require("express");
const router = express.Router();
const UserModel = require("../models/user.model");
const TaskModel = require("../models/task.model");
const { populate } = require("../models/user.model");

router.get('/', async (req, res) => {
  const body = req.body;
  try {
    const userEmail = body.email;
    const populatedData = await UserModel.findOne({"user_details.email" : userEmail}).populate('tasks');
    console.log('populated data is: ', populatedData);
    const responseData = {
      tasks : populatedData.tasks,
      user_details : {
        user_name : populatedData.user_details.name,
        email : populatedData.user_details.email,        
      }
    }
    
    res.status(200).json(responseData);
  } catch(error) {
    console.log('Error occured:', error);
    res.status(500).send(`An error occured: ${error}`);
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const data = {...body, task: []};
    const userData = new UserModel(data);
    console.log(userData);

    await userData.save();

    const responseData = {
      tasks : userData.tasks,
      token : userData.token,
      user_details : {
        user_name : userData.user_details.name,
        email : userData.user_details.email
      }
    }
    res.status(200).json(responseData);
  } catch (error) {
    console.log('Error occured:', error);
    res.status(400).send(`An error occured: ${error}`);
  }
});

router.put('/', async (req, res) => {
  try {
    const body = req.body
    const userEmail = body.email;
    console.log(body);
    const userUpdate = await UserModel.findOne({"user_details.email" : userEmail}).lean().exec();
    const userDetails = await userUpdate.user_details;
    const newDetails = {...userDetails, ...body};
  
    console.log(`new details update: `, newDetails);

    const updatedData = await UserModel.findByIdAndUpdate(userUpdate._id, {user_details : newDetails}, {new: true});

    console.log('Here\'s the update: ', updatedData);

    res.status(200).json(updatedData);
  } catch (error) {
    console.log('Error occured:', error);
    res.status(400).json(`An error occured: ${error}`);
  }
});

router.delete('/', async (req, res) => {
  try {
    const userEmail = req.body.email;
    console.log('User Email is ', userEmail);
    // TODO: Get and delete a user and all its associated tasks. (Delete multiple tasks at once)
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
    console.log('Error occured:', error);
    res.status(400).send(`An error occured: ${error}`);
  }
});

module.exports = router;