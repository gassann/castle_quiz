// 問題ごとの正解率をFirestoreに記録するモジュール
// ga.js からクイズページのみ自動読み込みされる

const FIREBASE_VERSION = '10.12.5';

function questionId(text) {
  // 問題文から一意なIDを生成（djb2ハッシュ）
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  }
  return 'q_' + Math.abs(h).toString(36);
}

async function initFirestore() {
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
  const [{ initializeApp, getApps }, { getFirestore, doc, setDoc, increment, collection, getDocs, orderBy, query }] =
    await Promise.all([
      import(`${base}/firebase-app.js`),
      import(`${base}/firebase-firestore.js`),
    ]);

  const { firebaseConfig } = await import('./firebase-config.js');
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const db = getFirestore(app, 'oshiroquiz');

  // 回答を記録する（クイズJSから呼び出す）
  window.recordAnswer = async function ({ question, group, difficulty, isCorrect }) {
    try {
      const id = questionId(question);
      await setDoc(
        doc(db, 'quiz_stats', id),
        {
          question,
          group,
          difficulty,
          correct: increment(isCorrect ? 1 : 0),
          total:   increment(1),
        },
        { merge: true }
      );
    } catch (_) {
      // 計測失敗はサイレントに無視
    }
  };

  // stats.html から全データ取得に使う
  window.fetchQuizStats = async function () {
    const snap = await getDocs(
      query(collection(db, 'quiz_stats'), orderBy('total', 'desc'))
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  };
}

initFirestore();
