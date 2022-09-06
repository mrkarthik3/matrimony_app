const asyncHandler = require('../middleware/async');
const User = require('../models/Users');
const CustomErrorResponse = require('../utilities/errorResponse');
const okta = require('@okta/okta-sdk-nodejs');

// @desc   Register a new Profile
// @route  POST /api/v1/users/
// @access Public

exports.registerUserProfile = asyncHandler(async (req, res, next) => {
  // connect with okta here ?!
  const user = await User.create(req.body);
  res.status(201).json({ success: true, message: 'New user is created.', data: user });
});
/** ----------------------------------------- */

// @desc   Retrieve a user Profile
// @route  GET /api/v1/users/:userId
// @access Private

//creating user inside mongodb with oktaInformation.
const creteUserInMongoDb = async (mongoUser) => {
  const user = await User.create(mongoUser);
  return user;
};


//signing up user into okta
exports.oktaSignUp = asyncHandler(async (req, res, next) => {
  const client = new okta.Client({
    orgUrl: 'https://dev-42684472.okta.com/',
    token: '00TW3soK2Eq883PaRVu5rjqRniqE6iaueZOivSe91P',
  });
  const body = req.body;
  try {
    await createUserInOkta();
    async function createUserInOkta() {
      const response = await client.createUser(body);

      //will update it with destructure
      const oktaId = response.id;
      const name = `${response.profile.firstName} ${response.profile.lastName}`;
      const gender = response.profile.gender;
      const email = response.profile.email;

      const mongoUser = {
        oktaUserId: oktaId,
        name,
        gender,
        email,
      };
      const mongoReponse = await creteUserInMongoDb(mongoUser);
      res.send({
        res: response,
      });
    }
  } catch (err) {
    res.send({
      err: err,
    });
  }
});

//find user in mongodb by oktaId
async function findUserByOktaId(oktaId) {
  const currentUser = await User.find({ oktaUserId: oktaId });
  return currentUser;
}

exports.getUserProfile = asyncHandler(async (req, res, next) => {
  const params = req.params;
  const oktaId = params.id;

  const currentUser = await findUserByOktaId(oktaId);

  if (!currentUser) {
    return next(new CustomErrorResponse(`User not found!`, 404));
  }
  res.status(200).json({ currentUser });
});


//to upload image in mongodb
exports.uploadImageToMongoDb = asyncHandler(async (req, res, next) => {
  const imageUrl = req.body.imageUrlString;
  const currentUserId = req.body.oktaUserId;
  const currentUser = await findUserByOktaId(currentUserId);
  // console.log(currentUser[0].images);
  const imageUrls = currentUser[0].images;
  if (!currentUser) {
    return next(new CustomErrorResponse(`User not found!`, 404));
  }
  await User.updateOne({ oktaUserId: currentUserId }, { images: [...imageUrls, imageUrl] });
  res.status(200).json({ status: 'success' });
});

/** ----------------------------------------- */

// @desc   Update already existing Profile Data
// @route  PUT /api/v1/users/:userId
// @access Private

// After initial signup where only mandatory fields are asked,
// Whenever user logs in... and updates their profile data,
// This controller is used for that purpose.

exports.updateUserProfile = asyncHandler(async (req, res, next) => {
  const currentUserId = req.params.userId;
  if (!currentUserId) {
    return next(new CustomErrorResponse(`Can't update data of non-existent user`, 400));
  }
  await User.updateOne({ oktaUserId: currentUserId }, { $set: req.body });
  res.status(200).json({
    success: true,
    message: 'Updated User successfully',
    data: 'user',
  });
});
/** ----------------------------------------- */

// @desc   Delete a new Profile
// @route  DELETE /api/v1/users/:userId
// @access Private

exports.deleteUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return next(new CustomErrorResponse(`No user found with id of ${req.params.userId}`, 404));
  }
  // I could have used findByIdAndDelete().
  // But remove() allows using middleware... so I will use remove()
  await user.remove();

  res.status(200).json({
    success: true,
    message: 'User successfully deleted',
  });
});
/** ----------------------------------------- */
