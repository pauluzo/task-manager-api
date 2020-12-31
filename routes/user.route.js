const express = require("express");
const router = express.Router();
const UserModel = require("../models/user.model");

router.get('/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const userData = await UserModel.findById(userId);
    userData.populate('active_tasks completed_tasks expired_tasks');
    res.status(200).json(userData);
  } catch(error) {
    console.log('Error occured:', error);
    res.status(400).send(`An error occured: ${error}`);
  }
});

router.post("/", async (req, res) => {
  const userData = new UserModel(req.body);
  
  try {
    console.log(userData);

    await userData.save();
    res.status(200).send(`The schema seems to work well: ${userData}`);
  } catch (error) {
    console.log('Error occured:', error);
    res.status(400).send(`An error occured: ${error}`);
  }
});

router.put('/:id', async (req, res) => {
  const body = req.body
  const userId = req.params.id;

  try {
    console.log(body);
    const userUpdate = await UserModel.findById(userId);
    const userDetails = await userUpdate.toObject().user_details;
    const newDetails = {...userDetails, ...body};
  
    console.log(`new details update: `, newDetails);
     await userUpdate.updateOne(newDetails);

    console.log('Here\'s the update: ', userUpdate);

    res.status(200).json(`User updated successfully: ${userUpdate}`);
  } catch (error) {
    console.log('Error occured:', error);
    res.status(400).json(`An error occured: ${error}`);
  }
})

module.exports = router;