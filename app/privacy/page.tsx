export default function PrivacyPage() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">プライバシーポリシー</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">基本方針</h2>
        <p className="mb-2">
          本サービスは個人情報の保護を重視しますが，通信は暗号化されていません．機密情報の入力は行わないでください．
        </p>
        <p className="mb-2">
          利用により生じた損害について，当方は一切責任を負いません．ご利用は自己責任でお願いします．
        </p>
        <p className="mb-2">
          作成されたイベントは保存から3ヶ月経過すると自動的に削除されます．
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">収集しない情報</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>氏名，住所，電話番号，メールアドレスなどの特定個人情報は収集しません．</li>
          <li>入力内容を恒久的に保存しません．</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">取得される可能性のある情報</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>アクセスログ（IPアドレス，ユーザーエージェント，アクセス日時）．</li>
          <li>エラーログや統計情報などの最小限の技術情報．</li>
        </ul>
        <p className="mt-2">
          これらはサービス運用と品質改善の目的でのみ用います．本人を特定する目的では使用しません．
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">クッキー・ローカルストレージ</h2>
        <p className="mb-2">
          セッション維持や設定保存のためにブラウザのクッキーやローカルストレージを使用する場合があります．
        </p>
        <p className="mb-2">
          ブラウザ設定で無効化できますが，一部機能が動作しない可能性があります．
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">第三者提供</h2>
        <p className="mb-2">
          法令に基づく場合を除き，第三者へ個人データを提供しません．外部解析サービスを利用する場合は，その範囲と目的を明示します．
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">データの保持と削除</h2>
        <p className="mb-2">
          ログは障害調査とセキュリティ対策のために一定期間保持し，目的達成後に削除します．保持期間は運用状況により見直します．
        </p>
        <p className="mb-2">
          ユーザーから削除要請があった場合は，可能な範囲で速やかに対応します．
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">セキュリティ</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>最低限の権限設計とアクセス制御を実施します．</li>
          <li>脆弱性対策と監査を継続的に行います．</li>
        </ul>
        <p className="mt-2">
          ただし，完全な安全性を保証するものではありません．ユーザー側でも機密情報の入力回避など適切な対策を行ってください．
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">未成年の利用</h2>
        <p className="mb-2">
          未成年の方は保護者の同意を得た上で利用してください．
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">ポリシーの変更</h2>
        <p className="mb-2">
          本ポリシーは予告なく改定する場合があります．重要な変更がある場合は，本ページで告知します．
        </p>
      </section>

      <section className="mb-2">
        <h2 className="text-xl font-semibold mb-2">お問い合わせ</h2>
        <p>ご質問は運営者までご連絡ください．連絡先はサービス内の案内欄に記載します．</p>
      </section>
    </main>
  )
}
