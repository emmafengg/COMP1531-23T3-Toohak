import {
  requestAdminAuthRegister, requestAdminUserDetails, requestAdminQuizCreate,
  requestAdminQuizList,
  requestRoot,
} from './testfunction';
import { requestClear, requestHelper } from './testfunction';

const ERROR = { error: expect.any(String) };
const OK = 200;
const UNAUTHORIZED = 401;

beforeEach(() => {
  requestClear();
});

// Test for function clear
describe('clear', () => {
  let token: string;
  beforeEach(() => {
    token = requestAdminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella').object.token;
    requestAdminQuizCreate(token, 'Jake', "I'm pretty handsome");
  });

  test('Returns empty object', () => {
    const response = requestClear();
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);
  });

  test('User detail returns error after clear', () => {
    requestClear();
    const response = requestAdminUserDetails(token);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('Quiz list return error after clear', () => {
    requestClear();
    const response = requestAdminQuizList(token);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });
});

describe('404 Not Found', () => {
  test('Should return 404 for undefined route', () => {
    const res = requestHelper('POST', '/undefinedRoute', {});
    expect(res.statusCode).toStrictEqual(404);
  });
  test('Should return 404 for undefined route', () => {
    const res = requestHelper('PUT', '/undefinedRoute', {});
    expect(res.statusCode).toStrictEqual(404);
  });
  test('Should return 404 for undefined route', () => {
    const res = requestHelper('DELETE', '/undefinedRoute', {});
    expect(res.statusCode).toStrictEqual(404);
  });
  test('Should return 404 for undefined route', () => {
    const res = requestHelper('GET', '/undefinedRoute', {});
    expect(res.statusCode).toStrictEqual(404);
  });
});

describe('root test', () => {
  test('test server root', () => {
    expect(requestRoot().statusCode).toBe(OK);
  });
});
