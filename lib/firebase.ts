import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

// .envの読み込み（Next.jsでは自動でprocess.envに入ってる）
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // 改行文字を復元
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as any), // 型を合わせる
  })
}

const db = getFirestore()

export { db, FieldValue }
