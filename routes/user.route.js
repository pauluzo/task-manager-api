const express = require("express");
const router = express.Router();
const UserModel = require("../models/user.model");

router.get('/', async (req, res) => {
  const body = req.body;
  try {
    const userEmail = body.email;
    const userData = await UserModel.findOne({"user_details.email" : userEmail}).lean().exec();
    const populatedData = userData.populate('tasks');
    
    res.status(200).json(populatedData);
  } catch(error) {
    console.log('Error occured:', error);
    res.status(400).send(`An error occured: ${error}`);
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const data = {...body, task: []};
    const userData = new UserModel(data);
    console.log(userData);

    await userData.save();
    res.status(200).send(`The schema seems to work well: ${userData}`);
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
    const userDetails = await userUpdate.toObject().user_details;
    const newDetails = {...userDetails, ...body};
  
    console.log(`new details update: `, newDetails);
    userUpdate.user_details = newDetails;
    await userUpdate.save();

    console.log('Here\'s the update: ', userUpdate);

    res.status(200).json(`User updated successfully: ${userUpdate}`);
  } catch (error) {
    console.log('Error occured:', error);
    res.status(400).json(`An error occured: ${error}`);
  }
})

module.exports = router;