import {
  requestClear, requestAdminAuthRegister, requestAdminAuthLogin, requestAdminUserDetails,
  requestAdminAuthLogout, requestAdminPasswordUpdate, requestAdminUserDetailsUpdate
} from './testfunction';

const OK = 200;
const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;

const ERROR = { error: expect.any(String) };

beforeEach(() => {
  requestClear();
});

/// ////////////////////////////////////////////////////////////////////////////
/// ////////////////////////ADMIN AUTH REGISTER/////////////////////////////////
/// ////////////////////////////////////////////////////////////////////////////

describe('adminAuthRegister Pass Test', () => {
  const validEmail = 'asd@gmail.com';
  const validPassword = 'Dancing321';
  const validNameFirst = 'First';
  const validNameLast = 'Last';
  beforeEach(() => {
    requestClear();
  });
  // use all valid inputs to receive output of token
  test('First Pass Test', () => {
    const response = requestAdminAuthRegister(
      validEmail,
      validPassword,
      validNameFirst,
      validNameLast
    );
    expect(response.object).toStrictEqual({
      token: expect.any(String),
    });
    // as no errors occurred, status code 200
    expect(response.status).toStrictEqual(OK);
  });

  // valid tests - testing character limits of criteria
  test.each([
    {
      email: 'iamthelongestemailinthiscase@gmail.com', password: 'andOneOfTheLongestPasswordContainSomeSuchAs13579', nameFirst: 'Also AVeryLongFirstN', nameLast: "And A-Complex'Last'N",
    },
    {
      email: 'andtheshortone@gmail.com', password: 'theShort1', nameFirst: 'FN', nameLast: 'LN',
    },
    {
      email: 'z1234567@ad.unsw.edu.au', password: 'Comp1531STUDENT', nameFirst: 'COMP', nameLast: 'Student',
    },
    {
      email: 'funny@outlook.com', password: '1-Fun^ny&Complex', nameFirst: 'Funny', nameLast: 'OUT',
    },

  ])('More valid test', ({
    email, password, nameFirst, nameLast,
  }) => {
    const response = requestAdminAuthRegister(email, password, nameFirst, nameLast);
    // return token as all valid inputs for registration
    expect(response.object).toStrictEqual({
      token: expect.any(String),
    });
    // as fulfil criteria, no errors occur, status code should remain 200
    expect(response.status).toStrictEqual(OK);
  });
});

/**
   * Empty Test
   */
describe('adminAuthRegister Empty Test', () => {
  const validEmail = 'asd@gmail.com';
  const validPassword = 'Dancing321';
  const validNameFirst = 'First';
  const validNameLast = 'Last';
  beforeEach(() => {
    requestClear();
  });

  // test by changing object keys to invalid inputs (empty strings)
  test.each([
    {
      email: '', password: validPassword, nameFirst: validNameFirst, nameLast: validNameLast,
    },
    {
      email: validEmail, password: '', nameFirst: validNameFirst, nameLast: validNameLast,
    },
    {
      email: validEmail, password: validPassword, nameFirst: '', nameLast: validNameLast,
    },
    {
      email: validEmail, password: validPassword, nameFirst: validNameFirst, nameLast: '',
    },
    {
      email: '', password: '', nameFirst: '', nameLast: '',
    },

  ])('error: Empty Test', ({
    email, password, nameFirst, nameLast,
  }) => {
    const response = requestAdminAuthRegister(email, password, nameFirst, nameLast);
    // as invalid test should return error string
    expect(response.object).toStrictEqual(ERROR);
    // as invalid inputs -> cause error, status code set to 400
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });
});

describe('adminAuthRegister Name Error Test', () => {
  const validEmail = 'asd@gmail.com';
  const validPassword = 'Dancing321';
  const validNameFirst = 'First';
  const validNameLast = 'Last';

  beforeEach(() => {
    // clear data before each test to avoid accessing previously made data
    requestClear();
  });

  // incorrect first name strings - too short/long or invalid characters
  test.each([
    {
      email: validEmail, password: validPassword, nameFirst: 'F', nameLast: validNameLast,
    },
    {
      email: validEmail, password: validPassword, nameFirst: 'FirstVeryLooooooooogerTest', nameLast: validNameLast,
    },
    {
      email: validEmail, password: validPassword, nameFirst: 'Fir~st', nameLast: validNameLast,
    },
    {
      email: validEmail, password: validPassword, nameFirst: 'Fir.st', nameLast: validNameLast,
    },
  ])('error: First Name Test', ({
    email, password, nameFirst, nameLast,
  }) => {
    const response = requestAdminAuthRegister(email, password, nameFirst, nameLast);
    // as invalid test should return error string
    expect(response.object).toStrictEqual(ERROR);
    // as invalid inputs -> cause error, status code set to 400
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  // incorrect last name strings - too short/long or invalid characters
  test.each([
    {
      email: validEmail,
      password: validPassword,
      nameFirst: validNameFirst,
      nameLast: 'L',
    },
    {
      email: validEmail,
      password: validPassword,
      nameFirst: validNameFirst,
      nameLast: 'LastVeryLooooooooogerTest',
    },
    {
      email: validEmail,
      password: validPassword,
      nameFirst: validNameFirst,
      nameLast: 'La~st',
    },
    {
      email: validEmail,
      password: validPassword,
      nameFirst: validNameFirst,
      nameLast: 'La.st',
    },
  ])('error: Last Name Test', ({
    email, password, nameFirst, nameLast,
  }) => {
    const response = requestAdminAuthRegister(email, password, nameFirst, nameLast);
    // as invalid test should return error string
    expect(response.object).toStrictEqual(ERROR);
    // as invalid inputs -> cause error, status code set to 400
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });
});

// invalid email inputs - are not in correct email format
describe('adminAuthRegister Email Error Test', () => {
  const validPassword = 'Dancing321';
  const validNameFirst = 'First';
  const validNameLast = 'Last';
  beforeEach(() => {
    // clear data before each test to avoid accessing previously made data
    requestClear();
  });

  // invalid email inputs - missing email domains
  test.each([
    {
      email: 'asd', password: validPassword, nameFirst: validNameFirst, nameLast: validNameLast,
    },
    {
      email: 'asd@gmail', password: validPassword, nameFirst: validNameFirst, nameLast: validNameLast,
    },
    {
      email: 'asd.com', password: validPassword, nameFirst: validNameFirst, nameLast: validNameLast,
    },
  ])('error: Email Test', ({
    email, password, nameFirst, nameLast,
  }) => {
    const response = requestAdminAuthRegister(email, password, nameFirst, nameLast);
    // as invalid test should return error string
    expect(response.object).toStrictEqual(ERROR);
    // as invalid inputs -> cause error, status code is set to 400
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('Exist Email Test', () => {
    requestAdminAuthRegister('abc@cba.com.au', 'Pass2468word', 'Test-first', "Test'last");
    // as another user has registered with the same email - cannot re-register using that email

    const response = requestAdminAuthRegister('abc@cba.com.au', 'Dancing321', 'First', 'Last');
    // as invalid test should return error string
    expect(response.object).toStrictEqual(ERROR);
    // as invalid inputs -> cause error, status code is set to 400
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });
});

// invalid password inputs
describe('adminAuthRegister Password Error Test', () => {
  // creation of valid inputs
  const validEmail = 'asd@gmail.com';
  const validNameFirst = 'First';
  const validNameLast = 'Last';

  beforeEach(() => {
    // clear data before each test to avoid accessing previously made data
    requestClear();
  });

  // incorrect password inputs - too short/missing letters and numbers
  test.each([
    {
      email: validEmail, password: 'Dan2468', nameFirst: validNameFirst, nameLast: validNameLast,
    },
    {
      email: validEmail, password: 'Dancing', nameFirst: validNameFirst, nameLast: validNameLast,
    },
    {
      email: validEmail, password: '182749237', nameFirst: validNameFirst, nameLast: validNameLast,
    },
  ])('error: Password Test', ({
    email, password, nameFirst, nameLast,
  }) => {
    const response = requestAdminAuthRegister(email, password, nameFirst, nameLast);

    // as invalid test should return error string
    expect(response.object).toStrictEqual(ERROR);
    // as invalid inputs -> cause error, status code is set to 400
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });
});

/// ////////////////////////////////////////////////////////////////////////////
/// //////////////////////// ADMIN AUTH LOGIN //////////////////////////////////
/// ////////////////////////////////////////////////////////////////////////////

// check for adminAuthLogin error
describe('adminAuthLogin error check', () => {
  beforeEach(() => {
    // clear data before testing to avoid accessing previously made data
    requestClear();
    // pre-register user for login
    requestAdminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella');
  });

  test('1.error: Email address does not exist', () => {
    const response = requestAdminAuthLogin('valide1111@gmail.com', '123abc!@#');
    // as invalid test should return error string
    expect(response.object).toStrictEqual(ERROR);
    // as invalid inputs -> cause error, status code is set to 400
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('2.error: Password is not correct for the given email', () => {
    const response = requestAdminAuthLogin('validemail@gmail.com', '123abc!!');
    // as invalid test should return error string
    expect(response.object).toStrictEqual(ERROR);
    // as invalid inputs -> cause error, status code is set to 400
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('3.error: input email is empty', () => {
    const response = requestAdminAuthLogin('', '123abc!!');
    // as invalid test should return error string
    expect(response.object).toStrictEqual(ERROR);
    // as invalid inputs -> cause error, status code is set to 400
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('4.error: input password is empty', () => {
    const response = requestAdminAuthLogin('validemail@gmail.com', '');
    // as invalid test should return error string
    expect(response.object).toStrictEqual(ERROR);
    // as invalid inputs -> cause error, status code is set to 400
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('5.valid parameters with incorrect email', () => {
    const response = requestAdminAuthLogin('nonexistentemail@gmail.com', '123abc!@#');
    // as invalid test should return error string
    expect(response.object).toStrictEqual(ERROR);
    // as invalid inputs -> cause error, status code is set to 400
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });
});

// check when adminAuthLogin parameters are valid
describe('adminAuthLogin valid check', () => {
  beforeEach(() => {
    // clear data before testing to avoid accessing previously made data
    requestClear();
    // pre-register users for login
    requestAdminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella');
    requestAdminAuthRegister('guesswhat@gmail.com', '123abc!12', 'Jun', 'Red');
  });

  test('1.valid parameters with only one data in datastore', () => {
    const response = requestAdminAuthLogin('validemail@gmail.com', '123abc!@#');
    // as valid inputs function will return a token (string)
    expect(response.object).toStrictEqual({ token: expect.any(String) });
    // as valid inputs status code set to 200 (no errors)
    expect(response.status).toStrictEqual(OK);
  });

  test('2.valid parameters with several data', () => {
    const response1 = requestAdminAuthLogin('validemail@gmail.com', '123abc!@#');
    // as valid inputs function will return a token (string)
    expect(response1.object).toStrictEqual({ token: expect.any(String) });
    // as valid inputs status code set to 200 (no errors)
    expect(response1.status).toStrictEqual(OK);

    const response2 = requestAdminAuthLogin('guesswhat@gmail.com', '123abc!12');
    // as valid inputs function will return a token (string)
    expect(response2.object).toStrictEqual({ token: expect.any(String) });
    // as valid inputs status code set to 200 (no errors)
    expect(response2.status).toStrictEqual(OK);
  });

  test('3.valid parameters with email and password containing leading/trailing spaces', () => {
    const response = requestAdminAuthLogin('validemail@gmail.com', '123abc!@#');
    // as valid inputs function will return a token (string)
    expect(response.object).toStrictEqual({ token: expect.any(String) });
    // as valid inputs status code set to 200 (no errors)
    expect(response.status).toStrictEqual(OK);
  });

  test('4. Should generate a new token on successful login', () => {
    const initialToken = requestAdminAuthRegister('newemail@gmail.com', '123abc!@#', 'newname', 'newname');
    const loginResponse = requestAdminAuthLogin('newemail@gmail.com', '123abc!@#');

    // expect a token to be created
    expect(loginResponse.object.token).toBeDefined();
    // as new login session a new token will be generated - cannot be same as initial token
    expect(loginResponse.object.token).not.toEqual(initialToken);
  });
});

// check when numSuccessfulLogins are changing
describe('adminAuthLogin numSuccessfulLogins check', () => {
  let result1: string;
  beforeEach(() => {
    requestClear();
    result1 = requestAdminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella').object.token;
  });

  test('1. Should increase numSuccessfulLogins and reset numFailedPasswordsSinceLastLogin on successful login', () => {
    requestAdminAuthLogin('validemail@gmail.com', '123abc!@#');
    const response = requestAdminUserDetails(result1);

    expect(response.object).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Jake Renzella',
        email: 'validemail@gmail.com',
        numSuccessfulLogins: 2,
        numFailedPasswordsSinceLastLogin: 0,
      }
    });
  });

  test('2. Should increase numFailedPasswordsSinceLastLogin on failed login', () => {
    requestAdminAuthLogin('validemail@gmail.com', 'wrongpassword');

    const response = requestAdminUserDetails(result1);
    expect(response.object).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Jake Renzella',
        email: 'validemail@gmail.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 1,
      }
    });

    requestAdminAuthLogin('validemail@gmail.com', '123abc!@#');

    const userDetails2 = requestAdminUserDetails(result1).object;
    expect(userDetails2).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Jake Renzella',
        email: 'validemail@gmail.com',
        numSuccessfulLogins: 2,
        numFailedPasswordsSinceLastLogin: 0,
      }
    });
  });

  test('3. Should increase numSuccessfulLogins on successful login', () => {
    requestAdminAuthLogin('validemail@gmail.com', '123abc!@#');
    requestAdminAuthLogin('validemail@gmail.com', '123abc!@#');

    const userDetails = requestAdminUserDetails(result1).object;
    expect(userDetails).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Jake Renzella',
        email: 'validemail@gmail.com',
        numSuccessfulLogins: 3,
        numFailedPasswordsSinceLastLogin: 0,
      }
    });
  });

  test('4. Should not reset numFailedPasswordsSinceLastLogin on unsuccessful login', () => {
    requestAdminAuthLogin('validemail@gmail.com', 'wrongpassword');
    requestAdminAuthLogin('validemail@gmail.com', 'wrongpassword');

    const userDetails = requestAdminUserDetails(result1).object;
    expect(userDetails).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Jake Renzella',
        email: 'validemail@gmail.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 2,
      }
    });
  });
});

/// ////////////////////////////////////////////////////////////////////////////
/// /////////////////////////ADMIN USER DETAILS/////////////////////////////////
/// ////////////////////////////////////////////////////////////////////////////

// adminUserDetails Function Testing
describe('adminUserDetails - function testing', () => {
  beforeEach(() => {
    requestClear();
  });

  // TESTS INVALID TOKEN
  // 1  -   no user exists with that token
  test('invalid token input: no users', () => {
    const response = requestAdminUserDetails('12345');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // 2  -   existence of 1 user but wrong token accessed
  test('invalid token input: one user, incorrect ID', () => {
    const token: string = requestAdminAuthRegister('thisisanemail@gmail.com', 'thisisapassword1', 'FirstName', 'LastName').object.token;
    const response = requestAdminUserDetails(token + '100');

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // 3  -   existence of 1 user and correct token accessed
  test.each([
    {
      idT3Email: 'emma@yahoo.com', idT3Password: 'emmalisa123', idT3Fn: 'emma', idT3Ln: 'lisa',
    },
    {
      idT3Email: 'abcd@yahoo.com', idT3Password: 'abcddcba123', idT3Fn: 'fnfnfnfnfnfn', idT3Ln: 'lnlnlnlnlnln',
    },
  ])('valid token input: one user, correct token', ({
    idT3Email, idT3Password, idT3Fn, idT3Ln,
  }) => {
    const token: string = requestAdminAuthRegister(idT3Email, idT3Password, idT3Fn, idT3Ln).object.token;
    const response = requestAdminUserDetails(token);

    expect(response.object).toStrictEqual(
      {
        user:
          {
            userId: expect.any(Number),
            name: `${idT3Fn} ${idT3Ln}`,
            email: idT3Email,
            numSuccessfulLogins: expect.any(Number),
            numFailedPasswordsSinceLastLogin: expect.any(Number),
          },
      }
    );

    expect(response.status).toStrictEqual(OK);
  });

  // 4  -   existence of multiple users and correct ID accessed
  test('valid AuthUserID input: two users, correct ID', () => {
    requestAdminAuthRegister('emma@yahoo.com', 'emmalisa123', 'emma', 'lisa');
    const token: string = requestAdminAuthRegister('omg123@yahoo.com', 'abcddcba123', 'thisisfirst', 'thisislast').object.token;
    const response = requestAdminUserDetails(token);

    expect(response.object).toStrictEqual(
      {
        user:
          {
            userId: expect.any(Number),
            name: 'thisisfirst thisislast',
            email: 'omg123@yahoo.com',
            numSuccessfulLogins: expect.any(Number),
            numFailedPasswordsSinceLastLogin: expect.any(Number),
          },
      }
    );

    expect(response.status).toStrictEqual(OK);
  });
});

/// ////////////////////////////////////////////////////////////////////////////
/// ////////////////////////ADMIN AUTH LOGOUT///////////////////////////////////
/// ////////////////////////////////////////////////////////////////////////////

describe('adminAuthLogout Test', () => {
  const validEmail = 'asd@gmail.com';
  const validPassword = 'Dancing321';
  const validNameFirst = 'First';
  const validNameLast = 'Last';
  let token: string;
  beforeEach(() => {
    requestClear();
    token = requestAdminAuthRegister(
      validEmail,
      validPassword,
      validNameFirst,
      validNameLast
    ).object.token;
  });

  test.each([
    {
      email: 'iamthelongestemailinthiscase@gmail.com', password: 'andOneOfTheLongestPasswordContainSomeSuchAs13579', nameFirst: 'Also AVeryLongFirstN', nameLast: "And A-Complex'Last'N",
    },
    {
      email: 'andtheshortone@gmail.com', password: 'theShort1', nameFirst: 'FN', nameLast: 'LN',
    },
    {
      email: 'z1234567@ad.unsw.edu.au', password: 'Comp1531STUDENT', nameFirst: 'COMP', nameLast: 'Student',
    },
    {
      email: 'funny@outlook.com', password: '1-Fun^ny&Complex', nameFirst: 'Funny', nameLast: 'OUT',
    },

  ])('Valid logout test', ({
    email, password, nameFirst, nameLast,
  }) => {
    const token = requestAdminAuthRegister(email, password, nameFirst, nameLast).object.token;
    const response = requestAdminAuthLogout(token);
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);
  });

  test('invalid token test', () => {
    const response = requestAdminAuthLogout(token + '1');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('another invalid userid test', () => {
    const response = requestAdminAuthLogout('abc');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('empty test', () => {
    const response = requestAdminAuthLogout('');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('token destory test', () => {
    const detail = requestAdminUserDetails(token);
    const response1 = requestAdminAuthLogout(token);
    expect(response1.object).toStrictEqual({});
    expect(response1.status).toStrictEqual(OK);
    const response2 = requestAdminUserDetails(token);
    expect(response2.object).not.toStrictEqual(detail.object);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).not.toStrictEqual(detail.status);
    expect(response2.status).toStrictEqual(UNAUTHORIZED);
  });
});

// /// ////////////////////////////////////////////////////////////////////////////
// /// ////////////////////ADMIN PASSWORD UPDATE///////////////////////////////////
// /// ////////////////////////////////////////////////////////////////////////////

describe('password update pass test', () => {
  const validEmail = 'asd@gmail.com';
  const validPassword = 'Dancing321';
  const validNameFirst = 'First';
  const validNameLast = 'Last';
  let token: string;
  beforeEach(() => {
    requestClear();
    token = requestAdminAuthRegister(
      validEmail,
      validPassword,
      validNameFirst,
      validNameLast
    ).object.token;
  });

  test.each([
    {
      password: '8WordPas'
    },
    {
      password: 'aNewLonglongLongPa55word!'
    },
    {
      password: 'Norma11yPa55!'
    },
    {
      password: 'AveryVal1dPASSword~'
    },

  ])('More valid test', ({
    password
  }) => {
    const response = requestAdminPasswordUpdate(token, validPassword, password);
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);
  });

  test('new password test', () => {
    const newPassword = '8WordPas';
    requestAdminPasswordUpdate(token, validPassword, newPassword);
    const response1 = requestAdminAuthLogin(validEmail, validPassword);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(BAD_REQUEST);
    const response2 = requestAdminAuthLogin(validEmail, newPassword);
    expect(response2.object).not.toStrictEqual(response1.object);
    expect(response2.object).toStrictEqual({ token: expect.any(String) });
    expect(response2.status).not.toStrictEqual(response1.status);
    expect(response2.status).toStrictEqual(OK);
  });
});

describe('Password Update Error Test', () => {
  const validEmail = 'asd@gmail.com';
  const validPassword = 'Dancing321';
  const validNameFirst = 'First';
  const validNameLast = 'Last';
  const newPassword = 'aNewLonglongLongPa55word!';
  let token: string;
  beforeEach(() => {
    requestClear();
    token = requestAdminAuthRegister(
      validEmail,
      validPassword,
      validNameFirst,
      validNameLast
    ).object.token;
  });
  test.each([
    {
      password: 'Dan2468'
    },
    {
      password: 'Dancing'
    },
    {
      password: '182749237'
    },
  ])('error: invalid password test', ({
    password
  }) => {
    const response = requestAdminPasswordUpdate(token, validPassword, password);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('same old and new password test', () => {
    const response = requestAdminPasswordUpdate(token, validPassword, validPassword);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('used password test', () => {
    requestAdminPasswordUpdate(token, validPassword, newPassword);
    const response = requestAdminPasswordUpdate(token, newPassword, validPassword);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('empty old password test', () => {
    const response = requestAdminPasswordUpdate(token, '', newPassword);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('empty new password test', () => {
    const response = requestAdminPasswordUpdate(token, validPassword, '');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('not match old password test', () => {
    const response = requestAdminPasswordUpdate(token, 'abcdE1234', newPassword);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('another not match password test', () => {
    const response = requestAdminPasswordUpdate(token, newPassword, validPassword);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('invalid token test', () => {
    const response = requestAdminPasswordUpdate(token + '1', newPassword, validPassword);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('another invalid userid test', () => {
    const response = requestAdminPasswordUpdate('abc', newPassword, validPassword);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('empty test', () => {
    const response = requestAdminPasswordUpdate('', newPassword, validPassword);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('all empty test: should return 401 when all params are empty', () => {
    const response = requestAdminPasswordUpdate('', '', '');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });
});

/// ////////////////////////////////////////////////////////////////////////////
/// ////////////////////ADMIN USER DETAIL UPDATE////////////////////////////////
/// ////////////////////////////////////////////////////////////////////////////

describe('details update pass test', () => {
  const validEmail = 'asd@gmail.com';
  const validPassword = 'Dancing321';
  const validNameFirst = 'First';
  const validNameLast = 'Last';
  const newEmail = 'asd@outlook.com';
  let token: string;
  beforeEach(() => {
    requestClear();
    token = requestAdminAuthRegister(
      validEmail,
      validPassword,
      validNameFirst,
      validNameLast
    ).object.token;
  });

  test('First Name Pass Test', () => {
    const response = requestAdminUserDetailsUpdate(
      token,
      newEmail,
      "F'i-r st",
      validNameLast
    );
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);
  });

  test('Last Name Pass Test', () => {
    const response = requestAdminUserDetailsUpdate(
      token,
      newEmail,
      validNameFirst,
      "L'a-s t"
    );
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);
  });

  test.each([
    {
      email: 'iamthelongestemailinthiscase@gmail.com', nameFirst: 'Also AVeryLongFirstN', nameLast: "And A-Complex'Last'N",
    },
    {
      email: 'andtheshortone@gmail.com', nameFirst: 'FN', nameLast: 'LN',
    },
    {
      email: 'z1234567@ad.unsw.edu.au', nameFirst: 'COMP', nameLast: 'Student',
    },
    {
      email: 'funny@outlook.com', nameFirst: 'Funny', nameLast: 'OUT',
    },

  ])('More valid test', ({
    email, nameFirst, nameLast,
  }) => {
    const response = requestAdminUserDetailsUpdate(token, email, nameFirst, nameLast);
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);
  });
});

describe('adminUserDetailsUpdate Empty Test', () => {
  const validEmail = 'asd@gmail.com';
  const validPassword = 'Dancing321';
  const validNameFirst = 'First';
  const validNameLast = 'Last';
  let token: string;
  beforeEach(() => {
    requestClear();
    token = requestAdminAuthRegister(
      validEmail,
      validPassword,
      validNameFirst,
      validNameLast
    ).object.token;
  });

  test.each([
    {
      email: '', nameFirst: validNameFirst, nameLast: validNameLast,
    },
    {
      email: validEmail, nameFirst: '', nameLast: validNameLast,
    },
    {
      email: validEmail, nameFirst: validNameFirst, nameLast: '',
    },
    {
      email: '', nameFirst: '', nameLast: '',
    },

  ])('error: Empty Test', ({
    email, nameFirst, nameLast,
  }) => {
    const response = requestAdminUserDetailsUpdate(token, email, nameFirst, nameLast);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('more empty test: all empty should return 401', () => {
    const response = requestAdminUserDetailsUpdate('', '', '', '');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });
});

describe('adminUserDetailsUpdate Name Error Test', () => {
  const validEmail = 'asd@gmail.com';
  const validPassword = 'Dancing321';
  const validNameFirst = 'First';
  const validNameLast = 'Last';
  let token: string;
  beforeEach(() => {
    requestClear();
    token = requestAdminAuthRegister(
      validEmail,
      validPassword,
      validNameFirst,
      validNameLast
    ).object.token;
  });

  /**
       * First Name Test
       */
  test.each([
    {
      email: validEmail, nameFirst: 'F', nameLast: validNameLast,
    },
    {
      email: validEmail, nameFirst: 'FirstVeryLooooooooogerTest', nameLast: validNameLast,
    },
    {
      email: validEmail, nameFirst: 'Fir~st', nameLast: validNameLast,
    },
    {
      email: validEmail, nameFirst: 'Fir.st', nameLast: validNameLast,
    },
  ])('error: First Name Test', ({
    email, nameFirst, nameLast,
  }) => {
    const response = requestAdminUserDetailsUpdate(token, email, nameFirst, nameLast);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  /**
       * Last Name Test
       */
  test.each([
    {
      email: validEmail,
      nameFirst: validNameFirst,
      nameLast: 'L',
    },
    {
      email: validEmail,
      nameFirst: validNameFirst,
      nameLast: 'LastVeryLooooooooogerTest',
    },
    {
      email: validEmail,
      nameFirst: validNameFirst,
      nameLast: 'La~st',
    },
    {
      email: validEmail,
      nameFirst: validNameFirst,
      nameLast: 'La.st',
    },
  ])('error: Last Name Test', ({
    email, nameFirst, nameLast,
  }) => {
    const response = requestAdminUserDetailsUpdate(token, email, nameFirst, nameLast);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });
});

/**
  * Email Test
  */
describe('adminUserDetailsUpdate Email Error Test', () => {
  const validNameFirst = 'First';
  const validNameLast = 'Last';
  let token: string;
  beforeEach(() => {
    requestClear();
    token = requestAdminAuthRegister('abc@cba.com.au', 'Pass2468word', 'Test-first', "Test'last").object.token;
  });

  test.each([
    {
      email: 'asd'
    },
    {
      email: 'asd@gmail'
    },
    {
      email: 'asd.com'
    },
  ])('error: Email Test', ({
    email
  }) => {
    const response = requestAdminUserDetailsUpdate(token, email, validNameFirst, validNameLast);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('Exist Email Test', () => {
    const existEmail = 'asd@gmail.com';
    requestAdminAuthRegister(existEmail, 'Dancing321', 'First', 'Last');
    const response = requestAdminUserDetailsUpdate(token, existEmail, validNameFirst, validNameFirst);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });
});

describe('AdminUserDetailsUpdate Error Test', () => {
  const validEmail = 'abc@gmail.com';
  const validPassword = 'Dancing321';
  const validNameFirst = 'First';
  const validNameLast = 'Last';
  const newEmail = 'asd@gmail.com';
  let token: string;
  beforeEach(() => {
    requestClear();
    token = requestAdminAuthRegister(
      validEmail,
      validPassword,
      validNameFirst,
      validNameLast
    ).object.token;
  });

  test('invalid token test', () => {
    const response = requestAdminUserDetailsUpdate(token + '1', newEmail, validNameFirst, validNameLast);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('another invalid userid test', () => {
    requestAdminAuthRegister(
      validEmail,
      validPassword,
      validNameFirst,
      validNameLast
    );
    const response = requestAdminUserDetailsUpdate('abc', newEmail, validNameFirst, validNameLast);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('empty test', () => {
    const response = requestAdminUserDetailsUpdate('', newEmail, validNameFirst, validNameLast);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });
});

describe('AdminUserDetailsUpdate Error Test', () => {
  const validEmail = 'abc@gmail.com';
  const validPassword = 'Dancing321';
  const validNameFirst = 'First';
  const validNameLast = 'Last';
  let token: string;
  beforeEach(() => {
    requestClear();
    token = requestAdminAuthRegister(
      validEmail,
      validPassword,
      validNameFirst,
      validNameLast
    ).object.token;
  });

  test('email update successful test', () => {
    const newEmail = 'asd@gmail.com';
    requestAdminUserDetailsUpdate(token, newEmail, validNameFirst, validNameLast);
    const response1 = requestAdminAuthLogin(validEmail, validPassword);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(BAD_REQUEST);
    const response2 = requestAdminAuthLogin(newEmail, validPassword);
    expect(response2.object).not.toStrictEqual(response1.object);
    expect(response2.object).toStrictEqual({ token: expect.any(String) });
    expect(response2.status).not.toStrictEqual(response1.status);
    expect(response2.status).toStrictEqual(OK);
  });

  test('name update successful test', () => {
    const newNameFirst = 'FirstVeryTest';
    const newNameLast = 'LongLong La st';
    const newEmail = 'aNewL0nglongEmail@gmail.com';
    const detail = requestAdminUserDetails(token).object;
    requestAdminUserDetailsUpdate(token, newEmail, newNameFirst, newNameLast);
    const response = requestAdminUserDetails(token);
    expect(response.status).toStrictEqual(OK);
    expect(response.object).not.toStrictEqual(detail);
    const name = `${newNameFirst} ${newNameLast}`;
    expect(response.object).toStrictEqual({
      user: {
        userId: detail.user.userId,
        name,
        email: newEmail,
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0
      }
    });
  });
});
