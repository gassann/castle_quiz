const questions = [
  {
    question: "現存12天守とは、主にどのような天守のこと？",
    choices: [
      "江戸時代以前から残る天守",
      "高さが12階以上ある天守",
      "日本で入場者数が多い12の天守",
      "国宝に指定された12の天守"
    ],
    answer: 0,
    explanation: "現存12天守は、江戸時代以前に建てられた天守が現在まで残っている12城を指します。"
  },
  {
    question: "別名「白鷺城」として知られる現存天守はどれ？",
    choices: ["松本城", "姫路城", "丸岡城", "宇和島城"],
    answer: 1,
    explanation: "姫路城は白い漆喰の美しさから「白鷺城」と呼ばれています。"
  },
  {
    question: "現存12天守のうち、青森県にある城はどれ？",
    choices: ["弘前城", "彦根城", "備中松山城", "高知城"],
    answer: 0,
    explanation: "弘前城は青森県弘前市にある現存天守です。"
  },
  {
    question: "黒い外観から「烏城」とも呼ばれる現存天守はどれ？",
    choices: ["犬山城", "松本城", "松江城", "丸亀城"],
    answer: 1,
    explanation: "松本城は黒い下見板張りの外観が印象的で「烏城」とも呼ばれます。"
  },
  {
    question: "現存12天守のうち、福井県にある城はどれ？",
    choices: ["丸岡城", "松山城", "高知城", "犬山城"],
    answer: 0,
    explanation: "丸岡城は福井県坂井市にある現存天守です。"
  },
  {
    question: "現存12天守のうち、島根県にある国宝天守はどれ？",
    choices: ["松江城", "弘前城", "宇和島城", "丸亀城"],
    answer: 0,
    explanation: "松江城は島根県松江市にあり、国宝天守のひとつです。"
  },
  {
    question: "現存12天守のうち、香川県にある城はどれ？",
    choices: ["備中松山城", "丸亀城", "松山城", "犬山城"],
    answer: 1,
    explanation: "丸亀城は香川県丸亀市にある現存天守です。"
  },
  {
    question: "現存12天守のうち、高知県にある城はどれ？",
    choices: ["高知城", "彦根城", "松本城", "姫路城"],
    answer: 0,
    explanation: "高知城は高知県高知市にあり、本丸の建物群がよく残る城として知られています。"
  },
  {
    question: "現存12天守のうち、岡山県高梁市にある山城はどれ？",
    choices: ["宇和島城", "備中松山城", "丸岡城", "松江城"],
    answer: 1,
    explanation: "備中松山城は岡山県高梁市にあり、山城として知られる現存天守です。"
  },
  {
    question: "現存12天守で、愛知県にある国宝天守はどれ？",
    choices: ["犬山城", "松山城", "丸亀城", "弘前城"],
    answer: 0,
    explanation: "犬山城は愛知県犬山市にある国宝天守です。"
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
  resultTitle.textContent = score >= 8 ? "お城マスター目前！" : score >= 5 ? "いい調子です！" : "ここから覚えていきましょう";
  resultScore.textContent = `${questions.length}問中 ${score}問 正解`;
  resultCopy.textContent = score >= 8
    ? "現存12天守の基本はかなり押さえられています。次は中級にも挑戦したいところです。"
    : score >= 5
      ? "地名と城名の組み合わせがつかめてきています。もう一度解くと一気に定着します。"
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
  currentIndex = 0;
  score = 0;
  renderQuestion();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

window.addEventListener("resize", fitDesign);
window.addEventListener("load", fitDesign);
renderQuestion();
