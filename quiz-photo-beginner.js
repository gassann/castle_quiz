const questions = [
  {
    image: "./assets/himeji-card.png",
    imageAlt: "姫路城の写真",
    question: "この写真のお城はどれ？",
    choices: ["姫路城", "大阪城", "熊本城", "松本城"],
    answer: 0,
    explanation: "白い漆喰の美しい大天守で知られる姫路城です。別名は白鷺城です。"
  },
  {
    image: "./assets/osaka-card.png",
    imageAlt: "大阪城の写真",
    question: "この写真のお城はどれ？",
    choices: ["名古屋城", "大阪城", "江戸城", "彦根城"],
    answer: 1,
    explanation: "豊臣秀吉ゆかりの城として知られる大阪城です。現在の天守は復興天守です。"
  },
  {
    image: "./assets/kumamoto-card.png",
    imageAlt: "熊本城の写真",
    question: "この写真のお城はどれ？",
    choices: ["熊本城", "松本城", "高知城", "丸岡城"],
    answer: 0,
    explanation: "黒い外観と力強い石垣が印象的な熊本城です。加藤清正の築城で有名です。"
  },
  {
    image: "./assets/matsumoto-card.jpg",
    imageAlt: "松本城の写真",
    question: "この写真のお城はどれ？",
    choices: ["松江城", "松本城", "犬山城", "弘前城"],
    answer: 1,
    explanation: "黒い外観から烏城とも呼ばれる松本城です。現存12天守のひとつです。"
  },
  {
    image: "./assets/nagoya-card.jpg",
    imageAlt: "名古屋城の写真",
    question: "この写真のお城はどれ？",
    choices: ["小田原城", "岡山城", "名古屋城", "福山城"],
    answer: 2,
    explanation: "金鯱で知られる名古屋城です。尾張徳川家の城として築かれました。"
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

let currentIndex = 0;
let score = 0;
let answered = false;

function fitDesign() {
  const scale = Math.min(window.innerWidth / designWidth, 1);
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  app.style.minHeight = `${viewportHeight / scale}px`;
  app.style.transform = `scale(${scale})`;
  frame.style.width = `${designWidth * scale}px`;
  frame.style.height = `${app.scrollHeight * scale}px`;
}

function renderQuestion() {
  const current = questions[currentIndex];
  answered = false;
  feedbackPanel.hidden = true;
  resultPanel.hidden = true;
  questionPanel.hidden = false;
  questionCount.textContent = `Q${currentIndex + 1} / ${questions.length}`;
  scoreCount.textContent = `正解 ${score}`;
  questionLabel.textContent = `第${currentIndex + 1}問`;
  questionImage.src = current.image;
  questionImage.alt = current.imageAlt;
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
  currentIndex = 0;
  score = 0;
  renderQuestion();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

window.addEventListener("resize", fitDesign);
window.addEventListener("load", fitDesign);
renderQuestion();
