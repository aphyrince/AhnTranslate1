import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: '결 | 나만의 웹페이지 번역기',
    description: '브라우저를 떠나지 않고 지금 보고 있는 화면부터. 나만의 AI 웹페이지 번역기를 시작해 보세요.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
    return (
        <html lang='ko' className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
            <body className='min-h-full flex flex-col'>{children}</body>
        </html>
    );
}
