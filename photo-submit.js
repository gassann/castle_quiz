import { firebaseConfig, photoUploadSettings } from "./firebase-config.js";

const form = document.querySelector("#photo-submit-form");
const dropzone = document.querySelector("#photo-dropzone");
const fileInput = document.querySelector("#photo-file");
const titleInput = document.querySelector("#photo-title");
const fileName = document.querySelector("#photo-file-name");
const fileHelp = document.querySelector("#photo-file-help");
const status = document.querySelector("#photo-submit-status");
const submitButton = document.querySelector(".photo-submit-button");

const requiredConfigKeys = ["apiKey", "authDomain", "projectId", "storageBucket", "appId"];
const isConfigured = requiredConfigKeys.every((key) => Boolean(firebaseConfig[key]));
const isLocalFile = window.location.protocol === "file:";
let firebaseApi = null;

async function loadFirebaseApi() {
  if (firebaseApi) {
    return firebaseApi;
  }

  const [{ initializeApp }, storageModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js")
  ]);
  const app = initializeApp(firebaseConfig);

  firebaseApi = {
    ref: storageModule.ref,
    storage: storageModule.getStorage(app),
    uploadBytesResumable: storageModule.uploadBytesResumable
  };

  return firebaseApi;
}

function setStatus(message, tone = "idle") {
  status.textContent = message;
  status.dataset.tone = tone;
}

function setSubmitting(isSubmitting) {
  submitButton.disabled = isSubmitting;
  submitButton.querySelector("span").textContent = isSubmitting ? "投稿中..." : "投稿する";
}

function formatBytes(bytes) {
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(mb >= 10 ? 0 : 1)}MB`;
}

function getExtension(file) {
  const fallback = file.type === "image/png" ? "png" : "jpg";
  return file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || fallback;
}

function createStoragePath(file, title) {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const safeTitle = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .slice(0, 48) || "castle-photo";
  const id = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${photoUploadSettings.basePath}/${year}/${month}/${Date.now()}-${safeTitle}-${id}.${getExtension(file)}`;
}

function validateFile(file) {
  if (!file) {
    return "投稿する写真を選択してください。";
  }

  if (!photoUploadSettings.allowedTypes.includes(file.type)) {
    return "PNGまたはJPGの写真を選択してください。";
  }

  if (file.size > photoUploadSettings.maxSizeBytes) {
    return `写真のサイズは最大${formatBytes(photoUploadSettings.maxSizeBytes)}までです。`;
  }

  return "";
}

function getUploadErrorMessage(error) {
  if (error?.code === "storage/unauthorized") {
    return "投稿に失敗しました。Firebase Storageの書き込み権限を確認してください。";
  }

  if (error?.code === "storage/unauthenticated") {
    return "投稿に失敗しました。ログインなし投稿を許可するStorageルールが必要です。";
  }

  if (error?.code === "storage/unknown" || error?.code === "storage/object-not-found") {
    return "投稿に失敗しました。Firebase Storageの作成状況とbucket名を確認してください。";
  }

  return `投稿に失敗しました。${error?.message || "時間をおいて再度お試しください。"}`;
}

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];

  if (!file) {
    dropzone.classList.remove("is-filled");
    fileName.textContent = "写真を選択する";
    fileHelp.innerHTML = "タップして写真を選択<br>PNG / JPG（最大10MB）";
    return;
  }

  dropzone.classList.add("is-filled");
  fileName.textContent = file.name;
  fileHelp.textContent = `${file.type.replace("image/", "").toUpperCase()} / ${formatBytes(file.size)}`;
  setStatus("", "idle");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (isLocalFile) {
    setStatus("写真投稿はfile://では動作しません。http://127.0.0.1:4173/photo-submit.html で開いてください。", "error");
    return;
  }

  if (!isConfigured) {
    setStatus("Firebase設定が未入力です。firebase-config.jsにWebアプリ設定を入れてください。", "error");
    return;
  }

  const file = fileInput.files?.[0];
  const title = titleInput.value.trim();
  const fileError = validateFile(file);

  if (fileError) {
    setStatus(fileError, "error");
    return;
  }

  if (!title) {
    setStatus("写真の名称を入力してください。", "error");
    titleInput.focus();
    return;
  }

  setSubmitting(true);
  setStatus("投稿を開始しています...", "idle");

  let firebaseStorage;
  try {
    firebaseStorage = await loadFirebaseApi();
  } catch (error) {
    setSubmitting(false);
    setStatus(`Firebase SDKの読み込みに失敗しました。${error.message}`, "error");
    return;
  }

  const storagePath = createStoragePath(file, title);
  const photoRef = firebaseStorage.ref(firebaseStorage.storage, storagePath);
  const uploadTask = firebaseStorage.uploadBytesResumable(photoRef, file, {
    contentType: file.type,
    customMetadata: {
      title,
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
      source: "oshiro-quiz-photo-submit"
    }
  });

  uploadTask.on(
    "state_changed",
    (snapshot) => {
      const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      setStatus(`投稿中... ${progress}%`, "idle");
    },
    (error) => {
      setSubmitting(false);
      setStatus(getUploadErrorMessage(error), "error");
    },
    () => {
      setSubmitting(false);
      form.reset();
      dropzone.classList.remove("is-filled");
      fileName.textContent = "写真を選択する";
      fileHelp.innerHTML = "タップして写真を選択<br>PNG / JPG（最大10MB）";
      setStatus("投稿が完了しました。ありがとうございました！", "success");
    }
  );
});
