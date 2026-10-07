const steps = [
    {
        number: '01',
        title: '읽고 싶은 페이지를 열어요',
        description: '뉴스, 아티클, 블로그 어디서든 지금 보고 있는 화면부터 시작해요.',
    },
    {
        number: '02',
        title: '확장 프로그램을 눌러요',
        description: '화면에 보이는 문장만 골라 번역 요청을 보내요. 페이지 구조는 그대로예요.',
    },
    {
        number: '03',
        title: '번역문을 바로 읽어요',
        description: '원래 페이지 위에 자연스럽게 바뀐 문장을 표시해요. 새 탭은 필요 없어요.',
    },
];

const features = [
    {
        icon: '↗',
        title: '보고 있는 곳부터',
        description: '페이지 전체를 기다리지 않고 현재 화면에 보이는 텍스트만 번역해요.',
    },
    {
        icon: '⌘',
        title: '레이아웃은 그대로',
        description: 'HTML 구조나 링크를 건드리지 않고 문장만 바꿔 읽던 흐름을 지켜요.',
    },
    {
        icon: '◈',
        title: '나만의 번역 서버',
        description: '내 Vercel 서버와 OpenAI API 키를 연결해 혼자 사용하는 번역 환경을 만들어요.',
    },
];

export default function Home() {
    return (
        <main>
            <header className='site-header'>
                <a aria-label='결 페이지 맨 위로' className='brand' href='#'>
                    <span aria-hidden='true' className='brand-mark'>
                        결
                    </span>
                    <span>
                        gyeol<span className='brand-period'>.</span>
                    </span>
                </a>
                <nav aria-label='주요 메뉴' className='header-nav'>
                    <a href='#how-it-works'>사용 방법</a>
                    <a href='#install'>시작하기</a>
                </nav>
                <a className='header-cta' href='#install'>
                    내 번역기 만들기 <span aria-hidden='true'>↗</span>
                </a>
            </header>

            <section className='hero'>
                <div className='hero-copy'>
                    <div className='eyebrow'>
                        <span /> MY OWN PAGE TRANSLATOR
                    </div>
                    <h1>
                        읽고 싶은 페이지,
                        <br />내 언어로 <span>결을 잇다.</span>
                    </h1>
                    <p className='hero-description'>
                        브라우저를 떠나지 않고, 지금 보고 있는 화면부터.
                        <br className='desktop-break' /> 나만의 AI 번역기로 웹의 흐름을 이어가세요.
                    </p>
                    <div className='hero-actions'>
                        <a className='button button-primary' href='#install'>
                            내 번역기 시작하기 <span aria-hidden='true'>→</span>
                        </a>
                        <a className='text-link' href='#how-it-works'>
                            어떻게 작동하나요? <span aria-hidden='true'>↓</span>
                        </a>
                    </div>
                    <div className='hero-note'>
                        <span aria-hidden='true' className='note-icon'>
                            ✳
                        </span>
                        <span>페이지의 구조는 그대로, 문장만 자연스럽게.</span>
                    </div>
                </div>

                <div aria-label='웹페이지 번역 미리보기' className='preview-wrap'>
                    <div className='preview-orbit orbit-one' />
                    <div className='preview-orbit orbit-two' />
                    <div className='preview-card'>
                        <div className='browser-top'>
                            <div className='browser-dots'>
                                <i />
                                <i />
                                <i />
                            </div>
                            <div className='address-bar'>
                                <span>◉</span> theverge.com / science
                            </div>
                            <span className='browser-menu'>···</span>
                        </div>
                        <div className='article'>
                            <div className='article-kicker'>
                                <span>SCIENCE</span>
                                <span>6 MIN READ</span>
                            </div>
                            <div className='article-title'>
                                <div className='skeleton skeleton-title-a' />
                                <div className='skeleton skeleton-title-b' />
                            </div>
                            <div className='article-meta'>
                                <div className='avatar'>A</div>
                                <div>
                                    <span className='meta-name'>Alex Rivera</span>
                                    <span className='meta-date'>Today, 9:41 AM</span>
                                </div>
                            </div>
                            <div className='article-image'>
                                <div className='sun' />
                                <div className='mountain mountain-back' />
                                <div className='mountain mountain-front' />
                                <div className='image-caption'>Somewhere, out there.</div>
                            </div>
                            <div className='article-paragraph'>
                                <span className='translation-indicator'>결로 번역됨</span>
                                <p>
                                    우리가 우주를 바라볼 때, 사실은 과거를 보고 있는 거예요. 별빛이 우리에게 닿기까지는
                                    아주 오랜 시간이 걸리니까요.
                                </p>
                            </div>
                            <div className='article-lines'>
                                <i />
                                <i />
                                <i />
                            </div>
                        </div>
                        <div className='translate-toast'>
                            <span aria-hidden='true' className='toast-symbol'>
                                결
                            </span>
                            <span>화면을 번역했어요</span>
                            <span className='toast-check'>✓</span>
                        </div>
                    </div>
                    <div aria-hidden='true' className='float-chip chip-top'>
                        <span>✦</span> AI 번역
                    </div>
                    <div aria-hidden='true' className='float-chip chip-bottom'>
                        <span className='chip-dot' /> 페이지 그대로
                    </div>
                </div>
                <div aria-hidden='true' className='hero-scribble'>
                    translate your way <span>↗</span>
                </div>
            </section>

            <section aria-label='서비스 요약' className='quick-stats'>
                <div>
                    <span className='stat-icon'>◎</span>
                    <span>현재 화면만 가볍게</span>
                </div>
                <div>
                    <span className='stat-icon'>⌁</span>
                    <span>원문 레이아웃 유지</span>
                </div>
                <div>
                    <span className='stat-icon'>♡</span>
                    <span>내 API 키로 안전하게</span>
                </div>
            </section>

            <section className='how-section' id='how-it-works'>
                <div className='section-heading'>
                    <span className='section-eyebrow'>SIMPLE BY DESIGN</span>
                    <h2>읽는 흐름을 끊지 않도록.</h2>
                    <p>번역은 간단하게, 읽기는 자연스럽게.</p>
                </div>
                <div className='steps-grid'>
                    {steps.map((step) => (
                        <article className='step-card' key={step.number}>
                            <span className='step-number'>{step.number}</span>
                            <div className='step-arrow' aria-hidden='true'>
                                ↗
                            </div>
                            <h3>{step.title}</h3>
                            <p>{step.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className='feature-section'>
                <div className='feature-intro'>
                    <span className='section-eyebrow'>MADE FOR YOUR READING</span>
                    <h2>
                        번역에 맞춰
                        <br />
                        페이지를 바꾸지 않아요.
                    </h2>
                    <p>페이지는 원래 모습 그대로. 읽고 있던 문장만 다른 언어로 자연스럽게 바뀌어요.</p>
                </div>
                <div className='feature-list'>
                    {features.map((feature) => (
                        <article className='feature-item' key={feature.title}>
                            <span aria-hidden='true' className='feature-icon'>
                                {feature.icon}
                            </span>
                            <div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                            <span aria-hidden='true' className='feature-arrow'>
                                ↗
                            </span>
                        </article>
                    ))}
                </div>
            </section>

            <section className='install-section' id='install'>
                <div className='install-content'>
                    <span className='section-eyebrow'>YOUR READING, YOUR RULES</span>
                    <h2>
                        나만의 번역기를
                        <br />
                        지금 시작해 보세요.
                    </h2>
                    <p>서버를 배포하고 크롬에 확장 프로그램을 추가하면 준비 끝.</p>
                    <div className='install-steps'>
                        <div>
                            <span>1</span>
                            <p>
                                <strong>서버 배포</strong>
                                <br />
                                Vercel에 이 프로젝트를 배포하고 환경 변수를 설정해요.
                            </p>
                        </div>
                        <div>
                            <span>2</span>
                            <p>
                                <strong>확장 프로그램 연결</strong>
                                <br />
                                <code>extension</code> 폴더를 Chrome 개발자 모드에서 불러와요.
                            </p>
                        </div>
                        <div>
                            <span>3</span>
                            <p>
                                <strong>페이지 번역</strong>
                                <br />
                                서버 주소와 토큰을 저장하고 확장 아이콘을 눌러요.
                            </p>
                        </div>
                    </div>
                    <a
                        className='button button-light'
                        href='https://github.com/aphyrince/AhnTranslate1'
                        rel='noreferrer'
                        target='_blank'
                    >
                        프로젝트 설정 보기 <span aria-hidden='true'>↗</span>
                    </a>
                    <span className='install-footnote'>OpenAI API 사용량은 본인 계정에 청구됩니다.</span>
                </div>
                <div aria-hidden='true' className='install-art'>
                    <div className='art-circle art-circle-back' />
                    <div className='art-circle art-circle-front' />
                    <div className='art-word'>
                        읽고
                        <br />
                        잇다<span>.</span>
                    </div>
                    <span className='art-star star-a'>✳</span>
                    <span className='art-star star-b'>✦</span>
                    <span className='art-caption'>
                        YOUR WORDS,
                        <br />
                        YOUR WORLD.
                    </span>
                </div>
            </section>

            <footer className='site-footer'>
                <a aria-label='결 페이지 맨 위로' className='brand footer-brand' href='#'>
                    <span aria-hidden='true' className='brand-mark'>
                        결
                    </span>
                    <span>
                        gyeol<span className='brand-period'>.</span>
                    </span>
                </a>
                <span>내가 읽는 방식으로, 세상을 읽다.</span>
                <span className='footer-right'>PERSONAL WEB TRANSLATOR · 2026</span>
            </footer>
        </main>
    );
}
