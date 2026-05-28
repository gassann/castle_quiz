const QUIZ_SIZE = 5;
const IMAGE_MANIFEST_PATH = "./quiz-image-manifest.json";
const IMAGE_BASE_PATH = "./quiz-image/";
const CASTLE_NAME_CHOICES = [
  "大阪城",
  "二条城",
  "姫路城",
  "江戸城",
  "名古屋城",
  "松本城",
  "彦根城",
  "熊本城"
];

const frame = document.querySelector(".scale-frame");
const app = document.querySelector(".app");
const designWidth = 744;
const questionCount = document.querySelector("#question-count");
const scoreCount = document.querySelector("#score-count");
const progressBar = document.querySelector("#progress-bar");
const questionPanel = document.querySelector("#question-panel");
const questionLabel = document.querySelector("#question-label");
const questionFigure = document.querySelector(".photo-question-figure");
const questionImage = document.querySelector("#question-image");
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
const photoHelpOverlay = document.querySelector("#photo-help-overlay");
const photoHelpClose = document.querySelector("#photo-help-close");

let questionPool = [];
let questions = [];
let currentIndex = 0;
let score = 0;
let answered = false;

photoHelpClose?.addEventListener("click", () => {
  if (photoHelpOverlay) {
    photoHelpOverlay.hidden = true;
  }
});

function fitDesign() {
  const scale = Math.min(window.innerWidth / designWidth, 1);
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  app.style.minHeight = `${viewportHeight / scale}px`;
  app.style.transform = `scale(${scale})`;
  frame.style.width = `${designWidth * scale}px`;
  frame.style.height = `${app.scrollHeight * scale}px`;
}

function shuffle(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function unique(items) {
  return [...new Set(items)];
}

function getPhotoType(subject) {
  if (subject.includes("櫓") && !subject.includes("櫓門")) {
    return { key: "yagura", noun: "櫓" };
  }

  if (subject.includes("門")) return { key: "gate", noun: "門" };
  if (subject.includes("天守")) return { key: "tenshu", noun: "天守" };
  if (subject.includes("橋")) return { key: "bridge", noun: "橋" };
  if (subject.includes("蔵")) return { key: "storehouse", noun: "蔵" };
  if (subject.includes("石垣")) return { key: "stone-wall", noun: "石垣" };
  if (subject.includes("石")) return { key: "stone", noun: "石" };
  if (subject.includes("庭園")) return { key: "garden", noun: "庭園" };
  if (subject.includes("壁")) return { key: "wall", noun: "壁" };
  if (subject.includes("釣鐘")) return { key: "bell", noun: "釣鐘" };
  if (subject.includes("大砲")) return { key: "cannon", noun: "大砲" };

  return { key: "landmark", noun: "場所" };
}

function parseImageFile(fileName) {
  if (!/\.(jpe?g|png|webp)$/i.test(fileName)) return null;

  const isRootImage = !fileName.includes("/");
  const isObjectQuestion = fileName.startsWith("これは何/");
  const baseName = fileName.replace(/^.*\//, "").replace(/\.[^.]+$/, "");
  const parts = baseName.split("_");
  const castle = parts[0].trim();
  const subject = parts.length >= 2 ? parts.slice(1).join("_").replace(/_\d+$/, "").trim() : "";
  if (!castle) return null;
  if ((isRootImage || isObjectQuestion) && !subject) return null;

  return {
    image: `${IMAGE_BASE_PATH}${fileName}`,
    imageAlt: subject ? `${castle}の${subject}` : `${castle}の写真`,
    mode: isRootImage ? "image-choice" : isObjectQuestion ? "object" : "castle",
    castle,
    subject,
    type: getPhotoType(subject || "城")
  };
}

async function loadQuestionPool() {
  const response = await fetch(IMAGE_MANIFEST_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`写真リストを読み込めませんでした。HTTP ${response.status}`);
  }

  const files = await response.json();
  if (!Array.isArray(files)) {
    throw new Error("写真リストの形式が正しくありません。");
  }

  return files.map(parseImageFile).filter(Boolean);
}

function buildChoices(item) {
  if (item.mode === "image-choice") {
    const sameTypePhotos = questionPool.filter((candidate) => {
      const isSamePhoto = candidate.castle === item.castle && candidate.subject === item.subject;
      return candidate.mode === "image-choice" && candidate.type.key === item.type.key && !isSamePhoto;
    });
    const fallbackPhotos = questionPool.filter((candidate) => {
      const isSamePhoto = candidate.castle === item.castle && candidate.subject === item.subject;
      return candidate.mode === "image-choice" && !isSamePhoto;
    });
    const mustUseSameType = item.type.key === "gate" || item.type.key === "yagura";
    const candidates = sameTypePhotos.length >= 3 || mustUseSameType ? sameTypePhotos : fallbackPhotos;
    const choices = shuffle([item, ...shuffle(candidates).slice(0, 3)]);

    return {
      choices,
      answer: choices.findIndex((choice) => choice.image === item.image)
    };
  }

  if (item.mode === "castle") {
    const castleChoices = unique([
      ...questionPool.map((candidate) => candidate.castle),
      ...CASTLE_NAME_CHOICES
    ]).filter((castle) => castle !== item.castle);
    const choices = shuffle([item.castle, ...shuffle(castleChoices).slice(0, 3)]);

    return {
      choices,
      answer: choices.indexOf(item.castle)
    };
  }

  if (item.mode === "object") {
    const objectChoices = unique(
      questionPool
        .filter((candidate) => candidate.mode === "object" && candidate.subject !== item.subject)
        .map((candidate) => candidate.subject)
    );
    const fallbackChoices = unique(
      questionPool
        .filter((candidate) => candidate.mode !== "castle" && candidate.subject !== item.subject)
        .map((candidate) => candidate.subject)
    );
    const candidates = objectChoices.length >= 3 ? objectChoices : fallbackChoices;
    const choices = shuffle([item.subject, ...shuffle(candidates).slice(0, 3)]);

    return {
      choices,
      answer: choices.indexOf(item.subject)
    };
  }

  const sameTypeChoices = unique(
    questionPool
      .filter((candidate) => candidate.mode === "image-choice" && candidate.type.key === item.type.key && candidate.subject !== item.subject)
      .map((candidate) => candidate.subject)
  );
  const fallbackChoices = unique(
    questionPool
      .filter((candidate) => candidate.mode === "image-choice" && candidate.subject !== item.subject)
      .map((candidate) => candidate.subject)
  );
  const candidates = sameTypeChoices.length >= 3 ? sameTypeChoices : fallbackChoices;
  const choices = shuffle([item.subject, ...shuffle(candidates).slice(0, 3)]);

  return {
    choices,
    answer: choices.indexOf(item.subject)
  };
}

function buildQuestion(item) {
  const { choices, answer } = buildChoices(item);
  const question = item.mode === "castle"
    ? "これはどこのお城？"
    : item.mode === "object"
      ? "これは何？"
      : `${item.castle}の${item.subject}はどれ？`;
  const explanation = item.mode === "castle"
    ? `正解は${item.castle}です。写真の特徴を見ながら、お城の名前を覚えていきましょう。`
    : `正解は${item.castle}の${item.subject}です。写真を見ながら名前と場所を覚えていきましょう。`;

  return {
    image: item.image,
    imageAlt: item.imageAlt,
    answerType: item.mode === "image-choice" ? "image" : "text",
    question,
    choices,
    answer,
    explanation
  };
}

function pickQuestions() {
  const usedSubjects = new Set();
  const picked = [];

  shuffle(questionPool).forEach((item) => {
    const questionKey = `${item.mode}:${item.castle}:${item.subject || item.image}`;
    if (picked.length >= QUIZ_SIZE || usedSubjects.has(questionKey)) return;
    usedSubjects.add(questionKey);
    picked.push(buildQuestion(item));
  });

  return picked;
}

function setLoadingState() {
  questionPanel.hidden = false;
  feedbackPanel.hidden = true;
  resultPanel.hidden = true;
  questionCount.textContent = "読込中";
  scoreCount.textContent = "正解 0";
  questionLabel.textContent = "準備中";
  questionFigure.hidden = false;
  questionImage.removeAttribute("src");
  questionImage.alt = "";
  questionText.textContent = "写真を読み込んでいます...";
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
  questionFigure.hidden = false;
  questionImage.removeAttribute("src");
  questionImage.alt = "";
  questionText.textContent = message;
  answerList.innerHTML = "";
  progressBar.style.width = "0%";
  fitDesign();
}

function resetQuiz() {
  questions = pickQuestions();
  currentIndex = 0;
  score = 0;
  if (photoHelpOverlay) {
    photoHelpOverlay.hidden = true;
  }
  renderQuestion();
}

function renderQuestion() {
  const current = questions[currentIndex];

  if (!current) {
    setErrorState("表示できる写真クイズがありません。quiz-imageフォルダの画像を確認してください。");
    return;
  }

  answered = false;
  feedbackPanel.hidden = true;
  resultPanel.hidden = true;
  questionPanel.hidden = false;
  questionCount.textContent = `Q${currentIndex + 1} / ${questions.length}`;
  scoreCount.textContent = `正解 ${score}`;
  questionLabel.textContent = `第${currentIndex + 1}問`;
  questionFigure.hidden = current.answerType === "image";
  if (current.answerType === "image") {
    questionImage.removeAttribute("src");
    questionImage.alt = "";
  } else {
    questionImage.src = current.image;
    questionImage.alt = current.imageAlt;
  }
  questionText.textContent = current.question;
  progressBar.style.width = `${(currentIndex / questions.length) * 100}%`;
  answerList.innerHTML = "";
  answerList.classList.toggle("image-choice-list", current.answerType === "image");

  current.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.className = current.answerType === "image" ? "answer-button image-choice-button" : "answer-button";
    button.type = "button";
    if (current.answerType === "image") {
      const image = document.createElement("img");
      image.src = choice.image;
      image.alt = "写真の選択肢";
      image.loading = "lazy";
      button.append(image);
    } else {
      button.textContent = choice;
    }
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
  if (photoHelpOverlay) {
    photoHelpOverlay.hidden = false;
  }
  questionCount.textContent = "完了";
  scoreCount.textContent = `正解 ${score}`;
  progressBar.style.width = "100%";
  resultTitle.textContent = score >= 4 ? "写真判定ばっちり！" : score >= 2 ? "いい調子です！" : "写真で覚えていきましょう";
  resultScore.textContent = `${questions.length}問中 ${score}問 正解`;
  resultCopy.textContent = "結果を確認したら、ぜひ写真投稿ページからあなたの一枚も投稿してください。写真が増えるほど、写真クイズをもっと充実させられます。";
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
  window.location.reload();
});

window.addEventListener("resize", fitDesign);
window.addEventListener("load", fitDesign);

async function initQuiz() {
  setLoadingState();

  try {
    questionPool = await loadQuestionPool();

    if (questionPool.length < QUIZ_SIZE) {
      throw new Error(`写真クイズに使える画像が${QUIZ_SIZE}枚未満です。`);
    }

    resetQuiz();
  } catch (error) {
    setErrorState(error.message || "写真クイズの読み込みに失敗しました。");
  }
}

initQuiz();
