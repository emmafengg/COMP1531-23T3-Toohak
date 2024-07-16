import express, { json, Request, Response } from 'express';
import { echo } from './echo/newecho';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import errorHandler from 'middleware-http-errors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import process from 'process';
import HTTPError from 'http-errors';

import { adminAuthRegister, adminUserDetails, adminAuthLogin, adminAuthLogout, adminUserPasswordUpdate, adminUserDetailsUpdate } from './auth';
import {
  adminQuizList, adminQuizCreate, adminQuizInfo, adminQuizInfoV2, adminQuizNameUpdate, adminQuizDescriptionUpdate,
  adminQuizRemove, adminQuizRemoveRestore, adminQuizViewTrash, adminQuizTrashEmpty, adminQuizTransfer, adminQuizCreateV2,
  adminQuizTransferV2, adminQuizRemoveV2, adminQuizThumbnailUpdate
} from './quiz';
import {
  adminQuizQuestionUpdate, adminQuizCreateQuestion, adminQuizDeleteQuestion, adminQuizQuestionMove,
  adminQuizDuplicateQuestion, adminQuizCreateQuestionV2, adminQuizQuestionUpdateV2
} from './question';
import {
  playerJoin, getPlayerStatus, getPlayerQuestionStatus, playerSendChatMessage, submitPlayerAnswer,
  adminPlayerSessionResult, playerReturnChatMessage, playerQuestionResults
} from './player';
import { TOKEN_INVALID, tokenCheck, forbiddenCheck, FORBIDDEN_ERROR, trashForbiddenCheck, TOKEN_INVALID_STR } from './support';
import {
  adminQuizCreateSession, adminQuizSessionResults, adminQuizSessionResultsCSV, adminQuizSessionStatus,
  adminQuizViewSessions, adminQuizSessionUpdate
} from './session';
import { AdminUserDetailsReturn, AdminTrashQuizzesReturn, EmptyObjectReturn } from './interface';
import { getData, setData } from './dataStore';
import { clear } from './other';

const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));
// for producing the docs that define the API
const file = fs.readFileSync(path.join(process.cwd(), 'swagger.yaml'), 'utf8');

app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
/* istanbul ignore next */
app.use('/docs', sui.serve, sui.setup(YAML.parse(file), { swaggerOptions: { docExpansion: config.expandDocs ? 'full' : 'list' } }));

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || 'localhost';

app.use('/csv', express.static(path.join(__dirname, '../csv')));

// ====================================================================
//  ================= WORK IS DONE BELOW THIS LINE ===================
// ====================================================================

let dataStore = getData();

/**
 * This branch is for data persistance, load data from json and save to data Store.
 * It is working but only can test by manual or whitebox test.
 * It can't test by blackbox test.
 */
/* istanbul ignore next */
if (fs.existsSync('./backup.json')) {
  const dbstr = fs.readFileSync('./backup.json');
  dataStore = JSON.parse(String(dbstr));
  setData(dataStore);
}

const save = () => {
  const jsonstr = JSON.stringify(dataStore);
  fs.writeFileSync('./backup.json', jsonstr);
  setData(dataStore);
};

// Example get request
app.get('/echo', (req: Request, res: Response) => {
  const data = req.query.echo as string;
  return res.json(echo(data));
});

// ====================== ADMIN/AUTH SERVER REQUESTS ========================
// ====================== ADMIN/AUTH SERVER REQUESTS ========================
// ====================== ADMIN/AUTH SERVER REQUESTS ========================
// adminAuthRegister ROUTE
app.post('/v1/admin/auth/register', (req: Request, res: Response) => {
  const { email, password, nameFirst, nameLast } = req.body;
  const response = adminAuthRegister(email, password, nameFirst, nameLast);

  if ('error' in response) {
    // set BAD_REQUEST status for errorCode
    res.status(BAD_REQUEST);
  }

  save();
  return res.json(response);
});

// adminAuthLogin ROUTE
app.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const response = adminAuthLogin(email, password);

  if ('error' in response) {
    // set BAD_REQUEST status for errorCode
    res.status(BAD_REQUEST);
  }
  save();
  return res.json(response);
});

// adminUserDetails ROUTE
app.get('/v1/admin/user/details', (req: Request, res: Response) => {
  const token: string = req.query.token as string;

  // check if token is valid
  if (!tokenCheck(token)) {
    // if invalid return unauthorised status and error string
    res.status(UNAUTHORIZED);
    return res.json(TOKEN_INVALID);
  }

  const response = adminUserDetails(token);
  save();
  return res.json(response);
});

// adminAuthLogout ROUTE
app.post('/v1/admin/auth/logout', (req: Request, res: Response) => {
  const { token } = req.body;
  // error checking invalid token
  if (!tokenCheck(token)) {
    // if token is invalid - return status of 401 and error string
    res.status(UNAUTHORIZED);
    return res.json(TOKEN_INVALID);
  }
  const response = adminAuthLogout(token);

  save();
  return res.json(response);
});

// adminUserPasswordUpdate ROUTE
app.put('/v1/admin/user/password', (req: Request, res: Response) => {
  const { token, oldPassword, newPassword } = req.body;

  // error checking invalid token
  if (!tokenCheck(token)) {
    res.status(UNAUTHORIZED);
    // if token is invalid - return status of 401 and error string
    return res.json(TOKEN_INVALID);
  }

  const response = adminUserPasswordUpdate(token, oldPassword, newPassword);
  if ('error' in response) {
    // set BAD_REQUEST status for errorCode
    res.status(BAD_REQUEST);
  }

  save();
  return res.json(response);
});

// adminUserDetailsUpdate ROUTE
app.put('/v1/admin/user/details', (req: Request, res: Response) => {
  const { token, email, nameFirst, nameLast } = req.body;

  // error checking invalid token
  if (!tokenCheck(token)) {
    // if invalid set status to 401
    res.status(UNAUTHORIZED);
    // return error string
    return res.json(TOKEN_INVALID);
  }

  const response = adminUserDetailsUpdate(token, email, nameFirst, nameLast);

  if ('error' in response) {
    // set BAD_REQUEST status for errorCode
    res.status(BAD_REQUEST);
  }

  save();
  return res.json(response);
});

/// ============================================================================
/// ============================== V2 ==========================================
/// ============================================================================
// adminAuthLogoutV2 ROUTE
app.post('/v2/admin/auth/logout', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  if (!tokenCheck(token)) {
    // if token is invalid - return status of 401 and error string
    throw HTTPError(UNAUTHORIZED, TOKEN_INVALID_STR);
  }
  const response: EmptyObjectReturn = adminAuthLogout(token);

  res.json(response);
});

// adminUserDetailsV2 ROUTE
app.get('/v2/admin/user/details', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  if (!tokenCheck(token)) {
    // if token is invalid - return status of 401 and error string
    throw HTTPError(UNAUTHORIZED, TOKEN_INVALID_STR);
  }
  const response: AdminUserDetailsReturn = adminUserDetails(token);

  res.json(response);
});

// adminUserDetailsUpdateV2 ROUTE
app.put('/v2/admin/user/details', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { email, nameFirst, nameLast } = req.body;

  // error checking invalid token
  if (!tokenCheck(token)) {
    throw HTTPError(UNAUTHORIZED, TOKEN_INVALID_STR);
  }

  const response = adminUserDetailsUpdate(token, email, nameFirst, nameLast);

  if ('error' in response) {
    // set BAD_REQUEST status for errorCode
    throw HTTPError(BAD_REQUEST, response.error);
  }

  res.json(response);
});

// adminUserPasswordUpdateV2 ROUTE
app.put('/v2/admin/user/password', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { oldPassword, newPassword } = req.body;

  // error checking invalid token
  if (!tokenCheck(token)) {
    throw HTTPError(UNAUTHORIZED, TOKEN_INVALID_STR);
  }

  const response = adminUserPasswordUpdate(token, oldPassword, newPassword);

  if ('error' in response) {
    // set BAD_REQUEST status for errorCode
    throw HTTPError(BAD_REQUEST, response.error);
  }

  res.json(response);
});

// ====================== QUIZ SERVER REQUESTS ========================
// ====================== QUIZ SERVER REQUESTS ========================
// ====================== QUIZ SERVER REQUESTS ========================
// adminQuizList ROUTE
app.get('/v1/admin/quiz/list', (req: Request, res: Response) => {
  const token = req.query.token as string;

  // error checking invalid token
  if (!tokenCheck(token)) {
    // if invalid return unauthorised status and error string
    res.status(UNAUTHORIZED);
    return res.json(TOKEN_INVALID);
  }

  const response = adminQuizList(token);

  save();

  res.json(response);
});

// adminQuizCreate ROUTE
app.post('/v1/admin/quiz', (req: Request, res: Response) => {
  // retreiving arguments for quiz create in body
  const { token, name, description } = req.body;

  // error checking invalid token
  if (!tokenCheck(token)) {
    // if invalid return unauthorised status and error string
    res.status(UNAUTHORIZED);
    return res.json(TOKEN_INVALID);
  }
  const response = adminQuizCreate(token, name, description);

  // if an error is thrown, return status with the errorCode
  if ('error' in response) {
    res.status(BAD_REQUEST);
  }

  save();
  // return the response - error string or success
  return res.json(response);
});

// adminQuizNameUpdate ROUTE
app.put('/v1/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  // retreiving arguments for adminQuizNameUpdate in body
  const { token, name } = req.body;

  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    // if invalid return unauthorised status and error string
    res.status(UNAUTHORIZED);
    return res.json(TOKEN_INVALID);
  }

  const quizId: number = parseInt(req.params.quizid);

  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    res.status(FORBIDDEN);
    return res.json(FORBIDDEN_ERROR);
  }

  const response = adminQuizNameUpdate(token, quizId, name);

  // if an error is thrown, return status with thhe errorCode and error message
  if ('error' in response) {
    res.status(BAD_REQUEST);
  }

  save();

  // if no error then return the function return
  return res.json(response);
});

// adminQuizRemove ROUTE
app.delete('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  const token = req.query.token as string;

  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    res.status(UNAUTHORIZED);
    return res.json(TOKEN_INVALID);
  }
  const quizId = parseInt(req.params.quizid);
  // const quiz = quizFindCheck(quizId);
  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    res.status(FORBIDDEN);
    return res.json(FORBIDDEN_ERROR);
  }
  const response = adminQuizRemove(quizId);

  save();

  return res.json(response);
});

// adminQuizViewTrash ROUTE
app.get('/v1/admin/quiz/trash', (req: Request, res: Response) => {
  const token = req.query.token as string;
  // error checking invalid token
  if (!tokenCheck(token)) {
    // if invalid token set status to 401 and return error string
    res.status(UNAUTHORIZED);
    return res.json(TOKEN_INVALID);
  }
  const response = adminQuizViewTrash(token);

  save();

  return res.json(response);
});

// adminQuizTrashEmpty ROUTE
app.delete('/v1/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const token = req.query.token as string;
  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    res.status(UNAUTHORIZED);
    return res.json(TOKEN_INVALID);
  }

  // split array by removing comments and mapping individual ids to new array
  const quizIdArray: number[] = JSON.parse(req.query.quizIds.toString());

  // find if quizid exists in trash and does not belong to user
  const authorizedQuiz = quizIdArray.every(q => {
    return forbiddenCheck(q, user) || trashForbiddenCheck(q, user);
  });

  // if quizId in trash does not belong to user
  if (!authorizedQuiz || quizIdArray.length === 0) {
    // return status 403 error and error msg
    res.status(FORBIDDEN);
    return res.json(FORBIDDEN_ERROR);
  }

  const response = adminQuizTrashEmpty(quizIdArray);
  if ('error' in response) {
    res.status(BAD_REQUEST);
  }

  save();

  return res.json(response);
});

// adminQuizDescriptionUpdate ROUTE
app.put('/v1/admin/quiz/:quizId/description', (req: Request, res: Response) => {
  const { token, description } = req.body;
  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    // if invalid return unauthorised status and error string
    res.status(UNAUTHORIZED);
    return res.json(TOKEN_INVALID);
  }

  const quizId = parseInt(req.params.quizId);

  // const quiz = quizFindCheck(quizId);
  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    // if invalid return unauthorised status and error string
    res.status(FORBIDDEN);
    return res.json(FORBIDDEN_ERROR);
  }

  const response = adminQuizDescriptionUpdate(quizId, description);

  if ('error' in response) {
    // if error found response - set error status to 400
    res.status(BAD_REQUEST);
  }

  save();

  return res.json(response);
});

// adminQuizInfo ROUTE
app.get('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  const token: string = req.query.token as string;

  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    // if user does not exist set status to 401
    res.status(UNAUTHORIZED);
    return res.json(TOKEN_INVALID);
  }

  const quizId: number = parseInt(req.params.quizid);

  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user) && !trashForbiddenCheck(quizId, user)) {
    // if doesn't own set status to 403
    res.status(FORBIDDEN);
    return res.json(FORBIDDEN_ERROR);
  }

  const response = adminQuizInfo(token, quizId);

  save();

  return res.json(response);
});

// adminQuizTransfer ROUTE
app.post('/v1/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  // retreiving arguments for quiz remove restore in body
  const token: string = req.body.token as string;
  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    // if user does not exist set status to 401
    res.status(UNAUTHORIZED);
    return res.json(TOKEN_INVALID);
  }
  const quizId: number = parseInt(req.params.quizid);

  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    // if doesn't own set status to 403
    res.status(FORBIDDEN);
    return res.json(FORBIDDEN_ERROR);
  }

  const userEmail: string = req.body.userEmail as string;
  const response = adminQuizTransfer(token, quizId, userEmail);

  // if an error is thrown, return status with the errorCode and error message
  if ('error' in response) {
    res.status(BAD_REQUEST);
  }

  save();

  // if no error then return the function return
  return res.json(response);
});

// adminQuizRemoveRestore ROUTE
app.post('/v1/admin/quiz/:quizid/restore', (req: Request, res: Response) => {
  // retreiving arguments for quiz remove restore in body
  const token: string = req.body.token as string;
  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    // if user cannot be found set status to 401 and return error msg
    res.status(UNAUTHORIZED);
    return res.json(TOKEN_INVALID);
  }

  const quizId: number = parseInt(req.params.quizid);

  // error if quiz does not belong to user
  if (!trashForbiddenCheck(quizId, user) && !forbiddenCheck(quizId, user)) {
    res.status(FORBIDDEN);
    return res.json(FORBIDDEN_ERROR);
  }

  const response = adminQuizRemoveRestore(token, quizId);

  // if an error is thrown, return status with the errorCode and error message
  if ('error' in response) {
    res.status(BAD_REQUEST);
  }

  save();

  // if no error then return the function return
  return res.json(response);
});

/// ============================================================================
/// ============================== V2 ==========================================
/// ============================================================================
// adminQuizCreateV2 ROUTE
app.post('/v2/admin/quiz', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { name, description } = req.body;

  if (!tokenCheck(token)) {
    throw HTTPError(UNAUTHORIZED, 'Token is invalid');
  }
  const response = adminQuizCreateV2(token, name, description);

  if ('error' in response) {
    throw HTTPError(BAD_REQUEST, 'invalid request made');
  }

  save();

  return res.json(response);
});

// adminQuizDescriptionUpdateV2 ROUTE
app.put('/v2/admin/quiz/:quizid/description', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { description } = req.body;
  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    throw HTTPError(UNAUTHORIZED, 'Token is invalid');
  }
  const quizId = parseInt(req.params.quizid);

  // const quiz = quizFindCheck(quizId);
  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    throw HTTPError(FORBIDDEN, 'Quiz does not belong to the user');
  }

  const response = adminQuizDescriptionUpdate(quizId, description);

  if ('error' in response) {
    // if error found response - set error status to 400
    throw HTTPError(BAD_REQUEST, response.error);
  }

  save();

  return res.json(response);
});

// adminQuizRemoveV2 ROUTE
app.delete('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  if (!token) {
    throw HTTPError(UNAUTHORIZED, 'Token is empty');
  }
  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    throw HTTPError(UNAUTHORIZED, 'Token is invalid');
  }

  const quizId = parseInt(req.params.quizid);
  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    throw HTTPError(FORBIDDEN, 'Quiz does not belong to the user');
  }
  const response = adminQuizRemoveV2(quizId);

  if ('error' in response) {
    throw HTTPError(BAD_REQUEST, 'invalid request made');
  }

  save();

  return res.json(response);
});

// adminQuizRemoveRestoreV2 ROUTE
app.post('/v2/admin/quiz/:quizid/restore', (req: Request, res: Response) => {
  // retreiving arguments for quiz remove restore in body
  const token: string = req.headers.token as string;
  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    // if user cannot be found set status to 401 and return error msg
    throw HTTPError(UNAUTHORIZED, 'token is invalid');
  }

  const quizId: number = parseInt(req.params.quizid);

  // error if quiz does not belong to user
  if (!trashForbiddenCheck(quizId, user) && !forbiddenCheck(quizId, user)) {
    throw HTTPError(FORBIDDEN, 'quiz does not belong to the user');
  }

  const response = adminQuizRemoveRestore(token, quizId);

  // if an error is thrown, return status with error status 400
  if ('error' in response) {
    throw HTTPError(BAD_REQUEST, response.error);
  }

  // if no error then return the function return
  return res.json(response);
});

// adminQuizViewTrashV2 ROUTE
app.get('/v2/admin/quiz/trash', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  // error checking invalid token
  try {
    if (!tokenCheck(token)) {
      throw HTTPError(UNAUTHORIZED, TOKEN_INVALID_STR);
    }
    const response: AdminTrashQuizzesReturn = adminQuizViewTrash(token);
    res.json(response);
  } catch (e) {
    res.status(e.statusCode).json({ error: e.message });
  }
});

// adminQuizTrashEmptyV2 ROUTE
app.delete('/v2/admin/quiz/trash/empty', (req, res) => {
  const token = req.headers.token as string;
  const user = tokenCheck(token);

  // Check for empty token or quizIds
  if (!user) {
    throw HTTPError(UNAUTHORIZED, TOKEN_INVALID_STR);
  }

  const quizIdArray: number[] = JSON.parse(req.query.quizIds.toString());
  const authorizedQuiz = quizIdArray.every(q => {
    return forbiddenCheck(q, user) !== undefined || trashForbiddenCheck(q, user) !== undefined;
  });

  // if quizId in trash does not belong to user
  if (!authorizedQuiz || quizIdArray.length === 0) {
    // return status 403 error and error msg
    throw HTTPError(FORBIDDEN, 'Quiz does not belong to the user');
  }

  const response = adminQuizTrashEmpty(quizIdArray);
  if ('error' in response) {
    throw HTTPError(BAD_REQUEST, response.error);
  }
  save();

  return res.json(response);
});

// ==================== QUESTION SERVER REQUESTS ========================
// ==================== QUESTION SERVER REQUESTS ========================
// ==================== QUESTION SERVER REQUESTS ========================
// adminQuizCreateQuestion ROUTE
app.post('/v1/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const { token, questionBody } = req.body;
  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    // if token does not exist
    res.status(UNAUTHORIZED);
    return res.json(TOKEN_INVALID);
  }
  const quizId: number = parseInt(req.params.quizid);
  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    // if user does not own quiz - set status to 403
    res.status(FORBIDDEN);
    return res.json(FORBIDDEN_ERROR);
  }

  const response = adminQuizCreateQuestion(quizId, questionBody);

  // if an error is returned, return status with the errorCode and error message
  if ('error' in response) {
    res.status(BAD_REQUEST);
  }

  save();

  return res.json(response);
});

// adminQuizDeleteQuestion ROUTE
app.delete('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const token = req.query.token as string;
  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    // if token does not exist
    res.status(UNAUTHORIZED);
    return res.json(TOKEN_INVALID);
  }
  const quizId: number = parseInt(req.params.quizid);
  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    // if user does not own quiz - set status to 403
    res.status(FORBIDDEN);
    return res.json(FORBIDDEN_ERROR);
  }

  const questionId: number = parseInt(req.params.questionid);
  const response = adminQuizDeleteQuestion(quizId, questionId);

  // if an error is returned, return status with the errorCode and error message
  if ('error' in response) {
    res.status(BAD_REQUEST);
  }

  save();

  return res.json(response);
});

// adminQuizQuestionUpdate ROUTE
app.put('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const { token, questionBody } = req.body;
  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    // if token does not exist
    res.status(UNAUTHORIZED);
    return res.json(TOKEN_INVALID);
  }
  const quizId: number = parseInt(req.params.quizid);
  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    // if user does not own quiz - set status to 403
    res.status(FORBIDDEN);
    return res.json(FORBIDDEN_ERROR);
  }

  const questionId: number = parseInt(req.params.questionid);
  const response = adminQuizQuestionUpdate(quizId, questionId, questionBody);
  // if an error is returned, return status with the errorCode and error message
  if ('error' in response) {
    res.status(BAD_REQUEST);
  }

  save();

  return res.json(response);
});

// adminQuizQuestionMove ROUTE
app.put('/v1/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response) => {
  const token: string = req.body.token;
  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    // if token does not exist
    res.status(UNAUTHORIZED);
    return res.json(TOKEN_INVALID);
  }
  const quizId = parseInt(req.params.quizid);
  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    // if user does not own quiz - set status to 403
    res.status(FORBIDDEN);
    return res.json(FORBIDDEN_ERROR);
  }

  const questionId = parseInt(req.params.questionid);
  const newPosition: number = req.body.newPosition;

  const response = adminQuizQuestionMove(token, quizId, questionId, newPosition);

  // if an error is returned, return status with the errorCode and error message
  if ('error' in response) {
    res.status(BAD_REQUEST);
  }

  save();

  return res.json(response);
});

// adminQuizDuplicateQuestion function
app.post('/v1/admin/quiz/:quizid/question/:questionid/duplicate', (req: Request, res: Response) => {
  const { token } = req.body;
  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    res.status(UNAUTHORIZED);
    return res.json(TOKEN_INVALID);
  }
  const quizId: number = parseInt(req.params.quizid);
  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    res.status(FORBIDDEN);
    return res.json(FORBIDDEN_ERROR);
  }

  const questionId: number = parseInt(req.params.questionid);
  const response = adminQuizDuplicateQuestion(quizId, questionId);

  // if an error is returned, return status with the errorCode and error message
  if ('error' in response) {
    res.status(BAD_REQUEST);
  }

  save();

  return res.json(response);
});

/// ============================================================================
/// ============================== V2 ==========================================
/// ============================================================================
// adminQuizCreateQuestionV2 ROUTE
app.post('/v2/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { questionBody } = req.body;

  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    // if token does not exist
    throw HTTPError(UNAUTHORIZED, 'Token is invalid');
  }

  const quizId: number = parseInt(req.params.quizid);
  // const quiz = quizFindCheck(quizId);
  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    throw HTTPError(FORBIDDEN, 'Quiz does not belong to the user');
  }

  const response = adminQuizCreateQuestionV2(quizId, questionBody);

  if ('error' in response) {
    // if error found response - set error status to 400
    throw HTTPError(BAD_REQUEST, response.error);
  }

  save();

  return res.json(response);
});

// adminQuizDeleteQuestionV2 ROUTE
app.delete('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const token = req.headers.token as string;

  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    // if token does not exist
    throw HTTPError(UNAUTHORIZED, 'Token is invalid');
  }

  const quizId: number = parseInt(req.params.quizid);
  // const quiz = quizFindCheck(quizId);
  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    throw HTTPError(FORBIDDEN, 'Quiz does not belong to the user');
  }

  const questionId: number = parseInt(req.params.questionid);
  const response = adminQuizDeleteQuestion(quizId, questionId);

  if ('error' in response) {
    // if error found response - set error status to 400
    throw HTTPError(BAD_REQUEST, response.error);
  }

  save();

  return res.json(response);
});

// adminQuizListV2 ROUTE
app.get('/v2/admin/quiz/list', (req: Request, res: Response) => {
  const token = req.headers.token as string;

  // error checking invalid token
  if (!tokenCheck(token)) {
    throw HTTPError(UNAUTHORIZED, TOKEN_INVALID);
  }

  const response = adminQuizList(token);

  res.json(response);
});

// adminQuizNameUpdate ROUTE
app.put('/v2/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { name } = req.body;

  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    throw HTTPError(UNAUTHORIZED, TOKEN_INVALID);
  }

  const quizId: number = parseInt(req.params.quizid);

  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    throw HTTPError(FORBIDDEN, FORBIDDEN_ERROR);
  }

  const response = adminQuizNameUpdate(token, quizId, name);

  // if an error is thrown, return status with thhe errorCode and error message
  if ('error' in response) {
    throw HTTPError(BAD_REQUEST, response.error);
  }

  // if no error then return the function return
  return res.json(response);
});

// adminQuizQuestionUpdateV2 ROUTE
app.put('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { questionBody } = req.body;

  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    throw HTTPError(UNAUTHORIZED, TOKEN_INVALID);
  }

  const quizId: number = parseInt(req.params.quizid);

  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    throw HTTPError(FORBIDDEN, FORBIDDEN_ERROR);
  }

  const questionId: number = parseInt(req.params.questionid);
  const response = adminQuizQuestionUpdateV2(quizId, questionId, questionBody);

  // if an error is returned, return status with the errorCode and error message
  if ('error' in response) {
    throw HTTPError(BAD_REQUEST, response.error);
  }

  return res.json(response);
});

// adminQuizDuplicateQuestionV2 ROUTE
app.post('/v2/admin/quiz/:quizid/question/:questionid/duplicate', (req: Request, res: Response) => {
  const token = req.headers.token as string;

  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    throw HTTPError(UNAUTHORIZED, TOKEN_INVALID);
  }

  const quizId: number = parseInt(req.params.quizid);

  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    throw HTTPError(FORBIDDEN, FORBIDDEN_ERROR);
  }

  const questionId: number = parseInt(req.params.questionid);
  const response = adminQuizDuplicateQuestion(quizId, questionId);

  // if an error is returned, return status with the errorCode and error message
  if ('error' in response) {
    throw HTTPError(BAD_REQUEST, response.error);
  }

  return res.json(response);
});

// adminQuizInfoV2 ROUTE
app.get('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  const token: string = req.headers.token as string;

  // error checking invalid token
  const user = tokenCheck(token);

  if (!user) {
    // if user does not exist set status to 401
    throw HTTPError(UNAUTHORIZED, 'token is invalid');
  }

  const quizId: number = parseInt(req.params.quizid);

  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user) && !trashForbiddenCheck(quizId, user)) {
    // if doesn't own set status to 403
    throw HTTPError(FORBIDDEN, 'quiz does not belong to the user');
  }

  const response = adminQuizInfoV2(token, quizId);

  return res.json(response);
});

// adminQuizTransferV2 ROUTE
app.post('/v2/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  // retreiving arguments for quiz remove restore in body
  const token: string = req.headers.token as string;
  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    // if user does not exist set status to 401
    throw HTTPError(UNAUTHORIZED, 'token is invalid');
  }
  const quizId: number = parseInt(req.params.quizid);

  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    // if doesn't own set status to 403
    throw HTTPError(FORBIDDEN, 'quiz does not belong to the user');
  }

  const userEmail: string = req.body.userEmail as string;
  const response = adminQuizTransferV2(token, quizId, userEmail);

  // if an error is thrown, return status with the errorCode and error message
  if ('error' in response) {
    throw HTTPError(BAD_REQUEST, response.error);
  }

  // if no error then return the function return
  return res.json(response);
});

// adminQuizQuestionMoveV2 ROUTE
// implementation from v1 to v2 is the same (adminQuizQuestionMove)
app.put('/v2/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response) => {
  const token: string = req.headers.token as string;
  // error checking invalid token
  const user = tokenCheck(token);
  if (!user) {
    // if token does not exist
    throw HTTPError(UNAUTHORIZED, 'token is invalid');
  }
  const quizId = parseInt(req.params.quizid);
  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    // if user does not own quiz - set status to 403
    throw HTTPError(FORBIDDEN, 'quiz does not belong to the user');
  }

  const questionId = parseInt(req.params.questionid);
  const newPosition: number = req.body.newPosition;

  const response = adminQuizQuestionMove(token, quizId, questionId, newPosition);

  // if an error is returned, return status with the errorCode and error message
  if ('error' in response) {
    throw HTTPError(BAD_REQUEST, response.error);
  }

  save();

  return res.json(response);
});

// ========================== SESSION ROUTES  ==================================
// ========================== SESSION ROUTES  ==================================
// ========================== SESSION ROUTES  ==================================
// adminQuizCreateSession ROUTE
app.post('/v1/admin/quiz/:quizid/session/start', (req: Request, res: Response) => {
  const token: string = req.headers.token as string;

  const user = tokenCheck(token);
  if (!user) {
    // if token does not exist
    throw HTTPError(UNAUTHORIZED, 'token is invalid');
  }

  const quizId = parseInt(req.params.quizid);
  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    // if user does not own quiz - set status to 403
    throw HTTPError(FORBIDDEN, 'quiz does not belong to the user');
  }

  const autoStartNum = req.body.autoStartNum;

  const response = adminQuizCreateSession(quizId, autoStartNum);

  save();

  return res.json(response);
});

// adminQuizSessionStatus ROUTE
app.get('/v1/admin/quiz/:quizid/session/:sessionid', (req: Request, res: Response) => {
  const token: string = req.headers.token as string;

  const user = tokenCheck(token);
  if (!user) {
    // if token does not exist
    throw HTTPError(UNAUTHORIZED, 'token is invalid');
  }

  const quizId = parseInt(req.params.quizid);
  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    // if user does not own quiz - set status to 403
    throw HTTPError(FORBIDDEN, 'quiz does not belong to the user');
  }

  const sessionId = parseInt(req.params.sessionid);
  const response = adminQuizSessionStatus(quizId, sessionId);

  save();
  return res.json(response);
});

// adminQuizSessionResults ROUTE
app.get('/v1/admin/quiz/:quizid/session/:sessionid/results', (req: Request, res: Response) => {
  const token: string = req.headers.token as string;

  const user = tokenCheck(token);
  if (!user) {
    // if token does not exist
    throw HTTPError(UNAUTHORIZED, 'token is invalid');
  }

  const quizId = parseInt(req.params.quizid);
  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    // if user does not own quiz - set status to 403
    throw HTTPError(FORBIDDEN, 'quiz does not belong to the user');
  }

  const sessionId = parseInt(req.params.sessionid);
  const response = adminQuizSessionResults(quizId, sessionId);

  save();
  return res.json(response);
});

// adminQuizSessionResultsCSV ROUTE
app.get('/v1/admin/quiz/:quizid/session/:sessionid/results/csv', (req: Request, res: Response) => {
  const token: string = req.headers.token as string;

  const user = tokenCheck(token);
  if (!user) {
    // if token does not exist
    throw HTTPError(UNAUTHORIZED, 'token is invalid');
  }

  const quizId = parseInt(req.params.quizid);
  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    // if user does not own quiz - set status to 403
    throw HTTPError(FORBIDDEN, 'quiz does not belong to the user');
  }

  const sessionId = parseInt(req.params.sessionid);
  const response = adminQuizSessionResultsCSV(quizId, sessionId);

  save();
  return res.json(response);
});

// adminQuizViewSessions ROUTE
app.get('/v1/admin/quiz/:quizid/sessions', (req: Request, res: Response) => {
  const token: string = req.headers.token as string;

  const user = tokenCheck(token);
  if (!user) {
    // if token does not exist
    throw HTTPError(UNAUTHORIZED, 'token is invalid');
  }

  const quizId = parseInt(req.params.quizid);
  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    // if user does not own quiz - set status to 403
    throw HTTPError(FORBIDDEN, 'quiz does not belong to the user');
  }

  const response = adminQuizViewSessions(quizId);

  save();
  return res.json(response);
});

// adminQuizSessionUpdate ROUTE
app.put('/v1/admin/quiz/:quizid/session/:sessionid', (req: Request, res: Response) => {
  const token: string = req.headers.token as string;

  const user = tokenCheck(token);
  if (!user) {
    // if token does not exist
    throw HTTPError(UNAUTHORIZED, 'token is invalid');
  }

  const quizId = parseInt(req.params.quizid);
  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    // if user does not own quiz - set status to 403
    throw HTTPError(FORBIDDEN, 'quiz does not belong to the user so user no authorised to modify session');
  }

  const sessionId = parseInt(req.params.sessionid);
  const action = req.body.action as string;
  const response = adminQuizSessionUpdate(quizId, sessionId, action);

  save();
  return res.json(response);
});

// ======================== OTHER ITERATION 3 ROUTES  ==============================
// update thumbnail
app.put('/v1/admin/quiz/:quizid/thumbnail', (req: Request, res: Response) => {
  const token: string = req.headers.token as string;
  const { imgUrl } = req.body;

  const user = tokenCheck(token);
  if (!user) {
    // if token does not exist
    throw HTTPError(UNAUTHORIZED, 'token is invalid');
  }

  const quizId = parseInt(req.params.quizid);
  // error if quiz does not belong to user
  if (!forbiddenCheck(quizId, user)) {
    // if user does not own quiz - set status to 403
    throw HTTPError(FORBIDDEN, 'quiz does not belong to the user');
  }

  const response = adminQuizThumbnailUpdate(quizId, imgUrl);

  // if an error is returned, return status with the errorCode and error message
  if ('error' in response) {
    throw HTTPError(BAD_REQUEST, response.error);
  }

  // if no error then return the function return
  save();
  return res.json(response);
});

// ===========================    PLAYER    ==================================
// playerJoin function
app.post('/v1/player/join', (req: Request, res: Response) => {
  const { sessionId, name } = req.body;

  return res.json(playerJoin(sessionId, name));
});

// playerStatus function
app.get('/v1/player/:playerid', (req, res) => {
  const playerId = parseInt(req.params.playerid);
  return res.json(getPlayerStatus(playerId));
});

// playerQuestionStatus function
app.get('/v1/player/:playerid/question/:questionposition', (req, res) => {
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);

  const response = getPlayerQuestionStatus(playerId, questionPosition);
  save();
  return res.json(response);
});

// playerSendChatMessage function
app.post('/v1/player/:playerid/chat', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const { message } = req.body;

  const response = playerSendChatMessage(playerId, message);
  return res.json(response);
});

// playerReturnChatMessage function
app.get('/v1/player/:playerid/chat', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);

  const response = playerReturnChatMessage(playerId);
  return res.json(response);
});

// adminPlayerSessionResult function
app.get('/v1/player/:playerid/results', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const response = adminPlayerSessionResult(playerId);

  save();
  return res.json(response);
});

// playerQuestionAnswer function
app.put('/v1/player/:playerid/question/:questionposition/answer', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);
  const { answerIds } = req.body;
  const response = submitPlayerAnswer(playerId, questionPosition, answerIds);
  save();
  return res.json(response);
});
// ====================== OTHER SERVER REQUESTS ========================
app.delete('/v1/clear', (req: Request, res: Response) => {
  const response = clear();

  save();

  return res.json(response);
});

app.get('/v1/player/:playerid/question/:questionposition/results', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);

  const response = playerQuestionResults(playerId, questionPosition);
  save();

  return res.json(response);
});

// ====================================================================
//  ================= WORK IS DONE ABOVE THIS LINE ===================
// ====================================================================

app.use((req: Request, res: Response) => {
  const error = `
    404 Not found - This could be because:
      0. You have defined routes below (not above) this middleware in server.ts
      1. You have not implemented the route ${req.method} ${req.path}
      2. There is a typo in either your test or server, e.g. /posts/list in one
         and, incorrectly, /post/list in the other
      3. You are using ts-node (instead of ts-node-dev) to start your server and
         have forgotten to manually restart to load the new changes
      4. You've forgotten a leading slash (/), e.g. you have posts/list instead
         of /posts/list in your server.ts or test file
  `;
  res.status(404).json({ error });
});

// For handling errors
app.use(errorHandler());

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => console.log('Shutting down server gracefully.'));
});
