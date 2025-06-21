import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TopNav from "../components/TopNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  /**
   * サイト全体のデフォルトタイトルとテンプレート
   * - `default`   : 明示的にタイトルを指定しなかったページで使用される文字列
   * - `template`  : ページが個別にタイトルを指定した場合、このテンプレートが適用され
   *                 `%s` 部分がページ固有のタイトルに置き換わります
   */
  title: {
    default:
      "電波人間のRPG Free カジノ闘技場 シミュレーション & 対戦記録アプリ",
    template: "%s | 電波人間カジノRPG"
  },
  description:
    "期待値計算でどのモンスターに賭けるべきかを瞬時に分析できる、電波人間のRPG Free カジノ闘技場シミュレーション & 対戦記録アプリ。Google アカウントでログインすると自分の戦績やグループ統計も管理できます。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <TopNav />
        <main>{children}</main>
      </body>
    </html>
  );
}
