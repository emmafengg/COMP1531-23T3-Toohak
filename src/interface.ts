export interface User {
  authUserId: number,
  name: string,
  email: string,
  password: string,
  numSuccessfulLogins: number,
  numFailedPasswordsSinceLastLogin: number,
  usedPassword: string[];
  token: string[],
}

export interface QuizAnswer {
  answerId: number,
  answer: string,
  colour: string,
  correct: boolean,
}

export interface Question {
  quizId: number,
  questionId: number,
  question: string,
  duration: number,
  timeCreated: number,
  timeLastEdited: number,
  points: number,
  answers: QuizAnswer[]
  thumbnailUrl?: string
}

// interface for the question inside the sessions
export interface QuestionMetaData {
  questionId: number,
  question: string,
  duration: number,
  thumbnailUrl?: string,
  points: number,
  answers: QuizAnswer[],
}

export interface Quiz {
  authUserId: number,
  quizId: number,
  name: string,
  timeCreated: number,
  timeLastEdited: number,
  description: string,
  numQuestions: number,
  questions: Question[],
  questionsTrash?: Question[],
  duration: number,
  thumbnailUrl?: string
}

// interface for quiz inside the sessions
export interface QuizMetaData {
  quizId: number,
  name: string,
  timeCreated: number,
  timeLastEdited: number,
  description: string,
  numQuestions: number,
  questions: QuestionMetaData[],
  duration: number,
  thumbnailUrl?: string
}

export interface Messages {
  messageBody: string,
  playerId: number,
  playerName: string,
  timeSent: number
}

export enum SessionState {
  LOBBY = 'LOBBY',
  QUESTION_COUNTDOWN = 'QUESTION_COUNTDOWN',
  QUESTION_OPEN = 'QUESTION_OPEN',
  QUESTION_CLOSE = 'QUESTION_CLOSE',
  ANSWER_SHOW = 'ANSWER_SHOW',
  FINAL_RESULTS = 'FINAL_RESULTS',
  END = 'END'
}
export enum SessionAction {
  NEXT_QUESTION = 'NEXT_QUESTION',
  SKIP_COUNTDOWN = 'SKIP_COUNTDOWN',
  GO_TO_ANSWER = 'GO_TO_ANSWER',
  GO_TO_FINAL_RESULTS = 'GO_TO_FINAL_RESULTS',
  END = 'END'
}

export interface SessionQuizInfo {
  state: SessionState,
  atQuestion: number,
  players: Array<{ playerId: number; name: string }>,
  metadata: Quiz
}

export interface QuestionResultInfo {
  questionId: number,
  playersCorrectList: string[],
  averageAnswerTime: number,
  percentCorrect: number,
}

export interface RankInfo {
  name: string,
  score: number
}

export interface resultInfo {
  usersRankedByScore: RankInfo[];
  questionResults: QuestionResultInfo[]
}

export interface ResultCSVInfo {
  playerName: string,
  questionScore: number[],
  questionRank: number[]
}

export interface PlayerAnswerRecord {
  playerId: number;
  questionId: number;
  answerIds: number[];
  answerTime: number
}

export interface SessionQuiz {
  sessionId: number,
  autoStartNum: number,
  timeCreated: number,
  messages?: Messages[],
  info: SessionQuizInfo,
  results: resultInfo,
  resultsCSV: ResultCSVInfo[],
  playerAnswer?: PlayerAnswerRecord[],
  recentQuestionStartTime?: number
}

export interface DataStore {
  users: User[],
  quizzes: Quiz[],
  quizzesTrash: Quiz[],
  sessions: SessionQuiz[],
  recentUserId: number,
  recentQuizId: number,
  recentQuestionId: number,
  recentAnswerId: number,
  usedSessionNumbers: number[],
}

export interface EmptyObjectReturn {
  [key: string]: never;
}

export interface SingleErrorObject {
  error: string;
}

// used for iter1 and 2 - returned object of error
export interface ErrorObject {
  error: string;
  errorCode: number;
}

export interface AdminAuthRegisterReturn {
  token: string;
}

export interface AdminAuthLoginReturn {
  token: string;
}

export interface AdminUserDetailsReturn {
  user:
    {
      userId: number;
      name: string;
      email: string;
      numSuccessfulLogins: number;
      numFailedPasswordsSinceLastLogin: number;
    }
}

export interface AdminQuizDetailsReturn {
  quizId: number;
  name: string;
}

export interface AdminQuizListReturn {
  quizzes: AdminQuizDetailsReturn[];
}

export interface AdminQuizCreateReturn {
  quizId: number;
}

export interface AdminQuizCreateSession {
  sessionId: number;
}

export interface AdminTrashQuizzesReturn {
  quizzes: Pick<Quiz, 'quizId' | 'name'>[];
}

export interface AdminQuizInfoQuestions {
  questionId: number,
  question: string,
  duration: number,
  points: number,
  answers: QuizAnswer[]
}

export interface AdminQuizInfoReturn {
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: AdminQuizInfoQuestions[];
  duration: number;
}

export interface AdminQuizInfoReturnV2 {
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: AdminQuizInfoQuestions[];
  duration: number;
  thumbnailUrl: string;
}

export interface CreateQuestionReturn {
  questionId: number,
}

export interface CreateQuestionInput {
  question: string,
  duration: number,
  points: number,
  answers: Array<{ answer: string; correct: boolean }>;
  thumbnailUrl?: string
}

export interface DuplicateQuestionReturn {
    newQuestionId: number;
}

export interface SessionStatusReturn {
  state: SessionState,
  atQuestion: number,
  players: string[],
  metadata: QuizMetaData
}

export interface sessionResultsCSVReturn {
  url: string
}

export interface playerJoinReturn {
  playerId: number
}

export interface AdminQuizViewSessionsReturn {
  activeSessions: number[];
  inactiveSessions: number[];
}

export interface CurrentQuestionInfo {
  questionId: number;
  question: string;
  duration: number;
  thumbnailUrl?: string;
  points: number;
  answers: Array<{
    answerId: number;
    answer: string;
    colour: string;
  }>;
}

export interface playerStatusReturn {
  state: SessionState,
  numQuestions: number,
  atQuestion: number
}

export interface PlayerChatMessageInput {
  messageBody: string;
}

export interface ChatMessagesResponse {
  messages: Messages[];
}

export interface PlayerScore {
  playerName: string,
  playerId: number,
  score: number,
  answerTime: number,
  rank?: number
}
