import validator from 'validator';
import { v4 as uuidv4 } from 'uuid';
import { getData, setData } from './dataStore';
import { CreateQuestionInput, Question, Quiz, ResultCSVInfo, SessionQuiz, User, SessionAction, PlayerAnswerRecord, PlayerScore } from './interface';
import sha256 from 'sha256';
import fs from 'fs';
import path from 'path';

export const NAME_FIRST_ERROR = { error: 'nameFirst contains invalid characters' };
export const NAME_LAST_ERROR = { error: 'nameLast contains invalid characters' };
export const NAME_FIRST_LENGTH_ERROR = { error: 'nameFirst is not between 2-20 characters' };
export const NAME_LAST_LENGTH_ERROR = { error: 'nameLast is not between 2-20 characters' };
export const PASSWORD_ERROR = { error: 'password needs one number and at least one letter' };
export const PASSWORD_LENGTH_ERROR = { error: 'password less than 8 characters' };
export const EMAIL_INVALID = { error: 'invalid email address' };
export const EMAIL_EXIST = { error: 'email already used' };
export const TOKEN_INVALID = { error: 'Token is invalid' };

export const QUIZ_NAME_ERROR = { error: 'quiz name contains invalid characters' };
export const QUIZ_NAME_LENGTH_ERROR = { error: 'length of name is invalid' };
export const QUIZ_DESCRIPTION_ERROR = { error: 'description is too long' };
export const QUIZID_ERROR = { error: 'Quiz ID does not refer to a valid quiz' };
export const FORBIDDEN_ERROR = { error: 'Quiz does not belong to the user' };

export const QUESTION_LENGTH_ERROR = { error: 'invalid question length' };
export const QUESTION_ANSWER_LENGTH_ERROR = { error: 'invalid number of answers' };
export const QUESTION_DURATION_ERROR = { error: 'invalid question duration' };
export const QUIZ_DURATION_EXCEED_ERROR = { error: 'total quiz duration exceeds 3 minutes' };
export const QUESTION_POINTS_ERROR = { error: 'invalid point allocation - needs to be between 1-10' };
export const QUESTION_ANSWER_INVALID = { error: 'invalid answer length' };
export const QUESTION_ANSWER_DUPLICATE_ERROR = { error: 'duplicate answers' };
export const QUESTION_NO_CORRECT_ANSWER_ERROR = { error: 'no correct answers found' };
export const QUESTION_NOT_EXIST_ERROR = { error: 'question does not belong/does not exist' };
export const THUMBNAIL_EMPTY_ERROR = { error: 'thumbnailUrl is an empty string' };
export const THUMBNAIL_INVALID_FILE_ERROR = { error: 'thumbnailUrl does not return to a valid file' };
export const THUMBNAIL_INVALID_TYPE_ERROR = { error: 'thumbnailUrl is not a JPG or PNG file type' };
export const THUMBNAIL_INVALID_ERROR = { error: 'thumbnailUrl is not valid' };
export const SESSION_NOT_END_ERROR = { error: 'some session not in END state' };

export const TOKEN_INVALID_STR = 'Token is invalid';

/**
 * Support function use to create and return token
 * - no parameters
 * @returns {string} - new token for user
 */
export function createToken(): string {
  const token = uuidv4();
  return token;
}

/**
 * Generates and returns a random color from a predefined list of colors.
 *
 * @returns {string} - A randomly selected color (e.g., 'Red', 'Blue', 'Yellow', etc.).
 */
export function randomColour(): string {
  const colours = ['red', 'blue', 'green', 'yellow', 'purple', 'brown', 'orange'];

  return colours[Math.floor(Math.random() * colours.length)];
}

/**
 * check name contains characters other than lowercase letters,
 * uppercase letters, spaces, hyphens, or apostrophes
 * @param {string} name - user's name
 * @returns {boolean} - pass test or not
 */
export const authNameCheck = (name: string): boolean => {
  const namePattern = /^[a-zA-Z\s\-']+$/;
  return namePattern.test(name);
};

/**
 * check name length and return a boolean
 * @param {string} name - user's name
 * @returns {boolean} - pass test or not
 */
export const authNameLengthCheck = (name: string): boolean => {
  // checks the name is between 2-20
  return name.length >= 2 && name.length <= 20;
};

/**
 * check password contain at least one number and at least one letter
 * @param {string} password - user's input password
 * @returns {boolean} - pass test or not
 */
export const passwordCheck = (password: string): boolean => {
  // check password follows regex pattern
  const passwordPattern = /^(?=.*[0-9])(?=.*[a-zA-Z])/;
  return passwordPattern.test(password);
};

/**
 * check password not less than 8 character
 * @param {string} password - user's input password
 * @returns {boolean} - pass test or not
 */
export const passwordLengthCheck = (password: string): boolean => {
  return password.length >= 8;
};

/**
 * check email is a valid email
 * @param {string} email - user's email
 * @returns {boolean} - pass test or not
 */
export const emailCheck = (email: string): boolean => {
  return validator.isEmail(email);
};

/**
 * check email is exist at dataStore
 * @param {string} email - user's email
 * @returns {boolean} - pass test or not
 */
export const emailExistCheck = (email: string): boolean => {
  const data = getData();
  return !data.users.some((user) => user.email === email);
};

/**
 * check user's token is it a valid token
 * if it is valid, return user who own this token
 * @param {string} token - user's token, get from register or login
 */
export const tokenCheck = (token: string): User => {
  if (token === '') {
    return undefined;
  }

  const data = getData();
  return data.users.find(user => user.token.includes(token));
};

/**
 * detects quiz name is alphanumerical and spaces
 * @param {string} name - quiz's name
 * @returns {boolean} - pass test or not
 */
export const quizNameCheck = (name: string): boolean => {
  const namePattern = /^[a-zA-Z0-9\s]+$/;
  return namePattern.test(name);
};

/**
 * check quiz name length
 * @param {string} name - quiz's name
 * @returns {boolean} - pass test or not
 */
export const quizNameLengthCheck = (name: string): boolean => {
  return name.length >= 3 && name.length <= 30;
};

/**
 * check quiz description length
 * @param {string} description - quiz description
 * @returns {boolean} - pass test or not
 */
export const quizDescriptionLengthCheck = (description: string): boolean => {
  return description.length <= 100;
};

/**
 * check quizid is valid quizid, if valid return quiz
 * @param {number} quizId - quiz's id
 * @returns {Quiz} - quiz or undefined
 */
export const quizFindCheck = (quizId: number): Quiz => {
  const data = getData();
  return data.quizzes.find((quizzes) => quizzes.quizId === quizId);
};

/**
 * check whether user owns the given quiz, if owned return quiz
 * @param {number} quizId - quiz's id
 * @param {User} user - object with a user's details
 * @returns {Quiz} - quiz or undefined
 */
export const forbiddenCheck = (quizId: number, user: User): Quiz => {
  const data = getData();
  return data.quizzes.find(q => q.authUserId === user.authUserId && q.quizId === quizId);
};

/**
 * check trash for quizId owned by user
 * @param {number} quizId - quiz's id
 * @param {User} user - object with a user's details
 * @returns {Quiz} - quiz from quizzesTrash or undefined
 */
export const trashForbiddenCheck = (quizId: number, user: User): Quiz => {
  const data = getData();
  return data.quizzesTrash.find(q => q.authUserId === user.authUserId && q.quizId === quizId);
};

/**
 * checks length of the question
 * @param {string} question - question string
 * @returns {boolean} - pass test or not
 */
export const questionLengthCheck = (question: string): boolean => {
  return question.length >= 5 && question.length <= 50;
};

/**
 * checks length of the answers
 * @param {object[]} answers - answers to test
 * @returns {boolean} - pass test or not
 */
export const questionAnswersLengthCheck = (answers: object[]): boolean => {
  return answers.length >= 2 && answers.length <= 6;
};

/**
 * checks that duration of the question is positive
 * @param {number} duration - duration of the question
 * @returns {boolean} - pass test or not
 */
export const questionDurationCheck = (duration: number): boolean => {
  return duration > 0;
};

/**
 * checks that duration of the question and quiz is <= three minutes
 * @param {number} quizDuration - duration of the quiz
 * @param {number} questionDuration - duration of the question
 * @returns {boolean} - pass test or not
 */
export const quizTotalDurationCheck = (quizDuration: number, questionDuration: number): boolean => {
  return (quizDuration + questionDuration) <= 180;
};

/**
 * checks that question's points are in the range of 1 and 10
 * @param {number} points - points of the question
 * @returns {boolean} - pass test or not
 */
export const questionPointCheck = (points: number): boolean => {
  return points >= 1 && points <= 10;
};

/**
 * checks the length of the answers inputted
 * @param {CreateQuestionInput} questionInput - question input to check
 * @returns {boolean} - pass test or not
 */
export const questionAnswersValidCheck = (questionInput: CreateQuestionInput): boolean => {
  return questionInput.answers.every((answer) => answer.answer.length >= 1 && answer.answer.length <= 30);
};

/**
 * checks for duplicate answers
 * @param {CreateQuestionInput} questionInput - question input to check
 * @returns {boolean} - pass test or not
 */
export const questionAnswersDuplicatesCheck = (questionInput: CreateQuestionInput): boolean => {
  return !(questionInput.answers.some((answer, index, arr) => arr.slice(0, index).some(a => a.answer === answer.answer)));
};

/**
 * checks there is a correct answer for a question
 * @param {CreateQuestionInput} questionInput - question input to check
 * @returns {boolean} - pass test or not
 */
export const questionCorrectAnswerCheck = (questionInput: CreateQuestionInput): boolean => {
  return questionInput.answers.some((answer) => answer.correct === true);
};

/**
 * checks if there is a question with a given question id in the given quiz id
 * @param {number} quizId - quiz's id
 * @param {number} questionId - question's id
 * @returns {Question} - question relate on quizid and questionid
 */
export const questionFindCheck = (quizId: number, questionId: number): Question => {
  const quiz = quizFindCheck(quizId);
  return quiz.questions.find((q) => q.questionId === questionId);
};

/**
 * checks if the following thumbnail is valid or not - with string check
 * @param {string} url - url to test if valid or not
 * @returns {boolean} - pass test or not
 */
export const thumbnailValidCheck = (url: string): boolean => {
  if (url === '') {
    return false;
  }
  const regex = /^(http:\/\/|https:\/\/).*\.(jpg|jpeg|png)$/i;
  return regex.test(url);
};

/**
 * Generates a unique random number to be used as a session ID.
 * Ensures the generated number does not already exist in the used session numbers.
 * The number range is between 0 and 9999999.
 *
 * @returns {number} - A unique random number for session ID.
 */
export const randomNumGenerator = (): number => {
  const data = getData();

  // generate a number - randomise and multiply by 10000000 and round it
  let number: number = Math.floor(Math.random() * 10000000);

  /**
   * Generate for random session id
   * if session id already exist, will get a new one until unique
   * But because test exist may request this function more than 10k times
   * It is hard to test
   * */
  /* istanbul ignore next */
  while (data.usedSessionNumbers.includes(number)) {
    number = Math.floor(Math.random() * 10000000);
  }

  // put in already the usedSessionNumber array to ensure it is not used again
  data.usedSessionNumbers.push(number);

  setData(data);

  // returns random integer from 0 to 9999999
  return number;
};

/**
 * Generates a SHA-256 hash of the given password.
 *
 * @param {string} password - The password to be hashed.
 * @returns {string} - The SHA-256 hash of the password.
 */
export const hashString = (password: string): string => {
  // uses npm package to hash the string
  return sha256(password);
};

/**
 * Checks for the existence of a session with a specific quizId and sessionId.
 *
 * @param {number} quizId - The ID of the quiz associated with the session.
 * @param {number} sessionId - The ID of the session to be checked.
 * @returns {SessionQuiz} - The session object if found, otherwise undefined.
 */
export const sessionIdCheck = (quizId: number, sessionId: number): SessionQuiz => {
  const data = getData();
  // find session with matching sessionId and quizId
  return data.sessions.find(s => s.info.metadata.quizId === quizId && s.sessionId === sessionId);
};

/**
 * helper function for generating a player name
 *
 * @returns {string} string of a specified length and randomised
 */
const generateRandomString = (inputString: string, characterLength: number): string => {
  let result = '';
  // splits the inputted string into an array
  const stringArray = inputString.split('');

  // for the number of specified characters wanted - loop
  for (let i = 0; i < characterLength; i++) {
    // get a random position - randomise * length and round it
    const pos = Math.floor(Math.random() * stringArray.length);
    // concatenate the letter found to the result
    result += stringArray[pos];
    // get rid of the letter so it does not repeat twice
    stringArray.splice(pos, 1);
  }

  // return the result
  return result;
};

/**
 * generates a random name for a player - as they have entered game with an invalid name
 *
 * @returns {string} - A randomly generated player name.
 */
export const playerNameGenerator = (): string => {
  // initialise alphabet
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  // initialise number
  const number = '0123456789';

  let randomName = '';
  // use helper function and concatenate on existing name
  randomName += generateRandomString(alphabet, 5);
  randomName += generateRandomString(number, 3);

  return randomName;
};

/**
 * Converts quiz results into a CSV formatted string. It includes player names, scores, and ranks for each question.
 *
 * @param {ResultCSVInfo[]}results - Array of objects containing players' scores and ranks for each question.
 * @returns {string} - A CSV formatted string representing the quiz results.
 */
export const convertResultToCSV = (results: ResultCSVInfo[]): string => {
  // Check if there are any results to determine the number of questions
  const questionCount = results[0].questionScore.length;

  // Create the header row with dynamic question columns
  const headers = ['Player'];
  for (let i = 1; i <= questionCount; i++) {
    headers.push(`question${i}score`, `question${i}rank`);
  }
  let csvString = headers.join(',') + '\n';

  // Map each player's results to a CSV row
  results.forEach(result => {
    const row = [result.playerName]; // Start with the player's name
    // Append each score and rank to the row
    for (let i = 0; i < questionCount; i++) {
      row.push(`${result.questionScore[i]}`, `${result.questionRank[i]}`);
    }
    csvString += row.join(',') + '\n';
  });

  return csvString;
};

/**
 * Deletes all CSV files in the specified directory, excluding the 'README.txt' file.
 */
export const removeCSV = (): void => {
  const directoryPath = path.join(__dirname, '../csv');
  const csvFile = fs.readdirSync(directoryPath);

  csvFile.forEach(file => {
    if (file !== 'README.txt') {
      const filePath = path.join(directoryPath, file);
      fs.unlinkSync(filePath);
    }
  });
};

/**
 * Validates if the given action is a valid session action from a predefined set of session actions.
 *
 * @param {string} action - The session action to validate.
 * @returns {boolean} - True if the action is valid, false otherwise.
 */
export const checkSessionAction = (action: string): boolean => {
  return (action === SessionAction.SKIP_COUNTDOWN) || (action === SessionAction.NEXT_QUESTION) ||
    (action === SessionAction.GO_TO_FINAL_RESULTS) || (action === SessionAction.GO_TO_ANSWER) || (action === SessionAction.END);
};

/**
 * Checks an array of answer IDs for duplicates.
 *
 * @param {number[]} answerIds - Array of answer IDs to be checked.
 * @returns {boolean} - True if duplicates are found, false otherwise.
 */
export const checkForDuplicates = (answerIds: number[]): boolean => {
  for (let i = 0; i < answerIds.length; i++) {
    for (let j = i + 1; j < answerIds.length; j++) {
      if (answerIds[i] === answerIds[j]) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Calculates the score of a player for a specific question based on their answers and answer time.
 * Considers correct answers and ranks players based on their response times.
 *
 * @param {number} questionScore - The total score available for the question.
 * @param {number} answerTime - The time taken by the player to answer.
 * @param {PlayerAnswerRecord[]} playerAnswers - Array of the player's answers.
 * @param {number[]} correctAnswers - Array of correct answer IDs.
 * @param {Map<number, number[]>} correctAnswersByQuestion - Map of correct answers by question ID.
 * @returns {number} - The calculated score for the player.
 */
export const calculatePlayerScore = (questionScore: number, answerTime: number, playerAnswers: PlayerAnswerRecord[], correctAnswers: number[], correctAnswersByQuestion: Map<number, number[]>): number => {
  const correctPlayerAnswers = playerAnswers.filter(playerAnswer =>
    correctAnswersByQuestion.get(playerAnswer.questionId) &&
    playerAnswer.answerIds.length === correctAnswers.length &&
    playerAnswer.answerIds.every(answerId => correctAnswers.includes(answerId))
  );

  const sortedTimes = correctPlayerAnswers.map(pa => pa.answerTime).sort((a, b) => a - b);
  const rank = sortedTimes.indexOf(answerTime) + 1;
  const S = 1 / rank;
  return Math.round(questionScore * S * 10) / 10;
};

/**
 * Calculates and updates the scores for all players in a session.
 * It considers the correct answers, response times, and ranks the players accordingly.
 * Updates the session's results and rankings based on the calculated scores.
 *
 * @param {number} sessionId - The ID of the session for which scores are being calculated.
 */
export const scoreCalculate = (sessionId: number): void => {
  // Retrieve session data
  const data = getData();
  const session = data.sessions.find(s => s.sessionId === sessionId);

  // Create a map of correct answers for each question
  const correctAnswersByQuestion = new Map();
  session.info.metadata.questions.forEach(question => {
    const correctAnswers = question.answers.filter(a => a.correct).map(a => a.answerId);
    correctAnswersByQuestion.set(question.questionId, correctAnswers);
  });

  // Initialize player scores
  const scores: PlayerScore[] = session.info.players.map(player => ({
    playerId: player.playerId,
    playerName: player.name,
    score: 0,
    answerTime: 0,
    rank: null
  }));

  // Get the current question
  const sessionQuestion = session.info.metadata.questions[session.info.atQuestion - 1];

  // Calculate scores for each player who answered
  if (session.playerAnswer && session.playerAnswer.length > 0) {
    session.playerAnswer.forEach(player => {
      const playerScore = scores.find(p => p.playerId === player.playerId);

      const answerTime = player.answerTime - session.recentQuestionStartTime;
      const correctAnswers = correctAnswersByQuestion.get(player.questionId);

      // Check if the player's answers are correct
      const isCorrect = player.answerIds.length === correctAnswers.length &&
                      player.answerIds.every(answerId => correctAnswers.includes(answerId));

      // Find the corresponding question
      const question = session.info.metadata.questions.find(q => q.questionId === player.questionId);

      // Calculate player's score based on correctness and other factors
      playerScore.score = isCorrect ? calculatePlayerScore(question.points, player.answerTime, session.playerAnswer, correctAnswers, correctAnswersByQuestion) : 0;
      playerScore.answerTime = answerTime;
    });
  }

  // Sort players by score and assign ranks
  scores.sort((a, b) => b.score - a.score);
  let rank = 0;
  let previousScore: number = null;
  scores.forEach((player, index) => {
    if (player.score !== previousScore) {
      rank = index + 1;
      previousScore = player.score;
    }
    player.rank = rank;
  });

  // Create a list of players with correct answers
  const playersCorrectList = scores.filter(player => player.score > 0).map(player => player.playerName);

  // Calculate statistics for each question
  const questionResults = session.info.metadata.questions.map(question => {
    const totalPlayers = scores.length;
    const playersCorrect = scores.filter(player => player.score > 0).length;
    const percentCorrect = totalPlayers > 0 ? Math.round(playersCorrect / totalPlayers * 100) : 0;

    // Calculate average answer time
    const totalAnswerTime = scores.reduce((sum, player) => sum + player.answerTime, 0);
    const playersAnswered = scores.filter(player => player.answerTime > 0);
    const averageAnswerTime = playersAnswered.length > 0 ? Math.round(totalAnswerTime / playersAnswered.length) : 0;

    return {
      questionId: question.questionId,
      playersCorrectList,
      averageAnswerTime,
      percentCorrect
    };
  });

  // Update overall session results and rankings
  session.results.usersRankedByScore.forEach(player => {
    player.score += scores.find(p => p.playerName === player.name).score;
  });
  session.results.usersRankedByScore.sort((a, b) => b.score - a.score);

  // Update question results in the session data
  const result = questionResults.find(q => q.questionId === sessionQuestion.questionId);
  session.results.questionResults.push(result);

  // Update CSV data for players
  session.resultsCSV.forEach(player => {
    const playerScore = scores.find(p => p.playerName === player.playerName);
    player.questionScore.push(playerScore.score);
    player.questionRank.push(playerScore.rank);
  });

  // Clean up temporary data
  delete session.playerAnswer;
};
