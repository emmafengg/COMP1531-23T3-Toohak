import { requestAdminAuthLogin, requestAdminAuthLogoutV2, requestAdminAuthRegister, requestAdminPasswordUpdateV2, requestAdminUserDetailsUpdateV2, requestAdminUserDetailsV2, requestClear } from './testfunction';

const ERROR = { error: expect.any(String) };
const OK = 200;
const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;

beforeEach(() => {
  requestClear();
});

describe('POST /v2/admin/auth/logout tests', () => {
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

  test('Successful logout', () => {
    const response = requestAdminAuthLogoutV2(token);

    expect(response.object).toStrictEqual({});
    expect(response.status).toEqual(OK);
  });

  test('Logout twice', () => {
    requestAdminAuthLogoutV2(token);
    const response = requestAdminAuthLogoutV2(token);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toEqual(UNAUTHORIZED);
  });

  test('Invalid token', () => {
    const response = requestAdminAuthLogoutV2(token + '1');

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toEqual(UNAUTHORIZED);
  });

  test('Empty token', () => {
    const response = requestAdminAuthLogoutV2('');

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toEqual(UNAUTHORIZED);
  });
});

describe('GET /v2/admin/user/details tests', () => {
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

  test('Successful get details', () => {
    const name = `${validNameFirst} ${validNameLast}`;
    const response = requestAdminUserDetailsV2(token);

    expect(response.object).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name,
        email: validEmail,
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0
      }
    });
    expect(response.status).toEqual(OK);
  });

  test('Successful get details, fail login twice', () => {
    requestAdminAuthLogin(validEmail, '');
    requestAdminAuthLogin(validEmail, validPassword + 'a');

    const name = `${validNameFirst} ${validNameLast}`;
    const response = requestAdminUserDetailsV2(token);

    expect(response.object).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name,
        email: validEmail,
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 2
      }
    });
    expect(response.status).toEqual(OK);
  });

  test('Successful get details, successful login after fail login', () => {
    const login = requestAdminUserDetailsV2('');

    expect(login.object).toStrictEqual(ERROR);
    expect(login.status).toEqual(UNAUTHORIZED);
    requestAdminUserDetailsV2('');
    const token2 = requestAdminAuthLogin(validEmail, validPassword).object.token;

    const name = `${validNameFirst} ${validNameLast}`;
    const response = requestAdminUserDetailsV2(token);

    expect(response.object).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name,
        email: validEmail,
        numSuccessfulLogins: 2,
        numFailedPasswordsSinceLastLogin: 0
      }
    });
    expect(response.status).toEqual(OK);

    const response2 = requestAdminUserDetailsV2(token2);

    expect(response2.object).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name,
        email: validEmail,
        numSuccessfulLogins: 2,
        numFailedPasswordsSinceLastLogin: 0
      }
    });
    expect(response2.status).toEqual(OK);
  });

  test('Invalid token', () => {
    const response = requestAdminUserDetailsV2(token + '1');

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toEqual(UNAUTHORIZED);
  });
});

describe('PUT /v2/admin/user/details', () => {
  const validEmail = 'asd@gmail.com';
  const validPassword = 'Dancing321';
  const validNameFirst = 'First';
  const validNameLast = 'Last';
  const newEmail = 'asd@outlook.com';
  const newNameFirst = 'New first';
  const newNameLast = 'New last';
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

  test('Invalid token', () => {
    const response = requestAdminUserDetailsUpdateV2(token + '1', newEmail, newNameFirst, newNameLast);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toEqual(UNAUTHORIZED);
  });

  test('Empty token and details', () => {
    const response = requestAdminUserDetailsUpdateV2('', '', '', '');

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toEqual(UNAUTHORIZED);
  });

  test('Invalid email', () => {
    const response = requestAdminUserDetailsUpdateV2(token, 'newEmail', newNameFirst, newNameLast);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toEqual(BAD_REQUEST);
  });

  test('Exist email', () => {
    requestAdminAuthRegister(newEmail, validPassword, newNameFirst, newNameLast);
    const response = requestAdminUserDetailsUpdateV2(token, newEmail, newNameFirst, newNameLast);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toEqual(BAD_REQUEST);
  });

  test('Invalid first name length', () => {
    const response = requestAdminUserDetailsUpdateV2(token, newEmail, 'toolonglonglonglonglongname more than 20', newNameLast);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toEqual(BAD_REQUEST);
  });

  test('Invalid first name type', () => {
    const response = requestAdminUserDetailsUpdateV2(token, newEmail, 'New.na,me', newNameLast);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toEqual(BAD_REQUEST);
  });

  test('Invalid last name length', () => {
    const response = requestAdminUserDetailsUpdateV2(token, newEmail, newNameFirst, 'toolonglonglonglonglongname more than 20');

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toEqual(BAD_REQUEST);
  });

  test('Invalid last name type', () => {
    const response = requestAdminUserDetailsUpdateV2(token, newEmail, newNameFirst, 'New.na,me');

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toEqual(BAD_REQUEST);
  });

  test('Successful update with same email', () => {
    const response = requestAdminUserDetailsUpdateV2(token, validEmail, newNameFirst, newNameLast);

    expect(response.object).toStrictEqual({});
    expect(response.status).toEqual(OK);

    const result = requestAdminUserDetailsV2(token);
    const name = `${newNameFirst} ${newNameLast}`;

    expect(result.object).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name,
        email: validEmail,
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0
      }
    });
    expect(result.status).toEqual(OK);
  });

  test('Successful update only email', () => {
    const response = requestAdminUserDetailsUpdateV2(token, newEmail, validNameFirst, validNameLast);

    expect(response.object).toStrictEqual({});
    expect(response.status).toEqual(OK);

    const result = requestAdminUserDetailsV2(token);
    const name = `${validNameFirst} ${validNameLast}`;

    expect(result.object).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name,
        email: newEmail,
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0
      }
    });
    expect(result.status).toEqual(OK);
  });

  test('Successful update all', () => {
    const response = requestAdminUserDetailsUpdateV2(token, newEmail, newNameFirst, newNameLast);

    expect(response.object).toStrictEqual({});
    expect(response.status).toEqual(OK);

    const result = requestAdminUserDetailsV2(token);
    const name = `${newNameFirst} ${newNameLast}`;

    expect(result.object).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name,
        email: newEmail,
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0
      }
    });
    expect(result.status).toEqual(OK);
  });
});

describe('PUT /v2/admin/user/password', () => {
  const validEmail = 'asd@gmail.com';
  const validPassword = 'Dancing321';
  const validNameFirst = 'First';
  const validNameLast = 'Last';
  const newPassword = 'Test0FnewPa55';
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

  test('Invalid token', () => {
    const response = requestAdminPasswordUpdateV2(token + '1', validPassword, newPassword);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toEqual(UNAUTHORIZED);
  });

  test('Empty token and details', () => {
    const response = requestAdminPasswordUpdateV2('', '', '');

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toEqual(UNAUTHORIZED);
  });

  test('Wrong old password', () => {
    const response = requestAdminPasswordUpdateV2(token, 'invalidpass', newPassword);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toEqual(BAD_REQUEST);
  });

  test('Same new and old password', () => {
    const response = requestAdminPasswordUpdateV2(token, validPassword, validPassword);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toEqual(BAD_REQUEST);
  });

  test('Invalid new password, too short', () => {
    const response = requestAdminPasswordUpdateV2(token, validPassword, '2short');

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toEqual(BAD_REQUEST);
  });

  test('Invalid new password, doesnt have number', () => {
    const response = requestAdminPasswordUpdateV2(token, validPassword, 'tooshort');

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toEqual(BAD_REQUEST);
  });

  test('Fail to update with used password', () => {
    requestAdminPasswordUpdateV2(token, validPassword, newPassword);
    const response = requestAdminPasswordUpdateV2(token, newPassword, validPassword);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toEqual(BAD_REQUEST);
  });

  test('Successful update', () => {
    const response = requestAdminPasswordUpdateV2(token, validPassword, newPassword);

    expect(response.object).toStrictEqual({});
    expect(response.status).toEqual(OK);
  });

  test('Successful login with new password after update', () => {
    const response = requestAdminPasswordUpdateV2(token, validPassword, newPassword);

    expect(response.object).toStrictEqual({});
    expect(response.status).toEqual(OK);

    const newLogin = requestAdminAuthLogin(validEmail, newPassword);

    expect(newLogin.object).toStrictEqual({ token: expect.any(String) });
    expect(newLogin.status).toEqual(OK);

    const newToken = newLogin.object.token;
    const result = requestAdminUserDetailsV2(newToken);

    const name = `${validNameFirst} ${validNameLast}`;

    expect(result.object).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name,
        email: validEmail,
        numSuccessfulLogins: 2,
        numFailedPasswordsSinceLastLogin: 0
      }
    });
    expect(result.status).toEqual(OK);
  });

  test('Fail login with old password after update', () => {
    const response = requestAdminPasswordUpdateV2(token, validPassword, newPassword);

    expect(response.object).toStrictEqual({});
    expect(response.status).toEqual(OK);

    const newLogin = requestAdminAuthLogin(validEmail, validPassword);

    expect(newLogin.object).toStrictEqual(ERROR);
    expect(newLogin.status).toEqual(BAD_REQUEST);
  });
});
