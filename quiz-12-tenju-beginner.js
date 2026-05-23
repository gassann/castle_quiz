const QUIZ_SIZE = 10;
const QUIZ_CSV_PATH = "./quiz.csv";
const DIFFICULTY_LABELS = {
  beginner: "初級",
  intermediate: "中級",
  advanced: "上級"
};

const QUIZ_PAGE_CONFIGS = [
  {
    pattern: /quiz-12-tenju-(beginner|intermediate|advanced)\.html$/,
    title: "現存12天守",
    group: "existing-12"
  },
  {
    pattern: /quiz-100-meijo-(beginner|intermediate|advanced)\.html$/,
    title: "100名城",
    group: "100-meijo"
  },
  {
    pattern: /quiz-zoku-100-meijo-(beginner|intermediate|advanced)\.html$/,
    title: "続100名城",
    group: "zoku-100-meijo"
  },
  {
    pattern: /quiz-himeji\.html$/,
    title: "姫路城",
    group: "castle",
    castleNames: ["姫路城"]
  },
  {
    pattern: /quiz-edo\.html$/,
    title: "江戸城",
    group: "castle",
    castleNames: ["江戸城"]
  },
  {
    pattern: /quiz-osaka\.html$/,
    title: "大阪城",
    group: "castle",
    castleNames: ["大阪城", "大坂城"]
  }
];

const frame = document.querySelector(".scale-frame");
const app = document.querySelector(".app");
const designWidth = 744;
const questionCount = document.querySelector("#question-count");
const scoreCount = document.querySelector("#score-count");
const progressBar = document.querySelector("#progress-bar");
const questionPanel = document.querySelector("#question-panel");
const questionLabel = document.querySelector("#question-label");
const questionText = document.querySelector("#question-text");
const answerList = document.querySelector("#answer-list");
const feedbackPanel = document.querySelector("#feedback-panel");
const feedbackResult = document.querySelector("#feedback-result");
const feedbackCopy = document.querySelector("#feedback-copy");
const nextButton = document.querySelector("#next-button");
const resultPanel = document.querySelector("#result-panel");
const resultTitle = document.querySelector("#result-title");
const resultScore = document.querySelector("#result-score");
const resultCopy = document.querySelector("#result-copy");
const retryButton = document.querySelector("#retry-button");
const headerBadge = document.querySelector(".header-badge");

let questions = [];
let questionPool = [];
let currentIndex = 0;
let score = 0;
let answered = false;

function getQuizConfig() {
  const fileName = window.location.pathname.split("/").pop() || "";
  const matched = QUIZ_PAGE_CONFIGS
    .map((config) => ({ config, match: fileName.match(config.pattern) }))
    .find(({ match }) => match);

  if (!matched) {
    return {
      title: "現存12天守",
      group: "existing-12",
      difficulty: "初級"
    };
  }

  return {
    title: matched.config.title,
    group: matched.config.group,
    difficulty: DIFFICULTY_LABELS[matched.match[1]] || "",
    castleNames: matched.config.castleNames || []
  };
}

const quizConfig = getQuizConfig();

function getQuizDisplayName() {
  return quizConfig.difficulty ? `${quizConfig.title} ${quizConfig.difficulty}` : quizConfig.title;
}

function fitDesign() {
  const scale = Math.min(window.innerWidth / designWidth, 1);
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  app.style.minHeight = `${viewportHeight / scale}px`;
  app.style.transform = `scale(${scale})`;
  frame.style.width = `${designWidth * scale}px`;
  frame.style.height = `${app.scrollHeight * scale}px`;
}

function parseCsv(csvText) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (inQuotes) {
      if (char === "\"" && nextChar === "\"") {
        field += "\"";
        index += 1;
      } else if (char === "\"") {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === "\"") {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows.filter((csvRow) => csvRow.some((cell) => cell.trim()));
}

function csvToRecords(csvText) {
  const rows = parseCsv(csvText.replace(/^\uFEFF/, ""));
  const headers = rows[0] || [];

  return rows.slice(1).map((row) => {
    return headers.reduce((record, header, index) => {
      record[header] = row[index]?.trim() || "";
      return record;
    }, {});
  });
}

function rowMatchesQuizConfig(row) {
  if (quizConfig.difficulty && row["難易度"] !== quizConfig.difficulty) {
    return false;
  }

  if (quizConfig.group === "existing-12") {
    return Boolean(row["現存12天守"]);
  }

  if (quizConfig.group === "100-meijo") {
    return row["100名城"] === "100名城";
  }

  if (quizConfig.group === "zoku-100-meijo") {
    return row["100名城"] === "続100名城";
  }

  if (quizConfig.group === "castle") {
    return quizConfig.castleNames.includes(row["城"]);
  }

  return false;
}

function rowToQuestion(row) {
  const choices = row["選択肢"].split(",").map((choice) => choice.trim()).filter(Boolean);
  const answerText = row["答え"].trim();
  const answer = choices.indexOf(answerText);

  if (!row["問題文"] || choices.length < 2 || answer < 0) {
    return null;
  }

  return {
    question: row["問題文"],
    choices,
    answer,
    explanation: row["解説"] || "解説は準備中です。"
  };
}

function shuffle(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function setLoadingState() {
  questionPanel.hidden = false;
  feedbackPanel.hidden = true;
  resultPanel.hidden = true;
  questionCount.textContent = "読込中";
  scoreCount.textContent = "正解 0";
  questionLabel.textContent = "準備中";
  questionText.textContent = "問題を読み込んでいます...";
  answerList.innerHTML = "";
  progressBar.style.width = "0%";
  fitDesign();
}

function setErrorState(message) {
  questionPanel.hidden = false;
  feedbackPanel.hidden = true;
  resultPanel.hidden = true;
  questionCount.textContent = "エラー";
  questionLabel.textContent = "読み込み失敗";
  questionText.textContent = message;
  answerList.innerHTML = "";
  progressBar.style.width = "0%";
  fitDesign();
}

async function loadQuestionPool() {
  const response = await fetch(QUIZ_CSV_PATH, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`quiz.csvを読み込めませんでした。HTTP ${response.status}`);
  }

  const records = csvToRecords(await response.text());
  return records
    .filter(rowMatchesQuizConfig)
    .map(rowToQuestion)
    .filter(Boolean);
}

function resetQuiz() {
  questions = shuffle(questionPool).slice(0, QUIZ_SIZE);
  currentIndex = 0;
  score = 0;
  renderQuestion();
}

function renderQuestion() {
  const current = questions[currentIndex];

  if (!current) {
    setErrorState("表示できる問題がありません。quiz.csvの条件を確認してください。");
    return;
  }

  answered = false;
  feedbackPanel.hidden = true;
  resultPanel.hidden = true;
  questionPanel.hidden = false;
  questionCount.textContent = `Q${currentIndex + 1} / ${questions.length}`;
  scoreCount.textContent = `正解 ${score}`;
  questionLabel.textContent = `第${currentIndex + 1}問`;
  questionText.textContent = current.question;
  progressBar.style.width = `${(currentIndex / questions.length) * 100}%`;
  answerList.innerHTML = "";

  current.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.className = "answer-button";
    button.type = "button";
    button.textContent = choice;
    button.addEventListener("click", () => selectAnswer(index));
    answerList.append(button);
  });

  fitDesign();
}

function selectAnswer(index) {
  if (answered) return;
  answered = true;
  const current = questions[currentIndex];
  const isCorrect = index === current.answer;
  const buttons = [...answerList.querySelectorAll(".answer-button")];

  if (isCorrect) {
    score += 1;
  }

  if (typeof window.recordAnswer === 'function') {
    window.recordAnswer({
      question:   current.question,
      group:      quizConfig.group,
      difficulty: quizConfig.difficulty || '',
      isCorrect,
    });
  }

  buttons.forEach((button, buttonIndex) => {
    button.disabled = true;
    if (buttonIndex === current.answer) button.classList.add("is-correct");
    if (buttonIndex === index && !isCorrect) button.classList.add("is-wrong");
  });

  scoreCount.textContent = `正解 ${score}`;
  feedbackResult.textContent = isCorrect ? "正解！" : "不正解";
  feedbackResult.className = `feedback-result ${isCorrect ? "is-correct-text" : "is-wrong-text"}`;
  feedbackCopy.textContent = current.explanation;
  nextButton.textContent = currentIndex === questions.length - 1 ? "結果を見る" : "次の問題へ";
  feedbackPanel.hidden = false;
  progressBar.style.width = `${((currentIndex + 1) / questions.length) * 100}%`;
  fitDesign();
}

function showResult() {
  questionPanel.hidden = true;
  feedbackPanel.hidden = true;
  resultPanel.hidden = false;
  questionCount.textContent = "完了";
  scoreCount.textContent = `正解 ${score}`;
  progressBar.style.width = "100%";
  resultTitle.textContent = score >= 8 ? "お城マスター目前！" : score >= 5 ? "いい調子です！" : "ここから覚えていきましょう";
  resultScore.textContent = `${questions.length}問中 ${score}問 正解`;
  resultCopy.textContent = score >= 8
    ? `${getQuizDisplayName()}の知識はかなり押さえられています。次の級に挑戦しましょう！`
    : score >= 5
      ? "基本が少しずつつかめてきています。もう一度解くと一気に定着します。"
      : "最初は名前と場所を結びつけるだけで十分です。気軽にもう一周してみましょう。";
  fitDesign();
}

nextButton.addEventListener("click", () => {
  if (currentIndex === questions.length - 1) {
    showResult();
    return;
  }

  currentIndex += 1;
  renderQuestion();
});

retryButton.addEventListener("click", () => {
  resetQuiz();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

window.addEventListener("resize", fitDesign);
window.addEventListener("load", fitDesign);

async function initQuiz() {
  setLoadingState();
  headerBadge.textContent = getQuizDisplayName();
  document.title = `${getQuizDisplayName()} | お城クイズ`;

  try {
    questionPool = await loadQuestionPool();

    if (questionPool.length < QUIZ_SIZE) {
      throw new Error(`${getQuizDisplayName()}の問題が${QUIZ_SIZE}問未満です。`);
    }

    resetQuiz();
  } catch (error) {
    setErrorState(error.message || "問題の読み込みに失敗しました。");
  }
}

initQuiz();
