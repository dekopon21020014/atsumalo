import { getApps, initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

// 必須環境変数の存在チェック（アプリ起動時に欠落を早期検知する）
const requiredEnvVars = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
} as const

const missingVars = (Object.keys(requiredEnvVars) as Array<keyof typeof requiredEnvVars>).filter(
  (key) => !requiredEnvVars[key],
)
if (missingVars.length > 0) {
  throw new Error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`)
}

const serviceAccount: ServiceAccount = {
  projectId: requiredEnvVars.projectId!,
  clientEmail: requiredEnvVars.clientEmail!,
  // 改行文字を復元
  privateKey: requiredEnvVars.privateKey!.replace(/\\n/g, '\n'),
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  })
}

const db = getFirestore()

export { db, FieldValue }
