export default function AboutPage() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">About / このプロジェクトについて</h1>

      <section className="mb-6">
        <p className="mb-2">
          本プロジェクトは研究室や小規模グループ向けのイベント調整を簡潔にするオープンソースのツールです．
          単発イベントだけでなく定期イベントの調整にも対応します．
        </p>
        <p className="mb-2">
          リポジトリはGitHubで公開しており，IssueやPull Requestでの貢献を歓迎します．
        </p>
        <p>
          <a
            href="https://github.com/dekopon21020014/lab-scheduling"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://github.com/dekopon21020014/lab-scheduling
          </a>
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">目的</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>調整の往復を減らし，必要最小限の情報で候補提示と集計を行う．</li>
          <li>セットアップやアカウント作成なしで使える軽量な運用．</li>
          <li>コードを公開し，必要に応じて各環境で拡張できること．</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">主な機能</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>単発イベント／定期イベントの候補作成．</li>
          <li>URL共有による参加可否の収集と集計表示．</li>
          <li>最小限の入力項目での回答フォーム．</li>
          <li>イベントの自動削除（作成から3ヶ月）．</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">データ保持と削除</h2>
        <p className="mb-2">
          作成されたイベントは保存から3ヶ月経過すると自動的に削除されます．運用上必要なアクセスログは一定期間のみ保持します．
        </p>
        <p className="mb-2">
          具体的な取り扱いは
          <a href="/privacy" className="underline">プライバシーポリシー</a>
          を参照してください．
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">セキュリティと制限</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>通信は暗号化されていないため機密情報は入力しないでください．</li>
          <li>本サービスの利用により生じた損害について当方は責任を負いません．</li>
          <li>迷惑行為や不正利用を検知した場合はアクセスを制限します．</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">技術スタック</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>React／TypeScript．</li>
          <li>Tailwind CSS．</li>
          <li>軽量なバックエンドとシンプルな永続化層を前提とした設計．</li>
        </ul>
        <p className="text-sm text-gray-600 mt-1">
          実装はリポジトリのREADMEとソースコードを参照してください．
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">貢献方法</h2>
        <ol className="list-decimal pl-6 space-y-1">
          <li>Issueで提案やバグ報告を行う．</li>
          <li>Forkしてブランチを作成し，変更点をコミット．</li>
          <li>Pull Requestを作成し，背景と動作確認方法を記載．</li>
        </ol>
        <p className="text-sm text-gray-600 mt-1">
          小さな修正でも歓迎します．テンプレートがあれば従ってください．
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">ライセンス</h2>
        <p className="mb-2">
          ライセンスはリポジトリのLICENSEを参照してください．依存ライブラリのライセンスにも従います．
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">連絡先とクレジット</h2>
        <p className="mb-2">
          連絡先はリポジトリ内の連絡方法を参照してください．利用者からのフィードバックを歓迎します．
        </p>
        <p className="text-sm text-gray-600">
          本プロジェクトはコミュニティの貢献によって成長します．テスターとコントリビューターに感謝します．
        </p>
      </section>
    </main>
  )
}
