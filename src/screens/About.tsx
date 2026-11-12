import { Header, Icon } from '../components/ui';

export function About() {
  return (
    <div className="app">
      <Header title="About" />
      <div className="body" style={{ padding: '8px 24px 16px', gap: 16 }}>
        <div className="row" style={{ gap: 14 }}>
          <img src="./eileen.jpg" alt="Eileen on the subway, smiling" width={96} height={96} style={{ width: 96, height: 96, objectFit: 'cover', border: '1px solid var(--line)', flexShrink: 0 }} />
          <h2 style={{ fontSize: 20, lineHeight: 1.3 }}>
            Hi! I’m Eileen, the<br />creator of Mahjong{' '}
            <span style={{ whiteSpace: 'nowrap' }}>
              Magic.
              {/* The seal follows "Magic." on any screen width without changing the line height. */}
              <span style={{ position: 'relative', display: 'inline-block', width: 31, height: '1em' }}>
                <img src="./seal.png" alt="Eileen’s personal seal" width={25} style={{ position: 'absolute', left: 6, top: -1, width: 25, height: 'auto', transform: 'rotate(7deg)' }} />
              </span>
            </span>
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>I grew up the child of immigrants from northern China, where playing cards was the name of the game. It wasn’t until college and post-grad that I learned how to play mahjong. As I grew older, mahjong grew in popularity and connected diaspora kids in many communities (and generations!)</p>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>The aunties and grannies crush, and maybe I’ll be brave enough to play them one day. Mahjong has become a love of mine not just for the game, but for the rituals and connection from the neighborhood gossip, checking in on family, and sharing food.</p>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>I created this little corner to make parts of the game a little more accessible and less intimidating. I hope you love this game as much as I do. <span className="zh" lang="zh-Hant">糊了!</span></p>
        <a className="btn" href="mailto:eileen.jiang@kellogg.northwestern.edu?subject=Mahjong%20Magic%20feedback" style={{ justifyContent: 'space-between', minHeight: 56, padding: '0 18px', marginTop: 4 }}>
          <span>Feedback? Contact me</span><Icon.arrow />
        </a>
      </div>
      <footer style={{ padding: '14px 24px calc(30px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--divider)', textAlign: 'center' }}>
        <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>© Eileen Jiang</span>
      </footer>
    </div>
  );
}
