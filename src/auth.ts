// Functions with adminAuthRegister, adminAuthLogin
// adminUserDetails, adminAuthLogout, adminUserPasswordUpdate
// and adminUserDetailsUpdate
//
// By group AERO
// From 27/10/23

import { getData, setData } from './dataStore';
import {
  EmptyObjectReturn, AdminAuthRegisterReturn, AdminAuthLoginReturn,
  AdminUserDetailsReturn, SingleErrorObject
} from './interface';
import {
  createToken, emailCheck, emailExistCheck, authNameCheck, authNameLengthCheck, passwordCheck,
  passwordLengthCheck, tokenCheck, hashString
} from './support';
import {
  EMAIL_EXIST, EMAIL_INVALID, NAME_FIRST_ERROR, NAME_FIRST_LENGTH_ERROR, NAME_LAST_ERROR,
  NAME_LAST_LENGTH_ERROR, PASSWORD_ERROR, PASSWORD_LENGTH_ERROR
} from './support';

/**
 * Function register a user with an email, password, and names,
 * then returns their token.
 *
 * @param {string} email - user's email use to register
 * @param {string} password - user's password
 * @param {string} nameFirst - user's first name
 * @param {string} nameLast - user's last name
 * @returns {object} - new userId from datastore
 */
export function adminAuthRegister(email: string, password: string, nameFirst: string, nameLast: string): AdminAuthRegisterReturn | SingleErrorObject {
  if (!authNameCheck(nameFirst)) {
    // check valid characters of first name
    return NAME_FIRST_ERROR;
  } else if (!authNameCheck(nameLast)) {
    // check valid characters of last name
    return NAME_LAST_ERROR;
  } else if (!authNameLengthCheck(nameFirst)) {
    // check valid string length for first name
    return NAME_FIRST_LENGTH_ERROR;
  } else if (!authNameLengthCheck(nameLast)) {
    // check valid string length for last name
    return NAME_LAST_LENGTH_ERROR;
  } else if (!emailCheck(email)) {
    // check if email is in valid format
    return EMAIL_INVALID;
  } else if (!emailExistCheck(email)) {
    // check if email is already used for another user
    return EMAIL_EXIST;
  } else if (!passwordCheck(password)) {
    // check if password has valid characters and fits criteria
    return PASSWORD_ERROR;
  } else if (!passwordLengthCheck(password)) {
    // check length of password
    return PASSWORD_LENGTH_ERROR;
  }

  const data = getData();

  // detect data.recentUserId and plus 1 ready for the new user
  data.recentUserId += 1;

  // set authUserId to the value of data.recentUserId
  const authUserId = data.recentUserId;

  // combine first name and last name to name
  const name = `${nameFirst} ${nameLast}`;

  // setup password to hash
  const hashPassword = hashString(password);

  // Recording login successful and failed data
  const numSuccessfulLogins = 1;
  const numFailedPasswordsSinceLastLogin = 0;
  const token = createToken();
  const usedPassword = [hashPassword];

  // Then create user file
  const authUser = {
    authUserId,
    name,
    email,
    password: hashPassword,
    numSuccessfulLogins,
    numFailedPasswordsSinceLastLogin,
    token: [token],
    usedPassword,
  };
    // Push to datastore
  data.users.push(authUser);
  setData(data);

  // And return ID
  return {
    token,
  };
}

/**
 * Function given a registered user's email and password
 * returns their token.
 *
 * @param {string} email - user's register email
 * @param {string} password - user's password
 * @returns {object}  - user's token or error
 */
export function adminAuthLogin(email: string, password: string): AdminAuthLoginReturn | SingleErrorObject {
  const data = getData();

  const user = data.users.find((user) => user.email === email);
  // if cannot find corresponding user will return undefined

  if (!user) {
    return { error: 'Email address does not exist' };
  }

  // trans login password to hash password
  const hashPassword = hashString(password);

  // check whether the password validity
  if (user.password !== hashPassword) {
    // if password invalid - increment failed logins
    user.numFailedPasswordsSinceLastLogin += 1;
    setData(data);
    // return error - as failure of login
    return { error: 'Password is not correct for the given email' };
  }

  // login successfully
  user.numSuccessfulLogins++;
  user.numFailedPasswordsSinceLastLogin = 0; // reset for login successfully

  const token = createToken();

  // store the new token.
  user.token.push(token);

  setData(data);

  return {
    token,
  };
}

/**
 * Function given an admin user's token, returns details about the user.
 * "name" is the first and last name concatenated with a single space between them
 *
 * @param {string} token - user's token
 * @returns {object} - user details of the user given by token
 */
export function adminUserDetails(token: string): AdminUserDetailsReturn {
  const data = getData();

  // finds user with corrsponding token
  const user = data.users.find((user) => user.token.includes(token));

  return {
    user:
      {
        userId: user.authUserId,
        name: user.name,
        email: user.email,
        numSuccessfulLogins: user.numSuccessfulLogins,
        numFailedPasswordsSinceLastLogin: user.numFailedPasswordsSinceLastLogin,
      },
  };
}

/**
  * Function for user logout server with their login token
  *
  * @param {string} token - user's token since last login
  * @returns {EmptyObjectReturn} - return empty object (success)
  */
export function adminAuthLogout(token: string): EmptyObjectReturn {
  const data = getData();

  // find user with corresponding token
  const user = data.users.find(user => user.token.includes(token));

  // remove token - as user has logged out
  user.token = user.token.filter(t => t !== token);

  // update data
  setData(data);

  return {};
}

/**
  * Function to update a user's password
  *
  * @param {string} token - user's token since last login
  * @param {string} oldPassword - password user is currently using
  * @param {string} newPassword - password user wants to change to
  * @returns {EmptyObjectReturn | SingleErrorObject} - return empty object (success) or error if failure
  */
export function adminUserPasswordUpdate(token: string, oldPassword: string, newPassword: string): EmptyObjectReturn | SingleErrorObject {
  const data = getData();
  const user = tokenCheck(token);
  // tansfer password to hash password
  const hashOldPassword = hashString(oldPassword);
  const hashNewPassword = hashString(newPassword);

  if (!passwordCheck(newPassword)) {
    // check if given password fits criteria
    return PASSWORD_ERROR;
  } else if (!passwordLengthCheck(newPassword)) {
    // check valid length of password
    return PASSWORD_LENGTH_ERROR;
  } else if (user.password !== hashOldPassword) {
    // return error if inputted password does not match
    return { error: 'password not match the old password' };
  } else if (user.password === hashNewPassword) {
    // return error if both passwords are the same
    return { error: 'password is same as the old one' };
  } else if (user.usedPassword.includes(hashNewPassword)) {
    // if password used before - return error
    return { error: 'this password is used before!' };
  }

  // set user password to new password
  user.password = hashNewPassword;

  // add current password to used passwords under user
  user.usedPassword.push(hashNewPassword);

  // update data
  setData(data);
  return {};
}

/**
 * Function use to update user's detail with a matched login token
 * And new email, first name, last name.
 *
 * @param {string} token - user's login token
 * @param {string} email - user's new email
 * @param {string} nameFirst - user's new first name
 * @param {string} nameLast - user's new last name
 * @returns {EmptyObjectReturn | SingleErrorObject} return empty object (success) otherwise return error
 */
export function adminUserDetailsUpdate(token: string, email: string, nameFirst: string, nameLast: string): EmptyObjectReturn | SingleErrorObject {
  const data = getData();
  const user = tokenCheck(token);

  if (!authNameCheck(nameFirst)) {
    // check valid characters of first name
    return NAME_FIRST_ERROR;
  } else if (!authNameCheck(nameLast)) {
    // check valid characters of last name
    return NAME_LAST_ERROR;
  } else if (!authNameLengthCheck(nameFirst)) {
    // check valid length of first name
    return NAME_FIRST_LENGTH_ERROR;
  } else if (!authNameLengthCheck(nameLast)) {
    // check valid length of last name
    return NAME_LAST_LENGTH_ERROR;
  } else if (!emailCheck(email)) {
    // check email is in valid format
    return EMAIL_INVALID;
  } if (!emailExistCheck(email) && user.email !== email) {
    // check if email is already used for another user
    return EMAIL_EXIST;
  }

  // combine first name and last name to name
  const name = `${nameFirst} ${nameLast}`;

  // update details
  user.name = name;
  user.email = email;

  setData(data);

  return {};
}
