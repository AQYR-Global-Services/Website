import type { Metadata } from "next";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "AQYR Global Services — Page not found / 页面未找到",
  robots: { index: false, follow: true },
  icons: { icon: "/aqyr-favicon.png" },
};

// Multiple language root layouts share this standalone, script-free 404.
// Show both languages without guessing from, or echoing, an unknown URL.
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className={styles.body}>
        <main id="main-content" className={styles.page}>
          <a href="/" className={styles.brand} aria-label="AQYR Global Services home">
            <img src="/aqyr-header-logo.svg" alt="AQYR" width="150" height="40" />
            <span>Global Services</span>
          </a>
          <p className={styles.code}>404</p>
          <h1>Page not found.<span lang="zh-Hans">未找到这个页面。</span></h1>
          <p className={styles.intro}>This may be an older link. Choose a current page below to continue.</p>
          <p className={styles.intro} lang="zh-Hans">您可能打开了旧链接，可以从下面的入口继续浏览。</p>
          <div className={styles.choices}>
            <section aria-labelledby="english-pages">
              <h2 id="english-pages">English</h2>
              <a className={styles.home} href="/">Return to home <span aria-hidden="true">→</span></a>
              <nav aria-label="Current English pages">
                <a href="/employer-sponsorship">Employer sponsorship</a>
                <a href="/points-calculator">Skilled migration points calculator</a>
                <a href="/contact#enquiry">Contact our team</a>
              </nav>
            </section>
            <section lang="zh-Hans" aria-labelledby="chinese-pages">
              <h2 id="chinese-pages">中文</h2>
              <a className={styles.home} href="/zh">返回首页 <span aria-hidden="true">→</span></a>
              <nav aria-label="当前中文页面">
                <a href="/zh/employer-sponsorship">企业雇主担保</a>
                <a href="/zh/points-calculator">技术移民打分计算器</a>
                <a href="/zh/contact#enquiry">联系专业团队</a>
              </nav>
            </section>
          </div>
        </main>
      </body>
    </html>
  );
}
