import s from './page.module.css';

export default function Home() {
  return (
    <main className={s.home}>
      <h1 className={s.title}>VECTA Train</h1>
      <p className={s.subtitle}>Track your training. Own your data.</p>
    </main>
  );
}
