export default function AboutPage() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">このサイトについて</h1>
      <p className="mb-2">
        Lab Schedulingは研究室のイベントやミーティングの日程調整を支援するためのオープンソースプロジェクトです。
      </p>
      <p className="mb-2">
        ソースコードはGitHubで公開されており、改善の提案やバグ報告を歓迎しています。
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
    </main>
  )
}
